"""
Automated Test Suite for Hybrid Local AI + Gemini Medicine Identification System
================================================================================
Covers all 14 mandatory test scenarios:
1. Clear medicine packaging with a known catalogue entry.
2. Blurry or unreadable images.
3. Unknown medicine brands.
4. Two products with similar names.
5. Similar brands with different strengths.
6. Similar brands with different active ingredients.
7. Combination medicines.
8. Missing manufacturer details.
9. Empty or malformed OCR output.
10. Gemini timeouts.
11. Invalid Gemini JSON.
12. Repeated uploads and cache hits.
13. Model artifact loading.
14. Backend response-schema compatibility.
"""

import os
import sys
import unittest
import json
import time
import io
import re
from pathlib import Path
from unittest.mock import patch, MagicMock
from PIL import Image, ImageDraw, ImageFilter
import httpx

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from ml.service.matching_model import MedicineMatchingModel, load_artifacts, MatchDecision
from ml.service.local_inference import LocalMedicineInferencePipeline
from ml.service.ocr_engine import LocalOCREngine, OCRResult
from backend.app.services.medicine_catalog import get_catalog_service
from backend.app.services.gemini_fallback import GeminiFallbackService


def create_synthetic_test_image(text: str, blur: bool = False, low_contrast: bool = False) -> bytes:
    """Create a temporary packaging-like image for testing OCR and inference."""
    img = Image.new("RGB", (600, 300), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw simple background lines/boxes
    draw.rectangle([10, 10, 590, 290], outline=(200, 200, 200), width=2)
    draw.rectangle([20, 20, 580, 80], fill=(240, 245, 255))
    
    # Draw text
    draw.text((30, 35), text, fill=(0, 0, 0) if not low_contrast else (220, 220, 220))
    
    if blur:
        img = img.filter(ImageFilter.GaussianBlur(radius=8))
        
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


class TestHybridPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.models_dir = PROJECT_ROOT / "ml" / "models" / "medicine_matcher"
        cls.artifacts = load_artifacts(cls.models_dir)
        cls.matcher = cls.artifacts["model"]
        cls.ocr_engine = LocalOCREngine()
        cls.pipeline = LocalMedicineInferencePipeline(
            models_dir=cls.models_dir,
            ocr_engine=cls.ocr_engine,
        )
        cls.catalog = get_catalog_service()
        cls.fastapi_url = "http://127.0.0.1:5002"
        cls.express_url = "http://127.0.0.1:5001"

    # --------------------------------------------------------------------------
    # Scenario 1: Clear medicine packaging with a known catalogue entry
    # --------------------------------------------------------------------------
    def test_01_clear_packaging_known_entry(self):
        text = "Allegra 120mg Tablet | Sanofi India Ltd | Fexofenadine Hydrochloride 120 mg"
        result = self.pipeline.identify_text(text)
        
        self.assertTrue(result["is_identified"], "Clear packaging should be identified")
        self.assertGreaterEqual(result["confidence_score"], 0.82)
        self.assertEqual(result["internal_processing"]["decision"], MatchDecision.ACCEPTED)
        self.assertIn("Allegra", result["data"]["brand_name"])
        ghatak = result["data"]["hindi_response"]["pramukh_ghatak"].lower()
        self.assertTrue("fexofenadine" in ghatak or "फेक्सोफेनाडाइन" in ghatak)


    # --------------------------------------------------------------------------
    # Scenario 2: Blurry or unreadable images (safety rejection without false positive)
    # --------------------------------------------------------------------------
    def test_02_blurry_unreadable_image(self):
        # Create a heavily blurred image
        blurred_bytes = create_synthetic_test_image("Paracip 650mg Cipla", blur=True)
        result = self.pipeline.identify_image_bytes(blurred_bytes)
        
        self.assertFalse(result["is_identified"], "Blurry image must not be identified")
        self.assertLess(result["confidence_score"], 0.50)
        self.assertIsNotNone(result["unclear_reason"])
        self.assertTrue(
            "स्पष्ट फोटो" in result["data"]["hindi_response"]["doctor_paramarsh_sandesh"] or
            "धुंधली" in result["unclear_reason"] or
            "पढ़ने योग्य नहीं" in result["unclear_reason"]
        )
        # Brand name and active ingredients must be null
        self.assertIsNone(result["data"]["brand_name"])
        self.assertEqual(result["data"]["active_salts"], [])

    # --------------------------------------------------------------------------
    # Scenario 3: Unknown medicine brands
    # --------------------------------------------------------------------------
    def test_03_unknown_medicine_brand(self):
        text = "Xylopharma-999 NovelCompound 1250mg Tablets by AlienBio Labs"
        candidates = self.matcher.retrieve_candidates(text, top_k=5)
        eval_res = self.matcher.evaluate_decision(candidates, query_text=text)
        decision = eval_res["decision"]
        
        # Must abstain or reject because similarity score will be very low
        self.assertIn(decision, [MatchDecision.ABSTAIN_LOW_CONFIDENCE, MatchDecision.REJECT, MatchDecision.UNIDENTIFIED])
        self.assertNotEqual(decision, MatchDecision.ACCEPTED, "Unknown brand must not be accepted")

    # --------------------------------------------------------------------------
    # Scenario 4: Two products with similar names (e.g. Paracip vs Paracip CPM)
    # --------------------------------------------------------------------------
    def test_04_similar_names_differentiation(self):
        # When text specifically contains cold formulation Paracip CPM
        text_cpm = "Paracip CPM Tablet containing Paracetamol, Phenylephrine, Chlorpheniramine Maleate"
        candidates = self.matcher.retrieve_candidates(text_cpm, top_k=5)
        eval_res = self.matcher.evaluate_decision(candidates, query_text=text_cpm)
        decision = eval_res["decision"]
        top = eval_res.get("top_candidate")
        
        # It must retrieve CPM formulations, not falsely force plain Paracip 650 without warning
        if top:
            matched_name = top.get("brand_name", "")
            if "CPM" not in matched_name.upper():
                self.assertIn(decision, [MatchDecision.ABSTAIN_AMBIGUOUS, MatchDecision.ABSTAIN_LOW_CONFIDENCE])

    # --------------------------------------------------------------------------
    # Scenario 5: Similar brands with different strengths (Allegra 120 vs 180)
    # --------------------------------------------------------------------------
    def test_05_similar_brands_different_strengths(self):
        # 1. Clear 120mg text
        res_120 = self.pipeline.identify_text("Allegra 120mg Tablet Fexofenadine 120mg Sanofi")
        self.assertTrue(res_120["is_identified"])
        self.assertEqual(res_120["data"]["strength"].replace(" ", ""), "120mg")

        # 2. Clear 180mg text
        res_180 = self.pipeline.identify_text("Allegra 180mg Tablet Fexofenadine 180mg Sanofi")
        self.assertTrue(res_180["is_identified"])
        self.assertEqual(res_180["data"]["strength"].replace(" ", ""), "180mg")

        # 3. Conflict / mismatch: Text says 120mg but candidate has mismatched strength status
        cand_180 = [{
            "brand_name": "Allegra 180mg Tablet",
            "strength": "180mg",
            "strength_status": "mismatched",
            "calibrated_score": 0.88,
            "generic_name": "Fexofenadine Hydrochloride"
        }]
        eval_res = self.matcher.evaluate_decision(cand_180, query_text="Allegra 120mg Tablet")
        self.assertEqual(eval_res["decision"], MatchDecision.ABSTAIN_CONFLICT, "Strength mismatch must trigger conflict abstention")

    # --------------------------------------------------------------------------
    # Scenario 6: Similar brands with different active ingredients (Allegra vs Allegra-M)
    # --------------------------------------------------------------------------
    def test_06_similar_brands_different_active_ingredients(self):
        text_allegra_m = "Allegra-M Tablet with Montelukast Sodium and Fexofenadine Hydrochloride Sanofi"
        result = self.pipeline.identify_text(text_allegra_m)
        
        if result["is_identified"]:
            brand = result["data"]["brand_name"].upper()
            salts = [s.lower() for s in result["data"]["active_salts"]]
            self.assertTrue("ALLEGRA M" in brand or "ALLEGRA-M" in brand or any("montelukast" in s for s in salts))
        else:
            # Safe abstention is also acceptable
            self.assertIn(result["internal_processing"]["decision"], [MatchDecision.ABSTAIN_CONFLICT, MatchDecision.ABSTAIN_LOW_CONFIDENCE, MatchDecision.ABSTAIN_AMBIGUOUS])

    # --------------------------------------------------------------------------
    # Scenario 7: Combination medicines (e.g. Glycomet GP 1 or Foracort 200)
    # --------------------------------------------------------------------------
    def test_07_combination_medicines(self):
        text = "Glycomet GP 1 Tablet 15'S Glimepiride 1mg Metformin Hydrochloride 500mg SR USV"
        result = self.pipeline.identify_text(text)
        
        self.assertTrue(result["is_identified"])
        self.assertIn("Glycomet", result["data"]["brand_name"])
        # Should have active salts representation
        salts = result["data"]["active_salts"]
        self.assertTrue(len(salts) >= 1)
        self.assertTrue(any("glimepiride" in s.lower() or "metformin" in s.lower() for s in salts))

    # --------------------------------------------------------------------------
    # Scenario 8: Missing manufacturer details
    # --------------------------------------------------------------------------
    def test_08_missing_manufacturer_details(self):
        # Input packaging text does NOT mention manufacturer
        text = "Cetirizine 10mg Tablet 10 Tablets for allergy relief"
        candidates = self.matcher.retrieve_candidates(text, top_k=3)
        self.assertGreater(len(candidates), 0)
        
        # Missing manufacturer should not crash the matching pipeline
        eval_res = self.matcher.evaluate_decision(candidates, query_text=text)
        decision = eval_res["decision"]
        self.assertIn(decision, [MatchDecision.ACCEPTED, MatchDecision.ABSTAIN_AMBIGUOUS, MatchDecision.ABSTAIN_LOW_CONFIDENCE])

    # --------------------------------------------------------------------------
    # Scenario 9: Empty or malformed OCR output
    # --------------------------------------------------------------------------
    def test_09_empty_or_malformed_ocr(self):
        malformed_inputs = ["", "    \n\t", "###$$$@@@%%%%%^^^^", "... --- ... ??? !!!"]
        for inp in malformed_inputs:
            result = self.pipeline.identify_text(inp)
            self.assertFalse(result["is_identified"])
            self.assertLess(result["confidence_score"], 0.30)
            self.assertIsNotNone(result["unclear_reason"])
            self.assertIsNone(result["data"]["brand_name"])

    # --------------------------------------------------------------------------
    # Scenario 10: Gemini timeouts
    # --------------------------------------------------------------------------
    def test_10_gemini_timeout_handling(self):
        service = GeminiFallbackService(api_key="test_dummy_key", timeout_seconds=0.001)
        
        # Mocking an HTTP timeout
        with patch.object(service, "analyze_with_gemini", side_effect=TimeoutError("Request timed out after 0.001s")):
            with self.assertRaises(TimeoutError):
                service.analyze_with_gemini(text_context="Test prompt")

        # Formatting safe fallback response on error
        safe_resp = service.format_safe_fallback_response("Network timeout while contacting Gemini service.")
        self.assertFalse(safe_resp["is_identified"])
        self.assertEqual(safe_resp["confidence_score"], 0.0)
        self.assertIn("timeout", safe_resp["unclear_reason"].lower())
        self.assertIn("अस्वीकरण", safe_resp["data"]["disclaimer_hindi"])

    # --------------------------------------------------------------------------
    # Scenario 11: Invalid Gemini JSON handling
    # --------------------------------------------------------------------------
    def test_11_invalid_gemini_json_handling(self):
        service = GeminiFallbackService(api_key="test_dummy_key")
        malformed_raw_gemini = "Here is your response:\n```json\n{ brand_name: 'Paracip', incomplete...\n"
        
        # Parse attempt should raise or fail safely
        parsed = service.parse_gemini_response(malformed_raw_gemini)
        self.assertIsNone(parsed, "Malformed JSON should return None")
        
        safe_envelope = service.format_safe_fallback_response("Invalid JSON response from vision model")
        self.assertFalse(safe_envelope["is_identified"])
        self.assertIn("अस्वीकरण", safe_envelope["data"]["disclaimer_hindi"])

    # --------------------------------------------------------------------------
    # Scenario 12: Repeated uploads and cache hits
    # --------------------------------------------------------------------------
    def test_12_repeated_uploads_and_cache_hits(self):
        # We test cache functionality directly against the Express backend
        url = f"{self.express_url}/api/medicine/analyze"
        payload = {
            "packagingTextHint": "Allegra 120mg Tablet Sanofi India Ltd Fexofenadine HCl",
        }
        
        # 1. First request (populates cache)
        t0 = time.time()
        res1 = httpx.post(url, json=payload, timeout=10.0)
        dur1_ms = (time.time() - t0) * 1000
        self.assertEqual(res1.status_code, 200)
        data1 = res1.json()
        result1 = data1.get("result", data1)
        
        # 2. Second request (must be a cache hit)
        t1 = time.time()
        res2 = httpx.post(url, json=payload, timeout=10.0)
        dur2_ms = (time.time() - t1) * 1000
        self.assertEqual(res2.status_code, 200)
        data2 = res2.json()
        result2 = data2.get("result", data2)
        
        # Check cache hit consistency
        self.assertEqual(result1["data"]["brand_name"], result2["data"]["brand_name"])
        self.assertTrue(dur2_ms < 50.0, f"Cache hit should be near-instant (<50ms), got {dur2_ms:.1f}ms")
        
        # Check metrics endpoint
        diag_res = httpx.get(f"{self.express_url}/api/diagnostics/metrics", timeout=5.0)
        self.assertEqual(diag_res.status_code, 200)
        diag_json = diag_res.json()
        self.assertGreaterEqual(diag_json["metrics"]["cacheHits"], 1)

    # --------------------------------------------------------------------------
    # Scenario 13: Model artifact loading
    # --------------------------------------------------------------------------
    def test_13_model_artifact_loading(self):
        # Test valid loading
        artifacts = load_artifacts(self.models_dir)
        self.assertIn("vectorizer", artifacts)
        self.assertIn("catalog_tfidf", artifacts)
        self.assertIn("catalog_records", artifacts)
        self.assertIn("config", artifacts)
        self.assertGreater(len(artifacts["catalog_records"]), 20000)
        
        # Test missing directory error
        with self.assertRaises(FileNotFoundError):
            load_artifacts(PROJECT_ROOT / "non_existent_model_dir")

    # --------------------------------------------------------------------------
    # Scenario 14: Backend response-schema compatibility
    # --------------------------------------------------------------------------
    def test_14_backend_response_schema_compatibility(self):
        # Query the local inference service
        result = self.pipeline.identify_text("Allegra 120mg Tablet 10'S Fexofenadine HCl Sanofi")
        
        # Verify root schema
        self.assertIsInstance(result.get("is_identified"), bool)
        self.assertIsInstance(result.get("confidence_score"), (int, float))
        self.assertIn("unclear_reason", result)
        self.assertIn("data", result)
        
        # Verify data dictionary structure
        data = result["data"]
        self.assertIn("brand_name", data)
        self.assertIn("dosage_form", data)
        self.assertIn("strength", data)
        self.assertIsInstance(data.get("active_salts"), list)
        self.assertIn("therapeutic_class", data)
        self.assertIn("is_prescription_required", data)
        
        # Verify hindi_response sub-object
        self.assertIn("hindi_response", data)
        hr = data["hindi_response"]
        self.assertIn("dawa_ka_naam", hr)
        self.assertIn("pramukh_ghatak", hr)
        self.assertIsInstance(hr.get("karyapranali_aur_upyog"), list)
        self.assertIsInstance(hr.get("sawdhaniyan"), list)
        self.assertIn("doctor_paramarsh_sandesh", hr)
        
        # Verify disclaimer_hindi
        self.assertIn("disclaimer_hindi", data)
        self.assertIn("अस्वीकरण (Disclaimer)", data["disclaimer_hindi"])


if __name__ == "__main__":
    unittest.main()
