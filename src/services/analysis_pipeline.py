"""
Mediscan AI - Intelligent Medicine Analysis Pipeline
Orchestrates Intelligent Routing (Routes A-E), Cost Control, Multi-Tier Verification,
and Structured Medical Safety Contract Generation.
"""

import time
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, Union, List
from PIL import Image

from ..config import settings
from ..schemas import (
    IdentificationResult,
    IdentificationRoute,
    MedicineData,
    HindiExplanation,
    CandidateMatch,
    FieldVerificationStatus,
)
from ..database import save_analysis_record
from .image_preprocessing import ImagePreprocessor
from .ocr_service import OCRService
from .medicine_catalog import MedicineCatalogService
from .local_matcher import LocalMedicineMatcher, MatchDecision
from .gemini_service import GeminiAnalysisService
from .verification_service import VerificationService
from .cache_service import CacheService


def safe_str(val: Any) -> Optional[str]:
    if val is None:
        return None
    s = str(val).strip()
    if not s or s.lower() in ("nan", "none"):
        return None
    return s


class MedicineAnalysisPipeline:
    def __init__(
        self,
        catalog_service: Optional[MedicineCatalogService] = None,
        matcher: Optional[LocalMedicineMatcher] = None,
        ocr_service: Optional[OCRService] = None,
        gemini_service: Optional[GeminiAnalysisService] = None,
        cache_service: Optional[CacheService] = None,
    ):
        self.preprocessor = ImagePreprocessor()
        self.ocr_service = ocr_service or OCRService()
        self.catalog_service = catalog_service or MedicineCatalogService()
        self.matcher = matcher or LocalMedicineMatcher()
        self.gemini_service = gemini_service or GeminiAnalysisService()
        self.verification_service = VerificationService()
        self.cache_service = cache_service or CacheService()

        # Initialize matching artifacts
        self._ensure_matcher_ready()

    def _ensure_matcher_ready(self):
        """Loads fitted TF-IDF matching artifacts or trains on verified catalogue."""
        if not self.matcher.is_fitted:
            loaded = self.matcher.load_artifacts()
            if not loaded:
                if not self.catalog_service.is_loaded:
                    self.catalog_service.load_catalog()
                if self.catalog_service.records:
                    self.matcher.fit(self.catalog_service.records)
                    self.matcher.save_artifacts()

    def analyze(
        self,
        image_input: Union[bytes, Image.Image, str],
        packaging_text_hint: Optional[str] = None,
        force_fresh: bool = False,
    ) -> IdentificationResult:
        """
        Executes the intelligent routing pipeline:
        Route A: Trusted Cache Hit
        Route B: Local Catalogue Match (Zero API cost)
        Route C: Gemini Visual Reasoning Fallback
        Route D: Disputed / Verification Required
        Route E: Unidentified / Unmarked Pill Safety Rejection
        """
        start_time = time.perf_counter()
        analysis_id = f"med-{uuid.uuid4().hex[:12]}"
        now_str = datetime.utcnow().isoformat()

        # Step 1: Image Preprocessing & SHA-256 Hashing
        pil_img, image_bytes, image_hash = self.preprocessor.load_and_validate_image(image_input)
        stored_image_ref = self.preprocessor.maybe_store_image(image_bytes, image_hash)

        # Step 2: Route A - Trusted Cache Hit
        if not force_fresh:
            cached = self.cache_service.get(image_hash)
            if cached:
                cached["analysis_id"] = analysis_id
                cached["created_at"] = now_str
                cached["identification_method"] = IdentificationRoute.ROUTE_A_CACHE
                return IdentificationResult(**cached)

        # Step 3: Local OCR Extraction with Blister Foil Ink Isolation
        processed_cv2, meta = self.preprocessor.preprocess_for_ocr(pil_img)
        ink_isolated = meta.get("ink_isolated_image")
        ocr_result = self.ocr_service.extract_text(processed_cv2, ink_isolated_image=ink_isolated)
        ocr_text = ocr_result["text"]

        # Consolidate blister strip packaging evidence
        evidence = ocr_result.get("evidence", {})
        packaging_evidence = {
            "strengths": evidence.get("strengths", []),
            "dosage_forms": evidence.get("dosage_forms", []),
            "manufacturers": evidence.get("manufacturers", []),
            "has_prescription_warning": evidence.get("has_prescription_warning", False),
            "red_prescription_box_detected": meta.get("red_prescription_box_detected", False),
            "has_composition_clause": evidence.get("has_composition_clause", False),
            "has_identifying_substance": evidence.get("has_identifying_substance", False),
            "rotation_angle_corrected": meta.get("rotation_angle", 0),
        }

        if packaging_text_hint and packaging_text_hint.strip():
            ocr_text = f"{packaging_text_hint.strip()} {ocr_text}".strip()

        # Step 4: Safety Check - Loose Unmarked Pill
        is_loose_unmarked = self.preprocessor.detect_loose_unmarked_pill(pil_img, ocr_text)
        if is_loose_unmarked:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            result = self._create_loose_pill_result(
                analysis_id, image_hash, ocr_text, duration_ms, now_str, packaging_evidence=packaging_evidence
            )
            self._persist_record(result, stored_image_ref)
            return result

        # Step 5: Check if OCR is completely empty or unreadable
        if not ocr_result["is_readable"] and not packaging_text_hint:
            # If no OCR was extracted locally, fallback to Gemini multimodal reasoning
            pass

        # Step 6: Local Candidate Matching
        candidates = []
        decision = {"decision": MatchDecision.UNIDENTIFIED, "confidence_score": 0.0, "top_candidate": None}
        if ocr_text:
            candidates = self.matcher.rank_candidates(ocr_text, top_k=5)
            decision = self.matcher.evaluate_decision(candidates, query_text=ocr_text)

        candidate_matches = [
            CandidateMatch(
                product_id=str(c.get("product_id", "")),
                brand_name=str(c.get("brand_name", "")),
                generic_name=safe_str(c.get("generic_name")),
                strength=safe_str(c.get("strength")),
                dosage_form=safe_str(c.get("dosage_form")),
                similarity_score=float(c.get("calibrated_score", 0.0)),
            )
            for c in candidates
        ]

        top = decision.get("top_candidate")

        # Step 7: Early Safe Abstention - Manufacturer / Regulatory Boilerplate Only
        # If OCR text is readable but contains strictly manufacturer details / boilerplate and zero active drug substance,
        # or if the local matcher determined identifying substance is absent:
        is_substance_missing = bool(
            ocr_result.get("is_readable") and not ocr_result.get("has_identifying_substance", True)
        )
        is_explicit_unidentified = bool(
            decision.get("decision") == MatchDecision.UNIDENTIFIED
            and str(decision.get("reason", "")).startswith("Medicine could not be reliably identified")
        )

        if (is_substance_missing or is_explicit_unidentified) and not packaging_text_hint:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            result = self._create_abstain_result(
                analysis_id, image_hash, ocr_text, decision, candidate_matches, duration_ms, now_str,
                packaging_evidence=packaging_evidence
            )
            self._persist_record(result, stored_image_ref)
            return result

        # Step 8: Route B - Local Catalogue Match (Zero API Cost)
        if decision["decision"] == MatchDecision.ACCEPTED and top:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            result = self._create_local_match_result(
                analysis_id, image_hash, ocr_text, top, candidate_matches, duration_ms, now_str,
                packaging_evidence=packaging_evidence
            )
            self._persist_record(result, stored_image_ref)
            self.cache_service.set(image_hash, result.model_dump())
            return result

        # Step 9: Route C & D - Fallback to Gemini Multimodal Reasoning
        if self.gemini_service.is_available():
            try:
                gemini_output = self.gemini_service.analyze_medicine_image(
                    image_bytes=image_bytes,
                    ocr_text=ocr_text,
                    candidate_hints=candidates[:4],
                )
                duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
                result = self._process_gemini_output(
                    analysis_id, image_hash, ocr_text, gemini_output, candidate_matches, duration_ms, now_str,
                    packaging_evidence=packaging_evidence
                )
                self._persist_record(result, stored_image_ref)
                if result.is_identified:
                    self.cache_service.set(image_hash, result.model_dump())
                return result
            except Exception as e:
                # Gemini failed or timed out: provide safe fallback
                duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
                fallback = self.gemini_service.format_safe_fallback(str(e))
                result = self._process_gemini_output(
                    analysis_id, image_hash, ocr_text, fallback, candidate_matches, duration_ms, now_str,
                    packaging_evidence=packaging_evidence
                )
                self._persist_record(result, stored_image_ref)
                return result

        # If Gemini is not configured and local match abstained -> Route E
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        result = self._create_abstain_result(
            analysis_id, image_hash, ocr_text, decision, candidate_matches, duration_ms, now_str,
            packaging_evidence=packaging_evidence
        )
        self._persist_record(result, stored_image_ref)
        return result

    def _create_local_match_result(
        self,
        analysis_id: str,
        image_hash: str,
        ocr_text: str,
        top_cand: Dict[str, Any],
        candidates: List[CandidateMatch],
        duration_ms: float,
        created_at: str,
        packaging_evidence: Optional[Dict[str, Any]] = None,
    ) -> IdentificationResult:
        brand = top_cand["brand_name"]
        strength = safe_str(top_cand.get("strength"))
        form = safe_str(top_cand.get("dosage_form")) or "Tablet"
        salts = top_cand.get("active_ingredients", [])
        if isinstance(salts, str):
            salts = [s.strip() for s in salts.split(";") if s.strip()]

        is_rx = str(top_cand.get("prescription_status", "Prescription")).lower() in ("prescription", "schedule h", "schedule h1")

        karyapranali = top_cand.get("common_uses") or [
            f"{brand} का उपयोग डॉक्टर के परामर्श अनुसार इस श्रेणी के उपचार में किया जाता है।"
        ]
        sawdhaniyan = top_cand.get("precautions") or [
            "केवल डॉक्टर या फार्मासिस्ट द्वारा अनुशंसित खुराक में ही सेवन करें।",
            "दवा को बच्चों की पहुँच से दूर और नमी रहित ठंडी जगह पर रखें।"
        ]
        if is_rx and settings.HINDI_PRESCRIPTION_WARNING not in sawdhaniyan:
            sawdhaniyan.insert(0, settings.HINDI_PRESCRIPTION_WARNING)

        data = MedicineData(
            brand_name=safe_str(brand),
            generic_name=safe_str(top_cand.get("generic_name")),
            strength=strength,
            dosage_form=form,
            active_ingredients=[str(s) for s in salts if safe_str(s)] if salts else [brand],
            manufacturer=safe_str(top_cand.get("manufacturer")),
            therapeutic_class=safe_str(top_cand.get("therapeutic_class")) or f"Pharmaceutical Formulation ({safe_str(top_cand.get('generic_name')) or 'Verified'})",
            prescription_status=safe_str(top_cand.get("prescription_status")) or "Prescription",
            is_prescription_required=is_rx,
            common_uses=karyapranali,
            precautions=sawdhaniyan,
            hindi_response=HindiExplanation(
                dawa_ka_naam=brand,
                pramukh_ghatak=" + ".join(salts) if salts else brand,
                karyapranali_aur_upyog=karyapranali,
                sawdhaniyan=sawdhaniyan,
                doctor_paramarsh_sandesh=settings.HINDI_DOSAGE_ADVISORY,
            ),
            disclaimer_hindi=settings.HINDI_DISCLAIMER,
        )

        field_statuses = self.verification_service.verify_field_level(
            extracted_data=data.model_dump(),
            ocr_text=ocr_text,
            matched_catalog_record=top_cand,
        )

        return IdentificationResult(
            analysis_id=analysis_id,
            image_hash=image_hash,
            is_identified=True,
            confidence_score=top_cand.get("calibrated_score", 0.88),
            identification_method=IdentificationRoute.ROUTE_B_LOCAL_MATCH,
            decision_reason="सत्यापित स्थानीय कैटलॉग एवं पैकेजिंग विवरण से पूर्ण मिलान (बिना क्लाउड एपीआई के सफल पहचान)।",
            data=data,
            field_verification_status=field_statuses,
            packaging_evidence=packaging_evidence or {},
            exact_visible_text=ocr_text[:300] if ocr_text else None,
            ocr_text=ocr_text,
            candidate_matches=candidates,
            gemini_used=False,
            gemini_tokens={"prompt_tokens": 0, "candidate_tokens": 0, "total_tokens": 0},
            processing_duration_ms=duration_ms,
            created_at=created_at,
        )

    def _process_gemini_output(
        self,
        analysis_id: str,
        image_hash: str,
        ocr_text: str,
        gemini_dict: Dict[str, Any],
        candidates: List[CandidateMatch],
        duration_ms: float,
        created_at: str,
        packaging_evidence: Optional[Dict[str, Any]] = None,
    ) -> IdentificationResult:
        is_identified = bool(gemini_dict.get("is_identified", False))
        confidence = float(gemini_dict.get("confidence_score", 0.0))
        unclear_reason = gemini_dict.get("unclear_reason")
        exact_text = gemini_dict.get("exact_visible_text") or ocr_text

        raw_data = gemini_dict.get("data", {})
        meta = gemini_dict.get("_metadata", {})
        tokens = meta.get("tokens", {"prompt_tokens": 0, "candidate_tokens": 0, "total_tokens": 0})

        # Match against catalog for independent verification check
        matched_cat = None
        if raw_data.get("brand_name"):
            exact = self.catalog_service.exact_brand_match(raw_data["brand_name"])
            if exact:
                matched_cat = exact[0]
            else:
                sims = self.catalog_service.search_candidates(raw_data["brand_name"], limit=1)
                if sims and sims[0][1] >= 70.0:
                    matched_cat = sims[0][0]

        # Field-level verification
        field_statuses = self.verification_service.verify_field_level(
            extracted_data=raw_data,
            ocr_text=f"{ocr_text} {exact_text or ''}",
            matched_catalog_record=matched_cat,
        )

        # Check for Route D: Conflicts between Gemini and Catalog
        has_conflict = any(v == FieldVerificationStatus.CONFLICTING.value for v in field_statuses.values())
        route = (
            IdentificationRoute.ROUTE_D_VERIFICATION_REQUIRED
            if has_conflict
            else (
                IdentificationRoute.ROUTE_C_GEMINI_FALLBACK
                if is_identified
                else IdentificationRoute.ROUTE_E_UNIDENTIFIED
            )
        )

        h_resp = raw_data.get("hindi_response", {})
        hindi_explanation = HindiExplanation(
            dawa_ka_naam=h_resp.get("dawa_ka_naam") or raw_data.get("brand_name") or "अपुष्ट दवा",
            pramukh_ghatak=h_resp.get("pramukh_ghatak") or "सक्रिय घटकों की पुष्टि नहीं हो सकी।",
            karyapranali_aur_upyog=h_resp.get("karyapranali_aur_upyog") or raw_data.get("common_uses") or [],
            sawdhaniyan=h_resp.get("sawdhaniyan") or raw_data.get("precautions") or [
                "संदेह होने पर योग्य डॉक्टर या फार्मासिस्ट से परामर्श लें।"
            ],
            doctor_paramarsh_sandesh=h_resp.get("doctor_paramarsh_sandesh") or settings.HINDI_DOSAGE_ADVISORY,
        )

        data = MedicineData(
            brand_name=safe_str(raw_data.get("brand_name")) if is_identified else None,
            generic_name=safe_str(raw_data.get("generic_name")) if is_identified else None,
            strength=safe_str(raw_data.get("strength")) if is_identified else None,
            dosage_form=safe_str(raw_data.get("dosage_form")) if is_identified else None,
            active_ingredients=[str(s) for s in raw_data.get("active_ingredients", []) if safe_str(s)] if is_identified else [],
            manufacturer=safe_str(raw_data.get("manufacturer")) or (packaging_evidence.get("manufacturers")[0] if packaging_evidence and packaging_evidence.get("manufacturers") else None),
            batch_number=safe_str(raw_data.get("batch_number")),
            expiry_date=safe_str(raw_data.get("expiry_date")),
            therapeutic_class=safe_str(raw_data.get("therapeutic_class")) if is_identified else None,
            prescription_status=safe_str(raw_data.get("prescription_status")),
            is_prescription_required=raw_data.get("is_prescription_required"),
            common_uses=raw_data.get("common_uses", []) if is_identified else [],
            precautions=raw_data.get("precautions", []),
            hindi_response=hindi_explanation,
            disclaimer_hindi=raw_data.get("disclaimer_hindi") or settings.HINDI_DISCLAIMER,
        )

        if has_conflict:
            reason = "कैटलॉग और विजुअल एविडेंस में विरोधाभास पाया गया है।"
        elif is_identified:
            reason = "मल्टीमॉडल एआई द्वारा पैकेजिंग लेबल का सफल विश्लेषण।"
        else:
            reason = unclear_reason or "Medicine could not be reliably identified from this image. Please provide a clearer photo of the other side or the remaining packaging."

        return IdentificationResult(
            analysis_id=analysis_id,
            image_hash=image_hash,
            is_identified=is_identified and not has_conflict,
            confidence_score=confidence,
            identification_method=route,
            decision_reason=reason,
            data=data,
            field_verification_status=field_statuses,
            packaging_evidence=packaging_evidence or {},
            exact_visible_text=exact_text,
            ocr_text=ocr_text,
            candidate_matches=candidates,
            gemini_used=True,
            gemini_tokens=tokens,
            processing_duration_ms=duration_ms,
            created_at=created_at,
        )

    def _create_loose_pill_result(
        self,
        analysis_id: str,
        image_hash: str,
        ocr_text: str,
        duration_ms: float,
        created_at: str,
        packaging_evidence: Optional[Dict[str, Any]] = None,
    ) -> IdentificationResult:
        """Route E: Safety abstention for loose unmarked pills."""
        reason = (
            "खुली या बिना प्रिंट वाली गोली (Loose Pill without Imprint) को केवल उसके रंग या आकार से "
            "विश्वसनीय रूप से नहीं पहचाना जा सकता। यह मरीज की सुरक्षा के लिए प्रतिबंधित है। "
            "कृपया दवा के मूल पत्ते (Blister strip), बॉक्स या बोतल के लेबल की तस्वीर अपलोड करें।"
        )
        data = MedicineData(
            brand_name=None,
            generic_name=None,
            strength=None,
            dosage_form="Loose Pill / Capsule",
            active_ingredients=[],
            manufacturer=None,
            therapeutic_class=None,
            prescription_status=None,
            is_prescription_required=None,
            common_uses=[],
            precautions=[
                "बिना पैकेजिंग या स्पष्ट मुहर के किसी भी अज्ञात गोली का सेवन न करें।",
                "संदेह होने पर योग्य फार्मासिस्ट या डॉक्टर से संपर्क करें।"
            ],
            hindi_response=HindiExplanation(
                dawa_ka_naam="अज्ञात खुली गोली",
                pramukh_ghatak="पहचान अपुष्ट",
                karyapranali_aur_upyog=[],
                sawdhaniyan=[
                    "अज्ञात गोली का सेवन गंभीर स्वास्थ्य जोखिम पैदा कर सकता है।",
                    "कृपया पैकेजिंग या लेबल की फोटो अपलोड करें।"
                ],
                doctor_paramarsh_sandesh="दवा की पहचान के लिए मूल पैकेजिंग आवश्यक है।",
            ),
            disclaimer_hindi=settings.HINDI_UNVERIFIED_WARNING,
        )
        return IdentificationResult(
            analysis_id=analysis_id,
            image_hash=image_hash,
            is_identified=False,
            confidence_score=0.05,
            identification_method=IdentificationRoute.ROUTE_E_UNIDENTIFIED,
            decision_reason=reason,
            data=data,
            field_verification_status={},
            packaging_evidence=packaging_evidence or {},
            exact_visible_text=ocr_text,
            ocr_text=ocr_text,
            candidate_matches=[],
            gemini_used=False,
            gemini_tokens={"prompt_tokens": 0, "candidate_tokens": 0, "total_tokens": 0},
            processing_duration_ms=duration_ms,
            created_at=created_at,
        )

    def _create_abstain_result(
        self,
        analysis_id: str,
        image_hash: str,
        ocr_text: str,
        decision: Dict[str, Any],
        candidates: List[CandidateMatch],
        duration_ms: float,
        created_at: str,
        packaging_evidence: Optional[Dict[str, Any]] = None,
    ) -> IdentificationResult:
        dec_type = decision.get("decision", MatchDecision.UNIDENTIFIED)
        top = decision.get("top_candidate")
        reason = decision.get("reason")

        # If completely unidentified or missing identifying substance, never invent a brand name
        is_substance_missing = bool(
            packaging_evidence and not packaging_evidence.get("has_identifying_substance", True)
        )
        if dec_type == MatchDecision.UNIDENTIFIED or is_substance_missing:
            brand = None
            generic = None
            strength = None
            dosage_form = None
            salts = []
            if not reason or reason == "कोई उपयुक्त दवा मेल नहीं खाती।":
                reason = "Medicine could not be reliably identified from this image. Please provide a clearer photo of the other side or the remaining packaging."
        else:
            brand = top["brand_name"] if top else None
            generic = top.get("generic_name") if top else None
            strength = top.get("strength") if top else None
            dosage_form = top.get("dosage_form") if top else None
            salts = top.get("active_ingredients", []) if top else []
            if not reason:
                reason = "Medicine could not be reliably identified from this image."

        mfg = None
        if top and top.get("manufacturer"):
            mfg = safe_str(top.get("manufacturer"))
        elif packaging_evidence and packaging_evidence.get("manufacturers"):
            mfg = packaging_evidence["manufacturers"][0]

        data = MedicineData(
            brand_name=safe_str(brand),
            generic_name=safe_str(generic),
            strength=safe_str(strength),
            dosage_form=safe_str(dosage_form),
            active_ingredients=[str(s) for s in salts if safe_str(s)] if salts else [],
            manufacturer=mfg,
            therapeutic_class=None,
            prescription_status="Prescription" if packaging_evidence and (packaging_evidence.get("has_prescription_warning") or packaging_evidence.get("red_prescription_box_detected")) else None,
            is_prescription_required=True if packaging_evidence and (packaging_evidence.get("has_prescription_warning") or packaging_evidence.get("red_prescription_box_detected")) else None,
            common_uses=[],
            precautions=[
                "Medicine could not be reliably identified from this image.",
                "पहचान अपुष्ट होने पर दवा का सेवन न करें। कृपया पैकेजिंग के दूसरे हिस्से की फोटो लें।"
            ],
            hindi_response=HindiExplanation(
                dawa_ka_naam="पहचान अपुष्ट",
                pramukh_ghatak="सत्यापन संभव नहीं हो सका",
                karyapranali_aur_upyog=[],
                sawdhaniyan=[
                    "पहचान पुष्ट न होने तक इस दवा का सेवन न करें।",
                    "कृपया पत्ते के उस हिस्से की फोटो लें जहाँ दवा का नाम या साल्ट स्पष्ट लिखा हो।"
                ],
                doctor_paramarsh_sandesh=settings.HINDI_DOSAGE_ADVISORY,
            ),
            disclaimer_hindi=settings.HINDI_UNVERIFIED_WARNING,
        )
        return IdentificationResult(
            analysis_id=analysis_id,
            image_hash=image_hash,
            is_identified=False,
            confidence_score=decision.get("confidence_score", 0.0),
            identification_method=IdentificationRoute.ROUTE_E_UNIDENTIFIED,
            decision_reason=reason,
            data=data,
            field_verification_status={},
            packaging_evidence=packaging_evidence or {},
            exact_visible_text=ocr_text,
            ocr_text=ocr_text,
            candidate_matches=candidates,
            gemini_used=False,
            gemini_tokens={"prompt_tokens": 0, "candidate_tokens": 0, "total_tokens": 0},
            processing_duration_ms=duration_ms,
            created_at=created_at,
        )

    def _persist_record(self, result: IdentificationResult, stored_image_ref: Optional[str]) -> None:
        """Saves analysis record to the SQLite database."""
        save_analysis_record({
            "id": result.analysis_id,
            "image_hash": result.image_hash,
            "image_reference": stored_image_ref,
            "ocr_text": result.ocr_text or "",
            "extracted_fields": result.data.model_dump(),
            "candidate_product_ids": [c.product_id for c in result.candidate_matches],
            "selected_product_id": result.candidate_matches[0].product_id if result.candidate_matches else None,
            "identification_method": result.identification_method.value,
            "confidence_metadata": {
                "confidence_score": result.confidence_score,
                "decision_reason": result.decision_reason,
            },
            "field_verification_status": result.field_verification_status,
            "gemini_used": result.gemini_used,
            "model_version": settings.MODEL_VERSION,
            "prompt_version": settings.PROMPT_VERSION,
            "processing_duration": result.processing_duration_ms,
            "created_at": result.created_at,
        })
