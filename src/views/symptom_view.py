"""
Mediscan AI - Guided Symptom Checker View
Step-by-step clinical questionnaire with contraindication checks,
care urgency triage, and safe self-care recommendations.
"""

import streamlit as st
from ..services.symptom_service import SymptomCheckerService
from ..services.triage_service import CareLevel
from ..database import save_symptom_assessment, list_symptom_assessments


def render_symptom_view(user: dict):
    user_id = user["id"]

    st.markdown(
        """
        <div style="margin-bottom: 20px;">
            <h1 style="font-size: 2.1rem; font-weight: 700; color: #172033; margin-bottom: 4px;">Guided Symptom Checker</h1>
            <p style="font-size: 1.02rem; color: #697586; margin-top: 0;">
                Answer a few focused questions about your symptoms to understand potential causes, urgency levels, and appropriate care steps.
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    tab_check, tab_history = st.tabs(["🩺 New Symptom Assessment", "📋 Past Assessments Log"])

    with tab_check:
        col_form, col_tips = st.columns([1.5, 1.0], gap="large")

        with col_form:
            main_symptom = st.selectbox(
                "Primary Symptom",
                options=[
                    "Fever or High Temperature",
                    "Headache or Migraine",
                    "Cough or Throat Irritation",
                    "Abdominal / Stomach Pain",
                    "Joint Pain or Body Aches",
                    "Skin Rash or Itching",
                    "Nausea, Vomiting, or Loose Stools",
                    "Fatigue and Weakness",
                    "Other (Enter custom symptom below)"
                ],
                key="sym_primary"
            )

            if "Other" in main_symptom:
                custom_sym = st.text_input("Enter your main symptom", placeholder="e.g. ear pain, burning urination...", key="sym_custom")
                effective_symptom = custom_sym or "Unspecified symptom"
            else:
                effective_symptom = main_symptom

            c_dur, c_sev = st.columns(2)
            with c_dur:
                duration = st.selectbox(
                    "How long have you had this symptom?",
                    options=["A few hours", "1 - 2 days", "3 - 7 days", "1 - 2 weeks", "More than a month"],
                    key="sym_duration"
                )
            with c_sev:
                severity = st.select_slider(
                    "Severity Level",
                    options=["Mild", "Moderate", "Severe"],
                    value="Moderate",
                    key="sym_severity"
                )

            body_loc = st.selectbox(
                "Body Location of Discomfort",
                options=["Generalized (Full Body)", "Head & Neck", "Chest & Upper Body", "Stomach & Abdomen", "Back & Spine", "Limbs (Arms & Legs)", "Skin Surface"],
                key="sym_location"
            )

            associated_syms = st.multiselect(
                "Associated Symptoms (Select all that apply)",
                options=[
                    "Fever or Chills",
                    "Nausea or Vomiting",
                    "Dizziness or Lightheadedness",
                    "Shortness of Breath",
                    "Joint Pain or Muscle Aches",
                    "Headache",
                    "Loss of Appetite",
                    "Skin Rash",
                    "Sore Throat",
                    "Diarrhea"
                ],
                key="sym_associated"
            )

            c_preg, c_age = st.columns(2)
            with c_preg:
                preg_status = st.selectbox(
                    "Pregnancy Status",
                    options=["No / Not applicable", "Currently Pregnant", "Breastfeeding"],
                    key="sym_preg"
                )
            with c_age:
                age_range = st.selectbox(
                    "Age Group",
                    options=["Infant / Toddler (0-4)", "Child (5-17)", "Adult (18-64)", "Senior (65+)"],
                    index=2,
                    key="sym_age_group"
                )

            current_conditions = user.get("chronic_conditions", [])
            st.caption(f"Profile Context Included: Allergies: {', '.join(user.get('allergies', [])) or 'None'} &bull; Conditions: {', '.join(current_conditions) or 'None'}")

            assess_clicked = st.button("🔍 Assess My Symptoms", type="primary", use_container_width=True, key="btn_assess_sym")

        with col_tips:
            st.markdown(
                """
                <div class="med-card-highlight">
                    <strong style="font-size: 0.95rem; color: #172033;">🛡 Safety & Accuracy Principles</strong>
                    <ul style="font-size: 0.88rem; color: #4B5563; margin-left: -16px; margin-top: 6px;">
                        <li><b>Deterministic Triage:</b> Severe warning signs are prioritized immediately.</li>
                        <li><b>Contraindication Checks:</b> Recommends safe low-risk measures and cautions against harmful medications.</li>
                        <li><b>Not a Final Diagnosis:</b> Always review your assessment with an in-person doctor.</li>
                    </ul>
                </div>
                """,
                unsafe_allow_html=True,
            )

        if assess_clicked:
            assessment = SymptomCheckerService.assess_symptoms(
                main_symptom=effective_symptom,
                duration=duration,
                severity=severity,
                body_location=body_loc,
                associated_symptoms=associated_syms,
                age_range=age_range,
                relevant_conditions=current_conditions,
                pregnancy_status=preg_status,
                current_medications=[]
            )
            st.session_state.current_symptom_result = assessment

        # Display Assessment Result
        if "current_symptom_result" in st.session_state and st.session_state.current_symptom_result:
            res = st.session_state.current_symptom_result
            st.markdown("---")

            # Urgency Banner
            urgency = res["care_urgency"]
            if urgency == CareLevel.EMERGENCY.value:
                banner_cls = "danger-notice"
                badge_title = "🚨 EMERGENCY: Immediate Medical Care Required"
            elif urgency == CareLevel.URGENT.value:
                banner_cls = "medical-disclaimer"
                badge_title = "⚠ URGENT: Prompt Medical Evaluation Recommended Today"
            elif urgency == CareLevel.ROUTINE.value:
                banner_cls = "success-notice"
                badge_title = "📅 ROUTINE: Schedule an Appointment with a Healthcare Provider"
            else:
                banner_cls = "success-notice"
                badge_title = "ℹ GENERAL GUIDANCE: Supportive Self-Care & Monitoring"

            st.markdown(f'<div class="{banner_cls}"><h3 style="margin:0 0 4px 0;">{badge_title}</h3><p style="margin:0;">{res["action_guidance"]}</p></div>', unsafe_allow_html=True)

            c_res1, c_res2 = st.columns([1.4, 1.0], gap="large")

            with c_res1:
                st.markdown("#### 🔬 Possible Causes (To Discuss With Your Doctor)")
                for cause in res["possible_causes"]:
                    st.markdown(
                        f"""
                        <div style="border: 1px solid #E6EAF0; border-radius: 8px; padding: 12px; margin-bottom: 8px; background: #FFFFFF;">
                            <strong style="color: #172033; font-size: 1.0rem;">{cause['cause']}</strong>
                            <p style="font-size: 0.88rem; color: #4B5563; margin: 4px 0 0 0;">{cause['description']}</p>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )

                st.markdown("#### 💧 Supportive Self-Care Guidelines")
                for sc in res["self_care_guidance"]:
                    st.markdown(f"- {sc}")

            with c_res2:
                st.markdown("#### 🚨 When to Seek Urgent Escalation")
                for es in res["escalation_signs"]:
                    st.markdown(f"- 🔴 {es}")

                st.markdown("#### 🏥 Recommended Specialist")
                st.info(f"**{res['suggested_specialty']}**")

                if st.button("💾 Save to Health Records", use_container_width=True, key="btn_save_sym"):
                    save_symptom_assessment(user_id, res)
                    st.success("Symptom assessment saved to your Personal Health Records.")

    with tab_history:
        past_assessments = list_symptom_assessments(user_id)
        if not past_assessments:
            st.info("No past symptom assessments saved.")
        else:
            for pa in past_assessments:
                with st.expander(f"🩺 {pa['main_symptom']} — {pa['created_at'][:19]} ({pa['care_urgency']})"):
                    st.markdown(f"**Severity:** {pa.get('severity')} &bull; **Duration:** {pa.get('duration')} &bull; **Location:** {pa.get('body_location')}")
                    st.markdown("**Possible Causes Explored:**")
                    for c in pa.get("possible_causes", []):
                        st.markdown(f"- **{c.get('cause')}**: {c.get('description')}")
