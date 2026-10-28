"""
Mediscan AI - Medication Tracker View
Organizes current prescriptions, schedules, refill reminders,
and logs daily medication adherence (Taken, Skipped, Snoozed).
"""

from datetime import datetime
import streamlit as st

from ..database import (
    save_medication,
    list_medications,
    update_medication_status,
    delete_medication,
    log_medication_action,
    list_medication_logs,
)


def render_medication_view(user: dict):
    user_id = user["id"]

    st.markdown(
        """
        <div style="margin-bottom: 20px;">
            <h1 style="font-size: 2.1rem; font-weight: 700; color: #172033; margin-bottom: 4px;">Medication Tracker & Adherence</h1>
            <p style="font-size: 1.02rem; color: #697586; margin-top: 0;">
                Keep track of your current prescribed medicines, daily dosing schedules, refill warnings, and adherence records.
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    tab_active, tab_add, tab_logs = st.tabs([
        "💊 Active Regimens & Reminders",
        "➕ Add New Medication",
        "📋 Adherence History Log"
    ])

    # =========================================================================
    # TAB 1: ACTIVE REGIMENS & REMINDERS
    # =========================================================================
    with tab_active:
        active_meds = list_medications(user_id, status="ACTIVE")

        if not active_meds:
            st.info("No active medications found. Use the **Add New Medication** tab to enter your current prescriptions.")
        else:
            st.markdown(f"### Current Prescriptions ({len(active_meds)})")

            for med in active_meds:
                refill_days = med.get("refill_reminder_days", 0)
                refill_alert = ""
                if refill_days and refill_days <= 5:
                    refill_alert = f'<span style="background: #FEF2F2; color: #991B1B; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; border: 1px solid #F87171;">⚠ Refill in {refill_days} days</span>'

                st.markdown(
                    f"""
                    <div style="border: 1px solid #E6EAF0; border-radius: 8px; padding: 16px; margin-bottom: 12px; background: #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;">
                            <div>
                                <h3 style="margin: 0; color: #172033; font-size: 1.2rem;">{med['name']}</h3>
                                <div style="font-size: 0.9rem; color: #4B5563; margin-top: 2px;">
                                    <b>Strength:</b> {med.get('strength') or 'Standard'} &bull; <b>Form:</b> {med.get('dosage_form') or 'Tablet'} &bull; <b>Frequency:</b> {med.get('frequency') or 'Once Daily'}
                                </div>
                            </div>
                            <div>
                                {refill_alert}
                            </div>
                        </div>
                        <div style="font-size: 0.88rem; color: #374151; margin-top: 8px;">
                            <b>Instructions:</b> {med.get('instructions') or 'Take as prescribed by doctor'}
                        </div>
                        <div style="font-size: 0.8rem; color: #6B7280; margin-top: 4px;">
                            Started: {med.get('start_date') or 'Recent'} &bull; Source: <code>{med.get('provenance', 'USER_ENTERED')}</code>
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

                # Adherence Action Buttons
                c_act1, c_act2, c_act3, c_act4 = st.columns([1, 1, 1, 1])
                with c_act1:
                    if st.button("✓ Taken Today", key=f"med_taken_{med['id']}", use_container_width=True):
                        log_medication_action(med["id"], user_id, "TAKEN", notes="Logged on time")
                        st.success(f"Marked {med['name']} as taken.")
                with c_act2:
                    if st.button("⏰ Snooze (1h)", key=f"med_snooze_{med['id']}", use_container_width=True):
                        log_medication_action(med["id"], user_id, "SNOOZED", notes="Snoozed 1 hour")
                        st.info(f"Snoozed {med['name']}.")
                with c_act3:
                    if st.button("✗ Skipped", key=f"med_skip_{med['id']}", use_container_width=True):
                        log_medication_action(med["id"], user_id, "SKIPPED", notes="Patient skipped dose")
                        st.warning(f"Recorded skipped dose for {med['name']}.")
                with c_act4:
                    if st.button("Discontinue", key=f"med_disc_{med['id']}", use_container_width=True):
                        update_medication_status(med["id"], user_id, "DISCONTINUED")
                        st.info(f"Discontinued {med['name']}.")
                        st.rerun()

    # =========================================================================
    # TAB 2: ADD NEW MEDICATION
    # =========================================================================
    with tab_add:
        st.markdown("### Add Prescription or Over-the-Counter Medicine")

        with st.form("new_med_form"):
            c1, c2 = st.columns(2)
            with c1:
                med_name = st.text_input("Medication Name *", placeholder="e.g. Paracetamol, Metformin, Thyronorm")
                strength = st.text_input("Strength", placeholder="e.g. 500 mg, 100 mcg, 5 ml")
                dosage_form = st.selectbox("Dosage Form", options=["Tablet", "Capsule", "Syrup", "Injection", "Inhaler", "Eye Drops", "Ointment/Cream"])
            with c2:
                frequency = st.selectbox("Frequency", options=["Once daily (Morning)", "Once daily (Night)", "Twice daily (Morning & Night)", "Thrice daily", "As needed (SOS)"])
                instructions = st.text_input("Special Instructions", placeholder="e.g. After meals with water")
                refill_days = st.number_input("Refill Reminder (Days remaining)", min_value=0, max_value=90, value=15)

            c_d1, c_d2 = st.columns(2)
            with c_d1:
                start_date = st.date_input("Start Date", value=datetime.utcnow())
            with c_d2:
                has_end_date = st.checkbox("Has treatment end date?")
                end_date_val = st.date_input("End Date") if has_end_date else None

            if st.form_submit_button("➕ Save Medication", type="primary", use_container_width=True):
                if not med_name.strip():
                    st.error("Please enter a medication name.")
                else:
                    save_medication(
                        user_id=user_id,
                        name=med_name,
                        strength=strength,
                        dosage_form=dosage_form,
                        instructions=instructions,
                        frequency=frequency,
                        start_date=start_date.strftime("%Y-%m-%d"),
                        end_date=end_date_val.strftime("%Y-%m-%d") if end_date_val else None,
                        refill_days=refill_days,
                        provenance="USER_ENTERED"
                    )
                    st.success(f"Added {med_name} to your active medication list.")
                    st.rerun()

    # =========================================================================
    # TAB 3: ADHERENCE HISTORY LOG
    # =========================================================================
    with tab_logs:
        st.markdown("### Adherence History & Dosage Log")
        logs = list_medication_logs(user_id, limit=50)

        if not logs:
            st.info("No medication actions logged yet. When you take or snooze doses in Tab 1, your adherence audit trail appears here.")
        else:
            for l in logs:
                badge_color = "#16A34A" if l["status"] == "TAKEN" else ("#DC2626" if l["status"] == "SKIPPED" else "#D97706")
                st.markdown(
                    f"""
                    <div style="border-left: 3px solid {badge_color}; background: #FFFFFF; border-top: 1px solid #E6EAF0; border-right: 1px solid #E6EAF0; border-bottom: 1px solid #E6EAF0; padding: 10px 14px; border-radius: 4px; margin-bottom: 6px;">
                        <span style="font-weight: 700; color: {badge_color};">{l['status']}</span> &bull; <b>{l['medication_name']}</b> ({l.get('strength') or ''}) &bull; <span style="font-size: 0.82rem; color: #6B7280;">{l['logged_at'][:19]}</span>
                        <div style="font-size: 0.85rem; color: #4B5563;">Notes: {l.get('notes') or 'Standard confirmation'}</div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
