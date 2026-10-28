"""
Mediscan AI - Find Nearby Care View
Location-aware discovery of hospitals, emergency departments, clinics,
laboratories, and pharmacies across India with intelligent specialty matching.
"""

import streamlit as st
import urllib.parse

from ..services.healthcare_locator import HealthcareLocatorService
from ..database import (
    save_facility,
    list_saved_facilities,
    delete_saved_facility,
)


@st.cache_resource
def get_locator_service() -> HealthcareLocatorService:
    return HealthcareLocatorService()


def render_locator_view(user: dict):
    user_id = user["id"]
    locator = get_locator_service()

    st.markdown(
        """
        <div style="margin-bottom: 20px;">
            <h1 style="font-size: 2.1rem; font-weight: 700; color: #172033; margin-bottom: 4px;">Find Nearby Healthcare Facilities</h1>
            <p style="font-size: 1.02rem; color: #697586; margin-top: 0;">
                Locate verified hospitals, emergency trauma centers, specialist clinics, diagnostic laboratories, and pharmacies.
            </p>
        </div>
        """,
        unsafe_allow_html=True,
    )

    loc_tab1, loc_tab2 = st.tabs(["🔍 Search Healthcare Providers", "⭐ Saved Favorites"])

    with loc_tab1:
        # Search Filters
        col_q, col_type, col_city = st.columns([1.5, 1.0, 1.0])

        with col_q:
            query = st.text_input("Search by Name or Keyword", placeholder="e.g. AIIMS, Fortis, Lal PathLabs, blood test...", key="loc_query")

        with col_type:
            fac_type = st.selectbox(
                "Facility Type",
                options=["ALL", "HOSPITAL", "CLINIC", "LABORATORY", "PHARMACY"],
                key="loc_type"
            )

        with col_city:
            city_filter = st.selectbox(
                "City / Region",
                options=[
                    "Ludhiana (Punjab)",
                    "Chandigarh / Mohali",
                    "Jalandhar (Punjab)",
                    "Amritsar (Punjab)",
                    "Patiala (Punjab)",
                    "Delhi / NCR",
                    "Mumbai (Maharashtra)",
                    "Bengaluru (Karnataka)",
                    "All Cities",
                ],
                key="loc_city"
            )

        # Intelligent Specialty Matching
        st.markdown(
            """
            <div style="font-size: 0.85rem; color: #4B5563; font-weight: 500; margin-bottom: 4px;">
                💡 <b>Smart Specialty Finder:</b> Enter your health concern to suggest the right specialist category:
            </div>
            """,
            unsafe_allow_html=True,
        )
        c_spec1, c_spec2 = st.columns([2.5, 1.0])
        with c_spec1:
            concern_input = st.text_input("Enter your health problem or symptom", placeholder="e.g. skin rash, toothache, chest pain, blur vision...", key="loc_concern", label_visibility="collapsed")
        with c_spec2:
            spec_matches = locator.get_intelligent_specialty_matches(concern_input) if concern_input else []
            chosen_spec = spec_matches[0] if spec_matches else None
            if chosen_spec:
                st.info(f"Suggested: **{chosen_spec}**")

        # Map City Filter to Search Query
        effective_query = query
        if city_filter != "All Cities":
            city_kw = city_filter.split(" / ")[0].split(" (")[0]
            if effective_query:
                effective_query = f"{effective_query} {city_kw}"
            else:
                effective_query = city_kw

        # Coordinates for distance calculation
        CITY_COORDS = {
            "Ludhiana (Punjab)": (30.9010, 75.8573),
            "Chandigarh / Mohali": (30.7333, 76.7794),
            "Jalandhar (Punjab)": (31.3260, 75.5762),
            "Amritsar (Punjab)": (31.6340, 74.8723),
            "Patiala (Punjab)": (30.3398, 76.3869),
            "Delhi / NCR": (28.6139, 77.2090),
            "Mumbai (Maharashtra)": (19.0760, 72.8777),
            "Bengaluru (Karnataka)": (12.9716, 77.5946),
        }
        c_lat, c_lng = None, None
        active_city_label = city_filter if city_filter != "All Cities" else "Ludhiana (Punjab)"
        city_tuple = CITY_COORDS.get(active_city_label, (30.9010, 75.8573))
        use_coords = st.checkbox(
            f"📍 Calculate distances from my location ({active_city_label}: {city_tuple[0]}° N, {city_tuple[1]}° E)",
            value=True,
            key="use_location_coords"
        )
        if use_coords:
            c_lat, c_lng = city_tuple

        # Run Search
        facilities = locator.search_facilities(
            query=effective_query,
            facility_type=fac_type,
            specialty_filter=chosen_spec if concern_input else None,
            user_lat=c_lat,
            user_lng=c_lng
        )

        st.markdown(f"#### Verified Healthcare Facilities ({len(facilities)} found)")

        if not facilities:
            st.warning("No healthcare facilities matched your query. Try searching for a broader term or selecting 'All Cities'.")
        else:
            for fac in facilities:
                dist_str = f"&bull; 📍 **{fac['distance_km']} km away**" if fac.get("distance_km") is not None else ""
                emergency_tag = (
                    '<span style="background: #FEE2E2; color: #991B1B; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; border: 1px solid #F87171;">🚨 24/7 EMERGENCY DEPT</span>'
                    if fac.get("is_emergency_facility") else ""
                )

                specs = ", ".join(fac.get("specialties", []))

                st.markdown(
                    f"""
                    <div style="border: 1px solid #E6EAF0; border-radius: 8px; padding: 16px; margin-bottom: 12px; background: #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;">
                            <div>
                                <h3 style="margin: 0; color: #172033; font-size: 1.15rem;">{fac['name']}</h3>
                                <div style="font-size: 0.85rem; color: #4B5563; margin-top: 2px;">
                                    <b>{fac['facility_type']}</b> {dist_str} &bull; Rating: ⭐ {fac.get('rating', 4.5)}/5.0
                                </div>
                            </div>
                            <div style="margin-top: 4px;">
                                {emergency_tag}
                            </div>
                        </div>
                        <div style="font-size: 0.88rem; color: #374151; margin-top: 8px;">
                            📍 {fac['address']}
                        </div>
                        <div style="font-size: 0.82rem; color: #6B7280; margin-top: 4px;">
                            <b>Specialties:</b> {specs}
                        </div>
                        <div style="font-size: 0.78rem; color: #16A34A; margin-top: 4px;">
                            ● Source: {fac.get('source', 'Verified Health Registry')}
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

                # Action Buttons
                c_act1, c_act2, c_act3, _ = st.columns([1.2, 1.4, 1.2, 2.5])
                with c_act1:
                    st.markdown(f'<a href="{fac["maps_url"]}" target="_blank" style="display:inline-block; width:100%; text-align:center; background:#2563EB; color:#FFFFFF; padding:6px 12px; border-radius:6px; text-decoration:none; font-size:0.85rem; font-weight:600;">🗺 Directions</a>', unsafe_allow_html=True)
                with c_act2:
                    if fac.get("phone"):
                        st.markdown(f'<a href="tel:{fac["phone"]}" style="display:inline-block; width:100%; text-align:center; background:#F3F4F6; color:#172033; padding:6px 12px; border-radius:6px; text-decoration:none; font-size:0.85rem; font-weight:600; border:1px solid #D1D5DB;">📞 Call Facility</a>', unsafe_allow_html=True)
                with c_act3:
                    if st.button("⭐ Save", key=f"fav_{fac['id']}", use_container_width=True):
                        save_facility(
                            user_id=user_id,
                            facility_name=fac["name"],
                            facility_type=fac["facility_type"],
                            specialty=specs,
                            address=fac["address"],
                            phone=fac["phone"],
                            rating=fac.get("rating"),
                            distance_km=fac.get("distance_km"),
                            lat=fac["lat"],
                            lng=fac["lng"]
                        )
                        st.success("Saved to favorites.")

    with loc_tab2:
        saved_facs = list_saved_facilities(user_id)
        if not saved_facs:
            st.info("You haven't saved any healthcare facilities to your favorites yet. Click ⭐ Save on any provider card.")
        else:
            st.markdown(f"### ⭐ My Saved Healthcare Providers ({len(saved_facs)})")
            for sf in saved_facs:
                st.markdown(
                    f"""
                    <div style="border: 1px solid #E6EAF0; border-radius: 8px; padding: 14px; margin-bottom: 10px; background: #FFFFFF;">
                        <strong style="font-size: 1.05rem; color: #172033;">{sf['facility_name']}</strong> ({sf['facility_type']})<br>
                        <span style="font-size: 0.88rem; color: #4B5563;">{sf.get('address')}</span><br>
                        <span style="font-size: 0.85rem; color: #2563EB;">📞 {sf.get('phone') or 'Contact reception'}</span>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
                if st.button("Remove from Favorites", key=f"del_fav_{sf['id']}"):
                    delete_saved_facility(sf["id"], user_id)
                    st.success("Removed from favorites.")
                    st.rerun()
