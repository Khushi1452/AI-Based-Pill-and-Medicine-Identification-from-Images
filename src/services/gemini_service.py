"""
Mediscan AI - Gemini Visual Reasoning & Fallback Service
Powered by the official Google Gen AI SDK (google-genai).
Extracts structured Indian pharmaceutical data from packaging images,
enforces strict distinction between visible vs inferred facts,
and generates grounded Hindi explanations.
"""

import json
import re
import time
from typing import Dict, Any, Optional, List
from google import genai
from google.genai import types

from ..config import settings


SYSTEM_INSTRUCTION = """You are an expert Indian Pharmaceutical Verification and Packaging AI Specialist.
Your task is to analyze photographs of Indian medicine packaging, specifically real-world smartphone photos of blister strips (silver foil, printed text, red prescription warnings, QR codes, folds, wrinkles, shadows, and partially obscured text), cartons, syrup bottles, and tubes.

CRITICAL MEDICAL SAFETY & GROUNDING RULES:
1. VISIBLE VS INFERRED DISTINCTION:
   - Only state as 'visible' what is directly and clearly legible on the packaging.
   - Inferred medical knowledge (therapeutic class, pharmacological action) must be explicitly noted.
   - Do NOT invent or guess missing brand names, active ingredients, or strengths.
   - If the image is blurry, cropped, reflective, wrinkled, or unreadable, set is_identified to false.
   - Loose unmarked pills with no packaging text or unique imprint MUST NOT be identified based on color or shape alone. Set is_identified to false.

2. REAL-WORLD BLISTER STRIP & METALLIC FOIL PROCESSING:
   - The photo often depicts the back foil side of an Indian blister strip with wrinkles, specular glare, curvature, or folds.
   - Look across the entire surface for:
     a) Brand name (e.g. Paracip, Glycomet, Augmentin, Dolo, Calpol, Pantocid)
     b) Active pharmaceutical ingredients / salts and strengths (e.g. "Paracetamol IP 650 mg", "Metformin Hydrochloride IP 500 mg")
     c) Red prescription warning box ("Schedule H Prescription Drug - Caution: Not to be sold by retail without the prescription...")
     d) Manufacturer name (e.g. Cipla Ltd., Sun Pharma, Alkem, Torrent)
     e) Batch number (B.No.), Manufacturing date (Mfg), Expiry date (Exp), and MRP.

3. MANUFACTURER & REGULATORY DETAILS ARE SUPPORTING EVIDENCE ONLY:
   - NEVER identify or name a medicine based on the manufacturer name, marketing company, registration details, or QR codes alone.
   - For example, if you only see "Cipla Ltd, Mumbai" or "Schedule H Prescription Drug" but the medicine brand or active ingredient is missing, cut off, or illegible, DO NOT guess what drug it is.
   - In such cases, you MUST return:
     "Medicine could not be reliably identified from this image."
     and ask the user for a clearer photo of the other side or the remaining packaging. Set is_identified to false and confidence_score <= 0.10.

4. INSUFFICIENT EVIDENCE & ABSTENTION:
   - Never claim that every medicine can be identified from every photo.
   - If the medicine name or active ingredient is not visible or cannot be verified with high certainty, set is_identified to false and state:
     "Medicine could not be reliably identified from this image."

5. PRESCRIPTION CLASSIFICATION (CDSCO / DRUGS & COSMETICS ACT):
   - Only classify as Schedule H, H1, or X if clearly indicated by the Rx symbol, red box warning, or established CDSCO schedule.
   - If not established, indicate prescription status as 'Unverified / Unknown'.

6. CANDIDATES & AMBIGUITY:
   - If multiple medicines have similar names or the text is partially obscured, list potential candidate matches rather than choosing arbitrarily.

7. HINDI PATIENT GUIDANCE:
   - Provide clear, simple, accurate Hindi explanations (dawa_ka_naam, pramukh_ghatak, karyapranali_aur_upyog, sawdhaniyan, doctor_paramarsh_sandesh).
   - Never prescribe individual dosages or treatment duration.

8. MANDATORY HINDI DISCLAIMER:
   - Must use exact text:
   "अस्वीकरण: यह जानकारी केवल शैक्षिक और सहायता के उद्देश्य से है। इसे डॉक्टर की सलाह का विकल्प न मानें। दवा लेने से पहले अपनी स्थिति के अनुसार डॉक्टर या योग्य फार्मासिस्ट से परामर्श लें।"

Return your output STRICTLY as a valid JSON object matching the requested schema.
"""


class GeminiAnalysisService:
    def __init__(self, api_key: Optional[str] = None):
        key = api_key or settings.GEMINI_API_KEY
        self.api_key = key
        self.client = genai.Client(api_key=key) if key else None
        self.model_name = "gemini-2.5-flash"

    def is_available(self) -> bool:
        return self.client is not None and bool(self.api_key)

    def analyze_medicine_image(
        self,
        image_bytes: bytes,
        ocr_text: Optional[str] = None,
        candidate_hints: Optional[List[Dict[str, Any]]] = None,
        mime_type: str = "image/jpeg"
    ) -> Dict[str, Any]:
        """
        Sends the packaging image to Gemini along with supporting OCR context and local candidate hints.
        Returns parsed, validated structured JSON.
        """
        if not self.is_available():
            raise RuntimeError("Gemini API key is not configured on the server.")

        prompt = self._build_prompt(ocr_text, candidate_hints)

        # Build contents
        contents = [
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            prompt
        ]

        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            temperature=0.1,
            response_mime_type="application/json",
        )

        start_time = time.perf_counter()
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=contents,
            config=config,
        )
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # Extract token usage metadata if available
        tokens = {"prompt_tokens": 0, "candidate_tokens": 0, "total_tokens": 0}
        if hasattr(response, "usage_metadata") and response.usage_metadata:
            um = response.usage_metadata
            tokens["prompt_tokens"] = getattr(um, "prompt_token_count", 0) or 0
            tokens["candidate_tokens"] = getattr(um, "candidates_token_count", 0) or 0
            tokens["total_tokens"] = getattr(um, "total_token_count", 0) or 0

        parsed = self._parse_json(response.text)
        parsed["_metadata"] = {
            "gemini_latency_ms": latency_ms,
            "tokens": tokens,
            "model": self.model_name,
        }
        return parsed

    def _build_prompt(
        self, ocr_text: Optional[str] = None, candidate_hints: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        prompt_lines = [
            "Carefully analyze this Indian medicine packaging photograph.",
            "The image may be a real smartphone photo of the back side of an Indian blister strip with silver foil, folds, wrinkles, shadows, glare, or partial text.",
            "IMPORTANT IDENTIFICATION RULES:",
            "- Search for the brand name, active ingredients (salts), strengths (mg/ml), dosage form, and red Schedule H warning box.",
            "- Treat manufacturer names, company logos, batch numbers, and QR codes as supporting evidence ONLY. NEVER identify a medicine based solely on the manufacturer name.",
            "- If the brand name or active ingredients are not visible, cut off, or illegible, DO NOT guess a medicine name.",
            '  Instead, set "is_identified": false, set confidence_score <= 0.10, and set "unclear_reason": "Medicine could not be reliably identified from this image. The medicine name or active ingredient is not clearly visible. Please provide a clearer photo of the other side or the remaining packaging."',
        ]
        if ocr_text:
            prompt_lines.append(f'\n[LOCAL OCR EXTRACTED TEXT FROM PACKAGING]:\n"{ocr_text}"\n')
        if candidate_hints:
            prompt_lines.append("\n[LOCAL VERIFIED CATALOGUE CANDIDATES FOR REFERENCE]:")
            for c in candidate_hints[:4]:
                prompt_lines.append(
                    f"- {c.get('brand_name')} | Strength: {c.get('strength')} | Form: {c.get('dosage_form')} | Salts: {c.get('active_ingredients')}"
                )

        prompt_lines.append("""
Output JSON Schema:
{
  "is_identified": boolean,
  "confidence_score": float (0.0 to 1.0),
  "unclear_reason": string or null,
  "exact_visible_text": string (the exact words seen on the packaging),
  "data": {
    "brand_name": string or null,
    "generic_name": string or null,
    "strength": string or null,
    "dosage_form": string or null (e.g. Tablet, Capsule, Syrup, Cream, Inhaler, Rotacap),
    "active_ingredients": [string] (list of each active salt with strength, e.g. ["Paracetamol 650 mg"]),
    "manufacturer": string or null,
    "batch_number": string or null,
    "expiry_date": string or null,
    "therapeutic_class": string or null,
    "prescription_status": string or null ("OTC", "Schedule H", "Schedule H1", "Prescription", or null),
    "is_prescription_required": boolean or null,
    "common_uses": [string],
    "precautions": [string],
    "uncertain_or_conflicting_fields": [string],
    "hindi_response": {
      "dawa_ka_naam": string,
      "pramukh_ghatak": string,
      "karyapranali_aur_upyog": [string],
      "sawdhaniyan": [string],
      "doctor_paramarsh_sandesh": string
    },
    "disclaimer_hindi": "अस्वीकरण: यह जानकारी केवल शैक्षिक और सहायता के उद्देश्य से है। इसे डॉक्टर की सलाह का विकल्प न मानें। दवा लेने से पहले अपनी स्थिति के अनुसार डॉक्टर या योग्य फार्मासिस्ट से परामर्श लें।"
  }
}
""")
        return "\n".join(prompt_lines)

    @staticmethod
    def _parse_json(raw_text: str) -> Dict[str, Any]:
        """Cleans and extracts JSON object from response text."""
        if not raw_text or not raw_text.strip():
            raise ValueError("Empty response received from Gemini.")
        clean = raw_text.strip()
        clean = re.sub(r"^```(?:json)?\s*", "", clean)
        clean = re.sub(r"\s*```$", "", clean)

        try:
            return json.loads(clean)
        except Exception:
            match = re.search(r"\{[\s\S]*\}", clean)
            if match:
                return json.loads(match.group(0))
            raise ValueError(f"Could not parse valid JSON from Gemini output: {raw_text[:200]}")

    @staticmethod
    def format_safe_fallback(error_reason: str) -> Dict[str, Any]:
        """Provides a medically safe fallback result when Gemini fails or is offline."""
        return {
            "is_identified": False,
            "confidence_score": 0.0,
            "unclear_reason": f"Medicine could not be reliably identified from this image. (विश्लेषण सेवा अनुपलब्ध: {error_reason[:120]})",
            "exact_visible_text": None,
            "data": {
                "brand_name": None,
                "generic_name": None,
                "strength": None,
                "dosage_form": None,
                "active_ingredients": [],
                "manufacturer": None,
                "batch_number": None,
                "expiry_date": None,
                "therapeutic_class": None,
                "prescription_status": None,
                "is_prescription_required": None,
                "common_uses": [],
                "precautions": [
                    "सिस्टम अस्थायी रूप से दवा की पुष्टि करने में असमर्थ है।",
                    "संदेह की स्थिति में दवा का सेवन न करें और डॉक्टर या फार्मासिस्ट से संपर्क करें।"
                ],
                "uncertain_or_conflicting_fields": ["brand_name", "active_ingredients"],
                "hindi_response": {
                    "dawa_ka_naam": "पहचान असफल",
                    "pramukh_ghatak": "सक्रिय घटकों की पुष्टि नहीं हो सकी।",
                    "karyapranali_aur_upyog": [],
                    "sawdhaniyan": [
                        "पहचान पुष्ट न होने तक इस दवा का सेवन न करें।",
                        "योग्य डॉक्टर अथवा पंजीकृत फार्मासिस्ट से परामर्श लें।"
                    ],
                    "doctor_paramarsh_sandesh": settings.HINDI_DOSAGE_ADVISORY,
                },
                "disclaimer_hindi": settings.HINDI_UNVERIFIED_WARNING,
            },
            "_metadata": {
                "gemini_latency_ms": 0.0,
                "tokens": {"prompt_tokens": 0, "candidate_tokens": 0, "total_tokens": 0},
                "model": "fallback",
            }
        }
