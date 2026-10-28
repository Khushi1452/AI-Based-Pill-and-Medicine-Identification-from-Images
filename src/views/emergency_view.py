"""
Mediscan AI - Emergency Help & Triage Navigation View
Provides instant access to life-saving Indian emergency helplines (112, 108, 102, 1075, 14416),
red flag symptom checklists, and emergency trauma center directions.
"""

import streamlit as st
from ..services.healthcare_locator import HealthcareLocatorService


def render_emergency_view(user: dict):
    st.markdown(
        """
        <div style="background-color: #FEF2F2; border: 2px solid #DC2626; border-radius: 12px; padding: 22px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 2.2rem;">🚨</span>
                <div>
                    <h1 style="color: #991B1B; font-size: 1.8rem; margin: 0 0 4px 0;">Emergency Medical Assistance</h1>
                    <p style="color: #B91C1C; font-size: 1.0rem; margin: 0;">
                        If you or someone nearby is experiencing acute, life-threatening symptoms, do NOT wait for online chat or reports. 
                        Contact verified emergency responders immediately.
                    </p>
                </div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # 1. Primary Indian Emergency Helplines Grid
    st.markdown("### 📞 National Emergency Helplines (India)")
    c1, c2, c3 = st.columns(3)

    with c1:
        st.markdown(
            """
            <div style="border: 2px solid #DC2626; border-radius: 8px; padding: 16px; background: #FFFFFF; text-align: center; margin-bottom: 12px;">
                <div style="font-size: 1.8rem; font-weight: 800; color: #DC2626;">112</div>
                <strong style="color: #172033;">National Emergency</strong>
                <p style="font-size: 0.82rem; color: #6B7280; margin: 4px 0 10px 0;">Unified all-in-one helpline (Police, Fire, Medical Ambulance) across India.</p>
                <a href="tel:112" style="background: #DC2626; color: #FFFFFF; padding: 6px 16px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 0.88rem; display: inline-block;">
                    📞 Call 112 Now
                </a>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with c2:
        st.markdown(
            """
            <div style="border: 2px solid #EA580C; border-radius: 8px; padding: 16px; background: #FFFFFF; text-align: center; margin-bottom: 12px;">
                <div style="font-size: 1.8rem; font-weight: 800; color: #EA580C;">108</div>
                <strong style="color: #172033;">Ambulance Emergency</strong>
                <p style="font-size: 0.82rem; color: #6B7280; margin: 4px 0 10px 0;">Emergency medical transport, trauma care, and critical patient response.</p>
                <a href="tel:108" style="background: #EA580C; color: #FFFFFF; padding: 6px 16px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 0.88rem; display: inline-block;">
                    📞 Call 108 Ambulance
                </a>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with c3:
        st.markdown(
            """
            <div style="border: 2px solid #2563EB; border-radius: 8px; padding: 16px; background: #FFFFFF; text-align: center; margin-bottom: 12px;">
                <div style="font-size: 1.8rem; font-weight: 800; color: #2563EB;">102</div>
                <strong style="color: #172033;">Maternal & Infant</strong>
                <p style="font-size: 0.82rem; color: #6B7280; margin: 4px 0 10px 0;">JSSK dedicated free emergency transport for pregnant mothers and neonates.</p>
                <a href="tel:102" style="background: #2563EB; color: #FFFFFF; padding: 6px 16px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 0.88rem; display: inline-block;">
                    📞 Call 102
                </a>
            </div>
            """,
            unsafe_allow_html=True,
        )

    c4, c5, c6 = st.columns(3)
    with c4:
        st.markdown(
            """
            <div style="border: 1px solid #E6EAF0; border-radius: 8px; padding: 14px; background: #FFFFFF; text-align: center;">
                <div style="font-size: 1.4rem; font-weight: 700; color: #4B5563;">1075</div>
                <strong>National Health Helpline</strong>
                <p style="font-size: 0.8rem; color: #6B7280; margin: 4px 0;">MoHFW 24/7 central medical inquiries & public health emergencies.</p>
                <a href="tel:1075" style="color: #2563EB; font-weight: 600; font-size: 0.85rem;">📞 Call 1075</a>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with c5:
        st.markdown(
            """
            <div style="border: 1px solid #E6EAF0; border-radius: 8px; padding: 14px; background: #FFFFFF; text-align: center;">
                <div style="font-size: 1.4rem; font-weight: 700; color: #7C3AED;">14416</div>
                <strong>Tele-MANAS Mental Crisis</strong>
                <p style="font-size: 0.8rem; color: #6B7280; margin: 4px 0;">24/7 free mental health counseling & crisis intervention (Toll-free: 1800-891-4416).</p>
                <a href="tel:14416" style="color: #7C3AED; font-weight: 600; font-size: 0.85rem;">📞 Call 14416</a>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with c6:
        st.markdown(
            """
            <div style="border: 1px solid #E6EAF0; border-radius: 8px; padding: 14px; background: #FFFFFF; text-align: center;">
                <div style="font-size: 1.3rem; font-weight: 700; color: #059669;">1800-116-117</div>
                <strong>Poison Information Center</strong>
                <p style="font-size: 0.8rem; color: #6B7280; margin: 4px 0;">National Poison Information Centre (AIIMS New Delhi) for toxic exposure.</p>
                <a href="tel:1800116117" style="color: #059669; font-weight: 600; font-size: 0.85rem;">📞 Call Poison Center</a>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("<br>", unsafe_allow_html=True)

    # 2. Red Flag Symptoms Checklist
    st.markdown("### ⚠️ Red Flag Symptoms That Require Immediate Emergency Hospitalization")
    col_rf1, col_rf2 = st.columns(2)

    with col_rf1:
        st.markdown(
            """
            <div style="border: 1px solid #FCA5A5; border-radius: 8px; padding: 16px; background: #FFF5F5;">
                <strong style="color: #991B1B;">1. Heart & Circulation</strong>
                <ul style="font-size: 0.88rem; color: #7F1D1D; margin: 6px 0 10px -16px;">
                    <li>Crushing, heavy chest pressure or tightness.</li>
                    <li>Pain radiating to the left arm, jaw, neck, or back.</li>
                    <li>Sudden profuse cold sweating with dizziness.</li>
                </ul>

                <strong style="color: #991B1B;">2. Stroke Signs (Think F.A.S.T.)</strong>
                <ul style="font-size: 0.88rem; color: #7F1D1D; margin: 6px 0 0 -16px;">
                    <li><b>F - Face:</b> Sudden drooping of one side of the face or smile.</li>
                    <li><b>A - Arms:</b> Sudden weakness or inability to raise one arm.</li>
                    <li><b>S - Speech:</b> Slurred, garbled speech or inability to talk.</li>
                    <li><b>T - Time:</b> Time to call 112 immediately. Note the onset time.</li>
                </ul>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with col_rf2:
        st.markdown(
            """
            <div style="border: 1px solid #FCA5A5; border-radius: 8px; padding: 16px; background: #FFF5F5;">
                <strong style="color: #991B1B;">3. Breathing & Allergic Crises</strong>
                <ul style="font-size: 0.88rem; color: #7F1D1D; margin: 6px 0 10px -16px;">
                    <li>Severe gasping, inability to complete full sentences.</li>
                    <li>Blue or grey discoloration of lips, tongue, or fingertips.</li>
                    <li>Sudden throat swelling or tongue enlargement after food/stings.</li>
                </ul>

                <strong style="color: #991B1B;">4. Neurological & Trauma</strong>
                <ul style="font-size: 0.88rem; color: #7F1D1D; margin: 6px 0 0 -16px;">
                    <li>Unconsciousness, collapse, or inability to awaken.</li>
                    <li>Active seizure lasting longer than 5 minutes.</li>
                    <li>Uncontrolled spurting arterial bleeding or major trauma.</li>
                </ul>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("<br>", unsafe_allow_html=True)

    # 3. Quick Emergency Trauma Centers Navigation
    st.markdown("### 🏥 Nearest 24/7 Hospital Emergency Departments")
    locator = HealthcareLocatorService()
    emergency_facs = locator.search_facilities(emergency_priority=True)

    for fac in emergency_facs[:4]:
        st.markdown(
            f"""
            <div style="border: 1px solid #E6EAF0; border-radius: 8px; padding: 14px; margin-bottom: 8px; background: #FFFFFF; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                <div>
                    <strong style="font-size: 1.05rem; color: #172033;">{fac['name']}</strong>
                    <span style="background: #FEE2E2; color: #991B1B; font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; font-weight: 700; margin-left: 8px;">24x7 ER</span>
                    <div style="font-size: 0.85rem; color: #4B5563; margin-top: 2px;">{fac['address']}</div>
                    <div style="font-size: 0.82rem; color: #DC2626; font-weight: 600; margin-top: 2px;">Emergency Line: {fac.get('emergency_phone') or '112'}</div>
                </div>
                <div style="margin-top: 6px;">
                    <a href="{fac['maps_url']}" target="_blank" style="background: #2563EB; color: #FFFFFF; padding: 6px 14px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 0.85rem;">
                        🗺 Get Directions
                    </a>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )
