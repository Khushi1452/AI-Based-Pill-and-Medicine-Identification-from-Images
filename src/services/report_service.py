"""
Mediscan AI - Medical Report Analyzer Service
Parses laboratory PDF reports and scanned report images using PyMuPDF and Tesseract OCR,
extracts structured biomarkers with reference ranges and abnormal flags,
provides grounded clinical explanations, and enables longitudinal multi-report comparisons.
"""

import io
import re
import json
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime

import pymupdf
from PIL import Image
from google import genai
from google.genai import types

from ..config import settings
from .ocr_service import OCRService
from .image_preprocessing import ImagePreprocessor


COMMON_BIOMARKER_PATTERNS = [
    # Blood / Hematology
    {"pattern": r"\b(hemoglobin|hb)\b[:\s\-]*([0-9]+\.?[0-9]*)\s*(g/dl|gm/dl)?", "name": "Hemoglobin", "unit": "g/dL", "ref": "12.0 - 16.0"},
    {"pattern": r"\b(wbc|total\s+leukocyte\s+count|tlc)\b[:\s\-]*([0-9]+(?:\.[0-9]*)?)\s*(/\s*cumm|/\s*uL|cells/cumm)?", "name": "Total Leukocyte Count (TLC)", "unit": "cells/cumm", "ref": "4,000 - 11,000"},
    {"pattern": r"\b(platelet\s+count|platelets)\b[:\s\-]*([0-9]+(?:\.[0-9]*)?)\s*(lakh/cumm|/\s*cumm|thousand/uL)?", "name": "Platelet Count", "unit": "lakh/cumm", "ref": "1.50 - 4.50"},
    {"pattern": r"\b(rbc|red\s+blood\s+cell)\b[:\s\-]*([0-9]+\.?[0-9]*)\s*(mil/uL|mill/cumm)?", "name": "RBC Count", "unit": "mil/uL", "ref": "3.8 - 5.5"},
    {"pattern": r"\b(esr|erythrocyte\s+sedimentation\s+rate)\b[:\s\-]*([0-9]+)\s*(mm/hr)?", "name": "ESR", "unit": "mm/hr", "ref": "0 - 20"},
    # Metabolic & Renal
    {"pattern": r"\b(fasting\s+blood\s+(?:sugar|glucose)|fasting\s+glucose|fbs)\b[:\s\-]*([0-9]+\.?[0-9]*)\s*(mg/dl)?", "name": "Fasting Blood Glucose", "unit": "mg/dL", "ref": "70 - 99"},
    {"pattern": r"\b(post\s+prandial\s+(?:glucose|blood\s+sugar)|ppbs)\b[:\s\-]*([0-9]+\.?[0-9]*)\s*(mg/dl)?", "name": "Post Prandial Glucose", "unit": "mg/dL", "ref": "< 140"},
    {"pattern": r"\b(hba1c|glycated\s+hemoglobin)\b[:\s\-]*([0-9]+\.?[0-9]*)\s*(%)?", "name": "HbA1c", "unit": "%", "ref": "< 5.7"},
    {"pattern": r"\b(serum\s+creatinine|creatinine)\b[:\s\-]*([0-9]+\.?[0-9]*)\s*(mg/dl)?", "name": "Serum Creatinine", "unit": "mg/dL", "ref": "0.6 - 1.2"},
    {"pattern": r"\b(blood\s+urea|urea)\b[:\s\-]*([0-9]+\.?[0-9]*)\s*(mg/dl)?", "name": "Blood Urea", "unit": "mg/dL", "ref": "15 - 40"},
    {"pattern": r"\b(uric\s+acid)\b[:\s\-]*([0-9]+\.?[0-9]*)\s*(mg/dl)?", "name": "Uric Acid", "unit": "mg/dL", "ref": "3.5 - 7.2"},
    # Liver Function
    {"pattern": r"\b(sgpt|alt|alanine\s+aminotransferase)\b[:\s\-]*([0-9]+)\s*(u/l|iu/l)?", "name": "SGPT (ALT)", "unit": "U/L", "ref": "7 - 56"},
    {"pattern": r"\b(sgot|ast|aspartate\s+aminotransferase)\b[:\s\-]*([0-9]+)\s*(u/l|iu/l)?", "name": "SGOT (AST)", "unit": "U/L", "ref": "10 - 40"},
    {"pattern": r"\b(bilirubin\s+total|total\s+bilirubin)\b[:\s\-]*([0-9]+\.?[0-9]*)\s*(mg/dl)?", "name": "Total Bilirubin", "unit": "mg/dL", "ref": "0.2 - 1.2"},
    # Lipids & Thyroid
    {"pattern": r"\b(total\s+cholesterol|cholesterol\s+total)\b[:\s\-]*([0-9]+)\s*(mg/dl)?", "name": "Total Cholesterol", "unit": "mg/dL", "ref": "< 200"},
    {"pattern": r"\b(triglycerides|triglyceride)\b[:\s\-]*([0-9]+)\s*(mg/dl)?", "name": "Triglycerides", "unit": "mg/dL", "ref": "< 150"},
    {"pattern": r"\b(tsh|thyroid\s+stimulating\s+hormone)\b[:\s\-]*([0-9]+\.?[0-9]*)\s*(uIU/ml|mIU/L)?", "name": "TSH", "unit": "uIU/mL", "ref": "0.4 - 4.0"},
]


class MedicalReportAnalyzer:
    def __init__(self, api_key: Optional[str] = None):
        key = api_key or settings.GEMINI_API_KEY
        self.api_key = key
        self.client = genai.Client(api_key=key) if key else None
        self.model_name = "gemini-2.5-flash"
        self.ocr_engine = OCRService()
        self.preprocessor = ImagePreprocessor()

    def parse_document(self, file_bytes: bytes, file_name: str) -> Tuple[str, List[Dict[str, Any]], Dict[str, Any]]:
        """
        Extracts raw text, parses biomarkers, and determines summary details.
        Accepts PDF documents and raster images (PNG, JPG, TIFF).
        """
        file_ext = file_name.split(".")[-1].lower() if "." in file_name else "pdf"

        raw_text = ""
        if file_ext == "pdf":
            raw_text = self._extract_text_from_pdf(file_bytes)
        else:
            raw_text = self._extract_text_from_image(file_bytes)

        if not raw_text.strip():
            raw_text = "No readable text could be extracted from this document."

        # Extract structured biomarkers using local rules first
        biomarkers = self._extract_biomarkers(raw_text)

        # AI-enhanced interpretation
        ai_summary = self._generate_report_explanation(raw_text, biomarkers)

        return raw_text, biomarkers, ai_summary

    def _extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        """Extracts text from PDF with PyMuPDF, falling back to OCR for scanned pages."""
        text_parts = []
        try:
            doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
            for page_num in range(min(len(doc), 15)):
                page = doc[page_num]
                page_text = page.get_text()
                if len(page_text.strip()) > 30:
                    text_parts.append(page_text)
                else:
                    # Page is likely scanned image -> render to pixmap and run OCR
                    pix = page.get_pixmap(dpi=200)
                    img_data = pix.tobytes("png")
                    img = Image.open(io.BytesIO(img_data))
                    ocr_res = self.ocr_engine.extract_text_multi_pass(img)
                    text_parts.append(ocr_res.get("text", ""))
            return "\n\n".join(text_parts)
        except Exception as e:
            return f"PDF Extraction Notice: {str(e)}"

    def _extract_text_from_image(self, image_bytes: bytes) -> str:
        """Processes scanned medical report image through contrast enhancement and multi-pass OCR."""
        try:
            img = Image.open(io.BytesIO(image_bytes))
            ocr_res = self.ocr_engine.extract_text_multi_pass(img)
            return ocr_res.get("text", "")
        except Exception as e:
            return f"Image OCR Error: {str(e)}"

    def _extract_biomarkers(self, text: str) -> List[Dict[str, Any]]:
        """Extracts numerical test values and compares against standard laboratory reference ranges."""
        results = []
        seen_names = set()

        for item in COMMON_BIOMARKER_PATTERNS:
            match = re.search(item["pattern"], text, re.IGNORECASE)
            if match and item["name"] not in seen_names:
                seen_names.add(item["name"])
                val_str = match.group(2)
                try:
                    val_num = float(val_str)
                except ValueError:
                    val_num = None

                flag = self._evaluate_reference_flag(val_num, item["ref"])
                results.append({
                    "test_name": item["name"],
                    "value": val_str,
                    "value_numeric": val_num,
                    "unit": item["unit"],
                    "reference_range": item["ref"],
                    "flag": flag,
                    "simple_explanation": self._get_biomarker_explanation(item["name"], flag)
                })

        # Also search for generic tabular test lines if few were found
        if len(results) < 3:
            table_lines = re.findall(r"([A-Za-z\s\(\)]+)\s+([0-9]+\.?[0-9]*)\s+([a-zA-Z/%]+)\s+([0-9\.\-\s]+)", text)
            for t_name, t_val, t_unit, t_ref in table_lines[:8]:
                cleaned_name = t_name.strip()
                if len(cleaned_name) > 3 and cleaned_name not in seen_names and not re.search(r"(page|date|doctor|patient|ref|test)", cleaned_name, re.I):
                    seen_names.add(cleaned_name)
                    try:
                        val_num = float(t_val.strip())
                    except ValueError:
                        val_num = None
                    results.append({
                        "test_name": cleaned_name,
                        "value": t_val.strip(),
                        "value_numeric": val_num,
                        "unit": t_unit.strip(),
                        "reference_range": t_ref.strip(),
                        "flag": "UNCERTAIN",
                        "simple_explanation": "Extracted parameter from laboratory document. Verify reference intervals with prescribing clinician."
                    })

        return results

    def _evaluate_reference_flag(self, value: Optional[float], ref_str: str) -> str:
        """Compares numerical value against range like '12.0 - 16.0' or '< 140'."""
        if value is None:
            return "UNCERTAIN"

        if "<" in ref_str:
            cutoff = float(re.sub(r"[^\d\.]", "", ref_str))
            return "NORMAL" if value < cutoff else "HIGH"

        if ">" in ref_str:
            cutoff = float(re.sub(r"[^\d\.]", "", ref_str))
            return "NORMAL" if value > cutoff else "LOW"

        range_match = re.search(r"([\d\.]+)\s*-\s*([\d\.]+)", ref_str.replace(",", ""))
        if range_match:
            low = float(range_match.group(1))
            high = float(range_match.group(2))
            if value < low:
                return "LOW"
            elif value > high:
                return "HIGH"
            else:
                return "NORMAL"

        return "NORMAL"

    def _get_biomarker_explanation(self, name: str, flag: str) -> str:
        explanations = {
            "Hemoglobin": {
                "LOW": "Lower than expected (anemia). May cause fatigue or weakness; discuss dietary iron or evaluation with your doctor.",
                "HIGH": "Higher than reference range. Can be associated with dehydration or chronic respiratory conditions.",
                "NORMAL": "Within expected reference range for healthy oxygen transport."
            },
            "Total Leukocyte Count (TLC)": {
                "HIGH": "Elevated white cell count, frequently seen with infections, inflammation, or acute physical stress.",
                "LOW": "Lower white cell count. May indicate viral infection or medication effect; requires clinical review.",
                "NORMAL": "Immune white blood cells within healthy baseline parameters."
            },
            "Platelet Count": {
                "LOW": "Platelet count is low (thrombocytopenia). In tropical fevers like dengue or viral infections, needs close monitoring.",
                "HIGH": "Elevated platelets. May accompany reactive inflammation.",
                "NORMAL": "Within normal range for effective blood clotting."
            },
            "Fasting Blood Glucose": {
                "HIGH": "Above standard fasting threshold (99 mg/dL). Discuss diabetes screening or HbA1c with a physician.",
                "LOW": "Low blood sugar (hypoglycemia). Requires dietary adjustment and review.",
                "NORMAL": "Normal fasting blood sugar regulation."
            },
            "HbA1c": {
                "HIGH": "Elevated average 3-month blood glucose. A level ≥ 6.5% typically indicates diabetes requiring medical management.",
                "NORMAL": "Healthy 3-month glycemic control."
            },
            "Serum Creatinine": {
                "HIGH": "Elevated serum creatinine. Suggests reduced kidney filtration efficiency; requires medical follow-up.",
                "NORMAL": "Normal kidney filtration indicator."
            },
            "SGPT (ALT)": {
                "HIGH": "Elevated liver enzyme indicating hepatic cellular stress or inflammation (fatty liver, infection, or medication).",
                "NORMAL": "Liver enzyme within baseline physiological limits."
            }
        }
        return explanations.get(name, {}).get(flag, f"Value is currently flagged as {flag}. Consult a physician for contextual evaluation.")

    def _generate_report_explanation(self, raw_text: str, biomarkers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generates patient-friendly explanation, key highlights, and questions for the doctor."""
        if self.client and bool(self.api_key):
            try:
                prompt = (
                    "You are an expert Medical Laboratory Explainer AI.\n"
                    "Analyze this laboratory report text and extracted biomarkers.\n"
                    "Provide a clear, reassuring summary for the patient.\n"
                    "CRITICAL: Never claim definitive diagnosis. Explain limitations.\n\n"
                    f"EXTRACTED BIOMARKERS:\n{json.dumps(biomarkers, indent=2)}\n\n"
                    f"REPORT EXCERPT:\n{raw_text[:2000]}\n\n"
                    "Return a JSON object with:\n"
                    "{\n"
                    "  \"summary\": \"2-3 sentence overview\",\n"
                    "  \"report_type\": \"e.g. Complete Blood Count (CBC) or Liver Function Test\",\n"
                    "  \"key_findings\": [\"finding 1\", \"finding 2\"],\n"
                    "  \"suggested_doctor_questions\": [\"question 1\", \"question 2\", \"question 3\"],\n"
                    "  \"limitations\": \"Diagnostic disclaimer\"\n"
                    "}"
                )
                res = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(response_mime_type="application/json")
                )
                if res and res.text:
                    return json.loads(res.text)
            except Exception:
                pass

        # Fallback structured summary
        flagged_count = sum(1 for b in biomarkers if b.get("flag") in ("HIGH", "LOW"))
        return {
            "summary": (
                f"Document successfully parsed. Identified {len(biomarkers)} laboratory biomarkers, "
                f"with {flagged_count} marked outside the reference range."
            ),
            "report_type": "Diagnostic Laboratory Report",
            "key_findings": [
                f"{b['test_name']}: {b['value']} {b['unit']} ({b['flag']})" for b in biomarkers if b.get("flag") in ("HIGH", "LOW")
            ] or ["All identified parameters are within standard reference ranges."],
            "suggested_doctor_questions": [
                "What factors could have contributed to the out-of-range values in this report?",
                "Do I need to repeat this test after a specific period or make dietary changes?",
                "Are any additional tests required to confirm these findings?"
            ],
            "limitations": (
                "Laboratory reference ranges vary by testing method, equipment, patient age, and fasting state. "
                "This AI explanation is for educational purposes only and cannot replace clinical review by a licensed medical practitioner."
            )
        }
