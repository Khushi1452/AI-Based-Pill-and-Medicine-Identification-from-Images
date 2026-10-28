"""
Mediscan AI - Conversational AI Doctor Chat Service
Maintains contextual multi-turn conversation, enforces safety triage first,
provides grounded medical possibilities in English, Hindi, and Punjabi,
and suggests follow-up clinical questions.
"""

import json
import re
from typing import Dict, Any, List, Optional
from google import genai
from google.genai import types

from ..config import settings
from .triage_service import TriageEngine, CareLevel


SYSTEM_PROMPT = """You are Mediscan AI Doctor Assistant, an empathetic, highly trained clinical decision-support assistant.
Your role is to help users understand symptoms, review report findings, and navigate healthcare choices in India.

CRITICAL CLINICAL SAFETY PRINCIPLES:
1. EMERGENCY FIRST: If emergency symptoms are present (chest pain, stroke signs, severe breathing distress, uncontrolled bleeding, anaphylaxis, poisoning), emphasize seeking urgent medical attention (calling 112 or visiting the nearest hospital emergency department) immediately.
2. POSSIBILITIES, NOT CONFIRMED DIAGNOSES: Always present possible explanations as potential considerations to discuss with a qualified physician, never as a definitive clinical diagnosis.
3. NEVER PRESCRIBE: Do not prescribe prescription medicines (Schedule H/H1/X in India), do not specify drug dosages, and do not advise stopping medicines prescribed by a doctor.
4. MEDICINE EDUCATION STANDARDS: When explaining or educating on any medication, packaging, or salt:
   - Always describe **How to Take**: administration method (swallow whole with water, calibrated measuring cup for syrups, do not crush or chew).
   - Always detail **When to Take**: specify daily timing slots (Morning, Afternoon, Evening) and exact food relationship (Before Food / After Food / With or Without Food) with clinical rationale (e.g. preventing gastric irritation or maximizing absorption).
   - Formulate **Key Benefits**: present key therapeutic benefits, onset speed, and targeted symptom relief in a formatted, structured manner.
5. HONEST LIMITATIONS: Clearly explain what information is missing (e.g. physical examination, vital signs, lab tests) and how that uncertainty affects your assessment.
6. NO PHYSICAL CLAIMS: Never claim to have physically examined the patient.
7. MULTILINGUAL RESPONSES: If the user writes or requests answers in Hindi or Punjabi, respond in that language with warmth and clarity.

STRUCTURED RESPONSE FORMAT (For non-emergency queries):
- **What I understand:** [Concise summary of symptoms, duration, and patient context]
- **Possible explanations:** [2-3 qualified possibilities to discuss with a clinician]
- **What you can do next:** [Low-risk self-care, hydration, rest, or monitoring]
- **When to seek medical care:** [Specific red flags and warning signs that require urgent escalation]
- **Questions for your doctor:** [2-3 practical, focused questions the user can ask their healthcare provider]
- **Confidence & Limitations:** [Clear note on missing information and the necessity of in-person medical evaluation]

Be reassuring, accurate, accessible, and grounded. Always end with a reminder to consult a licensed medical professional.
"""


class AIDoctorChatService:
    def __init__(self, api_key: Optional[str] = None):
        key = api_key or settings.GEMINI_API_KEY
        self.api_key = key
        self.client = genai.Client(api_key=key) if key else None
        self.model_name = "gemini-2.5-flash"

    def is_available(self) -> bool:
        return self.client is not None and bool(self.api_key)

    def generate_chat_response(
        self,
        user_message: str,
        conversation_history: Optional[List[Dict[str, Any]]] = None,
        user_profile: Optional[Dict[str, Any]] = None,
        attached_reports: Optional[List[Dict[str, Any]]] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Processes a user message through the triage engine, incorporates profile context,
        and generates an educational, structured response with follow-up suggestions.
        """
        # Step 1: Run Deterministic Triage Engine First
        triage_result = TriageEngine.evaluate(user_message, user_profile)

        # If Level 1 Emergency is triggered, return immediate emergency guidance
        if triage_result["is_emergency"]:
            emergency_reply = self._build_emergency_response(triage_result, language)
            return {
                "content": emergency_reply,
                "care_level": triage_result["care_level"],
                "is_emergency": True,
                "triage_details": triage_result,
                "follow_up_suggestions": [
                    "Where is the nearest emergency hospital?",
                    "What emergency first-aid can I do right now?",
                    "Call 112 emergency services"
                ],
                "ai_generated": True,
                "source": "DETERMINISTIC_TRIAGE_OVERRIDE"
            }

        # Step 2: Build Contextual Prompt for Non-Emergency
        profile_context = self._format_profile_context(user_profile)
        reports_context = self._format_reports_context(attached_reports)
        lang_prompt = self._get_language_instruction(language)

        full_prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"--- PATIENT PROFILE ---\n{profile_context}\n\n"
            f"--- RELEVANT UPLOADED REPORTS ---\n{reports_context}\n\n"
            f"--- TRIAGE ASSESSMENT ---\nAssessed Care Urgency: {triage_result['care_level']}\n"
            f"Triage Note: {triage_result['action_guidance']}\n\n"
            f"--- LANGUAGE REQUIREMENT ---\n{lang_prompt}\n\n"
            f"--- PATIENT QUESTION ---\n{user_message}"
        )

        # Step 3: Call Gemini or Safe Fallback
        if self.is_available():
            try:
                # Format conversation history
                contents = []
                if conversation_history:
                    # Keep last 6 messages for context
                    for msg in conversation_history[-6:]:
                        role = "user" if msg.get("role") == "user" else "model"
                        contents.append(f"{role.upper()}: {msg.get('content', '')}")
                contents.append(full_prompt)

                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents="\n\n".join(contents),
                    config=types.GenerateContentConfig(
                        temperature=0.2,
                        max_output_tokens=1200
                    )
                )
                ai_text = response.text if response and response.text else ""
                follow_ups = self._extract_follow_ups(ai_text, language)

                return {
                    "content": ai_text,
                    "care_level": triage_result["care_level"],
                    "is_emergency": False,
                    "triage_details": triage_result,
                    "follow_up_suggestions": follow_ups,
                    "ai_generated": True,
                    "source": "GEMINI_2_5_FLASH"
                }
            except Exception as e:
                # Graceful fallback to clinical decision template if API call fails
                fallback_text = self._build_clinical_fallback(user_message, triage_result, user_profile, language, error_msg=str(e))
                return {
                    "content": fallback_text,
                    "care_level": triage_result["care_level"],
                    "is_emergency": False,
                    "triage_details": triage_result,
                    "follow_up_suggestions": self._default_follow_ups(language),
                    "ai_generated": True,
                    "source": "LOCAL_CLINICAL_FALLBACK"
                }
        else:
            fallback_text = self._build_clinical_fallback(user_message, triage_result, user_profile, language)
            return {
                "content": fallback_text,
                "care_level": triage_result["care_level"],
                "is_emergency": False,
                "triage_details": triage_result,
                "follow_up_suggestions": self._default_follow_ups(language),
                "ai_generated": True,
                "source": "LOCAL_CLINICAL_FALLBACK"
            }

    def _build_emergency_response(self, triage: Dict[str, Any], language: str) -> str:
        nums = triage["emergency_numbers"]
        if language == "hi":
            return (
                f"🚨 **आपातकालीन चेतावनी: {triage['trigger_title']}**\n\n"
                f"आपकी दी गई जानकारी में संभावित आपातकालीन लक्षण पाए गए हैं। तुरंत आपातकालीन सहायता लें।\n\n"
                f"**तत्काल कदम:**\n"
                f"- **राष्ट्रीय आपातकालीन नंबर (भारत): 112** पर कॉल करें।\n"
                f"- **एम्बुलेंस सेवा: 108** पर कॉल करें।\n"
                f"- {triage['action_guidance']}\n\n"
                f"⚠️ *कृपया ऑनलाइन चैट या रिपोर्ट विश्लेषण की प्रतीक्षा न करें। तुरंत नजदीकी अस्पताल के इमरजेंसी वार्ड (ER) में जाएं।*"
            )
        elif language == "pa":
            return (
                f"🚨 **ਐਮਰਜੈਂਸੀ ਚੇਤਾਵਨੀ: {triage['trigger_title']}**\n\n"
                f"ਤੁਹਾਡੇ ਲੱਛਣਾਂ ਵਿੱਚ ਸੰਭਾਵੀ ਐਮਰਜੈਂਸੀ ਲੱਛਣ ਮਿਲੇ ਹਨ। ਤੁਰੰਤ ਮੈਡੀਕਲ ਸਹਾਇਤਾ ਪ੍ਰਾਪਤ ਕਰੋ।\n\n"
                f"**ਤੁਰੰਤ ਕਦਮ:**\n"
                f"- **ਐਮਰਜੈਂਸੀ ਨੰਬਰ (ਭਾਰਤ): 112** ਜਾਂ **108** 'ਤੇ ਕਾਲ ਕਰੋ।\n"
                f"- {triage['action_guidance']}\n\n"
                f"⚠️ *ਕਿਰਪਾ ਕਰਕੇ ਕਿਸੇ ਵੀ ਆਨਲਾਈਨ ਰਿਪੋਰਟ ਦੀ ਉਡੀਕ ਨਾ ਕਰੋ। ਨਜ਼ਦੀਕੀ ਹਸਪਤਾਲ ਦੇ ਐਮਰਜੈਂਸੀ ਵਾਰਡ ਵਿੱਚ ਜਾਓ।*"
            )
        else:
            return (
                f"🚨 **MEDICAL EMERGENCY ALERT: {triage['trigger_title']}**\n\n"
                f"Based on what you described, you may be experiencing a medical emergency requiring immediate attention.\n\n"
                f"**Immediate Action Required:**\n"
                f"- **Call 112** (National Emergency Helpline in India) or **108** (Ambulance Services) immediately.\n"
                f"- {triage['action_guidance']}\n"
                f"- {triage['escalation_reason']}\n\n"
                f"> **CRITICAL:** Do NOT wait for online chat or document analysis. Proceed directly to the nearest hospital emergency department (Casualty/ER)."
            )

    def _format_profile_context(self, profile: Optional[Dict[str, Any]]) -> str:
        if not profile:
            return "No prior medical profile provided."
        allergies = ", ".join(profile.get("allergies", [])) or "None reported"
        conditions = ", ".join(profile.get("chronic_conditions", [])) or "None reported"
        age = profile.get("age", "Unspecified")
        gender = profile.get("gender", "Unspecified")
        blood_group = profile.get("blood_group", "Unspecified")
        return f"Age: {age} | Gender: {gender} | Blood Group: {blood_group} | Allergies: {allergies} | Chronic Conditions: {conditions}"

    def _format_reports_context(self, reports: Optional[List[Dict[str, Any]]]) -> str:
        if not reports:
            return "No recent laboratory or diagnostic reports attached."
        lines = []
        for r in reports[:3]:
            title = r.get("report_title", "Medical Report")
            date = r.get("report_date", "Recent")
            biomarkers = r.get("biomarkers", [])
            flagged = [f"{b.get('test_name')}: {b.get('value')} {b.get('unit')} ({b.get('flag')})" for b in biomarkers if b.get('flag') in ('HIGH', 'LOW')]
            flag_str = f"Flagged values: {', '.join(flagged)}" if flagged else "Values within standard ranges"
            lines.append(f"- {title} ({date}): {flag_str}")
        return "\n".join(lines)

    def _get_language_instruction(self, language: str) -> str:
        if language == "hi":
            return "Please answer completely in simple, easy-to-understand Hindi (देवनागरी)."
        elif language == "pa":
            return "Please answer completely in simple, polite Punjabi (ਗੁਰਮੁਖੀ)."
        return "Answer in clear, reassuring, simple English."

    def _extract_follow_ups(self, text: str, language: str) -> List[str]:
        # Return sensible follow-up suggestions
        if language == "hi":
            return [
                "क्या इसके लिए मुझे डॉक्टर को दिखाना चाहिए?",
                "क्या घर पर कोई सुरक्षित उपाय है?",
                "डॉक्टर से क्या सवाल पूछने चाहिए?"
            ]
        elif language == "pa":
            return [
                "ਕੀ ਮੈਨੂੰ ਡਾਕਟਰ ਕੋਲ ਜਾਣਾ ਚਾਹੀਦਾ ਹੈ?",
                "ਕੀ ਕੋਈ ਘਰੇਲੂ ਸਾਵਧਾਨੀ ਵਰਤਣੀ ਚਾਹੀਦੀ ਹੈ?",
                "ਡਾਕਟਰ ਨੂੰ ਕੀ ਸਵਾਲ ਪੁੱਛਣੇ ਹਨ?"
            ]
        return [
            "What tests might a doctor recommend for this?",
            "What safe home care measures can I try?",
            "Which type of specialist should I consult?"
        ]

    def _default_follow_ups(self, language: str) -> List[str]:
        return self._extract_follow_ups("", language)

    def _build_clinical_fallback(
        self,
        user_message: str,
        triage: Dict[str, Any],
        profile: Optional[Dict[str, Any]],
        language: str,
        error_msg: Optional[str] = None
    ) -> str:
        """Grounded clinical decision support fallback template when offline or API key is absent."""
        care_level = triage.get("care_level", "ROUTINE")
        urgency_note = (
            "Prompt evaluation today (within a few hours) is advisable."
            if care_level == CareLevel.URGENT.value else
            "An elective in-person consultation with a primary care doctor is recommended."
        )

        allergies = profile.get("allergies", []) if profile else []
        allergies_note = f"Noted allergies: {', '.join(allergies)}." if allergies else "No drug allergies recorded."

        if language == "hi":
            return (
                f"**मैं क्या समझ पाया:**\n"
                f"आपने उल्लेख किया है: \"{user_message}\"। {allergies_note}\n\n"
                f"**संभावित कारण (डॉक्टर से चर्चा के लिए):**\n"
                f"- सामान्य मौसमी संक्रमण या शरीर की सूजन संबंधी प्रतिक्रिया।\n"
                f"- जीवनशैली, खानपान या मांसपेशियों का तनाव।\n"
                f"- अन्य संबंधित स्वास्थ्य स्थितियां जिनका व्यक्तिगत परीक्षण आवश्यक है।\n\n"
                f"**आप क्या कर सकते हैं:**\n"
                f"- पर्याप्त मात्रा में पानी पिएं और पर्याप्त आराम करें।\n"
                f"- बिना डॉक्टर की सलाह के कोई भी नई एंटीबायोटिक या दर्दनिवारक दवा न लें।\n\n"
                f"**डॉक्टर से कब मिलें:**\n"
                f"- {urgency_note}\n"
                f"- यदि तेज बुखार, असहनीय दर्द या सांस फूलने की समस्या हो तो तुरंत आपातकालीन सहायता (112) लें।\n\n"
                f"**डॉक्टर से पूछने योग्य प्रश्न:**\n"
                f"- क्या मुझे सीबीसी (CBC) या अन्य बुनियादी रक्त जांच करवानी चाहिए?\n"
                f"- क्या मेरे वर्तमान लक्षणों के लिए कोई विशिष्ट परहेज आवश्यक है?\n\n"
                f"**सीमाएं व अस्वीकरण:**\n"
                f"यह जानकारी केवल शैक्षिक मार्गदर्शन के लिए है। यह किसी डॉक्टर द्वारा की गई जांच या निदान का स्थान नहीं ले सकती।"
            )
        else:
            return (
                f"**What I understand:**\n"
                f"You reported: \"{user_message}\". {allergies_note}\n\n"
                f"**Possible explanations (to discuss with your doctor):**\n"
                f"- Common viral or bacterial response, depending on associated fever or inflammation.\n"
                f"- Musculoskeletal strain or lifestyle-related physical stress.\n"
                f"- An underlying condition requiring in-person clinical examination and physical evaluation.\n\n"
                f"**What you can do next:**\n"
                f"- Maintain optimal hydration with clean water and electrolytes.\n"
                f"- Rest and monitor the progression, frequency, and severity of your symptoms.\n"
                f"- Avoid self-prescribing antibiotics or scheduled medications without clinical guidance.\n\n"
                f"**When to seek medical care:**\n"
                f"- {urgency_note}\n"
                f"- Seek immediate care if you develop high fever, difficulty breathing, or severe sudden pain.\n\n"
                f"**Questions for your clinician:**\n"
                f"- Are any diagnostic tests (such as CBC or imaging) indicated for these symptoms?\n"
                f"- What symptoms should alert me to return for an urgent follow-up?\n\n"
                f"**Confidence & Limitations:**\n"
                f"This decision-support summary is generated based solely on text input without physical examination. "
                f"A physical examination, vital signs, and targeted diagnostic tests by a licensed physician are necessary for a definitive diagnosis."
            )
