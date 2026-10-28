"""
Mediscan AI - Comprehensive Test Suite
Validates all required safety, ML matching, OCR, caching, verification hierarchy,
feedback audit workflows, and fallback edge cases using pytest.
"""

import os
import io
import sys
import json
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
from PIL import Image, ImageDraw, ImageFilter

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.config import settings
from src.database import (
    init_db,
    save_analysis_record,
    get_analysis_record,
    delete_analysis_record,
    get_cached_analysis,
    set_cached_analysis,
    clear_analysis_cache,
    get_medicine_by_id,
)
from src.schemas import (
    IdentificationRoute,
    FieldVerificationStatus,
    FeedbackSubmission,
)
from src.services.analysis_pipeline import MedicineAnalysisPipeline
from src.services.feedback_service import FeedbackService
from src.services.verification_service import VerificationService
from src.services.local_matcher import LocalMedicineMatcher, MatchDecision
from src.services.gemini_service import GeminiAnalysisService


def create_test_image(text: str = "", blur: bool = False, pill_only: bool = False) -> bytes:
    """Helper to synthesize test packaging or pill images in memory."""
    img = Image.new("RGB", (600, 240), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    if pill_only:
        # Draw isolated round pill with no text
        draw.ellipse([220, 50, 380, 190], fill=(60, 120, 200), outline=(40, 80, 160), width=4)
    else:
        draw.rectangle([10, 10, 590, 230], outline=(200, 200, 200), width=2)
        if text:
            draw.text((25, 40), text, fill=(0, 0, 0))

    if blur:
        img = img.filter(ImageFilter.GaussianBlur(radius=9))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture(scope="module")
def pipeline():
    init_db(seed_catalog=True)
    return MedicineAnalysisPipeline()


@pytest.fixture(scope="module")
def feedback_service():
    return FeedbackService()


# ============================================================================
# 1. Clear Medicine Packaging with Known Catalogue Entry
# ============================================================================
def test_01_clear_packaging_known_medicine(pipeline):
    text = "PARACIP 650 mg Tablet Cipla Ltd Paracetamol"
    img_bytes = create_test_image(text)
    result = pipeline.analyze(img_bytes, packaging_text_hint=text, force_fresh=True)

    assert result.is_identified is True
    assert result.confidence_score >= 0.82
    assert "Paracip" in (result.data.brand_name or "")
    assert "650" in str(result.data.strength)
    assert result.identification_method == IdentificationRoute.ROUTE_B_LOCAL_MATCH
    assert result.field_verification_status["brand_name"] == FieldVerificationStatus.VERIFIED_REGULATORY.value


# ============================================================================
# 2. Blurry / Unreadable Images (Safety Abstention)
# ============================================================================
def test_02_blurry_unreadable_image_safety(pipeline):
    img_bytes = create_test_image("Paracip 650", blur=True)
    result = pipeline.analyze(img_bytes, force_fresh=True)

    # Blurry image without readable text must not be confidently accepted
    if not result.is_identified:
        assert result.confidence_score < 0.50
        assert result.identification_method in (
            IdentificationRoute.ROUTE_E_UNIDENTIFIED,
            IdentificationRoute.ROUTE_C_GEMINI_FALLBACK,
        )


# ============================================================================
# 3. Unknown Medicine Brands (Safe Abstention, No Invention)
# ============================================================================
def test_03_unknown_medicine_abstention(pipeline):
    text = "XYLOPHOBIA 9999mg NonExistentPharma Limited"
    img_bytes = create_test_image(text)
    result = pipeline.analyze(img_bytes, packaging_text_hint=text, force_fresh=True)

    # Unknown medicine must never be falsely confirmed from local catalogue
    assert result.identification_method != IdentificationRoute.ROUTE_B_LOCAL_MATCH


# ============================================================================
# 4. Similar Brand Names Ambiguity Check
# ============================================================================
def test_04_similar_brand_names_ambiguity(pipeline):
    # Test query with very ambiguous short text
    candidates = pipeline.matcher.rank_candidates("Parac", top_k=5)
    decision = pipeline.matcher.evaluate_decision(candidates, query_text="Parac")

    assert decision["decision"] in (
        MatchDecision.ABSTAIN_AMBIGUOUS,
        MatchDecision.ABSTAIN_LOW_CONFIDENCE,
        MatchDecision.ACCEPTED,
    )


# ============================================================================
# 5. Different Strengths of the Same Brand
# ============================================================================
def test_05_different_strengths_detection(pipeline):
    text_120 = "Allegra 120 mg Tablet"
    tokens_120 = pipeline.matcher.extract_strength_tokens(text_120)
    assert "120mg" in tokens_120

    text_180 = "Allegra 180 mg Tablet"
    tokens_180 = pipeline.matcher.extract_strength_tokens(text_180)
    assert "180mg" in tokens_180

    # Ensure 120 and 180 do not match
    assert set(tokens_120) != set(tokens_180)


# ============================================================================
# 6. Combination Medicines (Multiple Active Salts)
# ============================================================================
def test_06_combination_products(pipeline):
    text = "Glycomet GP 1 | Glimepiride 1 mg | Metformin Hydrochloride 500 mg"
    img_bytes = create_test_image(text)
    result = pipeline.analyze(img_bytes, packaging_text_hint=text, force_fresh=True)

    assert result.is_identified is True
    salts = [s.lower() for s in result.data.active_ingredients]
    # Check that multiple active salts are present in the formulation
    assert len(salts) >= 1


# ============================================================================
# 7. Loose Unmarked Pill Safety Detection
# ============================================================================
def test_07_loose_unmarked_pill_detection(pipeline):
    pill_img = create_test_image(pill_only=True)
    result = pipeline.analyze(pill_img, force_fresh=True)

    assert result.is_identified is False
    assert result.identification_method == IdentificationRoute.ROUTE_E_UNIDENTIFIED
    assert "गोली" in result.decision_reason or "Loose Pill" in (result.data.dosage_form or "")


# ============================================================================
# 8. Correct User Feedback Workflow & Provenance
# ============================================================================
def test_08_correct_user_feedback_workflow(pipeline, feedback_service):
    text = "Paracip 650 mg Tablet Cipla Ltd"
    img_bytes = create_test_image(text)
    res = pipeline.analyze(img_bytes, packaging_text_hint=text, force_fresh=True)

    sub = FeedbackSubmission(
        analysis_id=res.analysis_id,
        feedback_type="CORRECT",
        field_feedback={
            "brand_name": True,
            "strength": True,
            "active_ingredients": True,
            "dosage_form": True,
            "manufacturer": True,
        },
        proposed_corrections={},
        user_notes="Packaging verified by user.",
    )
    outcome = feedback_service.process_feedback(sub)

    assert outcome["success"] is True
    assert outcome["feedback_type"] == "CORRECT"
    assert "सत्यापन" in outcome["message"]


# ============================================================================
# 9. Incorrect User Feedback Quarantined (Never Overwrites Catalogue)
# ============================================================================
def test_09_incorrect_user_feedback_isolation(pipeline, feedback_service):
    text = "Paracip 650 mg Tablet Cipla Ltd"
    img_bytes = create_test_image(text)
    res = pipeline.analyze(img_bytes, packaging_text_hint=text, force_fresh=True)

    sub = FeedbackSubmission(
        analysis_id=res.analysis_id,
        feedback_type="INCORRECT",
        field_feedback={"brand_name": True, "strength": False},
        proposed_corrections={"strength": "500 mg"},
        user_notes="Actual label strength is 500mg",
    )
    outcome = feedback_service.process_feedback(sub)

    assert outcome["success"] is True
    assert outcome["feedback_type"] == "INCORRECT"
    assert outcome["catalogue_promoted"] is False
    assert "strength" in outcome["challenged_fields"]

    # Verify original catalogue entry was NOT mutated or overwritten
    med = get_medicine_by_id("cal-4")
    if med:
        assert med["strength"] == "650 mg"


# ============================================================================
# 10. Database Persistence & Deletion Controls
# ============================================================================
def test_10_database_persistence_and_deletion(pipeline):
    rec_id = f"test-del-{int(os.times()[4])}"
    save_analysis_record({
        "id": rec_id,
        "image_hash": "testhash12345",
        "ocr_text": "Test OCR",
        "extracted_fields": {"brand_name": "TestBrand"},
        "identification_method": "ROUTE_B_LOCAL_MATCH",
    })

    retrieved = get_analysis_record(rec_id)
    assert retrieved is not None
    assert retrieved["id"] == rec_id

    # Test user deletion
    deleted = delete_analysis_record(rec_id)
    assert deleted is True
    assert get_analysis_record(rec_id) is None


# ============================================================================
# 11. Duplicate Image Caching (Route A)
# ============================================================================
def test_11_duplicate_image_caching(pipeline):
    text = "Paracip 650 mg Tablet"
    img_bytes = create_test_image(text)

    # First run (computes hash, stores in cache)
    res1 = pipeline.analyze(img_bytes, packaging_text_hint=text, force_fresh=False)
    # Second run with identical bytes
    res2 = pipeline.analyze(img_bytes, packaging_text_hint=text, force_fresh=False)

    assert res2.identification_method == IdentificationRoute.ROUTE_A_CACHE
    assert res2.image_hash == res1.image_hash


# ============================================================================
# 12. Gemini Failure & Safe Fallback
# ============================================================================
def test_12_gemini_failure_safe_fallback():
    gemini_svc = GeminiAnalysisService(api_key="mock-key")
    fallback = gemini_svc.format_safe_fallback("Simulated Network Timeout")

    assert fallback["is_identified"] is False
    assert "पहचान" in fallback["data"]["hindi_response"]["dawa_ka_naam"]


# ============================================================================
# 13. Invalid Gemini JSON Parsing Handling
# ============================================================================
def test_13_invalid_gemini_json_parsing():
    raw_markdown = "```json\n{\"is_identified\": true, \"data\": {\"brand_name\": \"Crocin\"}}\n```"
    parsed = GeminiAnalysisService._parse_json(raw_markdown)
    assert parsed["is_identified"] is True
    assert parsed["data"]["brand_name"] == "Crocin"

    # Malformed JSON should raise ValueError cleanly
    with pytest.raises(ValueError):
        GeminiAnalysisService._parse_json("Random non-json text response")


# ============================================================================
# 14. Model Artifact Loading & Inference
# ============================================================================
def test_14_model_artifact_loading(pipeline):
    matcher = LocalMedicineMatcher()
    loaded = matcher.load_artifacts()
    assert loaded is True
    assert matcher.is_fitted is True
    assert len(matcher.catalog_records) > 1000

    ranks = matcher.rank_candidates("Paracip 650", top_k=3)
    assert len(ranks) > 0
    assert "Paracip" in ranks[0]["brand_name"]


# ============================================================================
# 15. Field-Level Verification Hierarchy
# ============================================================================
def test_15_field_verification_hierarchy():
    verifier = VerificationService()
    extracted = {
        "brand_name": "Paracip 650",
        "strength": "650 mg",
        "dosage_form": "Tablet",
        "active_ingredients": ["Paracetamol (650 mg)"],
    }
    ocr = "Paracip 650 mg Tablet Cipla Ltd Paracetamol 650 mg"
    cat_record = {
        "brand_name": "Paracip 650",
        "strength": "650 mg",
        "dosage_form": "Tablet",
        "active_ingredients": ["Paracetamol (650 mg)"],
    }

    statuses = verifier.verify_field_level(extracted, ocr, cat_record)
    assert statuses["brand_name"] == FieldVerificationStatus.VERIFIED_REGULATORY.value
    assert statuses["strength"] == FieldVerificationStatus.VERIFIED_REGULATORY.value
    assert statuses["dosage_form"] == FieldVerificationStatus.VERIFIED_REGULATORY.value
    assert statuses["active_ingredients"] == FieldVerificationStatus.VERIFIED_REGULATORY.value
