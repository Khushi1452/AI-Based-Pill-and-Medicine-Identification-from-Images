"""
Mediscan AI - Home Dashboard View
Executive overview of patient health: active medications, pending reminders,
recent lab reports, vital trends, and quick access to clinical tools.
"""

from datetime import datetime
import streamlit as st
import plotly.graph_objects as go

from ..database import (
    list_medications,
    list_medical_reports,
    list_health_measurements,
    list_appointments,
    list_saved_facilities,
    save_health_measurement,
    log_medication_action,
)
from ..services.triage_service import CareLevel


def render_dashboard_view(user: dict):
    user_id = user["id"]
    user_name = user.get("full_name", "Patient")

    # 1. Header Banner
    st.markdown(
        f"""
        <div style="background: linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%); border: 1px solid #BFDBFE; border-radius: 12px; padding: 22px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                <div>
                    <h2 style="font-size: 1.8rem; font-weight: 700; color: #172033; margin: 0 0 4px 0;">Welcome back, {user_name} 👋</h2>
                    <p style="font-size: 0.95rem; color: #4B5563; margin: 0;">
                        Personal Health Dashboard &bull; Age: {user.get('age', '34')} &bull; Blood: {user.get('blood_group', 'B+')} &bull; Language: {user.get('preferred_language', 'en').upper()}
                    </p>
                </div>
                <div style="text-align: right; margin-top: 8px;">
                    <span style="background-color: #ECFDF5; color: #065F46; padding: 6px 12px; border-radius: 20px; font-size: 0.82rem; font-weight: 600; border: 1px solid #A7F3D0;">
                        ● Patient Record Active
                    </span>
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # 2. Emergency Quick Action Alert (India 112)
    st.markdown(
        """
        <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <div>
                <strong style="color: #991B1B; font-size: 0.95rem;">🚨 Medical Emergency Notice</strong>
                <p style="color: #B91C1C; font-size: 0.85rem; margin: 2px 0 0 0;">If you or someone nearby is experiencing chest pain, difficulty breathing, or severe trauma, call emergency services immediately.</p>
            </div>
            <div style="margin-top: 6px;">
                <a href="tel:112" style="background-color: #DC2626; color: #FFFFFF; padding: 6px 14px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 0.85rem; display: inline-block;">
                    📞 Call 112 (National Emergency)
                </a>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # 3. Fetch Real User Data
    active_meds = list_medications(user_id, status="ACTIVE")
    recent_reports = list_medical_reports(user_id)
    recent_measurements = list_health_measurements(user_id, limit=20)
    appointments = list_appointments(user_id, status="SCHEDULED")
    saved_facs = list_saved_facilities(user_id)

    # 4. KPI Metrics Tiles
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.markdown(
            f"""
            <div class="metric-tile">
                <div class="metric-label">Active Medications</div>
                <div class="metric-value">{len(active_meds)}</div>
                <div style="font-size: 0.78rem; color: #6B7280;">Prescribed regimens</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with col2:
        st.markdown(
            f"""
            <div class="metric-tile">
                <div class="metric-label">Medical Reports</div>
                <div class="metric-value">{len(recent_reports)}</div>
                <div style="font-size: 0.78rem; color: #6B7280;">Lab & diagnostic files</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with col3:
        st.markdown(
            f"""
            <div class="metric-tile">
                <div class="metric-label">Vital Measurements</div>
                <div class="metric-value">{len(recent_measurements)}</div>
                <div style="font-size: 0.78rem; color: #6B7280;">BP, glucose & labs</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with col4:
        st.markdown(
            f"""
            <div class="metric-tile">
                <div class="metric-label">Upcoming Visits</div>
                <div class="metric-value">{len(appointments)}</div>
                <div style="font-size: 0.78rem; color: #6B7280;">Scheduled doctor appts</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("<br>", unsafe_allow_html=True)

    # 5. Two-Column Dashboard Content
    col_left, col_right = st.columns([1.2, 1.0], gap="large")

    with col_left:
        # A. Medication Reminders & Daily Tracker
        st.markdown("### 💊 Daily Medication Reminders")
        if not active_meds:
            st.info("No active medications recorded yet. You can add your current prescriptions in the **Medication Tracker** tab.")
        else:
            for med in active_meds[:4]:
                with st.container():
                    st.markdown(
                        f"""
                        <div style="border: 1px solid #E6EAF0; border-radius: 8px; padding: 14px; margin-bottom: 10px; background: #FFFFFF;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong style="font-size: 1.05rem; color: #172033;">{med['name']}</strong>
                                    <span style="background: #F3F4F6; color: #374151; font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; margin-left: 6px;">
                                        {med.get('strength') or 'Standard'}
                                    </span>
                                    <div style="font-size: 0.85rem; color: #6B7280; margin-top: 4px;">
                                        Instructions: {med.get('instructions') or 'As directed by physician'} &bull; Frequency: {med.get('frequency') or 'Daily'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )
                    c_btn1, c_btn2, _ = st.columns([1, 1, 2])
                    with c_btn1:
                        if st.button("✓ Mark Taken", key=f"dash_taken_{med['id']}", use_container_width=True):
                            log_medication_action(med["id"], user_id, "TAKEN", notes="Recorded from dashboard")
                            st.success(f"Logged {med['name']} as taken.")
                    with c_btn2:
                        if st.button("⏰ Snooze (1h)", key=f"dash_snooze_{med['id']}", use_container_width=True):
                            log_medication_action(med["id"], user_id, "SNOOZED", notes="Snoozed 1 hour")
                            st.info(f"Snoozed reminder for {med['name']}.")

        st.markdown("---")

        # B. Recent Diagnostic Reports & Biomarkers
        st.markdown("### 📄 Recent Lab & Diagnostic Reports")
        if not recent_reports:
            st.info("No medical reports uploaded yet. Upload your PDF blood or urine test in the **Medical Report Analyzer** to receive structured explanations.")
        else:
            for rep in recent_reports[:3]:
                st.markdown(
                    f"""
                    <div style="border: 1px solid #E6EAF0; border-radius: 8px; padding: 14px; margin-bottom: 12px; background: #FFFFFF;">
                        <div style="display: flex; justify-content: space-between;">
                            <div>
                                <strong style="font-size: 1.0rem; color: #172033;">{rep.get('report_title')}</strong>
                                <span style="font-size: 0.8rem; color: #6B7280; margin-left: 8px;">({rep.get('report_date') or 'Recent'})</span>
                            </div>
                            <span style="background: #EFF6FF; color: #2563EB; font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; font-weight: 600;">
                                {rep.get('report_type')}
                            </span>
                        </div>
                        <div style="font-size: 0.88rem; color: #4B5563; margin-top: 6px;">
                            {rep.get('ai_summary', {}).get('summary', 'Report recorded in patient history.')}
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

    with col_right:
        # C. Quick Vitals Entry
        st.markdown("### 📊 Log Today's Vitals")
        with st.expander("➕ Quick Add Measurement (BP / Blood Glucose)", expanded=True):
            meas_type = st.selectbox(
                "Measurement Type",
                options=[
                    "Blood Pressure (Sys / Dia)",
                    "Fasting Blood Glucose",
                    "Post-Prandial Glucose",
                    "Heart Rate (Pulse)",
                    "Body Temperature",
                    "Oxygen Saturation (SpO2)",
                    "Body Weight",
                ],
                key="dash_meas_type"
            )

            if "Blood Pressure" in meas_type:
                cb1, cb2 = st.columns(2)
                with cb1:
                    sys_val = st.number_input("Systolic (mmHg)", min_value=60, max_value=250, value=120, key="dash_bp_sys")
                with cb2:
                    dia_val = st.number_input("Diastolic (mmHg)", min_value=40, max_value=150, value=80, key="dash_bp_dia")
                if st.button("Save Blood Pressure", type="primary", use_container_width=True):
                    save_health_measurement(
                        user_id=user_id,
                        measurement_type="BLOOD_PRESSURE",
                        value_numeric=float(sys_val),
                        secondary_value=float(dia_val),
                        unit="mmHg",
                        source="USER_ENTERED",
                        notes="Logged from Home Dashboard"
                    )
                    st.success(f"Recorded BP: {sys_val}/{dia_val} mmHg")
                    st.rerun()

            elif "Glucose" in meas_type:
                gluc_val = st.number_input("Glucose Value (mg/dL)", min_value=30.0, max_value=600.0, value=95.0, key="dash_gluc_val")
                m_type = "FASTING_GLUCOSE" if "Fasting" in meas_type else "POSTPRANDIAL_GLUCOSE"
                if st.button("Save Glucose Reading", type="primary", use_container_width=True):
                    save_health_measurement(
                        user_id=user_id,
                        measurement_type=m_type,
                        value_numeric=float(gluc_val),
                        unit="mg/dL",
                        source="USER_ENTERED",
                        notes="Logged from Home Dashboard"
                    )
                    st.success(f"Recorded Glucose: {gluc_val} mg/dL")
                    st.rerun()

            else:
                gen_val = st.number_input("Value", min_value=10.0, max_value=300.0, value=72.0, key="dash_gen_val")
                unit_label = "bpm" if "Heart" in meas_type else ("°F" if "Temp" in meas_type else ("%" if "SpO2" in meas_type else "kg"))
                m_code = meas_type.upper().replace(" ", "_").replace("(", "").replace(")", "")
                if st.button("Save Measurement", type="primary", use_container_width=True):
                    save_health_measurement(
                        user_id=user_id,
                        measurement_type=m_code,
                        value_numeric=float(gen_val),
                        unit=unit_label,
                        source="USER_ENTERED",
                        notes="Logged from Home Dashboard"
                    )
                    st.success("Measurement recorded.")
                    st.rerun()

        st.markdown("---")

        # D. Upcoming Appointments
        st.markdown("### 📅 Upcoming Consultations")
        if not appointments:
            st.info("No upcoming doctor appointments scheduled. Prepare for your next clinic visit in **Appointment Preparation**.")
        else:
            for apt in appointments[:3]:
                st.markdown(
                    f"""
                    <div style="border: 1px solid #E6EAF0; border-radius: 8px; padding: 12px; margin-bottom: 8px; background: #FFFFFF;">
                        <strong style="color: #172033;">{apt.get('doctor_name') or 'Doctor Appointment'}</strong> &bull; <span style="color: #2563EB;">{apt.get('specialty') or 'General Medicine'}</span>
                        <div style="font-size: 0.85rem; color: #6B7280; margin-top: 4px;">
                            Date: <b>{apt.get('appointment_date')}</b> &bull; Facility: {apt.get('facility_name') or 'Clinic'}
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

        # E. Saved Healthcare Providers
        if saved_facs:
            st.markdown("---")
            st.markdown("### ⭐ Saved Healthcare Providers")
            for fac in saved_facs[:2]:
                st.markdown(
                    f"""
                    <div style="font-size: 0.88rem; margin-bottom: 6px;">
                        🏥 <b>{fac['facility_name']}</b> ({fac['facility_type']})<br>
                        <span style="color: #6B7280;">{fac.get('address', '')[:45]}...</span>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
