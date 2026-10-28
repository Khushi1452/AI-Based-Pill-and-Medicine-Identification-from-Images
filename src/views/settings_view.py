"""
Mediscan AI - Settings & Privacy View
Controls system diagnostics, privacy notices, Gemini API key status,
database cache controls, and ML model retraining triggers.
"""

import os
import subprocess
import streamlit as st

from ..config import settings
from ..database import (
    get_catalogue_stats,
    clear_analysis_cache,
    init_db,
    save_audit_feedback,
)


def render_settings_view(user: dict):
    user_id = user["id"]

    st.markdown(
        """
        <div style="margin-bottom: 20px;">
            <h1 style="font-size: 2.1rem; font-weight: 700; color: #172033; margin-bottom: 4px;">Platform Settings & Privacy</h1>
            <p style="font-size: 1.02rem; color: #697586; margin-top: 0;">
                Configure clinical preferences, review data privacy protections, verify system diagnostics, and manage model artifacts.
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    set_tab1, set_tab2, set_tab3, set_tab4 = st.tabs([
        "⚙️ System Diagnostics & Health",
        "🛡 Data Privacy & DPDP Compliance",
        "🤖 Machine Learning Pipeline",
        "💬 Provide Platform Feedback"
    ])

    with set_tab1:
        st.markdown("### System Health & Diagnostics")

        # Tesseract check
        tess_ok = os.path.exists(settings.TESSERACT_CMD) or subprocess.run(["which", "tesseract"], capture_output=True).returncode == 0
        tess_status = "✓ Online & Operational" if tess_ok else "✗ Binary Not Detected"

        # Gemini API check
        gemini_ok = bool(settings.GEMINI_API_KEY)
        gemini_status = f"✓ Configured ({settings.GEMINI_API_KEY[:4]}...{settings.GEMINI_API_KEY[-3:]})" if gemini_ok else "⚠️ No API Key in .env (Using Local Fallback)"

        # Database stats
        stats = get_catalogue_stats()

        col1, col2 = st.columns(2)
        with col1:
            st.markdown(
                f"""
                <div class="med-card">
                    <strong style="font-size: 1.05rem; color: #172033;">Core Engines</strong>
                    <hr style="margin: 8px 0; border: 0; border-top: 1px solid #E6EAF0;">
                    <div style="font-size: 0.9rem; margin-bottom: 6px;">
                        <b>Tesseract OCR Engine:</b> <span style="color: {'#16A34A' if tess_ok else '#DC2626'}; font-weight:600;">{tess_status}</span><br>
                        <span style="font-size: 0.8rem; color: #6B7280;">Binary Path: <code>{settings.TESSERACT_CMD}</code></span>
                    </div>
                    <div style="font-size: 0.9rem; margin-bottom: 6px;">
                        <b>Google Gemini Multimodal AI:</b> <span style="color: {'#16A34A' if gemini_ok else '#D97706'}; font-weight:600;">{gemini_status}</span><br>
                        <span style="font-size: 0.8rem; color: #6B7280;">Model: <code>gemini-2.5-flash</code></span>
                    </div>
                    <div style="font-size: 0.9rem;">
                        <b>Local Database:</b> <span style="color: #16A34A; font-weight:600;">✓ SQLite WAL Mode Active</span><br>
                        <span style="font-size: 0.8rem; color: #6B7280;">Path: <code>{settings.DATABASE_PATH}</code></span>
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

        with col2:
            st.markdown(
                f"""
                <div class="med-card">
                    <strong style="font-size: 1.05rem; color: #172033;">Database Store Counts</strong>
                    <hr style="margin: 8px 0; border: 0; border-top: 1px solid #E6EAF0;">
                    <div style="font-size: 0.9rem; margin-bottom: 4px;">
                        <b>CDSCO Verified Medicines:</b> {stats['total_medicines']:,} records
                    </div>
                    <div style="font-size: 0.9rem; margin-bottom: 4px;">
                        <b>Total Packaging Analyses:</b> {stats['total_analyses']:,} uploads
                    </div>
                    <div style="font-size: 0.9rem; margin-bottom: 4px;">
                        <b>Pending Review Queue:</b> {stats['pending_reviews']} corrections
                    </div>
                    <div style="font-size: 0.9rem;">
                        <b>Local vs Cloud Ratio:</b> {stats['local_analyses']} Local / {stats['gemini_analyses']} Gemini
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

        st.markdown("#### Database Maintenance Controls")
        cb1, cb2 = st.columns(2)
        with cb1:
            if st.button("🗑 Flush Response Cache", use_container_width=True):
                deleted = clear_analysis_cache()
                st.success(f"Cleared {deleted} cached responses.")
        with cb2:
            if st.button("🔄 Reseed CDSCO Catalogue", use_container_width=True):
                init_db(seed_catalog=True)
                st.success("Catalogue verified.")

    with set_tab2:
        st.markdown("### 🛡 Data Privacy & Security Framework")
        st.markdown(
            """
            Mediscan AI is engineered with privacy-by-design principles adhering to the **Digital Personal Data Protection (DPDP) Act, 2023** of India:

            1. **User-Level Data Isolation:** Every patient health record (reports, medications, vitals, conversations) is strictly scoped to the authenticated user ID and cannot be accessed across sessions.
            2. **No Data Brokerage:** Your medical history, uploaded blood reports, and health questions are never sold or shared with advertisers or third-party insurers.
            3. **Local-First Processing:** Medicine packaging matching and OCR extraction execute locally on your machine whenever possible, avoiding cloud transmission of unnecessary data.
            4. **Right to Erasure (DPDP Act Sec. 12):** You retain the permanent right to download a complete export of your records or permanently purge your account and all associated data at any time in **My Health Records**.
            5. **Minimal Logging:** Sensitive personal health information (PHI) is excluded from application error logs.
            """
        )

    with set_tab3:
        st.markdown("### 🤖 Machine Learning Pipeline & Model Retraining")
        st.markdown(
            """
            The local medicine matching engine utilizes a trainable character (2–5 n-gram) and word TF-IDF vectorizer + Cosine Similarity retrieval pipeline over 20,485+ CDSCO formulations.
            
            - **Model Location:** `ml/models/medicine_matcher/`
            - **Training Notebook:** `ml/notebooks/medicine_ai_training.ipynb`
            - **Automated Retraining Script:** `scripts/generate_and_run_notebook.py`
            """
        )

        if st.button("🚀 Trigger Local ML Model Retraining", type="primary", use_container_width=True):
            with st.spinner("Executing model retraining and matrix re-indexing..."):
                try:
                    res = subprocess.run(
                        [".venv/bin/python", "scripts/generate_and_run_notebook.py"],
                        capture_output=True,
                        text=True,
                        timeout=120
                    )
                    if res.returncode == 0:
                        st.success("✓ Model retrained and evaluated successfully! New vectorizer and artifacts exported.")
                    else:
                        st.error(f"Retraining encountered an error: {res.stderr[:200]}")
                except Exception as e:
                    st.error(f"Retraining execution notice: {str(e)}")

    with set_tab4:
        st.markdown("### 💬 Submit System Feedback or Correction")
        with st.form("feedback_audit_form"):
            category = st.selectbox(
                "Feedback Category",
                options=[
                    "MEDICINE_IDENTIFICATION",
                    "OCR",
                    "REPORT_EXPLANATION",
                    "CHATBOT",
                    "HEALTHCARE_LISTING"
                ]
            )
            rating = st.selectbox("Rating", options=["HELPFUL", "UNHELPFUL", "INCORRECT"])
            input_summary = st.text_input("What were you trying to do?", placeholder="e.g. Scanned Dolo 650 blister strip")
            correction = st.text_area("What went wrong or how can we improve?", placeholder="e.g. The strength was misread as 6500 mg instead of 650 mg")

            if st.form_submit_button("Submit Feedback", type="primary"):
                save_audit_feedback(
                    user_id=user_id,
                    category=category,
                    ref_id=None,
                    in_summary=input_summary,
                    out_summary="User direct submission",
                    rating=rating,
                    corrections=correction
                )
                st.success("Thank you for your feedback! It has been logged to the clinical audit queue.")
