"""
Mediscan AI - Appointment Preparation View
Generates concise, editable clinical dossiers for doctor visits,
synthesizing symptom history, active medications, abnormal labs, and doctor questions.
"""

from datetime import datetime
import streamlit as st

from ..services.health_record_service import HealthRecordService
from ..database import (
    save_appointment,
    list_appointments,
    update_appointment,
    delete_appointment,
)


def render_appointment_view(user: dict):
    user_id = user["id"]

    st.markdown(
        """
        <div style="margin-bottom: 20px;">
            <h1 style="font-size: 2.1rem; font-weight: 700; color: #172033; margin-bottom: 4px;">Doctor Appointment Preparation</h1>
            <p style="font-size: 1.02rem; color: #697586; margin-top: 0;">
                Prepare for your medical consultation with an organized clinical dossier summarizing symptoms, active prescriptions, recent lab findings, and targeted questions.
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    tab_prep, tab_schedule = st.tabs(["📋 Generate Consultation Dossier", "📅 Scheduled Appointments"])

    with tab_prep:
        col_in, col_dossier = st.columns([1.0, 1.4], gap="large")

        with col_in:
            st.markdown("### Consultation Details")
            doc_name = st.text_input("Physician / Doctor Name", placeholder="e.g. Dr. Rajesh Verma, MD", key="apt_doc_name")
            specialty = st.selectbox("Specialty", options=["General Medicine / Internal Medicine", "Cardiology", "Dermatology", "Orthopaedics", "Gastroenterology", "Ophthalmology", "ENT Specialist", "Other"])
            clinic_name = st.text_input("Clinic / Hospital Facility", placeholder="e.g. Max Super Speciality Hospital, Saket", key="apt_facility")
            visit_reason = st.text_input("Main Concern or Reason for Visit *", placeholder="e.g. Persistent cough and morning fatigue for 2 weeks", key="apt_reason")

            c_q1 = st.text_input("Custom Concern 1 (Optional)", placeholder="e.g. Blood pressure readings fluctuated this week")
            c_q2 = st.text_input("Custom Concern 2 (Optional)", placeholder="e.g. Occasional knee stiffness on climbing stairs")

            gen_clicked = st.button("📝 Generate Clinical Dossier", type="primary", use_container_width=True, key="btn_gen_dossier")

        with col_dossier:
            st.markdown("### Clinical Dossier Preview")

            concerns = [visit_reason] if visit_reason else []
            if c_q1:
                concerns.append(c_q1)
            if c_q2:
                concerns.append(c_q2)

            if gen_clicked or "active_dossier" in st.session_state:
                if gen_clicked:
                    dossier = HealthRecordService.generate_appointment_preparation(
                        user_id=user_id,
                        user_profile=user,
                        appointment_reason=visit_reason or "General Consultation",
                        target_doctor=doc_name,
                        custom_concerns=concerns or None
                    )
                    st.session_state.active_dossier = dossier

                dos = st.session_state.get("active_dossier")
                if dos:
                    st.markdown(
                        f"""
                        <div style="border: 1px solid #CBD5E1; border-radius: 8px; padding: 18px; background: #FFFFFF; font-size: 0.9rem;">
                            <div style="border-bottom: 2px solid #2563EB; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between;">
                                <div>
                                    <strong style="font-size: 1.15rem; color: #172033;">PRE-CONSULTATION PATIENT DOSSIER</strong><br>
                                    <span style="color: #64748B;">Date: {dos['generated_date']} &bull; Prepared for: <b>{dos['doctor_name']}</b></span>
                                </div>
                                <div style="text-align: right; color: #64748B;">
                                    <b>{dos['patient_name']}</b> ({dos['patient_age']}y, {dos['patient_gender']})<br>
                                    Blood Group: {dos['medical_history']['blood_group']}
                                </div>
                            </div>
                            <div style="margin-bottom: 10px;">
                                <strong style="color: #1E293B;">1. Chief Reasons for Consultation:</strong>
                                <ul>
                                    {''.join([f'<li>{c}</li>' for c in dos['chief_concerns']])}
                                </ul>
                            </div>
                            <div style="margin-bottom: 10px;">
                                <strong style="color: #1E293B;">2. Background Conditions & Allergies:</strong>
                                <div>Known Allergies: <b>{', '.join(dos['medical_history']['allergies']) or 'None reported'}</b></div>
                                <div>Chronic Conditions: <b>{', '.join(dos['medical_history']['chronic_conditions']) or 'None reported'}</b></div>
                            </div>
                            <div style="margin-bottom: 10px;">
                                <strong style="color: #1E293B;">3. Active Medications Currently Taken:</strong>
                                <ul>
                                    {''.join([f"<li><b>{m['name']}</b> ({m['strength']}) - {m['instructions']} [{m['frequency']}]</li>" for m in dos['current_medications']]) or '<li>No active medications recorded</li>'}
                                </ul>
                            </div>
                            <div style="margin-bottom: 10px;">
                                <strong style="color: #1E293B;">4. Recent Flagged Laboratory Parameters:</strong>
                                <ul>
                                    {''.join([f"<li><b>{l['test_name']}</b>: {l['value']} ({l['flag']}) [Ref: {l['reference_range']}]</li>" for l in dos['key_lab_findings']]) or '<li>No abnormal lab parameters flagged in uploaded reports</li>'}
                                </ul>
                            </div>
                            <div style="margin-bottom: 10px;">
                                <strong style="color: #1E293B;">5. Prepared Questions for the Doctor:</strong>
                                <ul>
                                    {''.join([f'<li>{q}</li>' for q in dos['questions_for_doctor']])}
                                </ul>
                            </div>
                            <div style="font-size: 0.78rem; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 6px; margin-top: 8px;">
                                <i>{dos['provenance_disclaimer']}</i>
                            </div>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )

                    # Export / Download Button
                    dossier_text = (
                        f"PATIENT CONSULTATION DOSSIER\n"
                        f"Date: {dos['generated_date']}\n"
                        f"Doctor: {dos['doctor_name']}\n"
                        f"Patient: {dos['patient_name']} (Age: {dos['patient_age']}, {dos['patient_gender']})\n"
                        f"Allergies: {', '.join(dos['medical_history']['allergies']) or 'None'}\n"
                        f"Chronic Conditions: {', '.join(dos['medical_history']['chronic_conditions']) or 'None'}\n\n"
                        f"CHIEF CONCERNS:\n" + "\n".join([f"- {c}" for c in dos['chief_concerns']]) + "\n\n"
                        f"CURRENT MEDICATIONS:\n" + "\n".join([f"- {m['name']} ({m['strength']}) - {m['instructions']}" for m in dos['current_medications']]) + "\n\n"
                        f"QUESTIONS FOR DOCTOR:\n" + "\n".join([f"- {q}" for q in dos['questions_for_doctor']]) + "\n\n"
                        f"DISCLAIMER:\n{dos['provenance_disclaimer']}"
                    )

                    st.download_button(
                        "⬇️ Download Dossier for Doctor Visit",
                        data=dossier_text,
                        file_name=f"Consultation_Dossier_{datetime.utcnow().strftime('%Y%m%d')}.txt",
                        mime="text/plain",
                        use_container_width=True
                    )

                    if st.button("📅 Save to My Scheduled Appointments", type="primary", use_container_width=True):
                        save_appointment(
                            user_id=user_id,
                            doctor_name=doc_name or "Consulting Physician",
                            specialty=specialty,
                            facility_name=clinic_name,
                            appointment_date=datetime.utcnow().strftime("%Y-%m-%d"),
                            reason=visit_reason,
                            prep_summary=dos
                        )
                        st.success("Appointment & consultation dossier saved.")
            else:
                st.info("Fill in your visit details on the left and click **Generate Clinical Dossier** to compile your doctor visit package.")

    with tab_schedule:
        st.markdown("### Scheduled Appointments")
        appts = list_appointments(user_id)
        if not appts:
            st.info("No appointments currently scheduled.")
        else:
            for a in appts:
                with st.expander(f"📅 {a.get('doctor_name') or 'Doctor Visit'} — {a['appointment_date']} ({a.get('status')})"):
                    st.markdown(f"**Specialty:** {a.get('specialty')} &bull; **Facility:** {a.get('facility_name')}")
                    st.markdown(f"**Chief Reason:** {a.get('reason')}")
                    c_del, _ = st.columns([1, 4])
                    with c_del:
                        if st.button("Cancel Appointment", key=f"del_apt_{a['id']}"):
                            delete_appointment(a["id"], user_id)
                            st.success("Appointment removed.")
                            st.rerun()
