"""
Mediscan AI - Medicine Scanner View
Preserves the full 5-tier hybrid medicine identification pipeline:
- OpenCV CLAHE Preprocessing & Loose Pill Detection
- Multi-Pass Tesseract OCR
- Local TF-IDF n-gram Candidate Matching over 20,485+ CDSCO medicines (Route B)
- Gemini Multimodal Fallback for wrinkled/specular blister strips (Route C)
- Field-level provenance verification badges & grounded Hindi guidance
- User feedback audit trails and CDSCO catalogue search
"""

import time
from datetime import datetime
from PIL import Image
import streamlit as st

from ..config import settings
from ..schemas import FeedbackSubmission, FieldVerificationStatus, IdentificationRoute
from ..services.analysis_pipeline import MedicineAnalysisPipeline
from ..services.feedback_service import FeedbackService
from ..database import (
    list_recent_analyses,
    get_analysis_record,
    delete_analysis_record,
    list_pending_feedback,
    update_feedback_status,
    search_medicines,
    get_catalogue_stats,
    clear_analysis_cache,
)


@st.cache_resource
def get_analysis_pipeline() -> MedicineAnalysisPipeline:
    return MedicineAnalysisPipeline()


@st.cache_resource
def get_feedback_service() -> FeedbackService:
    return FeedbackService()


def get_badge_html(status: str) -> str:
    if status == FieldVerificationStatus.VERIFIED_REGULATORY.value:
        return '<span class="badge badge-verified">✓ Verified Regulatory</span>'
    elif status == FieldVerificationStatus.VERIFIED_MANUFACTURER.value:
        return '<span class="badge badge-verified">✓ Verified Manufacturer</span>'
    elif status == FieldVerificationStatus.VISIBLE_ON_PACKAGING.value:
        return '<span class="badge badge-visible">👁 Visible on Package</span>'
    elif status == FieldVerificationStatus.CONFLICTING.value:
        return '<span class="badge badge-conflict">⚠ Conflicting Data</span>'
    elif status == FieldVerificationStatus.USER_CONFIRMED.value:
        return '<span class="badge badge-verified">✓ User Confirmed</span>'
    else:
        return '<span class="badge badge-inferred">? Unverified Inferred</span>'


def render_medicine_view(user: dict):
    pipeline = get_analysis_pipeline()
    feedback_service = get_feedback_service()

    st.markdown(
        """
        <div style="margin-bottom: 20px;">
            <h1 style="font-size: 2.1rem; font-weight: 700; color: #172033; margin-bottom: 4px;">Medicine Packaging Scanner & Verification</h1>
            <p style="font-size: 1.02rem; color: #697586; margin-top: 0;">
                Edge-first Indian pharmaceutical identification for blister strips, cartons, and bottles. Cross-checked against 20,485+ CDSCO / Jan Aushadhi formulations.
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    med_tab1, med_tab2, med_tab3, med_tab4, med_tab5 = st.tabs([
        "🔍 Scan Packaging",
        "📜 Scan History",
        "⚖️ Verify & Correct Queue",
        "📚 Medicine Catalogue",
        "📊 Model Performance"
    ])

    # =========================================================================
    # TAB 1: SCAN PACKAGING
    # =========================================================================
    with med_tab1:
        col_input, col_guide = st.columns([1.4, 1.0], gap="large")

        with col_input:
            input_method = st.radio(
                "Input Method",
                options=["📁 Upload Photo", "📷 Use Camera"],
                horizontal=True,
                label_visibility="collapsed",
                key="med_input_method"
            )

            uploaded_file = None
            if input_method == "📁 Upload Photo":
                uploaded_file = st.file_uploader(
                    "Choose packaging photograph",
                    type=["jpg", "jpeg", "png", "webp"],
                    help="Accepts JPG, JPEG, PNG, and WEBP images under 25MB.",
                    key="med_file_uploader"
                )
            else:
                camera_file = st.camera_input("Capture packaging photograph", key="med_cam_input")
                if camera_file:
                    uploaded_file = camera_file

            packaging_hint = st.text_input(
                "Visible text or brand markings (Optional hint)",
                placeholder="e.g. Paracip 650, Allegra 120, Pan 40...",
                help="Useful if the foil blister strip is wrinkled, reflective, or curved.",
                key="med_text_hint"
            )

            if uploaded_file is not None:
                image_bytes = uploaded_file.getvalue()
                st.session_state.image_bytes = image_bytes

                st.image(image_bytes, caption="Packaging Preview", use_container_width=True)
                col_b1, col_b2 = st.columns([1, 1])
                with col_b1:
                    analyze_clicked = st.button("🔬 Analyze Medicine", type="primary", use_container_width=True, key="med_btn_analyze")
                with col_b2:
                    if st.button("🗑 Remove Image", use_container_width=True, key="med_btn_remove"):
                        st.session_state.current_analysis = None
                        st.session_state.image_bytes = None
                        st.session_state.feedback_status = None
                        st.rerun()

                if analyze_clicked:
                    with st.spinner("Executing CLAHE preprocessing, multi-pass OCR, and catalogue cross-check..."):
                        try:
                            res = pipeline.analyze(
                                image_input=image_bytes,
                                packaging_text_hint=packaging_hint,
                                force_fresh=False,
                            )
                            st.session_state.current_analysis = res
                            st.session_state.feedback_status = None
                            st.session_state.show_correction_box = False
                        except Exception as e:
                            st.error(f"Analysis failed: {str(e)}")

        with col_guide:
            st.markdown(
                """
                <div class="med-card-highlight">
                    <strong style="font-size: 0.95rem; color: #172033;">📸 Real-World Blister Strip Tips</strong>
                    <ul style="font-size: 0.88rem; color: #697586; margin-left: -16px; margin-top: 6px;">
                        <li><b>Metallic Foil:</b> Avoid direct flashlight glare on silver foil surfaces.</li>
                        <li><b>Prescription Box:</b> Try to include the red Schedule H box or strength text.</li>
                        <li><b>Loose Pills:</b> Unmarked loose pills without packaging cannot be safely identified.</li>
                        <li><b>5-Tier Routing:</b> Accepted locally if similarity &ge; 0.82 (Zero API cost).</li>
                    </ul>
                </div>
                """,
                unsafe_allow_html=True,
            )

        # Display Analysis Result
        if "current_analysis" in st.session_state and st.session_state.current_analysis is not None:
            res = st.session_state.current_analysis
            st.markdown("---")

            # Route & Safety Banner
            method = res.identification_method
            conf_pct = int(res.confidence_score * 100)

            if method == IdentificationRoute.ROUTE_A_CACHE.value:
                banner_cls = "success-notice"
                route_desc = f"✓ Route A: Instant Cache Hit (Confidence: {conf_pct}%). Zero API tokens used."
            elif method == IdentificationRoute.ROUTE_B_LOCAL_MATCH.value:
                banner_cls = "success-notice"
                route_desc = f"✓ Route B: High-Confidence Local Match against CDSCO Catalogue ({conf_pct}%). Zero API cost."
            elif method == IdentificationRoute.ROUTE_C_GEMINI_FALLBACK.value:
                banner_cls = "success-notice"
                route_desc = f"⚡ Route C: Gemini Multimodal Visual Reasoning ({conf_pct}%). Packaging verified."
            elif method == IdentificationRoute.ROUTE_D_VERIFICATION_REQUIRED.value:
                banner_cls = "medical-disclaimer"
                route_desc = "⚠ Route D: Verification Required. Packaging evidence and catalogue conflict."
            else:
                banner_cls = "danger-notice"
                route_desc = "🛡 Route E: Safety Rejection / Abstention. Packaging unreadable or loose pill."

            st.markdown(f'<div class="{banner_cls}"><b>{route_desc}</b></div>', unsafe_allow_html=True)

            if res.is_identified:
                med = res.data
                ver_status = res.field_verification_status or {}

                c1, c2 = st.columns([1.5, 1.0], gap="large")
                with c1:
                    st.markdown(
                        f"""
                        <div class="med-card">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div>
                                    <h2 style="margin: 0; color: #172033; font-size: 1.8rem;">{med.brand_name or 'Identified Medicine'}</h2>
                                    <div style="font-size: 1.05rem; color: #4B5563; margin-top: 2px;">{med.generic_name or ''}</div>
                                </div>
                                <div>
                                    <span class="badge {'badge-rx' if med.is_prescription_required else 'badge-otc'}">
                                        {'℞ Schedule H / Prescription' if med.is_prescription_required else 'OTC Medicine'}
                                    </span>
                                </div>
                            </div>
                            <hr style="border: 0; border-top: 1px solid #E6EAF0; margin: 16px 0;">
                            <table style="width: 100%; font-size: 0.9rem; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 6px 0; color: #697586; width: 30%;"><b>Active Salt:</b></td>
                                    <td style="padding: 6px 0; color: #172033;">{', '.join(med.active_ingredients) if med.active_ingredients else 'N/A'}</td>
                                    <td style="text-align: right;">{get_badge_html(ver_status.get('active_ingredients', ''))}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; color: #697586;"><b>Strength:</b></td>
                                    <td style="padding: 6px 0; color: #172033;">{med.strength or 'N/A'}</td>
                                    <td style="text-align: right;">{get_badge_html(ver_status.get('strength', ''))}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; color: #697586;"><b>Dosage Form:</b></td>
                                    <td style="padding: 6px 0; color: #172033;">{med.dosage_form or 'N/A'}</td>
                                    <td style="text-align: right;">{get_badge_html(ver_status.get('dosage_form', ''))}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; color: #697586;"><b>Manufacturer:</b></td>
                                    <td style="padding: 6px 0; color: #172033;">{med.manufacturer or 'N/A'}</td>
                                    <td style="text-align: right;">{get_badge_html(ver_status.get('manufacturer', ''))}</td>
                                </tr>
                            </table>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )

                    # Hindi Guidance Card
                    hindi = med.hindi_response
                    if hindi:
                        st.markdown(
                            f"""
                            <div class="med-card-highlight">
                                <strong style="font-size: 1.05rem; color: #172033;">🇮🇳 हिंदी रोगी मार्गदर्शन (Hindi Patient Advisory)</strong>
                                <div style="margin-top: 8px; font-size: 0.9rem; color: #374151;">
                                    <div><b>दवा का नाम:</b> {hindi.dawa_ka_naam}</div>
                                    <div><b>प्रमुख घटक:</b> {hindi.pramukh_ghatak}</div>
                                    <div style="margin-top: 4px;"><b>सामान्य उपयोग:</b> {', '.join(hindi.karyapranali_aur_upyog)}</div>
                                    <div style="margin-top: 4px;"><b>सावधानियां:</b> {', '.join(hindi.sawdhaniyan)}</div>
                                    <div style="margin-top: 6px; color: #B45309; font-weight: 500;"><b>सलाह:</b> {hindi.doctor_paramarsh_sandesh}</div>
                                </div>
                            </div>
                            """,
                            unsafe_allow_html=True,
                        )

                with c2:
                    st.markdown("#### 🔍 Evidence & Local OCR Text")
                    with st.expander("Extracted OCR Tokens", expanded=True):
                        st.code(res.ocr_text or "No text detected", language="text")

                    # Candidate Matches
                    if res.candidate_matches:
                        st.markdown("#### Top Catalogue Candidates")
                        for cm in res.candidate_matches[:3]:
                            st.markdown(
                                f"- **{cm.brand_name}** ({cm.strength or ''}) &bull; Score: `{cm.similarity_score:.2f}`"
                            )

                    # User Feedback Actions
                    st.markdown("#### ⚖️ Verification Feedback")
                    fb_c1, fb_c2 = st.columns(2)
                    with fb_c1:
                        if st.button("✓ Correct", key="fb_correct", use_container_width=True):
                            feedback_service.submit_feedback(
                                FeedbackSubmission(
                                    analysis_id=res.analysis_id,
                                    feedback_type="CORRECT",
                                    field_feedback={"brand_name": True, "strength": True}
                                ),
                                image_bytes=st.session_state.get("image_bytes")
                            )
                            st.success("Confirmed! Sample staged for model retraining.")
                    with fb_c2:
                        if st.button("✗ Incorrect", key="fb_incorrect", use_container_width=True):
                            st.session_state.show_correction_box = True

                    if st.session_state.get("show_correction_box"):
                        corr_brand = st.text_input("Correct Brand Name")
                        corr_strength = st.text_input("Correct Strength (e.g. 650 mg)")
                        if st.button("Submit Correction to Queue"):
                            feedback_service.submit_feedback(
                                FeedbackSubmission(
                                    analysis_id=res.analysis_id,
                                    feedback_type="INCORRECT",
                                    proposed_corrections={"brand_name": corr_brand, "strength": corr_strength}
                                ),
                                image_bytes=st.session_state.get("image_bytes")
                            )
                            st.info("Correction submitted to clinical review queue.")
                            st.session_state.show_correction_box = False

    # =========================================================================
    # TAB 2: SCAN HISTORY
    # =========================================================================
    with med_tab2:
        st.markdown("### 📜 Recent Medicine Scans")
        analyses = list_recent_analyses(limit=25)
        if not analyses:
            st.info("No medicine packaging scans recorded yet.")
        else:
            for a in analyses:
                with st.expander(f"💊 Scan {a['id'][:8]} — {a['created_at'][:19]} ({a['identification_method']})"):
                    st.json(a.get("extracted_fields", {}))
                    if st.button("Delete Record", key=f"del_scan_{a['id']}"):
                        delete_analysis_record(a["id"])
                        st.success("Deleted scan record.")
                        st.rerun()

    # =========================================================================
    # TAB 3: VERIFY & CORRECT QUEUE
    # =========================================================================
    with med_tab3:
        st.markdown("### ⚖️ Clinical Verification Queue")
        st.caption("User-reported corrections are held here and never overwrite verified regulatory data without approval.")
        pending = list_pending_feedback(limit=20)
        if not pending:
            st.success("✓ Review queue is clear. No pending corrections.")
        else:
            for item in pending:
                st.markdown(
                    f"""
                    <div style="border: 1px solid #E6EAF0; padding: 12px; border-radius: 8px; margin-bottom: 8px;">
                        <b>Feedback ID:</b> {item['id']} &bull; <b>Analysis ID:</b> {item['analysis_id']}<br>
                        <b>Proposed Corrections:</b> `{item.get('proposed_corrections')}`
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
                q_c1, q_c2, _ = st.columns([1, 1, 3])
                with q_c1:
                    if st.button("Approve", key=f"appr_{item['id']}"):
                        update_feedback_status(item["id"], "APPROVED", reviewed_by=user.get("username", "admin"))
                        st.success("Correction approved.")
                        st.rerun()
                with q_c2:
                    if st.button("Reject", key=f"rej_{item['id']}"):
                        update_feedback_status(item["id"], "REJECTED", reviewed_by=user.get("username", "admin"))
                        st.info("Correction rejected.")
                        st.rerun()

    # =========================================================================
    # TAB 4: MEDICINE CATALOGUE
    # =========================================================================
    with med_tab4:
        st.markdown("### 📚 CDSCO / Jan Aushadhi Verified Catalogue")
        q = st.text_input("Search 20,485+ Verified Indian Medicines", placeholder="e.g. Paracetamol, Augmentin, Metformin...", key="cat_search_q")
        if q:
            results = search_medicines(q, limit=20)
            st.caption(f"Found {len(results)} matching products.")
            for m in results:
                st.markdown(
                    f"""
                    <div style="border: 1px solid #E6EAF0; padding: 10px 14px; border-radius: 6px; margin-bottom: 6px;">
                        <strong style="color: #172033; font-size: 1.05rem;">{m['brand_name']}</strong> &bull; {m.get('strength') or ''} ({m.get('dosage_form') or ''})<br>
                        <span style="font-size: 0.85rem; color: #4B5563;">Active: {m.get('active_ingredients')} &bull; Manufacturer: {m.get('manufacturer')}</span><br>
                        <span style="font-size: 0.78rem; color: #16A34A;">● Source: {m.get('source_name')}</span>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

    # =========================================================================
    # TAB 5: MODEL PERFORMANCE
    # =========================================================================
    with med_tab5:
        st.markdown("### 📊 System & Routing Metrics")
        stats = get_catalogue_stats()
        mc1, mc2, mc3, mc4 = st.columns(4)
        with mc1:
            st.metric("Total Catalogue", f"{stats['total_medicines']:,}")
        with mc2:
            st.metric("Total Analyzed", f"{stats['total_analyses']:,}")
        with mc3:
            st.metric("Gemini Fallbacks", f"{stats['gemini_analyses']:,}")
        with mc4:
            st.metric("Local Matches", f"{stats['local_analyses']:,}")

        if st.button("Clear Response Cache", key="med_clear_cache"):
            deleted = clear_analysis_cache()
            st.success(f"Cleared {deleted} cached responses.")
