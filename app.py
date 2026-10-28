"""
Mediscan AI — Advanced AI Healthcare Assistant Platform
Modern, minimal, premium healthcare application built with Streamlit, local OCR,
TF-IDF ML Candidate Matching, SQLite database, PyMuPDF, Plotly, and Gemini Multimodal AI.
"""

import os
import streamlit as st

from src.config import settings
from src.database import init_db, get_catalogue_stats
from src.services.auth_service import AuthService

# View Modules
from src.views.dashboard_view import render_dashboard_view
from src.views.chat_view import render_chat_view
from src.views.report_view import render_report_view
from src.views.medicine_view import render_medicine_view
from src.views.symptom_view import render_symptom_view
from src.views.locator_view import render_locator_view
from src.views.records_view import render_records_view
from src.views.medication_view import render_medication_view
from src.views.timeline_view import render_timeline_view
from src.views.appointment_view import render_appointment_view
from src.views.emergency_view import render_emergency_view
from src.views.settings_view import render_settings_view

# ============================================================================
# PAGE CONFIG & STYLES (Light Healthcare Theme Only)
# ============================================================================

st.set_page_config(
    page_title="Mediscan AI — Healthcare Platform",
    page_icon="🩺",
    layout="wide",
    initial_sidebar_state="expanded",
)

CUSTOM_CSS = """
<style>
/* Main Container Typography & Clean Background */
html, body, [class*="css"] {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #172033;
}
.stApp {
    background-color: #FFFFFF;
}

/* Sidebar Styling */
section[data-testid="stSidebar"] {
    background-color: #F8FAFC;
    border-right: 1px solid #E2E8F0;
}
section[data-testid="stSidebar"] .stRadio label {
    font-size: 0.92rem;
    font-weight: 500;
    color: #1E293B;
    padding: 6px 12px;
    border-radius: 6px;
    margin-bottom: 2px;
}

/* Card Styling */
.med-card {
    background-color: #FFFFFF;
    border: 1px solid #E6EAF0;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
.med-card-highlight {
    background-color: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 18px;
    margin-bottom: 16px;
}

/* Verification Badges */
.badge {
    display: inline-block;
    padding: 4px 10px;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
.badge-verified {
    background-color: #ECFDF5;
    color: #16865B;
    border: 1px solid #A7F3D0;
}
.badge-visible {
    background-color: #EFF6FF;
    color: #2563EB;
    border: 1px solid #BFDBFE;
}
.badge-inferred {
    background-color: #FFFBEB;
    color: #B7791F;
    border: 1px solid #FDE68A;
}
.badge-conflict {
    background-color: #FEF2F2;
    color: #C84747;
    border: 1px solid #FECACA;
}
.badge-rx {
    background-color: #FEE2E2;
    color: #991B1B;
    border: 1px solid #FCA5A5;
}
.badge-otc {
    background-color: #E0E7FF;
    color: #3730A3;
    border: 1px solid #C7D2FE;
}

/* Healthcare Alert Boxes */
.medical-disclaimer {
    background-color: #FFFBEB;
    border-left: 4px solid #B7791F;
    padding: 14px 16px;
    border-radius: 4px;
    color: #92400E;
    font-size: 0.88rem;
    line-height: 1.5;
    margin-top: 14px;
}
.danger-notice {
    background-color: #FEF2F2;
    border-left: 4px solid #DC2626;
    padding: 14px 16px;
    border-radius: 4px;
    color: #991B1B;
    font-size: 0.9rem;
    line-height: 1.5;
    margin-bottom: 14px;
}
.success-notice {
    background-color: #ECFDF5;
    border-left: 4px solid #16865B;
    padding: 14px 16px;
    border-radius: 4px;
    color: #065F46;
    font-size: 0.9rem;
    line-height: 1.5;
    margin-bottom: 14px;
}

/* Metric KPI Tile */
.metric-tile {
    background: #FFFFFF;
    border: 1px solid #E6EAF0;
    border-radius: 8px;
    padding: 16px;
    text-align: center;
}
.metric-value {
    font-size: 1.8rem;
    font-weight: 700;
    color: #2563EB;
    margin: 4px 0;
}
.metric-label {
    font-size: 0.82rem;
    color: #697586;
    text-transform: uppercase;
    font-weight: 600;
}

/* Clean Button Overrides */
.stButton > button {
    border-radius: 6px;
    font-weight: 500;
    padding: 6px 16px;
    border: 1px solid #E6EAF0;
    transition: all 0.15s ease-in-out;
}
.stButton > button:hover {
    border-color: #2563EB;
    color: #2563EB;
}
</style>
"""
st.markdown(CUSTOM_CSS, unsafe_allow_html=True)


# ============================================================================
# INITIALIZATION & USER AUTHENTICATION
# ============================================================================

@st.cache_resource
def bootstrap_database():
    init_db(seed_catalog=True)

bootstrap_database()

# Ensure default demo user exists
if "authenticated_user" not in st.session_state or st.session_state.authenticated_user is None:
    demo_user = AuthService.ensure_default_user()
    st.session_state.authenticated_user = demo_user

current_user = st.session_state.authenticated_user


# ============================================================================
# SIDEBAR NAVIGATION
# ============================================================================

# App Brand
st.sidebar.markdown(
    """
    <div style="display: flex; align-items: center; gap: 10px; padding: 10px 0 16px 0;">
        <span style="font-size: 2.0rem;">🩺</span>
        <div>
            <div style="font-size: 1.15rem; font-weight: 700; color: #172033; letter-spacing: -0.3px;">Mediscan AI</div>
            <div style="font-size: 0.75rem; color: #64748B;">Comprehensive Healthcare Platform</div>
        </div>
    </div>
    """,
    unsafe_allow_html=True,
)

# Patient Profile Capsule
if current_user:
    st.sidebar.markdown(
        f"""
        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 12px; margin-bottom: 14px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <strong style="font-size: 0.92rem; color: #0F172A;">{current_user.get('full_name', 'Patient')}</strong>
                    <div style="font-size: 0.78rem; color: #64748B;">
                        Age: {current_user.get('age', '34')} &bull; Blood: {current_user.get('blood_group', 'B+')}
                    </div>
                </div>
                <span style="font-size: 1.2rem;">👤</span>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

# 12 Target Navigation Sections
NAVIGATION_OPTIONS = [
    "🏠 Home Dashboard",
    "💬 AI Doctor Chat",
    "📄 Medical Report Analyzer",
    "💊 Medicine Scanner",
    "🩺 Symptom Checker",
    "🏥 Find Nearby Care",
    "📁 My Health Records",
    "⏰ Medication Tracker",
    "📈 Health Timeline",
    "📋 Appointment Preparation",
    "🚨 Emergency Help",
    "⚙️ Settings and Privacy",
]

selected_nav = st.sidebar.radio(
    "Navigation Menu",
    options=NAVIGATION_OPTIONS,
    index=0,
    label_visibility="collapsed"
)

st.sidebar.markdown("---")

# Emergency Dial Action in Sidebar
st.sidebar.markdown(
    """
    <div style="background-color: #FEF2F2; border-left: 3px solid #DC2626; padding: 10px 12px; border-radius: 4px; margin-bottom: 12px;">
        <strong style="color: #991B1B; font-size: 0.85rem;">Emergency Quick Dial</strong><br>
        <span style="font-size: 0.78rem; color: #B91C1C;">National Emergency: <b>112</b></span><br>
        <span style="font-size: 0.78rem; color: #B91C1C;">Medical Ambulance: <b>108</b></span>
    </div>
    """,
    unsafe_allow_html=True,
)

# Stats Footer
stats = get_catalogue_stats()
st.sidebar.markdown(
    f"""
    <div style="font-size: 0.78rem; color: #64748B;">
        <div><b>Catalogue:</b> {stats['total_medicines']:,} verified products</div>
        <div><b>Model Version:</b> v{settings.MODEL_VERSION}</div>
        <div><b>Local Engine:</b> Active</div>
    </div>
    """,
    unsafe_allow_html=True,
)


# ============================================================================
# MAIN CONTENT ROUTER
# ============================================================================

if selected_nav == "🏠 Home Dashboard":
    render_dashboard_view(current_user)

elif selected_nav == "💬 AI Doctor Chat":
    render_chat_view(current_user)

elif selected_nav == "📄 Medical Report Analyzer":
    render_report_view(current_user)

elif selected_nav == "💊 Medicine Scanner":
    render_medicine_view(current_user)

elif selected_nav == "🩺 Symptom Checker":
    render_symptom_view(current_user)

elif selected_nav == "🏥 Find Nearby Care":
    render_locator_view(current_user)

elif selected_nav == "📁 My Health Records":
    render_records_view(current_user)

elif selected_nav == "⏰ Medication Tracker":
    render_medication_view(current_user)

elif selected_nav == "📈 Health Timeline":
    render_timeline_view(current_user)

elif selected_nav == "📋 Appointment Preparation":
    render_appointment_view(current_user)

elif selected_nav == "🚨 Emergency Help":
    render_emergency_view(current_user)

elif selected_nav == "⚙️ Settings and Privacy":
    render_settings_view(current_user)
