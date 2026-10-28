"""
Mediscan AI - Medical Emergency & Triage Engine
Deterministic, rule-based clinical safety layer that runs BEFORE any LLM generation.
Evaluates severe warning signs, assigns one of four care urgency levels,
and directs patients to immediate emergency services (including India 112).
"""

import re
from enum import Enum
from typing import Dict, Any, List, Optional, Tuple


class CareLevel(str, Enum):
    EMERGENCY = "EMERGENCY"                  # Level 1: Seek emergency assistance now
    URGENT = "URGENT"                        # Level 2: Prompt medical assessment (within hours)
    ROUTINE = "ROUTINE"                      # Level 3: Schedule healthcare appointment
    GENERAL_GUIDANCE = "GENERAL_GUIDANCE"    # Level 4: Self-care and educational guidance


class TriageEngine:
    # Emergency Keywords & Regex Patterns (High-Risk Red Flags)
    EMERGENCY_RULES = [
        {
            "category": "Cardiac & Vascular",
            "pattern": r"\b(chest\s+pain|chest\s+pressure|crushing\s+chest|heart\s+attack|pain\s+radiating\s+to\s+(left\s+arm|jaw|neck)|severe\s+palpitations\s+with\s+(fainting|dizziness))\b",
            "title": "Suspected Cardiac Emergency",
            "action": "Immediate emergency care required. Call 112 or your local ambulance immediately. Do not drive yourself to the hospital.",
            "escalation": "Every minute counts. Sit upright, rest quietly, and have someone call 112 or 108 immediately."
        },
        {
            "category": "Respiratory Crisis",
            "pattern": r"\b(can'?t\s+breathe|cannot\s+breathe|unable\s+to\s+breathe|gasping\s+for\s+air|severe\s+shortness\s+of\s+breath|lips?\s+(?:are\s+)?(?:turning\s+)?blue|blue\s+lips?|choking|unable\s+to\s+speak\s+in\s+sentences|stridor)\b",
            "title": "Severe Breathing Distress",
            "action": "Call emergency services (112 or 108) immediately. Seek urgent oxygen support.",
            "escalation": "Severe oxygen deprivation requires immediate emergency airway intervention."
        },
        {
            "category": "Neurological / Stroke (FAST)",
            "pattern": r"\b(face\s+droop(ing)?|facial\s+droop|arm\s+weakness|arm\s+numbness|slurred\s+speech|cannot\s+speak|sudden\s+vision\s+loss|thunderclap\s+headache|worst\s+headache\s+of\s+my\s+life)\b",
            "title": "Suspected Stroke or Acute Neurological Emergency",
            "action": "Think F.A.S.T. (Face, Arms, Speech, Time). Call 112 immediately. Note the exact time symptoms started.",
            "escalation": "Acute stroke treatments are highly time-critical (therapeutic window is within 3 to 4.5 hours)."
        },
        {
            "category": "Altered Consciousness",
            "pattern": r"\b(unconscious|passed\s+out|fainted\s+and\s+not\s+waking|unresponsive|collapsed|inability\s+to\s+wake)\b",
            "title": "Loss of Consciousness / Unresponsiveness",
            "action": "Call 112 or 108 right away. Check for normal breathing and place the person in the recovery position if safe.",
            "escalation": "Unresponsiveness is a critical life-threatening state."
        },
        {
            "category": "Severe Hemorrhage",
            "pattern": r"\b(uncontrolled\s+bleeding|coughing\s+up\s+blood\s+in\s+large\s+amount|vomiting\s+blood|spurting\s+blood|bleeding\s+heavily\s+won'?t\s+stop)\b",
            "title": "Severe Uncontrolled Bleeding",
            "action": "Call 112 immediately. Apply firm, direct pressure with a clean cloth to the wound without releasing.",
            "escalation": "Risk of hypovolemic shock. Urgent surgical or trauma care required."
        },
        {
            "category": "Anaphylaxis / Severe Allergy",
            "pattern": r"\b(throat\s+swelling|tongue\s+swelling|difficulty\s+swallowing\s+with\s+hives|anaphylaxis|swollen\s+airway)\b",
            "title": "Suspected Anaphylaxis (Severe Allergic Reaction)",
            "action": "Administer an epinephrine auto-injector (EpiPen) if prescribed and available. Call 112 immediately.",
            "escalation": "Airway closure can occur rapidly within minutes of allergen exposure."
        },
        {
            "category": "Poisoning & Overdose",
            "pattern": r"\b(swallowed\s+poison|drank\s+chemical|snake\s+bite|snakebite|overdose|swallowed\s+pills\s+too\s+many|pesticide)\b",
            "title": "Suspected Poisoning, Overdose, or Envenomation",
            "action": "Call National Poison Information Center (1800-116-117) or 112 immediately. Keep the chemical container or packaging for the doctors.",
            "escalation": "Do not induce vomiting unless explicitly directed by a poison control specialist."
        },
        {
            "category": "Active Seizures",
            "pattern": r"\b(active\s+seizure|convulsing|fit\s+lasting\s+more\s+than\s+5\s+minutes|repeated\s+seizures)\b",
            "title": "Prolonged or Active Seizure",
            "action": "Call 112. Clear the area of sharp objects. Do NOT place anything in the person's mouth.",
            "escalation": "Status epilepticus lasting over 5 minutes is a neurological emergency."
        },
        {
            "category": "Mental Health Crisis / Self-Harm",
            "pattern": r"\b(suicide|kill\s+myself|want\s+to\s+die|end\s+my\s+life|self[- ]harm)\b",
            "title": "Immediate Mental Health Crisis",
            "action": "You are not alone. Please reach out to India's Tele-MANAS Mental Health Helpline at 14416 (or 1800-891-4416, 24/7 toll-free) or call 112 immediately.",
            "escalation": "Professional mental health support is available right now free of charge."
        }
    ]

    # Urgent Care Patterns (Prompt attention needed, but not immediate arrest/collapse)
    URGENT_RULES = [
        {
            "category": "High Fever & Stiff Neck",
            "pattern": r"\b(high\s+fever\s+with\s+stiff\s+neck|fever\s+over\s+103|fever\s+with\s+confusion|fever\s+with\s+rash)\b",
            "title": "Possible Meningitis or Severe Infection",
            "action": "Visit an urgent care center or doctor within 2–4 hours."
        },
        {
            "category": "Acute Abdominal Pain",
            "pattern": r"\b(severe\s+stomach\s+pain|right\s+lower\s+belly\s+pain|acute\s+abdominal\s+pain|vomiting\s+and\s+can'?t\s+keep\s+fluids\s+down)\b",
            "title": "Acute Abdominal Condition",
            "action": "Seek prompt physical medical examination to rule out appendicitis or acute obstruction."
        },
        {
            "category": "Deep Wound / Suspected Fracture",
            "pattern": r"\b(broken\s+bone|bone\s+sticking\s+out|deep\s+cut|cannot\s+bear\s+weight|deformity\s+in\s+limb)\b",
            "title": "Suspected Fracture or Laceration",
            "action": "Immobilize the limb and visit the nearest orthopaedic or trauma clinic."
        },
        {
            "category": "Severe Dehydration",
            "pattern": r"\b(no\s+urine\s+for\s+12\s+hours|dry\s+mouth\s+and\s+dizziness|sunken\s+eyes\s+and\s+lethargy)\b",
            "title": "Severe Dehydration",
            "action": "Seek prompt medical attention for IV fluid assessment."
        }
    ]

    @classmethod
    def evaluate(cls, user_text: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Deterministically evaluates user input for life-threatening warning signs.
        Always runs prior to LLM reasoning.
        """
        text = (user_text or "").lower()

        # 1. Check Level 1: Emergency Rules
        for rule in cls.EMERGENCY_RULES:
            if re.search(rule["pattern"], text, re.IGNORECASE):
                return {
                    "is_emergency": True,
                    "care_level": CareLevel.EMERGENCY.value,
                    "trigger_category": rule["category"],
                    "trigger_title": rule["title"],
                    "action_guidance": rule["action"],
                    "escalation_reason": rule["escalation"],
                    "emergency_numbers": {
                        "all_emergency_india": "112",
                        "ambulance_india": "108",
                        "maternal_ambulance_india": "102",
                        "national_health_helpline": "1075",
                        "mental_health_tele_manas": "14416 (Toll-free 1800-891-4416)",
                        "poison_center_india": "1800-116-117"
                    },
                    "safety_disclaimer": (
                        "CRITICAL NOTICE: Potential life-threatening emergency signs detected. "
                        "Do NOT wait for online advice or report analysis. Contact emergency medical services immediately."
                    )
                }

        # 2. Check Level 2: Urgent Rules
        for rule in cls.URGENT_RULES:
            if re.search(rule["pattern"], text, re.IGNORECASE):
                return {
                    "is_emergency": False,
                    "care_level": CareLevel.URGENT.value,
                    "trigger_category": rule["category"],
                    "trigger_title": rule["title"],
                    "action_guidance": rule["action"],
                    "escalation_reason": "Symptoms warrant timely clinical evaluation today to prevent complications.",
                    "emergency_numbers": {"primary_helpline": "112", "ambulance": "108"},
                    "safety_disclaimer": (
                        "Prompt medical assessment recommended. Please visit an outpatient clinic, primary health center (PHC), "
                        "or urgent care provider."
                    )
                }

        # 3. Check Duration / Severity for Routine vs General Guidance
        has_chronic_context = False
        if context:
            if context.get("chronic_conditions") or context.get("age", 0) > 65 or context.get("age", 0) < 2:
                has_chronic_context = True

        duration_matches = re.search(r"\b(weeks|months|persistent|long\s+time|recurrent|worsening)\b", text, re.IGNORECASE)
        if duration_matches or has_chronic_context:
            return {
                "is_emergency": False,
                "care_level": CareLevel.ROUTINE.value,
                "trigger_category": "Persistent or Chronic Symptoms",
                "trigger_title": "Routine Clinical Appointment",
                "action_guidance": "Schedule an in-person appointment with your primary care physician or specialist.",
                "escalation_reason": "Persistent symptoms should be formally examined by a licensed doctor.",
                "emergency_numbers": {"national_health_helpline": "1075"},
                "safety_disclaimer": (
                    "This is educational decision-support guidance, not a diagnosis. "
                    "If new warning signs develop, seek immediate care."
                )
            }

        # 4. Default: Level 4: General Guidance
        return {
            "is_emergency": False,
            "care_level": CareLevel.GENERAL_GUIDANCE.value,
            "trigger_category": "General Health Query",
            "trigger_title": "General Care & Education",
            "action_guidance": "General supportive measures and education. Monitor symptoms closely.",
            "escalation_reason": "Escalate to urgent care if symptoms worsen, high fever appears, or pain intensifies.",
            "emergency_numbers": {"national_health_helpline": "1075"},
            "safety_disclaimer": (
                "The absence of detected warning signs does NOT guarantee that you are safe or free of illness. "
                "Always consult a licensed doctor for personal medical advice."
            )
        }
