"""
Mediscan AI - Guided Symptom Checker Service
Conducts structured clinical assessments, detects red flags, evaluates contraindications,
and provides care urgency recommendations with tailored self-care guidance.
"""

from typing import Dict, Any, List, Optional
from .triage_service import TriageEngine, CareLevel


class SymptomCheckerService:
    @classmethod
    def assess_symptoms(
        cls,
        main_symptom: str,
        duration: str,
        severity: str,
        body_location: str,
        associated_symptoms: List[str],
        age_range: str,
        relevant_conditions: List[str],
        pregnancy_status: str,
        current_medications: List[str]
    ) -> Dict[str, Any]:
        """
        Processes multi-attribute symptom inputs, executes deterministic triage,
        evaluates safety contraindications, and produces a decision-support assessment.
        """
        combined_text = (
            f"Main symptom: {main_symptom}. Location: {body_location}. "
            f"Associated symptoms: {', '.join(associated_symptoms)}. Severity: {severity}. Duration: {duration}."
        )

        context = {
            "age_range": age_range,
            "chronic_conditions": relevant_conditions,
            "pregnancy_status": pregnancy_status,
            "current_medications": current_medications
        }

        # 1. Triage Engine
        triage = TriageEngine.evaluate(combined_text, context)

        # 2. Derive care urgency and possible considerations
        care_urgency = triage["care_level"]
        if severity == "Severe" and care_urgency == CareLevel.GENERAL_GUIDANCE.value:
            care_urgency = CareLevel.URGENT.value

        # 3. Analyze Possible Clinical Causes (as possibilities, not diagnoses)
        possible_causes = cls._map_possible_causes(main_symptom, associated_symptoms, body_location)

        # 4. Formulate Low-Risk Supportive Self-Care with Contraindication Checks
        self_care = cls._generate_safe_self_care(
            main_symptom,
            severity,
            pregnancy_status,
            relevant_conditions
        )

        # 5. Determine Escalation Red Flags
        escalation_signs = cls._determine_escalation_signs(main_symptom)

        # 6. Specialty Recommendation
        specialty = cls._suggest_specialty(main_symptom, body_location, care_urgency)

        return {
            "main_symptom": main_symptom,
            "duration": duration,
            "severity": severity,
            "body_location": body_location,
            "care_urgency": care_urgency,
            "is_emergency": triage["is_emergency"],
            "triage_summary": triage["trigger_title"],
            "action_guidance": triage["action_guidance"],
            "possible_causes": possible_causes,
            "self_care_guidance": self_care,
            "escalation_signs": escalation_signs,
            "suggested_specialty": specialty,
            "safety_disclaimer": (
                "Educational Decision-Support: This assessment does not provide a definitive medical diagnosis. "
                "Consult a licensed physician for clinical examination and personalized prescription."
            )
        }

    @classmethod
    def _map_possible_causes(cls, symptom: str, associated: List[str], location: str) -> List[Dict[str, str]]:
        s_lower = symptom.lower()
        assoc_str = " ".join(associated).lower()

        if "fever" in s_lower or "fever" in assoc_str:
            if "cough" in assoc_str or "throat" in assoc_str:
                return [
                    {"cause": "Upper Respiratory Tract Viral Infection", "description": "Common influenza, rhinovirus, or bronchitis; typically self-limiting with supportive hydration."},
                    {"cause": "Bacterial Pharyngitis / Tonsillitis", "description": "Bacterial throat infection that may require clinical throat swab examination."}
                ]
            elif "joint" in assoc_str or "rash" in assoc_str:
                return [
                    {"cause": "Vector-Borne Infection (Dengue, Chikungunya, Malaria)", "description": "High prevalence in tropical climates during seasonal monsoon changes. Requires Complete Blood Count (CBC) and platelet monitoring."},
                    {"cause": "Acute Viral Exanthem", "description": "Systemic viral illness presenting with rash and generalized body aches."}
                ]
            return [
                {"cause": "Acute Viral Syndrome", "description": "General systemic viral infection responding to rest and antipyretic care."},
                {"cause": "Urinary Tract Infection (UTI)", "description": "Particularly if accompanied by dysuria, lower abdominal discomfort, or frequency."}
            ]

        if "headache" in s_lower:
            if "nausea" in assoc_str or "light" in assoc_str or "sound" in assoc_str:
                return [
                    {"cause": "Migraine Headache", "description": "Unilateral or throbbing headache often aggravated by sensory stimuli."},
                    {"cause": "Tension-Type Headache", "description": "Bilateral band-like pressure associated with stress, lack of sleep, or screen fatigue."}
                ]
            return [
                {"cause": "Tension Headache", "description": "Common headache linked to muscle contraction in the neck or scalp."},
                {"cause": "Cervicogenic or Sinus Strain", "description": "Referred discomfort from cervical spine posture or congested nasal sinuses."}
            ]

        if "stomach" in s_lower or "abdominal" in s_lower:
            return [
                {"cause": "Acute Gastritis / Acid Peptic Disorder", "description": "Irritation of stomach lining, hyperacidity, or indigestion."},
                {"cause": "Gastroenteritis / Food-Borne Infection", "description": "Intestinal inflammation accompanied by loose stools or cramping."}
            ]

        if "cough" in s_lower:
            return [
                {"cause": "Post-Viral Bronchial Hyperresponsiveness", "description": "Lingering airway sensitivity following a common cold or respiratory virus."},
                {"cause": "Allergic Bronchitis / Cough Variant Asthma", "description": "Airway irritation triggered by seasonal dust, pollution, or allergens."}
            ]

        return [
            {"cause": f"Primary {symptom} Presentation", "description": "Symptom warrants focused physical examination by a medical clinician to identify underlying cause."}
        ]

    @classmethod
    def _generate_safe_self_care(
        cls,
        symptom: str,
        severity: str,
        pregnancy: str,
        conditions: List[str]
    ) -> List[str]:
        steps = [
            "Maintain optimal hydration by drinking 2.5 to 3 liters of clean water, clear soups, or electrolyte fluids daily.",
            "Prioritize restorative rest and avoid intense physical exertion until recovery.",
            "Record your body temperature and symptom frequency twice daily in your personal health log."
        ]

        is_pregnant = any(w in pregnancy.lower() for w in ("yes", "pregnant", "pregnancy"))
        has_asthma = any("asthma" in c.lower() for c in conditions)

        if is_pregnant:
            steps.append("PREGNANCY CAUTION: Avoid taking over-the-counter medications or herbal remedies without prior obstetrician clearance.")

        if has_asthma:
            steps.append("ASTHMA NOTICE: Have your rescue inhaler accessible and monitor peak expiratory flow if symptoms affect chest comfort.")

        if "fever" in symptom.lower():
            steps.append("Fever Comfort: Apply lukewarm water sponge to forehead and neck if temperature exceeds 101°F. Avoid heavy blankets.")
            steps.append("Caution: Do NOT take non-steroidal anti-inflammatory drugs (NSAIDs like ibuprofen/aspirin) if dengue or viral platelet drop is suspected.")

        return steps

    @classmethod
    def _determine_escalation_signs(cls, symptom: str) -> List[str]:
        return [
            "Sudden severe worsening of symptoms or development of unbearable pain.",
            "Appearance of high fever (> 102.5°F / 39.2°C) unresponsive to standard measures.",
            "Difficulty breathing, chest tightness, or blueness of lips / nail beds.",
            "Repeated vomiting with inability to retain any liquids for over 12 hours.",
            "Onset of confusion, extreme lethargy, slurred speech, or persistent fainting."
        ]

    @classmethod
    def _suggest_specialty(cls, symptom: str, location: str, care_urgency: str) -> str:
        if care_urgency == CareLevel.EMERGENCY.value:
            return "Hospital Emergency Department (Casualty / ER)"

        s_lower = symptom.lower()
        loc_lower = location.lower()

        if "skin" in s_lower or "rash" in s_lower:
            return "Dermatologist"
        elif "eye" in s_lower or "vision" in s_lower:
            return "Ophthalmologist"
        elif "ear" in s_lower or "nose" in s_lower or "throat" in s_lower:
            return "ENT Specialist (Otolaryngologist)"
        elif "stomach" in s_lower or "digestion" in s_lower:
            return "Gastroenterologist or General Physician"
        elif "bone" in s_lower or "joint" in s_lower or "ortho" in s_lower:
            return "Orthopaedic Specialist or Rheumatologist"
        elif "tooth" in s_lower or "dental" in s_lower:
            return "Dentist"
        elif "child" in loc_lower or "infant" in loc_lower:
            return "Pediatrician"
        else:
            return "General Physician / Family Medicine Practitioner"
