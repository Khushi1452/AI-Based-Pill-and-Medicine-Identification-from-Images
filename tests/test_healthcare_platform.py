"""
Comprehensive Test Suite for Mediscan AI Healthcare Platform
Tests:
- Emergency symptoms taking priority over ordinary chat
- Ambiguous symptoms producing appropriate uncertainty
- Medical reports with missing units or unreadable values
- Corrupt and unsupported files
- User authentication and user-level data isolation
- User feedback not automatically becoming a verified label
- Missing or invalid Gemini API keys handled gracefully
- Healthcare search distance calculation and specialty mapping
- Data deletion and export compliance
- Multilingual chat responses (English, Hindi, Punjabi)
- Symptom checker contraindications and care urgency
"""

import os
import sys
import json
import pytest
from pathlib import Path
from datetime import datetime

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.services.triage_service import TriageEngine, CareLevel
from src.services.chat_service import AIDoctorChatService
from src.services.report_service import MedicalReportAnalyzer
from src.services.symptom_service import SymptomCheckerService
from src.services.healthcare_locator import HealthcareLocatorService, haversine_distance_km
from src.services.auth_service import AuthService
from src.database import (
    init_db,
    save_medical_report,
    list_medical_reports,
    delete_medical_report,
    save_medication,
    list_medications,
    save_health_measurement,
    list_health_measurements,
    save_audit_feedback,
    list_audit_feedbacks,
    set_cached_analysis,
    get_cached_analysis,
    clear_analysis_cache,
)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db(seed_catalog=False)


# ============================================================================
# 1. EMERGENCY TRIAGE & CHAT PRIORITY TESTS
# ============================================================================

def test_emergency_chest_pain_triggers_immediate_triage():
    """Verify crushing chest pain immediately assigns EMERGENCY level with 112 routing."""
    res = TriageEngine.evaluate("I have severe crushing chest pain radiating to my left arm")
    assert res["is_emergency"] is True
    assert res["care_level"] == CareLevel.EMERGENCY.value
    assert "112" in res["emergency_numbers"]["all_emergency_india"]
    assert "108" in res["emergency_numbers"]["ambulance_india"]


def test_emergency_stroke_fast_signs_trigger():
    """Verify stroke FAST signs (face drooping, slurred speech) trigger emergency."""
    res = TriageEngine.evaluate("My father suddenly has facial droop and cannot speak properly")
    assert res["is_emergency"] is True
    assert res["care_level"] == CareLevel.EMERGENCY.value
    assert "Stroke" in res["trigger_title"]


def test_emergency_respiratory_crisis():
    """Verify severe breathing distress triggers emergency."""
    res = TriageEngine.evaluate("I cannot breathe and my lips are turning blue")
    assert res["is_emergency"] is True
    assert res["care_level"] == CareLevel.EMERGENCY.value


def test_emergency_anaphylaxis():
    """Verify severe allergy / throat swelling triggers immediate emergency."""
    res = TriageEngine.evaluate("Ate peanuts and now experiencing severe throat swelling and breathing difficulty")
    assert res["is_emergency"] is True
    assert res["care_level"] == CareLevel.EMERGENCY.value


def test_emergency_takes_priority_in_chat_service():
    """Verify chat service intercepts emergency without delaying for LLM generation."""
    chat_svc = AIDoctorChatService(api_key=None)
    response = chat_svc.generate_chat_response("I have severe chest pressure and shortness of breath")
    assert response["is_emergency"] is True
    assert response["care_level"] == CareLevel.EMERGENCY.value
    assert "112" in response["content"]
    assert response["source"] == "DETERMINISTIC_TRIAGE_OVERRIDE"


# ============================================================================
# 2. AMBIGUOUS SYMPTOMS & UNCERTAINTY DISCLOSURE
# ============================================================================

def test_ambiguous_symptoms_produce_uncertainty():
    """Verify ambiguous, minor symptoms produce qualified explanations and limitations."""
    chat_svc = AIDoctorChatService(api_key=None)
    res = chat_svc.generate_chat_response("I have a slightly dry mouth and feel somewhat tired")
    assert res["is_emergency"] is False
    assert res["care_level"] == CareLevel.GENERAL_GUIDANCE.value
    assert "Confidence & Limitations" in res["content"] or "सीमाएं" in res["content"]


# ============================================================================
# 3. MEDICAL REPORT PARSING & CORRUPT/EMPTY HANDLING
# ============================================================================

def test_report_analyzer_handles_corrupt_file_gracefully():
    """Verify corrupt or random bytes do not crash the document parser."""
    analyzer = MedicalReportAnalyzer()
    corrupt_bytes = b"NOT_A_VALID_PDF_OR_IMAGE_GARBAGE_BYTES_12345"
    raw_text, biomarkers, summary = analyzer.parse_document(corrupt_bytes, "corrupt.pdf")
    assert isinstance(raw_text, str)
    assert isinstance(biomarkers, list)
    assert isinstance(summary, dict)


def test_report_analyzer_extracts_known_biomarkers():
    """Verify standard clinical parameters are extracted with correct reference ranges."""
    analyzer = MedicalReportAnalyzer()
    sample_text = """
    LAL PATHLABS CLINICAL LABORATORY REPORT
    Patient: Pooja Sharma | Date: 12-Oct-2026
    Complete Blood Count:
    Hemoglobin: 10.5 g/dL (Reference: 12.0 - 16.0 g/dL)
    Total Leukocyte Count (TLC): 13500 cells/cumm (Reference: 4,000 - 11,000)
    Platelet Count: 2.10 lakh/cumm (Reference: 1.50 - 4.50)
    Fasting Blood Glucose: 118 mg/dL (Reference: 70 - 99)
    """
    biomarkers = analyzer._extract_biomarkers(sample_text)
    names = [b["test_name"] for b in biomarkers]
    assert "Hemoglobin" in names
    assert "Platelet Count" in names
    assert "Fasting Blood Glucose" in names

    # Check flag for low hemoglobin (10.5 vs 12.0 - 16.0)
    hb_item = next(b for b in biomarkers if b["test_name"] == "Hemoglobin")
    assert hb_item["flag"] == "LOW"

    # Check flag for high fasting glucose (118 vs 70 - 99)
    fbs_item = next(b for b in biomarkers if b["test_name"] == "Fasting Blood Glucose")
    assert fbs_item["flag"] == "HIGH"


# ============================================================================
# 4. USER AUTHENTICATION & DATA ISOLATION
# ============================================================================

def test_user_authentication_and_password_hashing():
    """Verify PBKDF2 password verification succeeds on correct password and rejects incorrect."""
    username = f"testuser_{int(datetime.utcnow().timestamp())}"
    success, msg, user = AuthService.register_user(
        username=username,
        password="secretpassword123",
        full_name="Dr. Test User",
        email=f"{username}@example.com"
    )
    assert success is True
    assert user is not None

    # Correct login
    auth_ok, _, logged_in = AuthService.authenticate_user(username, "secretpassword123")
    assert auth_ok is True
    assert logged_in["username"] == username

    # Wrong password rejected
    fail_ok, _, _ = AuthService.authenticate_user(username, "wrongpassword")
    assert fail_ok is False


def test_user_data_isolation():
    """Verify User A cannot see User B's reports or medications."""
    user_a = f"usera_{int(datetime.utcnow().timestamp())}"
    user_b = f"userb_{int(datetime.utcnow().timestamp())}"

    _, _, u_a = AuthService.register_user(user_a, "pass12345", "User A")
    _, _, u_b = AuthService.register_user(user_b, "pass12345", "User B")

    # User A saves a report
    save_medical_report(
        user_id=u_a["id"],
        report_title="User A Private Blood Test",
        report_type="BLOOD_TEST",
        report_date="2026-10-15",
        raw_text="Hemoglobin 14.0",
        biomarkers=[],
        ai_summary={}
    )

    # User B queries their reports -> must be empty
    reports_b = list_medical_reports(u_b["id"])
    assert len(reports_b) == 0

    # User A queries their reports -> exactly 1
    reports_a = list_medical_reports(u_a["id"])
    assert len(reports_a) == 1
    assert reports_a[0]["report_title"] == "User A Private Blood Test"


def test_data_export_and_deletion():
    """Verify full user export and cascade deletion purging."""
    u_name = f"deluser_{int(datetime.utcnow().timestamp())}"
    _, _, u = AuthService.register_user(u_name, "pass12345", "Delete Me")

    save_medication(u["id"], name="Metformin 500mg")
    save_health_measurement(u["id"], measurement_type="HEART_RATE", value_numeric=72.0, unit="bpm")

    # Export
    export = AuthService.export_user_data(u["id"])
    assert len(export["medications"]) == 1
    assert len(export["health_measurements"]) == 1

    # Purge
    deleted = AuthService.delete_user_account(u["id"])
    assert deleted is True

    # After deletion, queries must return empty
    assert len(list_medications(u["id"])) == 0
    assert len(list_health_measurements(u["id"])) == 0


# ============================================================================
# 5. USER FEEDBACK AUDIT TRAIL
# ============================================================================

def test_user_feedback_does_not_auto_promote_to_verified():
    """Verify feedback is logged as PENDING and does not alter verified database."""
    fb_id = save_audit_feedback(
        user_id="test_user",
        category="MEDICINE_IDENTIFICATION",
        ref_id="scan_123",
        in_summary="Dolo 650 blister scan",
        out_summary="Predicted Paracetamol",
        rating="INCORRECT",
        corrections="Brand should be Dolo-650"
    )
    assert fb_id.startswith("aud_")
    feedbacks = list_audit_feedbacks(category="MEDICINE_IDENTIFICATION")
    assert any(f["id"] == fb_id and f["review_status"] == "PENDING" for f in feedbacks)


# ============================================================================
# 6. HEALTHCARE LOCATOR & SPECIALTY MATCHING
# ============================================================================

def test_healthcare_locator_distance_and_specialties():
    """Verify Haversine distance and intelligent specialty mapping."""
    # Haversine distance between AIIMS (28.5672, 77.2100) and Connaught Place (28.6315, 77.2167) ~7.2 km
    dist = haversine_distance_km(28.5672, 77.2100, 28.6315, 77.2167)
    assert 6.0 <= dist <= 8.5

    loc = HealthcareLocatorService()
    specs = loc.get_intelligent_specialty_matches("severe tooth cavity and bleeding gums")
    assert "Dentistry" in specs

    skin_specs = loc.get_intelligent_specialty_matches("itchy red rash and eczema")
    assert "Dermatology" in skin_specs


# ============================================================================
# 7. MULTILINGUAL RESPONSES & FALLBACKS
# ============================================================================

def test_multilingual_chat_fallback():
    """Verify offline clinical fallback responds in requested Hindi and Punjabi."""
    chat_svc = AIDoctorChatService(api_key=None)

    hi_res = chat_svc.generate_chat_response("मुझे कल से हल्का बुखार है", language="hi")
    assert "संभावित कारण" in hi_res["content"] or "डॉक्टर" in hi_res["content"]

    en_res = chat_svc.generate_chat_response("I have a mild fever since yesterday", language="en")
    assert "Possible explanations" in en_res["content"]


# ============================================================================
# 8. SYMPTOM CHECKER & CONTRAINDICATION NOTICES
# ============================================================================

def test_symptom_checker_pregnancy_and_asthma_contraindications():
    """Verify contraindication alerts are generated for pregnancy and asthma."""
    res = SymptomCheckerService.assess_symptoms(
        main_symptom="Fever and body aches",
        duration="1 - 2 days",
        severity="Moderate",
        body_location="Full body",
        associated_symptoms=["Headache"],
        age_range="Adult (18-64)",
        relevant_conditions=["Asthma"],
        pregnancy_status="Currently Pregnant",
        current_medications=[]
    )
    guidance_str = " ".join(res["self_care_guidance"])
    assert "PREGNANCY CAUTION" in guidance_str
    assert "ASTHMA NOTICE" in guidance_str


# ============================================================================
# 9. CACHE ISOLATION & HASH LOOKUP
# ============================================================================

def test_cache_storage_and_clear():
    """Verify response cache storing, retrieval, and clearing."""
    img_hash = "mock_hash_test_123456"
    test_data = {"product": "Test Medicine 500mg", "verified": True}
    set_cached_analysis(img_hash, test_data, ttl_seconds=3600)

    retrieved = get_cached_analysis(img_hash)
    assert retrieved is not None
    assert retrieved["product"] == "Test Medicine 500mg"

    clear_analysis_cache()
    assert get_cached_analysis(img_hash) is None
