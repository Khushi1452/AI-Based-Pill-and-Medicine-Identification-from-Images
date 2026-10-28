"""
Gemini Fallback Service
Invoked strictly when local OCR + ML matching model determines an ambiguous formulation,
low confidence score, or novel packaging that requires multimodal cloud reasoning.
"""

import os
import json
import re
from typing import Dict, Any, Optional, List

REQUIRED_DOSAGE_ADVISORY_HINDI = (
    "सही खुराक और उपचार की अवधि आपकी उम्र, स्वास्थ्य स्थिति और दवा की फॉर्मूलेशन पर निर्भर करती है। "
    "डॉक्टर या योग्य फार्मासिस्ट की सलाह के अनुसार ही दवा लें।"
)
REQUIRED_FAILURE_DISCLAIMER_HINDI = (
    "अस्वीकरण (Disclaimer): दवा की पहचान की पुष्टि होने तक इस जानकारी के आधार पर दवा न लें। "
    "कृपया किसी भी संदेह की स्थिति में योग्य डॉक्टर या फार्मासिस्ट से परामर्श लें।"
)


class GeminiFallbackService:
    def __init__(self, api_key: Optional[str] = None, timeout_seconds: float = 30.0):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        self.timeout_seconds = timeout_seconds
        self.is_configured = bool(self.api_key)

    def should_fallback(self, local_decision: Dict[str, Any]) -> bool:
        """
        Policy check: only invoke Gemini when local ML cannot safely accept the candidate.
        """
        decision_type = local_decision.get("decision", "")
        if decision_type == "LOCAL_IDENTIFICATION_ACCEPTED":
            return False
        if decision_type == "UNREADABLE_IMAGE":
            # Safety rejection: unreadable evidence should not waste Gemini quota
            return False
        return True

    def format_fallback_prompt(
        self,
        ocr_text: str,
        local_candidates: List[Dict[str, Any]],
        user_question: Optional[str] = None,
    ) -> str:
        prompt = (
            "Analyze the submitted Indian pharmaceutical packaging evidence carefully and return the required JSON.\n"
        )
        if ocr_text:
            prompt += f"\nExtracted Local OCR Packaging Text: \"{ocr_text}\"\n"
        if local_candidates:
            prompt += "\n[LOCAL ML PRE-RETRIEVED CANDIDATES FROM 20,485+ INDIAN CATALOG]:\n"
            for c in local_candidates[:4]:
                prompt += f"- Brand: {c.get('brand_name')} | Form: {c.get('dosage_form')} | Strength: {c.get('strength')} | Score: {c.get('calibrated_score')}\n"
        if user_question:
            prompt += f"\nUser Context: \"{user_question}\"\n"
        return prompt

    def analyze_with_gemini(
        self,
        text_context: str = "",
        image_bytes: Optional[bytes] = None,
    ) -> Dict[str, Any]:
        """
        Calls Gemini API with strict timeout and returns parsed JSON.
        """
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured on the server.")
        # When calling actual API or in test mock
        raise NotImplementedError("Direct live SDK calls should be made through configured client or server handler.")

    def parse_gemini_response(self, raw_text: str) -> Optional[Dict[str, Any]]:
        """
        Extracts and parses JSON object from Gemini output text.
        Returns None if parsing fails.
        """
        if not raw_text or not raw_text.strip():
            return None
        clean = raw_text.strip()
        # Remove markdown fenced code blocks if present
        clean = re.sub(r"^```(?:json)?\s*", "", clean)
        clean = re.sub(r"\s*```$", "", clean)
        try:
            return json.loads(clean)
        except Exception:
            # Fallback regex search for JSON object
            match = re.search(r"\{[\s\S]*\}", clean)
            if match:
                try:
                    return json.loads(match.group(0))
                except Exception:
                    return None
            return None

    def format_safe_fallback_response(self, error_reason: str) -> Dict[str, Any]:
        """
        Constructs a safe, schema-compliant response when Gemini fails or times out.
        """
        return {
            "is_identified": False,
            "confidence_score": 0.0,
            "unclear_reason": f"Gemini fallback error: {error_reason}",
            "data": {
                "brand_name": None,
                "dosage_form": None,
                "strength": None,
                "active_salts": [],
                "therapeutic_class": None,
                "is_prescription_required": None,
                "hindi_response": {
                    "dawa_ka_naam": "पहचान असफल",
                    "pramukh_ghatak": "",
                    "karyapranali_aur_upyog": [],
                    "sawdhaniyan": [
                        "सिस्टम अस्थायी रूप से दवा की पुष्टि करने में असमर्थ है।",
                        "कृपया दवा के सेवन से पहले योग्य डॉक्टर या फार्मासिस्ट से परामर्श लें।"
                    ],
                    "doctor_paramarsh_sandesh": REQUIRED_DOSAGE_ADVISORY_HINDI,
                },
                "disclaimer_hindi": REQUIRED_FAILURE_DISCLAIMER_HINDI,
            },
        }
