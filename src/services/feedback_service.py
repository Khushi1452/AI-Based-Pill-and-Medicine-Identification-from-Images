"""
Mediscan AI - User Feedback & Governance Service
Implements the complete Correct / Incorrect workflow, field-level dispute tracking,
provenance preservation, review queue management, and model training sample staging.
"""

import os
import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, Tuple

from ..config import settings
from ..schemas import FeedbackSubmission, FieldVerificationStatus
from ..database import (
    save_feedback_record,
    get_analysis_record,
    get_db_connection,
    update_feedback_status,
)
from .verification_service import VerificationService


class FeedbackService:
    def __init__(self):
        self.verification_service = VerificationService()
        settings.FEEDBACK_DIR.mkdir(parents=True, exist_ok=True)
        settings.PENDING_REVIEW_DIR.mkdir(parents=True, exist_ok=True)

    def process_feedback(self, submission: FeedbackSubmission) -> Dict[str, Any]:
        """
        Processes user feedback on an analysis result.
        Enforces strict safety governance:
        - Correct submissions are recorded with provenance and audited before any catalogue promotion.
        - Incorrect submissions isolate disputed fields, enter the review queue, and never overwrite verified catalogue records.
        """
        analysis = get_analysis_record(submission.analysis_id)
        if not analysis:
            raise ValueError(f"Analysis record with ID '{submission.analysis_id}' not found.")

        feedback_id = f"fb-{uuid.uuid4().hex[:12]}"
        now_str = datetime.utcnow().isoformat()

        is_overall_correct = submission.feedback_type.upper() == "CORRECT"
        field_statuses = analysis.get("field_verification_status", {})
        extracted_fields = analysis.get("extracted_fields", {})

        if is_overall_correct:
            # 1. Store feedback record
            save_feedback_record({
                "id": feedback_id,
                "analysis_id": submission.analysis_id,
                "feedback_type": "CORRECT",
                "field_feedback": submission.field_feedback,
                "proposed_corrections": submission.proposed_corrections,
                "review_status": "APPROVED",
                "reviewed_by": "User Confirmation",
                "created_at": now_str,
            })

            # 2. Check if eligible for trusted catalogue promotion
            is_eligible, reason = self.verification_service.evaluate_catalogue_promotion_eligibility(
                field_statuses, user_confirmed=True
            )

            catalogue_promoted = False
            if is_eligible:
                brand = extracted_fields.get("brand_name")
                if brand:
                    catalogue_promoted = self._maybe_add_to_catalogue(extracted_fields, source="User-Confirmed Regulatory Match")

            # 3. Stage for future retraining
            self._save_training_sample(analysis, submission, is_correct=True)

            status_message = (
                "सत्यापन सफल: आपकी पुष्टि दर्ज कर ली गई है। "
                + ("दवा का विवरण आधिकारिक कैटलॉग में सुरक्षित है।" if catalogue_promoted else "डेटा भविष्य के प्रशिक्षण के लिए लेबल किया गया है।")
            )

            return {
                "success": True,
                "feedback_id": feedback_id,
                "feedback_type": "CORRECT",
                "catalogue_promoted": catalogue_promoted,
                "promotion_reason": reason,
                "message": status_message,
                "field_verification_status": field_statuses,
            }

        else:
            # User reports INCORRECT information
            save_feedback_record({
                "id": feedback_id,
                "analysis_id": submission.analysis_id,
                "feedback_type": "INCORRECT",
                "field_feedback": submission.field_feedback,
                "proposed_corrections": submission.proposed_corrections,
                "review_status": "PENDING",
                "reviewed_by": None,
                "created_at": now_str,
            })

            # Store in pending review queue file
            self._save_pending_review_item(analysis, submission, feedback_id)

            challenged_fields = [k for k, v in submission.field_feedback.items() if not v]
            if not challenged_fields and submission.proposed_corrections:
                challenged_fields = list(submission.proposed_corrections.keys())

            return {
                "success": True,
                "feedback_id": feedback_id,
                "feedback_type": "INCORRECT",
                "catalogue_promoted": False,
                "challenged_fields": challenged_fields,
                "message": (
                    f"सुधार अनुरोध सफलतापूर्वक दर्ज किया गया (फील्ड्स: {', '.join(challenged_fields) if challenged_fields else 'समस्त विवरण'})। "
                    "यह प्रविष्टि विशेषज्ञ समीक्षा कतार में भेज दी गई है।"
                ),
            }

    def _maybe_add_to_catalogue(self, extracted_fields: Dict[str, Any], source: str) -> bool:
        """Adds a newly confirmed and verified medicine to the database catalogue."""
        brand = extracted_fields.get("brand_name")
        if not brand:
            return False

        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM medicines WHERE brand_name = ? COLLATE NOCASE;", (brand,))
            if cursor.fetchone():
                return False  # Already exists, do not overwrite

            now_str = datetime.utcnow().isoformat()
            new_id = f"USER-{uuid.uuid4().hex[:8]}"
            cursor.execute("""
                INSERT INTO medicines (
                    product_id, brand_name, generic_name, active_ingredients, strength,
                    dosage_form, manufacturer, therapeutic_class, common_uses, precautions,
                    prescription_status, source_name, source_url, verification_status,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                new_id,
                brand,
                extracted_fields.get("generic_name", ""),
                "; ".join(extracted_fields.get("active_ingredients", [])),
                extracted_fields.get("strength", ""),
                extracted_fields.get("dosage_form", ""),
                extracted_fields.get("manufacturer", ""),
                extracted_fields.get("therapeutic_class", ""),
                " | ".join(extracted_fields.get("common_uses", [])),
                " | ".join(extracted_fields.get("precautions", [])),
                extracted_fields.get("prescription_status", "Prescription"),
                source,
                "https://cdsco.gov.in",
                FieldVerificationStatus.USER_CONFIRMED.value,
                now_str,
                now_str,
            ))
            conn.commit()
            return True

    def _save_training_sample(self, analysis: Dict[str, Any], submission: FeedbackSubmission, is_correct: bool) -> None:
        """Saves verified examples to the approved training dataset for periodic model updates."""
        training_file = settings.FEEDBACK_DIR / "approved_training_samples.jsonl"
        sample = {
            "analysis_id": analysis["id"],
            "image_hash": analysis["image_hash"],
            "ocr_text": analysis.get("ocr_text", ""),
            "ground_truth": analysis.get("extracted_fields", {}),
            "user_confirmed": is_correct,
            "field_feedback": submission.field_feedback,
            "recorded_at": datetime.utcnow().isoformat(),
        }
        with open(training_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(sample, ensure_ascii=False) + "\n")

    def _save_pending_review_item(self, analysis: Dict[str, Any], submission: FeedbackSubmission, feedback_id: str) -> None:
        """Writes challenged predictions to the human-in-the-loop review log."""
        review_file = settings.PENDING_REVIEW_DIR / "pending_corrections.jsonl"
        item = {
            "feedback_id": feedback_id,
            "analysis_id": analysis["id"],
            "image_hash": analysis["image_hash"],
            "ocr_text": analysis.get("ocr_text", ""),
            "predicted_fields": analysis.get("extracted_fields", {}),
            "field_feedback": submission.field_feedback,
            "proposed_corrections": submission.proposed_corrections,
            "user_notes": submission.user_notes,
            "created_at": datetime.utcnow().isoformat(),
        }
        with open(review_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(item, ensure_ascii=False) + "\n")
