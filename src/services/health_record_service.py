"""
Mediscan AI - Personal Health Record & Clinical Summary Service
Manages personal health records with strict clinical provenance tracking,
generates structured appointment preparation dossiers, and compiles health timelines.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
import json

from ..database import (
    get_db_connection,
    list_medical_reports,
    list_medications,
    list_health_measurements,
    list_appointments,
    list_symptom_assessments,
)


class HealthRecordProvenance:
    USER_ENTERED = "USER_ENTERED"
    EXTRACTED_FROM_REPORT = "EXTRACTED_FROM_REPORT"
    CLINICIAN_PROVIDED = "CLINICIAN_PROVIDED"
    AI_GENERATED = "AI_GENERATED"


class HealthRecordService:
    @classmethod
    def get_user_health_summary(cls, user_id: str) -> Dict[str, Any]:
        """Gathers unified health records for user dashboard and appointment prep."""
        reports = list_medical_reports(user_id)
        meds = list_medications(user_id, status="ACTIVE")
        measurements = list_health_measurements(user_id, limit=30)
        appointments = list_appointments(user_id)
        symptoms = list_symptom_assessments(user_id)

        return {
            "reports_count": len(reports),
            "recent_reports": reports[:3],
            "active_medications": meds,
            "recent_measurements": measurements[:5],
            "upcoming_appointments": [a for a in appointments if a.get("status") == "SCHEDULED"],
            "recent_symptoms": symptoms[:3],
        }

    @classmethod
    def generate_appointment_preparation(
        cls,
        user_id: str,
        user_profile: Dict[str, Any],
        appointment_reason: str,
        target_doctor: Optional[str] = None,
        custom_concerns: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Synthesizes an appointment preparation dossier for the patient to share with their doctor.
        Clearly labels unverified user inputs versus lab reports.
        """
        now_str = datetime.utcnow().strftime("%d %b %Y")
        reports = list_medical_reports(user_id)
        active_meds = list_medications(user_id, status="ACTIVE")
        symptoms = list_symptom_assessments(user_id)
        measurements = list_health_measurements(user_id, limit=10)

        # 1. Chief Concerns
        concerns = custom_concerns or [appointment_reason]

        # 2. Symptom Progression Timeline
        timeline_items = []
        for s in symptoms[:3]:
            timeline_items.append({
                "symptom": s.get("main_symptom"),
                "duration": s.get("duration"),
                "severity": s.get("severity"),
                "date": s.get("created_at", "")[:10]
            })

        # 3. Medical Background
        history = {
            "chronic_conditions": user_profile.get("chronic_conditions", []),
            "allergies": user_profile.get("allergies", []),
            "blood_group": user_profile.get("blood_group", "Unspecified"),
            "provenance": HealthRecordProvenance.USER_ENTERED
        }

        # 4. Current Medications
        med_list = []
        for m in active_meds:
            med_list.append({
                "name": m.get("name"),
                "strength": m.get("strength") or "N/A",
                "instructions": m.get("instructions") or "As prescribed",
                "frequency": m.get("frequency") or "Regular",
                "provenance": m.get("provenance") or HealthRecordProvenance.USER_ENTERED
            })

        # 5. Key Abnormal Lab Findings
        abnormal_labs = []
        for rep in reports[:3]:
            for b in rep.get("biomarkers", []):
                if b.get("flag") in ("HIGH", "LOW"):
                    abnormal_labs.append({
                        "test_name": b.get("test_name"),
                        "value": f"{b.get('value')} {b.get('unit')}",
                        "flag": b.get("flag"),
                        "reference_range": b.get("reference_range"),
                        "report_date": rep.get("report_date")
                    })

        # 6. Suggested Questions for the Clinician
        doctor_questions = [
            f"What could be causing my {appointment_reason.lower()}?",
            "Are any changes needed to my current medications or dosages?",
            "Do any of my recent lab parameters require follow-up or retesting?",
            "What warning signs should prompt me to seek urgent care?"
        ]

        return {
            "generated_date": now_str,
            "patient_name": user_profile.get("full_name", "Patient"),
            "patient_age": user_profile.get("age", "N/A"),
            "patient_gender": user_profile.get("gender", "N/A"),
            "doctor_name": target_doctor or "Healthcare Provider",
            "appointment_reason": appointment_reason,
            "chief_concerns": concerns,
            "symptom_progression": timeline_items,
            "medical_history": history,
            "current_medications": med_list,
            "key_lab_findings": abnormal_labs,
            "recent_measurements": [
                {
                    "type": m.get("measurement_type"),
                    "value": f"{m.get('value_numeric')}" + (f"/{m.get('secondary_value')}" if m.get('secondary_value') else "") + f" {m.get('unit')}",
                    "date": m.get("measured_at", "")[:10]
                }
                for m in measurements[:4]
            ],
            "questions_for_doctor": doctor_questions,
            "provenance_disclaimer": (
                "NOTE FOR CLINICIAN: This summary was compiled by the patient using Mediscan AI. "
                "Self-reported symptoms and user-entered medications represent patient recollections. "
                "Laboratory findings reflect extracted data from uploaded documents and require verification against primary records."
            )
        }

    @classmethod
    def get_unified_health_timeline(cls, user_id: str) -> List[Dict[str, Any]]:
        """Gathers all chronological events across reports, measurements, symptoms, and appointments."""
        events = []

        # Reports
        for r in list_medical_reports(user_id):
            events.append({
                "type": "REPORT",
                "title": f"Medical Report: {r.get('report_title')}",
                "timestamp": r.get("report_date") or r.get("created_at")[:10],
                "badge": r.get("report_type"),
                "details": f"{len(r.get('biomarkers', []))} tests recorded",
                "provenance": HealthRecordProvenance.EXTRACTED_FROM_REPORT
            })

        # Measurements
        for m in list_health_measurements(user_id, limit=50):
            val_str = f"{m.get('value_numeric')}"
            if m.get('secondary_value'):
                val_str += f"/{m.get('secondary_value')}"
            events.append({
                "type": "MEASUREMENT",
                "title": f"{m.get('measurement_type').replace('_', ' ').title()}",
                "timestamp": m.get("measured_at")[:10],
                "badge": f"{val_str} {m.get('unit')}",
                "details": m.get("notes") or f"Recorded from {m.get('source')}",
                "provenance": m.get("source")
            })

        # Symptoms
        for s in list_symptom_assessments(user_id):
            events.append({
                "type": "SYMPTOM",
                "title": f"Symptom Assessment: {s.get('main_symptom')}",
                "timestamp": s.get("created_at")[:10],
                "badge": s.get("care_urgency"),
                "details": f"Severity: {s.get('severity')} | Duration: {s.get('duration')}",
                "provenance": HealthRecordProvenance.USER_ENTERED
            })

        # Appointments
        for a in list_appointments(user_id):
            events.append({
                "type": "APPOINTMENT",
                "title": f"Appointment: {a.get('doctor_name') or 'Doctor Visit'}",
                "timestamp": a.get("appointment_date")[:10],
                "badge": a.get("status"),
                "details": f"Facility: {a.get('facility_name') or 'Clinic'} | Reason: {a.get('reason') or 'Consultation'}",
                "provenance": HealthRecordProvenance.USER_ENTERED
            })

        # Sort descending by timestamp
        events.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return events
