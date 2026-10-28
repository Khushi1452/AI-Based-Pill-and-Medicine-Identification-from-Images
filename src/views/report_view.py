"""
Mediscan AI - Medical Report Analyzer View
Parses PDF reports and scanned laboratory images, extracts structured biomarkers,
provides side-by-side verification with user correction, and enables multi-report comparison.
"""

import io
from datetime import datetime
import streamlit as st
import plotly.graph_objects as go

from ..services.report_service import MedicalReportAnalyzer
from ..database import (
    save_medical_report,
    list_medical_reports,
    get_medical_report,
    update_medical_report_biomarkers,
    delete_medical_report,
)


@st.cache_resource
def get_report_analyzer() -> MedicalReportAnalyzer:
    return MedicalReportAnalyzer()


def render_report_view(user: dict):
    user_id = user["id"]
    analyzer = get_report_analyzer()

    st.markdown(
        """
        <div style="margin-bottom: 20px;">
            <h1 style="font-size: 2.1rem; font-weight: 700; color: #172033; margin-bottom: 4px;">Medical Report Analyzer</h1>
            <p style="font-size: 1.02rem; color: #697586; margin-top: 0;">
                Upload laboratory blood tests, urine panels, or diagnostic summaries (PDF/Images) to receive structured explanations and monitor biomarker trends over time.
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    tab_upload, tab_history, tab_compare = st.tabs([
        "📤 Analyze New Report",
        "📂 Saved Reports Archive",
        "📈 Longitudinal Multi-Report Comparison"
    ])

    # =========================================================================
    # TAB 1: ANALYZE NEW REPORT
    # =========================================================================
    with tab_upload:
        col_up, col_info = st.columns([1.4, 1.0], gap="large")

        with col_up:
            report_file = st.file_uploader(
                "Upload Laboratory or Diagnostic Document",
                type=["pdf", "png", "jpg", "jpeg"],
                help="Accepts PDFs, scans, and photographs of blood panels, lipid profiles, thyroid tests, or discharge summaries (max 25MB).",
                key="rep_uploader"
            )

            report_title_input = st.text_input(
                "Report Title or Description",
                placeholder="e.g. Complete Blood Count (CBC) - Lal PathLabs",
                key="rep_title_in"
            )

            rep_date_input = st.date_input(
                "Test Collection Date (from report)",
                value=datetime.utcnow(),
                key="rep_date_in"
            )

            if report_file is not None:
                file_bytes = report_file.getvalue()
                st.caption(f"Document Size: {len(file_bytes) / 1024:.1f} KB &bull; Filename: {report_file.name}")

                if st.button("🔬 Extract & Analyze Document", type="primary", use_container_width=True):
                    with st.spinner("Extracting document text, identifying reference ranges, and generating plain-language guidance..."):
                        raw_text, biomarkers, ai_summary = analyzer.parse_document(file_bytes, report_file.name)
                        st.session_state.active_parsed_report = {
                            "title": report_title_input or report_file.name,
                            "date": rep_date_input.strftime("%Y-%m-%d"),
                            "raw_text": raw_text,
                            "biomarkers": biomarkers,
                            "ai_summary": ai_summary,
                            "file_name": report_file.name,
                        }

        with col_info:
            st.markdown(
                """
                <div class="med-card-highlight">
                    <strong style="color: #172033; font-size: 0.95rem;">📋 Supported Document Formats</strong>
                    <ul style="font-size: 0.88rem; color: #4B5563; margin-top: 8px; margin-left: -18px;">
                        <li><b>Hematology:</b> Complete Blood Count (CBC), Hemoglobin, Platelets, ESR.</li>
                        <li><b>Metabolic & Renal:</b> Fasting Glucose, HbA1c, Serum Creatinine, Urea, Uric Acid.</li>
                        <li><b>Lipids & Liver:</b> Cholesterol, Triglycerides, Bilirubin, SGPT/SGOT enzymes.</li>
                        <li><b>Radiology & ECG:</b> Typed clinical impressions and written conclusions.</li>
                    </ul>
                </div>
                """,
                unsafe_allow_html=True,
            )

        # Display Parsed Results
        if "active_parsed_report" in st.session_state and st.session_state.active_parsed_report:
            rep_data = st.session_state.active_parsed_report
            st.markdown("---")
            st.markdown(f"### Results for: {rep_data['title']} ({rep_data['date']})")

            # Summary Box
            summary = rep_data["ai_summary"].get("summary", "")
            st.markdown(
                f"""
                <div style="background-color: #F0FDF4; border-left: 4px solid #16A34A; padding: 14px 18px; border-radius: 6px; margin-bottom: 20px;">
                    <strong style="color: #166534; font-size: 0.95rem;">💡 Plain-Language Summary:</strong>
                    <p style="color: #14532D; font-size: 0.9rem; margin: 4px 0 0 0;">{summary}</p>
                </div>
                """,
                unsafe_allow_html=True,
            )

            # Side-by-side: Extracted Biomarkers vs Raw Text
            c_bio, c_raw = st.columns([1.6, 1.0], gap="medium")

            with c_bio:
                st.markdown("#### 🧪 Extracted Parameters & Reference Ranges")
                biomarkers = rep_data["biomarkers"]
                if not biomarkers:
                    st.warning("No standard numerical laboratory parameters were automatically extracted. You can review the raw document text on the right.")
                else:
                    for i, bio in enumerate(biomarkers):
                        flag = bio.get("flag", "NORMAL")
                        if flag == "HIGH":
                            badge_style = "background-color: #FEE2E2; color: #991B1B; border: 1px solid #FCA5A5;"
                        elif flag == "LOW":
                            badge_style = "background-color: #FEF3C7; color: #92400E; border: 1px solid #FCD34D;"
                        elif flag == "NORMAL":
                            badge_style = "background-color: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0;"
                        else:
                            badge_style = "background-color: #F3F4F6; color: #4B5563; border: 1px solid #E5E7EB;"

                        st.markdown(
                            f"""
                            <div style="border: 1px solid #E6EAF0; border-radius: 8px; padding: 12px 16px; margin-bottom: 10px; background: #FFFFFF;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <strong style="font-size: 1.0rem; color: #172033;">{bio['test_name']}</strong>
                                        <div style="font-size: 0.82rem; color: #6B7280;">Lab Range: {bio['reference_range']}</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <span style="font-size: 1.15rem; font-weight: 700; color: #172033;">{bio['value']} {bio['unit']}</span>
                                        <div><span style="{badge_style} font-size: 0.72rem; padding: 2px 8px; border-radius: 4px; font-weight: 700;">{flag}</span></div>
                                    </div>
                                </div>
                                <div style="font-size: 0.85rem; color: #4B5563; margin-top: 6px; border-top: 1px solid #F3F4F6; padding-top: 6px;">
                                    {bio.get('simple_explanation', '')}
                                </div>
                            </div>
                            """,
                            unsafe_allow_html=True,
                        )

            with c_raw:
                st.markdown("#### 📄 Document Text Preview")
                with st.expander("Show Extracted Raw Text", expanded=True):
                    st.text_area(
                        "Raw Extracted Text",
                        value=rep_data["raw_text"],
                        height=350,
                        disabled=True,
                        key="raw_text_display"
                    )

            # Doctor Questions & Limitations
            st.markdown("#### 🩺 Recommended Questions for Your Physician")
            questions = rep_data["ai_summary"].get("suggested_doctor_questions", [])
            for q in questions:
                st.markdown(f"- {q}")

            # Consent to Save
            st.markdown("---")
            c_save1, c_save2 = st.columns([1, 2])
            with c_save1:
                if st.button("💾 Save Report to My Health Records", type="primary", use_container_width=True):
                    rep_id = save_medical_report(
                        user_id=user_id,
                        report_title=rep_data["title"],
                        report_type="BLOOD_TEST" if "blood" in rep_data["title"].lower() else "LAB_PANEL",
                        report_date=rep_data["date"],
                        raw_text=rep_data["raw_text"],
                        biomarkers=rep_data["biomarkers"],
                        ai_summary=rep_data["ai_summary"],
                        file_name=rep_data["file_name"]
                    )
                    st.success("Report successfully saved to your private Health Records!")
                    st.session_state.active_parsed_report = None
                    st.rerun()

    # =========================================================================
    # TAB 2: SAVED REPORTS ARCHIVE
    # =========================================================================
    with tab_history:
        saved_reports = list_medical_reports(user_id)
        if not saved_reports:
            st.info("You haven't saved any reports yet. Analyze a document in the first tab to save it.")
        else:
            st.markdown(f"### Saved Reports ({len(saved_reports)})")
            for rep in saved_reports:
                with st.expander(f"📄 {rep['report_title']} — {rep.get('report_date') or 'No Date'}"):
                    c_del1, c_del2 = st.columns([4, 1])
                    with c_del2:
                        if st.button("🗑 Delete", key=f"del_rep_{rep['id']}"):
                            delete_medical_report(rep["id"], user_id)
                            st.success("Report deleted.")
                            st.rerun()

                    st.markdown(f"**Document File:** `{rep.get('file_name', 'N/A')}` &bull; **Type:** `{rep.get('report_type')}`")
                    st.markdown(f"**Clinical Summary:** {rep.get('ai_summary', {}).get('summary', 'Recorded')}")

                    biomarkers = rep.get("biomarkers", [])
                    if biomarkers:
                        st.markdown("**Biomarkers:**")
                        cols = st.columns(min(len(biomarkers), 4))
                        for idx, b in enumerate(biomarkers[:8]):
                            with cols[idx % 4]:
                                st.metric(label=b["test_name"], value=f"{b['value']} {b['unit']}", delta=b.get("flag"))

    # =========================================================================
    # TAB 3: LONGITUDINAL MULTI-REPORT COMPARISON
    # =========================================================================
    with tab_compare:
        saved_reports = list_medical_reports(user_id)
        if len(saved_reports) < 2:
            st.info("Longitudinal trend analysis requires at least **two** saved reports with compatible parameters. Upload another report to track changes over time.")
        else:
            st.markdown("### 📈 Biomarker Progression Over Time")
            st.markdown("Select an extracted biomarker to visualize how your laboratory measurements have evolved across test dates.")

            # Identify all unique biomarker names present across saved reports
            all_tests = set()
            for r in saved_reports:
                for b in r.get("biomarkers", []):
                    if b.get("value_numeric") is not None:
                        all_tests.add(b["test_name"])

            if not all_tests:
                st.warning("No compatible numerical biomarkers with extracted values were found across your saved reports.")
            else:
                chosen_test = st.selectbox("Select Biomarker to Plot", options=sorted(list(all_tests)))

                # Collect time series points
                dates = []
                values = []
                units = []
                flags = []

                # Sort reports chronologically
                chrono_reports = sorted(saved_reports, key=lambda x: x.get("report_date") or x.get("created_at")[:10])

                for r in chrono_reports:
                    r_date = r.get("report_date") or r.get("created_at")[:10]
                    for b in r.get("biomarkers", []):
                        if b["test_name"] == chosen_test and b.get("value_numeric") is not None:
                            dates.append(r_date)
                            values.append(b["value_numeric"])
                            units.append(b.get("unit", ""))
                            flags.append(b.get("flag", "NORMAL"))

                if len(values) >= 2:
                    unit_label = units[0] if units else ""
                    fig = go.Figure()
                    fig.add_trace(go.Scatter(
                        x=dates,
                        y=values,
                        mode="lines+markers+text",
                        name=chosen_test,
                        text=[f"{v} {unit_label}" for v in values],
                        textposition="top center",
                        line=dict(color="#2563EB", width=3),
                        marker=dict(size=10, color="#1D4ED8")
                    ))
                    fig.update_layout(
                        title=f"{chosen_test} Trend ({unit_label})",
                        xaxis_title="Report Date",
                        yaxis_title=f"Value ({unit_label})",
                        plot_bgcolor="#FFFFFF",
                        paper_bgcolor="#FFFFFF",
                        height=420,
                        margin=dict(l=40, r=40, t=50, b=40),
                    )
                    st.plotly_chart(fig, use_container_width=True)

                    # Highlight observations
                    diff = values[-1] - values[0]
                    direction = "increased" if diff > 0 else "decreased"
                    st.markdown(
                        f"""
                        <div style="background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 14px; margin-top: 14px;">
                            <strong>Trend Observation:</strong> Between {dates[0]} and {dates[-1]}, your {chosen_test} has {direction} by {abs(diff):.2f} {unit_label}.
                            <div style="font-size: 0.85rem; color: #4B5563; margin-top: 4px;">
                                Discuss this longitudinal trend with your physician during your next consultation.
                            </div>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )
                else:
                    st.info(f"Only 1 report has data for **{chosen_test}** ({values[0]} {units[0] if units else ''}). Upload a subsequent test to generate trend curves.")
