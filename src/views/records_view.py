"""
Mediscan AI - My Health Records View
Maintains an organized, private personal health record with strict provenance tracking,
search, data export, and privacy-compliant deletion controls.
"""

import json
from datetime import datetime
import streamlit as st

from ..services.auth_service import AuthService
from ..services.health_record_service import HealthRecordProvenance
from ..database import (
    list_medical_reports,
    list_medications,
    list_health_measurements,
    list_appointments,
    list_symptom_assessments,
    delete_medical_report,
    delete_medication,
    delete_health_measurement,
)


def render_records_view(user: dict):
    user_id = user["id"]

    st.markdown(
        """
        <div style="margin-bottom: 20px;">
            <h1 style="font-size: 2.1rem; font-weight: 700; color: #172033; margin-bottom: 4px;">My Personal Health Records</h1>
            <p style="font-size: 1.02rem; color: #697586; margin-top: 0;">
                Your private, encrypted repository of medical reports, allergies, conditions, medications, and measurements with verified clinical provenance.
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    rec_tab1, rec_tab2, rec_tab3, rec_tab4 = st.tabs([
        "👤 Profile & Medical History",
        "📂 Document & Test Repository",
        "📥 Data Export & Privacy",
        "🗑 Account Deletion"
    ])

    # =========================================================================
    # TAB 1: PROFILE & MEDICAL HISTORY
    # =========================================================================
    with rec_tab1:
        st.markdown("### Patient Profile & Clinical Background")

        with st.form("edit_profile_form"):
            c_p1, c_p2, c_p3 = st.columns(3)
            with c_p1:
                p_name = st.text_input("Full Name", value=user.get("full_name", ""))
                p_gender = st.selectbox("Gender", options=["Female", "Male", "Other", "Prefer not to say"], index=0 if user.get("gender") == "Female" else 1)
            with c_p2:
                p_age = st.number_input("Age", min_value=1, max_value=120, value=int(user.get("age") or 34))
                p_blood = st.selectbox("Blood Group", options=["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"], index=2)
            with c_p3:
                p_lang = st.selectbox("Preferred Language", options=["en", "hi", "pa"], format_func=lambda x: "English" if x == "en" else ("Hindi" if x == "hi" else "Punjabi"), index=0)
                p_consent = st.checkbox("Voluntary data sharing for anonymized research", value=user.get("data_sharing_consent", True))

            st.markdown("#### Medical Conditions & Allergies")
            c_a1, c_a2 = st.columns(2)
            with c_a1:
                allergies_str = st.text_input("Known Allergies (comma-separated)", value=", ".join(user.get("allergies", [])))
            with c_a2:
                conditions_str = st.text_input("Chronic Conditions (comma-separated)", value=", ".join(user.get("chronic_conditions", [])))

            st.markdown("#### Emergency Contact Information")
            c_e1, c_e2 = st.columns(2)
            with c_e1:
                em_name = st.text_input("Contact Person & Relation", value=user.get("emergency_contact_name") or "Rajesh Sharma (Spouse)")
            with c_e2:
                em_phone = st.text_input("Emergency Phone Number", value=user.get("emergency_contact_phone") or "+91 98765 43210")

            if st.form_submit_button("💾 Save Profile Updates", type="primary"):
                allergies_list = [a.strip() for a in allergies_str.split(",") if a.strip()]
                conditions_list = [c.strip() for c in conditions_str.split(",") if c.strip()]
                AuthService.update_profile(
                    user_id=user_id,
                    full_name=p_name,
                    age=p_age,
                    gender=p_gender,
                    blood_group=p_blood,
                    allergies=allergies_list,
                    chronic_conditions=conditions_list,
                    emergency_contact_name=em_name,
                    emergency_contact_phone=em_phone,
                    preferred_language=p_lang,
                    data_sharing_consent=p_consent
                )
                st.success("Profile details successfully updated.")
                st.rerun()

    # =========================================================================
    # TAB 2: DOCUMENT & TEST REPOSITORY
    # =========================================================================
    with rec_tab2:
        st.markdown("### Diagnostic Documents & Extracted Parameters")
        reports = list_medical_reports(user_id)
        if not reports:
            st.info("No medical reports uploaded yet. Use the **Medical Report Analyzer** to upload PDF blood or urine panels.")
        else:
            search_rep = st.text_input("🔍 Filter records by test or title", placeholder="e.g. Hemoglobin, Glucose, Thyroid...", key="rep_filter_q")
            for rep in reports:
                if search_rep and search_rep.lower() not in rep["report_title"].lower() and not any(search_rep.lower() in b["test_name"].lower() for b in rep.get("biomarkers", [])):
                    continue

                with st.expander(f"📄 {rep['report_title']} &bull; {rep.get('report_date') or 'Recent'}"):
                    st.markdown(f"**Document Filename:** `{rep.get('file_name', 'N/A')}`")
                    st.markdown(f"**Clinical Summary:** {rep.get('ai_summary', {}).get('summary', 'Recorded')}")

                    biomarkers = rep.get("biomarkers", [])
                    if biomarkers:
                        st.markdown("**Biomarkers & Provenance:**")
                        for b in biomarkers:
                            st.markdown(
                                f"- **{b['test_name']}**: `{b['value']} {b['unit']}` (Range: {b['reference_range']}) &bull; Status: **{b.get('flag')}** &bull; Provenance: `EXTRACTED_FROM_REPORT`"
                            )

                    if st.button("🗑 Delete Record", key=f"del_rec_rep_{rep['id']}"):
                        delete_medical_report(rep["id"], user_id)
                        st.success("Record deleted.")
                        st.rerun()

    # =========================================================================
    # TAB 3: DATA EXPORT & PRIVACY
    # =========================================================================
    with rec_tab3:
        st.markdown("### 📥 Personal Health Data Export")
        st.markdown(
            """
            In compliance with patient privacy standards and Indian Digital Personal Data Protection (DPDP) principles, 
            you have full portability and ownership of your medical records.
            """
        )

        export_data = AuthService.export_user_data(user_id)
        json_export_str = json.dumps(export_data, indent=2, ensure_ascii=False)

        st.download_button(
            label="⬇️ Download Complete Health Record Backup (JSON)",
            data=json_export_str,
            file_name=f"Mediscan_Health_Record_{user.get('username')}_{datetime.utcnow().strftime('%Y%m%d')}.json",
            mime="application/json",
            use_container_width=True
        )

        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown("#### Printable Clinical Summary")
        summary_text = (
            f"# PATIENT CLINICAL HEALTH SUMMARY\n"
            f"Generated: {datetime.utcnow().strftime('%d %b %Y')}\n"
            f"Patient: {user.get('full_name')} (Age: {user.get('age')}, Gender: {user.get('gender')})\n"
            f"Blood Group: {user.get('blood_group')}\n"
            f"Allergies: {', '.join(user.get('allergies', [])) or 'None reported'}\n"
            f"Chronic Conditions: {', '.join(user.get('chronic_conditions', [])) or 'None reported'}\n\n"
            f"--- ACTIVE MEDICATIONS ---\n"
        )
        for m in list_medications(user_id, status="ACTIVE"):
            summary_text += f"- {m['name']} ({m.get('strength') or 'Standard'}): {m.get('instructions') or 'As directed'} [{m.get('frequency')}]\n"

        st.text_area("Plain Text Clinical Summary (Copy or Print)", value=summary_text, height=220)

    # =========================================================================
    # TAB 4: ACCOUNT DELETION
    # =========================================================================
    with rec_tab4:
        st.markdown("### ⚠️ Account & Health Data Purge")
        st.markdown(
            """
            <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 14px 18px; border-radius: 6px; margin-bottom: 20px;">
                <strong style="color: #991B1B;">Permanent Deletion Warning:</strong>
                <p style="color: #B91C1C; font-size: 0.9rem; margin: 4px 0 0 0;">
                    Purging your account will permanently delete your user profile, all uploaded medical reports, 
                    medication history, vital measurements, and past AI doctor conversations. This action cannot be undone.
                </p>
            </div>
            """,
            unsafe_allow_html=True,
        )

        confirm_text = st.text_input("Type 'DELETE' to confirm permanent erasure of your account", key="del_confirm_input")
        if st.button("🚨 Permanently Delete My Account & All Health Records", type="primary"):
            if confirm_text == "DELETE":
                AuthService.delete_user_account(user_id)
                st.session_state.authenticated_user = None
                st.success("Your account and all associated health records have been permanently erased.")
                st.rerun()
            else:
                st.error("Please type 'DELETE' exactly to confirm deletion.")
