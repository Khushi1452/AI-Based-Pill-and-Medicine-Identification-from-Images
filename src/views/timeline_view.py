"""
Mediscan AI - Health Timeline & Trend Visualization View
Compiles an interactive chronological feed of health events and renders
Plotly trend charts for Blood Pressure, Blood Glucose, and laboratory biomarkers.
"""

from datetime import datetime
import streamlit as st
import plotly.graph_objects as go

from ..services.health_record_service import HealthRecordService
from ..database import (
    save_health_measurement,
    list_health_measurements,
    delete_health_measurement,
    list_medical_reports,
)


def render_timeline_view(user: dict):
    user_id = user["id"]

    st.markdown(
        """
        <div style="margin-bottom: 20px;">
            <h1 style="font-size: 2.1rem; font-weight: 700; color: #172033; margin-bottom: 4px;">Health Timeline & Vitals Trends</h1>
            <p style="font-size: 1.02rem; color: #697586; margin-top: 0;">
                Track your health journey chronologically and visualize blood pressure, glucose, and laboratory parameters over time.
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    tab_trends, tab_events, tab_log = st.tabs([
        "📈 Interactive Trend Charts",
        "🕒 Chronological Health Feed",
        "➕ Log Vital Measurement"
    ])

    # =========================================================================
    # TAB 1: INTERACTIVE TREND CHARTS
    # =========================================================================
    with tab_trends:
        trend_option = st.radio(
            "Select Vital Category",
            options=["Blood Pressure (BP)", "Blood Glucose (Sugar)", "Laboratory Biomarkers"],
            horizontal=True,
            key="trend_vital_cat"
        )

        if trend_option == "Blood Pressure (BP)":
            bp_records = list_health_measurements(user_id, measurement_type="BLOOD_PRESSURE", limit=50)

            if len(bp_records) < 2:
                st.info("Log at least **two** blood pressure readings in the 'Log Vital Measurement' tab to generate trend charts.")
            else:
                # Sort ascending by measured_at
                bp_sorted = sorted(bp_records, key=lambda x: x["measured_at"])
                dates = [r["measured_at"][:16] for r in bp_sorted]
                sys_vals = [r["value_numeric"] for r in bp_sorted]
                dia_vals = [r.get("secondary_value") or 80.0 for r in bp_sorted]

                fig = go.Figure()
                # Systolic
                fig.add_trace(go.Scatter(
                    x=dates, y=sys_vals,
                    mode="lines+markers",
                    name="Systolic (mmHg)",
                    line=dict(color="#DC2626", width=2.5),
                    marker=dict(size=8)
                ))
                # Diastolic
                fig.add_trace(go.Scatter(
                    x=dates, y=dia_vals,
                    mode="lines+markers",
                    name="Diastolic (mmHg)",
                    line=dict(color="#2563EB", width=2.5),
                    marker=dict(size=8)
                ))
                # Normal Reference Thresholds
                fig.add_hline(y=120, line_dash="dash", line_color="#16A34A", annotation_text="Normal Systolic (< 120)")
                fig.add_hline(y=80, line_dash="dash", line_color="#059669", annotation_text="Normal Diastolic (< 80)")
                fig.add_hline(y=140, line_dash="dot", line_color="#B91C1C", annotation_text="Stage 2 HTN Threshold (≥ 140)")

                fig.update_layout(
                    title="Blood Pressure Progression Over Time",
                    xaxis_title="Measurement Date & Time",
                    yaxis_title="Pressure (mmHg)",
                    plot_bgcolor="#FFFFFF",
                    paper_bgcolor="#FFFFFF",
                    height=440,
                    margin=dict(l=40, r=40, t=50, b=40),
                    legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
                )
                st.plotly_chart(fig, use_container_width=True)

        elif trend_option == "Blood Glucose (Sugar)":
            fasting = list_health_measurements(user_id, measurement_type="FASTING_GLUCOSE", limit=50)
            pp = list_health_measurements(user_id, measurement_type="POSTPRANDIAL_GLUCOSE", limit=50)

            all_gluc = sorted(fasting + pp, key=lambda x: x["measured_at"])

            if len(all_gluc) < 2:
                st.info("Log at least **two** blood sugar readings to visualize glycemic trends.")
            else:
                f_dates = [r["measured_at"][:16] for r in fasting]
                f_vals = [r["value_numeric"] for r in fasting]
                p_dates = [r["measured_at"][:16] for r in pp]
                p_vals = [r["value_numeric"] for r in pp]

                fig = go.Figure()
                if fasting:
                    fig.add_trace(go.Scatter(
                        x=f_dates, y=f_vals,
                        mode="lines+markers",
                        name="Fasting Glucose (mg/dL)",
                        line=dict(color="#2563EB", width=2.5)
                    ))
                if pp:
                    fig.add_trace(go.Scatter(
                        x=p_dates, y=p_vals,
                        mode="lines+markers",
                        name="Post-Prandial Glucose (mg/dL)",
                        line=dict(color="#D97706", width=2.5)
                    ))

                fig.add_hline(y=100, line_dash="dash", line_color="#16A34A", annotation_text="Normal Fasting Upper Bound (100)")
                fig.add_hline(y=140, line_dash="dot", line_color="#DC2626", annotation_text="Normal Post-Meal Upper Bound (140)")

                fig.update_layout(
                    title="Blood Glucose Readings (mg/dL)",
                    xaxis_title="Date & Time",
                    yaxis_title="mg/dL",
                    plot_bgcolor="#FFFFFF",
                    paper_bgcolor="#FFFFFF",
                    height=440,
                    margin=dict(l=40, r=40, t=50, b=40)
                )
                st.plotly_chart(fig, use_container_width=True)

        else:
            # Lab Biomarkers from Reports
            reports = list_medical_reports(user_id)
            if not reports:
                st.info("No laboratory reports found. Upload a report in the **Medical Report Analyzer** to plot lab tests.")
            else:
                # Find all biomarkers
                test_names = set()
                for r in reports:
                    for b in r.get("biomarkers", []):
                        if b.get("value_numeric") is not None:
                            test_names.add(b["test_name"])

                if not test_names:
                    st.warning("No numerical biomarkers extracted yet.")
                else:
                    sel_test = st.selectbox("Select Test", options=sorted(list(test_names)))
                    pts = []
                    for r in sorted(reports, key=lambda x: x.get("report_date") or x["created_at"]):
                        d_str = r.get("report_date") or r["created_at"][:10]
                        for b in r.get("biomarkers", []):
                            if b["test_name"] == sel_test and b.get("value_numeric") is not None:
                                pts.append((d_str, b["value_numeric"], b.get("unit", "")))

                    if pts:
                        dates = [p[0] for p in pts]
                        vals = [p[1] for p in pts]
                        unit = pts[0][2]

                        fig = go.Figure()
                        fig.add_trace(go.Scatter(
                            x=dates, y=vals,
                            mode="lines+markers+text",
                            text=[f"{v} {unit}" for v in vals],
                            textposition="top center",
                            line=dict(color="#7C3AED", width=3)
                        ))
                        fig.update_layout(
                            title=f"{sel_test} ({unit}) Over Time",
                            xaxis_title="Report Date",
                            yaxis_title=unit,
                            plot_bgcolor="#FFFFFF",
                            paper_bgcolor="#FFFFFF",
                            height=400
                        )
                        st.plotly_chart(fig, use_container_width=True)

    # =========================================================================
    # TAB 2: CHRONOLOGICAL HEALTH FEED
    # =========================================================================
    with tab_events:
        st.markdown("### Unified Longitudinal Health Stream")
        events = HealthRecordService.get_unified_health_timeline(user_id)

        if not events:
            st.info("No health events recorded yet. Upload a report, check symptoms, or log a measurement to see your timeline.")
        else:
            for ev in events:
                ev_type = ev["type"]
                badge_bg = "#EFF6FF" if ev_type == "REPORT" else ("#ECFDF5" if ev_type == "MEASUREMENT" else ("#FFFBEB" if ev_type == "SYMPTOM" else "#F3F4F6"))
                badge_fg = "#2563EB" if ev_type == "REPORT" else ("#065F46" if ev_type == "MEASUREMENT" else ("#92400E" if ev_type == "SYMPTOM" else "#374151"))

                st.markdown(
                    f"""
                    <div style="border: 1px solid #E6EAF0; border-radius: 8px; padding: 14px; margin-bottom: 10px; background: #FFFFFF;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <strong style="color: #172033; font-size: 1.05rem;">{ev['title']}</strong>
                            <span style="background: {badge_bg}; color: {badge_fg}; font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; font-weight: 700;">
                                {ev['badge']}
                            </span>
                        </div>
                        <div style="font-size: 0.88rem; color: #4B5563; margin-top: 4px;">
                            {ev['details']}
                        </div>
                        <div style="font-size: 0.8rem; color: #6B7280; margin-top: 4px;">
                            📅 {ev['timestamp']} &bull; Provenance: <code>{ev.get('provenance', 'USER_ENTERED')}</code>
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

    # =========================================================================
    # TAB 3: LOG VITAL MEASUREMENT
    # =========================================================================
    with tab_log:
        st.markdown("### Record Health Measurement")

        with st.form("manual_measurement_form"):
            c_m1, c_m2 = st.columns(2)
            with c_m1:
                m_type = st.selectbox(
                    "Measurement Type",
                    options=[
                        "BLOOD_PRESSURE",
                        "FASTING_GLUCOSE",
                        "POSTPRANDIAL_GLUCOSE",
                        "HEART_RATE",
                        "TEMPERATURE",
                        "SPO2",
                        "WEIGHT"
                    ]
                )
                m_val = st.number_input("Primary Value", min_value=1.0, max_value=500.0, value=120.0)

            with c_m2:
                m_unit = st.text_input("Unit", value="mmHg" if "PRESSURE" in m_type else ("mg/dL" if "GLUCOSE" in m_type else "bpm"))
                sec_val = None
                if m_type == "BLOOD_PRESSURE":
                    sec_val = st.number_input("Diastolic Value (mmHg)", min_value=30.0, max_value=200.0, value=80.0)

            m_notes = st.text_input("Notes or Context", placeholder="e.g. Taken before breakfast while resting")

            if st.form_submit_button("💾 Save Measurement", type="primary", use_container_width=True):
                save_health_measurement(
                    user_id=user_id,
                    measurement_type=m_type,
                    value_numeric=m_val,
                    secondary_value=sec_val,
                    unit=m_unit,
                    source="USER_ENTERED",
                    notes=m_notes
                )
                st.success("Vital measurement recorded successfully.")
                st.rerun()
