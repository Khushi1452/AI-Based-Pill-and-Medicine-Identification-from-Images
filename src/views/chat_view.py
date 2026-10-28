"""
Mediscan AI - AI Doctor Chat View
Provides a multi-turn, empathetic clinical conversation assistant with
automatic triage check, multilingual response (EN/HI/PA), and persistent session storage.
"""

import streamlit as st
from datetime import datetime

from ..services.chat_service import AIDoctorChatService
from ..services.triage_service import CareLevel
from ..database import (
    create_chat_conversation,
    list_chat_conversations,
    get_chat_conversation,
    delete_chat_conversation,
    add_chat_message,
    get_chat_messages,
    search_chat_messages,
    list_medical_reports,
)


@st.cache_resource
def get_chat_service() -> AIDoctorChatService:
    return AIDoctorChatService()


def render_chat_view(user: dict):
    user_id = user["id"]
    chat_service = get_chat_service()

    st.markdown(
        """
        <div style="margin-bottom: 20px;">
            <h1 style="font-size: 2.1rem; font-weight: 700; color: #172033; margin-bottom: 4px;">AI Doctor Health Consultation</h1>
            <p style="font-size: 1.02rem; color: #697586; margin-top: 0;">
                Describe symptoms, ask questions about diagnoses or treatments, and explore medical concerns with clinical decision support.
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # 1. Manage Active Conversation Session
    convs = list_chat_conversations(user_id)

    # Sidebar / Toolbar Controls
    col_ctrl1, col_ctrl2, col_ctrl3, col_ctrl4 = st.columns([1.5, 1.2, 1.0, 1.0])

    with col_ctrl1:
        conv_options = {c["id"]: f"{c['title']} ({c['created_at'][:10]})" for c in convs}
        if not conv_options:
            new_id = create_chat_conversation(user_id, "General Health Inquiry")
            conv_options[new_id] = f"General Health Inquiry ({datetime.utcnow().strftime('%Y-%m-%d')})"
            active_conv_id = new_id
        else:
            if "active_conv_id" not in st.session_state or st.session_state.active_conv_id not in conv_options:
                st.session_state.active_conv_id = list(conv_options.keys())[0]

            active_conv_id = st.selectbox(
                "Conversation Session",
                options=list(conv_options.keys()),
                format_func=lambda x: conv_options.get(x, "Session"),
                key="conv_selector",
                label_visibility="collapsed"
            )
            st.session_state.active_conv_id = active_conv_id

    with col_ctrl2:
        if st.button("➕ New Consultation", use_container_width=True):
            new_id = create_chat_conversation(user_id, f"Consultation {datetime.utcnow().strftime('%d %b %H:%M')}")
            st.session_state.active_conv_id = new_id
            st.rerun()

    with col_ctrl3:
        lang_choice = st.selectbox(
            "Language",
            options=["English", "हिंदी (Hindi)", "ਪੰਜਾਬੀ (Punjabi)"],
            index=0 if user.get("preferred_language") == "en" else (1 if user.get("preferred_language") == "hi" else 2),
            key="chat_language",
            label_visibility="collapsed"
        )
        lang_code = "en" if "English" in lang_choice else ("hi" if "Hindi" in lang_choice else "pa")

    with col_ctrl4:
        if convs and st.button("🗑 Delete Chat", use_container_width=True):
            delete_chat_conversation(active_conv_id, user_id)
            st.session_state.active_conv_id = None
            st.rerun()

    # 2. Options Accordion (Patient Context & Report Attachment)
    with st.expander("⚙️ Consultation Context & Attachments", expanded=False):
        c_opt1, c_opt2 = st.columns(2)
        with c_opt1:
            include_profile = st.checkbox("Include my medical profile (allergies, asthma, age)", value=True)
            search_query = st.text_input("🔍 Search past chat messages", placeholder="e.g. fever, paracetamol, blood test...")
            if search_query:
                found_msgs = search_chat_messages(user_id, search_query)
                st.caption(f"Found {len(found_msgs)} matching messages across past consultations.")
                for fm in found_msgs[:3]:
                    st.markdown(f"- *{fm['conversation_title']}*: \"{fm['content'][:60]}...\"")

        with c_opt2:
            reports = list_medical_reports(user_id)
            selected_reports = []
            if reports:
                rep_options = {r["id"]: f"{r['report_title']} ({r.get('report_date') or 'Recent'})" for r in reports}
                chosen_rep_ids = st.multiselect(
                    "Attach Laboratory Reports to Context",
                    options=list(rep_options.keys()),
                    format_func=lambda x: rep_options.get(x, "Report")
                )
                selected_reports = [r for r in reports if r["id"] in chosen_rep_ids]
            else:
                st.caption("No lab reports uploaded yet. Upload reports in Report Analyzer to refer to them here.")

    # 3. Message Thread Container
    messages = get_chat_messages(active_conv_id, user_id)

    st.markdown('<div style="margin-top: 10px;"></div>', unsafe_allow_html=True)

    # Initial Welcome Message if thread is empty
    if not messages:
        st.markdown(
            """
            <div style="background-color: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 8px; padding: 24px; text-align: center; margin: 20px 0;">
                <div style="font-size: 2rem; margin-bottom: 8px;">🩺</div>
                <h3 style="font-size: 1.15rem; color: #1E293B; margin: 0 0 6px 0;">How can I help you today?</h3>
                <p style="font-size: 0.9rem; color: #64748B; max-width: 600px; margin: 0 auto;">
                    You can describe what symptoms you are feeling, ask how long they typically last, or inquire about what to discuss with your doctor.
                </p>
                <div style="margin-top: 14px; font-size: 0.8rem; color: #94A3B8;">
                    Supported in English, Hindi (हिंदी), and Punjabi (ਪੰਜਾਬੀ).
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    # Display Conversation History
    for msg in messages:
        is_user = msg["role"] == "user"
        if is_user:
            with st.chat_message("user", avatar="👤"):
                st.markdown(f"**You:**\n\n{msg['content']}")
        else:
            care_level = msg.get("care_level")
            badge_html = ""
            if care_level == CareLevel.EMERGENCY.value:
                badge_html = '<span style="background-color: #FEE2E2; color: #991B1B; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; border: 1px solid #F87171;">EMERGENCY ALERT</span>'
            elif care_level == CareLevel.URGENT.value:
                badge_html = '<span style="background-color: #FEF3C7; color: #92400E; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; border: 1px solid #FCD34D;">URGENT ATTENTION</span>'
            else:
                badge_html = '<span style="background-color: #EFF6FF; color: #2563EB; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">DECISION SUPPORT</span>'

            with st.chat_message("assistant", avatar="🩺"):
                st.markdown(
                    f"""
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 0.82rem; font-weight: 600; color: #4B5563;">Mediscan AI Clinical Assistant (AI-Generated)</span>
                        {badge_html}
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
                st.markdown(msg["content"])

    # 4. Prompt Chips / Quick Suggestions
    if not messages:
        quick_prompts = [
            "I have had a mild headache and fever for 2 days",
            "What should I do if my blood pressure reads 145/95?",
            "What are the common symptoms of seasonal dengue fever?",
            "मेरा पेट कल से बहुत दर्द कर रहा है और हल्का बुखार है"
        ]
        st.markdown("<div style='font-size: 0.82rem; color: #64748B; font-weight: 600; margin-bottom: 6px;'>Suggested inquiries:</div>", unsafe_allow_html=True)
        qp_cols = st.columns(len(quick_prompts))
        chosen_prompt = None
        for i, qp in enumerate(quick_prompts):
            with qp_cols[i]:
                if st.button(qp, key=f"qp_{i}", use_container_width=True):
                    chosen_prompt = qp
    else:
        chosen_prompt = None

    # 5. User Input Box
    user_input = st.chat_input("Describe your symptoms or ask a medical question...")
    effective_input = user_input or chosen_prompt

    if effective_input:
        # Save user message to database
        add_chat_message(
            conversation_id=active_conv_id,
            user_id=user_id,
            role="user",
            content=effective_input
        )

        # Prepare context
        user_profile_data = user if include_profile else None

        with st.spinner("Evaluating clinical indicators and generating guidance..."):
            response_data = chat_service.generate_chat_response(
                user_message=effective_input,
                conversation_history=messages,
                user_profile=user_profile_data,
                attached_reports=selected_reports,
                language=lang_code
            )

        # Save assistant message to database
        add_chat_message(
            conversation_id=active_conv_id,
            user_id=user_id,
            role="assistant",
            content=response_data["content"],
            care_level=response_data["care_level"],
            triage_flag=1 if response_data.get("is_emergency") else 0
        )

        st.rerun()

    # Safety Disclaimer Footer
    st.markdown(
        """
        <div class="medical-disclaimer" style="margin-top: 30px;">
            <b>Clinical Guidance Notice:</b> This AI consultation provides decision-support information based on reported symptoms. 
            It is NOT a physical examination or confirmed clinical diagnosis. If you experience chest pain, sudden numbness, or shortness of breath, 
            call <b>112</b> or visit an emergency room immediately.
        </div>
        """,
        unsafe_allow_html=True,
    )
