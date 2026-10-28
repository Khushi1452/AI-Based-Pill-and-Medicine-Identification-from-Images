"""
Local Medicine Identification Pipeline
Coordinates Image Preprocessing, Local OCR, ML Candidate Matching,
Abstention Policy, and Structured Hindi / English Response Generation.
"""

import os
import re
import time
import base64
from typing import Dict, Any, Optional, Union
from PIL import Image
import io


from .ocr_engine import LocalOCREngine
from .matching_model import MedicineMatchingModel
from .medicine_catalog import MedicineCatalogService

# Prescribed Hindi Safety Constants
REQUIRED_DOSAGE_ADVISORY_HINDI = (
    "सही खुराक और उपचार की अवधि आपकी उम्र, स्वास्थ्य स्थिति और दवा की फॉर्मूलेशन पर निर्भर करती है। "
    "डॉक्टर या योग्य फार्मासिस्ट की सलाह के अनुसार ही दवा लें।"
)
REQUIRED_PRESCRIPTION_WARNING_HINDI = (
    "यह एक डॉक्टर के पर्चे (Prescription) पर मिलने वाली नियंत्रित दवा है। इसे बिना डॉक्टरी सलाह के कभी न लें।"
)
REQUIRED_SUCCESS_DISCLAIMER_HINDI = (
    "अस्वीकरण (Disclaimer): यह जानकारी केवल शैक्षिक और सहायता के उद्देश्य से है। "
    "इसे डॉक्टर की सलाह का विकल्प न मानें। दवा लेने से पहले अपनी स्थिति के अनुसार डॉक्टर या योग्य फार्मासिस्ट से परामर्श लें।"
)
REQUIRED_FAILURE_DISCLAIMER_HINDI = (
    "दवा की पहचान की पुष्टि होने तक इस जानकारी के आधार पर दवा न लें।"
)

class LocalMedicineInferenceService:
    def __init__(
        self,
        model_dir: Optional[str] = None,
        catalog_csv_path: Optional[str] = None,
        ocr_engine: Optional[Any] = None,
        models_dir: Optional[str] = None,
    ):
        self.ocr_engine = ocr_engine or LocalOCREngine()
        self.catalog_service = MedicineCatalogService(catalog_csv_path)
        effective_model_dir = str(model_dir or models_dir or "") or None
        self.matcher = MedicineMatchingModel(effective_model_dir)
        self.is_ready = False
        self._initialize()

    def identify_text(self, text: str) -> Dict[str, Any]:
        """Convenience method for text-only / OCR-extracted inference."""
        return self.identify_medicine_local(packaging_text_hint=text)

    def identify_image_bytes(self, image_bytes: bytes) -> Dict[str, Any]:
        """Convenience method for raw image bytes inference."""
        return self.identify_medicine_local(image_input=image_bytes)

    def _initialize(self):
        try:
            # Try loading saved artifacts first
            self.matcher.load_artifacts()
            self.is_ready = True
            print("[LocalInference] Successfully loaded trained ML matcher artifacts.")
        except Exception as e:
            print(f"[LocalInference] Saved artifacts not found ({e}). Training on verified catalog...")
            if not self.catalog_service.is_loaded:
                self.catalog_service.load_catalog()
            self.matcher.fit(self.catalog_service.records)
            self.matcher.save_artifacts()
            self.is_ready = True
            print("[LocalInference] ML matcher fitted on catalog and artifacts saved.")

    def identify_medicine_local(
        self,
        image_input: Optional[Union[str, bytes, Image.Image]] = None,
        packaging_text_hint: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Executes the full local inference pipeline:
        Image Preprocessing -> Local OCR -> ML Matching -> Decision Evaluation -> Schema Output.
        """
        start_time = time.perf_counter()
        timings = {}

        extracted_text = ""
        ocr_confidence = 0.0
        ocr_word_count = 0
        ocr_readable = False

        # Step 1 & 2: Local OCR Extraction
        if image_input is not None:
            ocr_start = time.perf_counter()
            ocr_res = self.ocr_engine.extract_text(image_input)
            timings["ocr_duration_ms"] = round((time.perf_counter() - ocr_start) * 1000, 2)
            
            extracted_text = ocr_res.get("text", "")
            ocr_confidence = ocr_res.get("confidence", 0.0)
            ocr_word_count = ocr_res.get("word_count", 0)
            ocr_readable = ocr_res.get("is_readable", False)

        # Merge packaging text hint if provided
        combined_text = extracted_text
        if packaging_text_hint and packaging_text_hint.strip():
            if combined_text:
                combined_text = f"{packaging_text_hint.strip()} {combined_text}"
            else:
                combined_text = packaging_text_hint.strip()

        # Step 3: Handle completely unreadable image evidence
        clean_alphanumeric = re.sub(r"[^a-zA-Z0-9]", "", combined_text)
        is_unidentifiable_text = bool(
            not combined_text or
            len(clean_alphanumeric) < 3 or
            ("UNREADABLE" in combined_text.upper()) or
            ("LOOSE" in combined_text.upper() and "UNMARKED" in combined_text.upper())
        )


        if is_unidentifiable_text:
            total_duration = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "is_identified": False,
                "confidence_score": 0.12,
                "unclear_reason": (
                    "दवा की पैकेजिंग स्पष्ट रूप से दिखाई नहीं दे रही है या फोटो में लिखा विवरण पढ़ने योग्य नहीं है। "
                    "कृपया पैकेट, स्ट्रिप या बोतल के लेबल की सीधी और अच्छी रोशनी वाली फोटो अपलोड करें।"
                ),
                "data": {
                    "brand_name": None,
                    "dosage_form": None,
                    "strength": None,
                    "active_salts": [],
                    "therapeutic_class": None,
                    "is_prescription_required": None,
                    "hindi_response": {
                        "dawa_ka_naam": "दवा की पहचान नहीं हो सकी।",
                        "pramukh_ghatak": "सक्रिय घटकों की पुष्टि नहीं हो सकी।",
                        "karyapranali_aur_upyog": [],
                        "sawdhaniyan": [
                            "केवल अनुमान के आधार पर दवा का सेवन न करें।",
                            "संदेह होने पर योग्य डॉक्टर या फार्मासिस्ट से परामर्श लें।",
                        ],
                        "doctor_paramarsh_sandesh": "कृपया स्पष्ट फोटो भेजें या दवा की पहचान के लिए योग्य फार्मासिस्ट से संपर्क करें।",
                    },
                    "disclaimer_hindi": REQUIRED_FAILURE_DISCLAIMER_HINDI,
                },
                "_internal": {
                    "method": "local_ml_ocr",
                    "decision": "UNREADABLE_IMAGE",
                    "ocr_text": extracted_text,
                    "ocr_confidence": ocr_confidence,
                    "should_fallback_to_gemini": True,
                    "timings_ms": timings,
                    "total_latency_ms": total_duration,
                },
                "internal_processing": {
                    "method": "local_ml_ocr",
                    "decision": "UNREADABLE_IMAGE",
                    "ocr_text": extracted_text,
                    "ocr_confidence": ocr_confidence,
                    "should_fallback_to_gemini": True,
                    "timings_ms": timings,
                    "total_latency_ms": total_duration,
                },
            }

        # Step 4: ML Candidate Matching
        match_start = time.perf_counter()
        candidates = self.matcher.rank_candidates(combined_text, top_k=6)
        timings["matching_duration_ms"] = round((time.perf_counter() - match_start) * 1000, 2)

        # Step 5: Abstention & Confidence Decision
        decision = self.matcher.evaluate_decision(candidates, query_text=combined_text)
        top = decision.get("top_candidate")

        total_duration = round((time.perf_counter() - start_time) * 1000, 2)

        # If decision is accepted locally without calling Gemini
        if decision["decision"] == "LOCAL_IDENTIFICATION_ACCEPTED" and top:
            brand_name = top["brand_name"]
            dosage_form = top.get("dosage_form") or "Tablet"
            strength = str(top.get("strength")) if (top.get("strength") and str(top.get("strength")).lower() not in ("nan", "none")) else None
            
            raw_salts = top.get("active_ingredients") or [brand_name]
            if isinstance(raw_salts, str):
                active_salts = [s.strip() for s in raw_salts.split(";") if s.strip()]
            elif isinstance(raw_salts, list):
                active_salts = [str(s).strip() for s in raw_salts if str(s).strip()]
            else:
                active_salts = [brand_name]

            is_rx = top.get("prescription_status", "Prescription") == "Prescription"
            therapeutic_class = f"Pharmaceutical Formulation ({top.get('generic_name', 'Verified Medicine')})"

            sawdhaniyan = []
            if is_rx:
                sawdhaniyan.append(REQUIRED_PRESCRIPTION_WARNING_HINDI)
            raw_precautions = top.get("precautions")
            if raw_precautions:
                if isinstance(raw_precautions, str):
                    sawdhaniyan.extend([p.strip() for p in raw_precautions.split("|") if p.strip()])
                elif isinstance(raw_precautions, list):
                    sawdhaniyan.extend([str(p).strip() for p in raw_precautions if str(p).strip()])
            if not sawdhaniyan:
                sawdhaniyan.append("दवा को बच्चों की पहुँच से दूर और नमी रहित ठंडी जगह पर रखें।")

            karyapranali = []
            raw_uses = top.get("common_uses")
            if raw_uses:
                if isinstance(raw_uses, str):
                    karyapranali.extend([u.strip() for u in raw_uses.split("|") if u.strip()])
                elif isinstance(raw_uses, list):
                    karyapranali.extend([str(u).strip() for u in raw_uses if str(u).strip()])
            if not karyapranali:
                karyapranali.append(f"{brand_name} का उपयोग डॉक्टर के परामर्श अनुसार इस श्रेणी के उपचार में किया जाता है।")

            return {
                "is_identified": True,
                "confidence_score": decision["confidence_score"],
                "unclear_reason": None,
                "data": {
                    "brand_name": brand_name,
                    "dosage_form": dosage_form,
                    "strength": strength,
                    "active_salts": active_salts,
                    "therapeutic_class": therapeutic_class,
                    "is_prescription_required": is_rx,
                    "hindi_response": {
                        "dawa_ka_naam": brand_name,
                        "pramukh_ghatak": " + ".join(active_salts) if active_salts else brand_name,
                        "karyapranali_aur_upyog": karyapranali,
                        "sawdhaniyan": sawdhaniyan,
                        "doctor_paramarsh_sandesh": REQUIRED_DOSAGE_ADVISORY_HINDI,
                    },
                    "disclaimer_hindi": REQUIRED_SUCCESS_DISCLAIMER_HINDI,
                },
                "_internal": {
                    "method": "local_ml_accepted",
                    "decision": decision["decision"],
                    "candidate_score": top["calibrated_score"],
                    "ocr_text": extracted_text,
                    "ocr_confidence": ocr_confidence,
                    "candidates_count": len(candidates),
                    "top_candidates": [c["brand_name"] for c in candidates[:3]],
                    "should_fallback_to_gemini": False,
                    "timings_ms": timings,
                    "total_latency_ms": total_duration,
                },
                "internal_processing": {
                    "method": "local_ml_accepted",
                    "decision": decision["decision"],
                    "candidate_score": top["calibrated_score"],
                    "ocr_text": extracted_text,
                    "ocr_confidence": ocr_confidence,
                    "candidates_count": len(candidates),
                    "top_candidates": [c["brand_name"] for c in candidates[:3]],
                    "should_fallback_to_gemini": False,
                    "timings_ms": timings,
                    "total_latency_ms": total_duration,
                },
            }

        # Otherwise: Ambiguous, low confidence, or conflict -> Fallback Candidate Context
        fallback_salts = []
        if top and top.get("active_ingredients"):
            raw_ing = top.get("active_ingredients")
            if isinstance(raw_ing, str):
                fallback_salts = [s.strip() for s in re.split(r"[;+]", raw_ing) if s.strip()]
            elif isinstance(raw_ing, list):
                fallback_salts = [str(s).strip() for s in raw_ing if str(s).strip()]

        return {
            "is_identified": False,
            "confidence_score": decision["confidence_score"],
            "unclear_reason": decision["reason"],
            "data": {
                "brand_name": top["brand_name"] if top else None,
                "dosage_form": top.get("dosage_form") if top else None,
                "strength": str(top.get("strength")) if (top and top.get("strength") and str(top.get("strength")).lower() not in ("nan", "none")) else None,
                "active_salts": fallback_salts,
                "therapeutic_class": None,
                "is_prescription_required": None,
                "hindi_response": {
                    "dawa_ka_naam": "सत्यापन प्रक्रियाधीन",

                    "pramukh_ghatak": "सक्रिय घटकों की पुष्टि नहीं हो सकी।",
                    "karyapranali_aur_upyog": [],
                    "sawdhaniyan": [
                        "दवा की पहचान संदिग्ध या अपुष्ट होने पर उसका सेवन न करें।",
                        "संदेह होने पर डॉक्टर या फार्मासिस्ट से संपर्क करें।"
                    ],
                    "doctor_paramarsh_sandesh": REQUIRED_DOSAGE_ADVISORY_HINDI,
                },
                "disclaimer_hindi": REQUIRED_FAILURE_DISCLAIMER_HINDI,
            },
            "_internal": {
                "method": "local_ml_abstain",
                "decision": decision["decision"],
                "ocr_text": extracted_text,
                "ocr_confidence": ocr_confidence,
                "candidates_count": len(candidates),
                "top_candidates": [c["brand_name"] for c in candidates[:4]],
                "should_fallback_to_gemini": True,
                "timings_ms": timings,
                "total_latency_ms": total_duration,
            },
            "internal_processing": {
                "method": "local_ml_abstain",
                "decision": decision["decision"],
                "ocr_text": extracted_text,
                "ocr_confidence": ocr_confidence,
                "candidates_count": len(candidates),
                "top_candidates": [c["brand_name"] for c in candidates[:4]],
                "should_fallback_to_gemini": True,
                "timings_ms": timings,
                "total_latency_ms": total_duration,
            },
        }


LocalMedicineInferencePipeline = LocalMedicineInferenceService

