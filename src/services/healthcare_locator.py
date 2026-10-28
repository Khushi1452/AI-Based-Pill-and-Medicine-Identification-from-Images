"""
Mediscan AI - Location-Aware Healthcare Discovery Service
Finds nearby hospitals, clinics, emergency departments, diagnostic laboratories, and pharmacies.
Supports GPS coordinates, city/PIN code search, intelligent specialty matching,
and Google Maps navigation links.
"""

import math
import os
import json
import urllib.parse
from typing import Dict, Any, List, Optional
import httpx


# Comprehensive verified registry of premier Indian healthcare centers,
# trauma hospitals, emergency departments, and diagnostic networks.
VERIFIED_HEALTHCARE_REGISTRY = [
    # Delhi NCR
    {
        "id": "fac_aiims_delhi",
        "name": "AIIMS New Delhi (All India Institute of Medical Sciences)",
        "facility_type": "HOSPITAL",
        "specialties": ["Multi-Specialty", "Emergency Department", "Cardiology", "Neurology", "Oncology", "Trauma Care"],
        "address": "Sri Aurobindo Marg, Ansari Nagar, New Delhi, Delhi 110029",
        "city": "New Delhi",
        "pin_code": "110029",
        "phone": "+91 11 2658 8500",
        "emergency_phone": "112 / +91 11 2659 4405",
        "rating": 4.8,
        "is_emergency_facility": True,
        "is_open_24x7": True,
        "lat": 28.5672,
        "lng": 77.2100,
        "source": "Ministry of Health & Family Welfare (MoHFW) / CDSCO"
    },
    {
        "id": "fac_safdarjung_delhi",
        "name": "Vardhman Mahavir Medical College & Safdarjung Hospital",
        "facility_type": "HOSPITAL",
        "specialties": ["Multi-Specialty", "Emergency Department", "Burns & Trauma", "General Medicine"],
        "address": "Ring Road, opposite AIIMS, Safdarjung Enclave, New Delhi, Delhi 110029",
        "city": "New Delhi",
        "pin_code": "110029",
        "phone": "+91 11 2673 0000",
        "emergency_phone": "108 / 112",
        "rating": 4.5,
        "is_emergency_facility": True,
        "is_open_24x7": True,
        "lat": 28.5705,
        "lng": 77.2066,
        "source": "Government of India Health Registry"
    },
    {
        "id": "fac_max_saket",
        "name": "Max Super Speciality Hospital, Saket",
        "facility_type": "HOSPITAL",
        "specialties": ["Multi-Specialty", "Cardiology", "Neurology", "Orthopaedics", "Emergency Department"],
        "address": "1, 2, Press Enclave Marg, Saket Institutional Area, Saket, New Delhi, Delhi 110017",
        "city": "New Delhi",
        "pin_code": "110017",
        "phone": "+91 11 2651 5050",
        "emergency_phone": "+91 11 4055 4055",
        "rating": 4.6,
        "is_emergency_facility": True,
        "is_open_24x7": True,
        "lat": 28.5283,
        "lng": 77.2125,
        "source": "NABH Accredited Hospital Directory"
    },
    {
        "id": "fac_lalpath_delhi",
        "name": "Dr Lal PathLabs National Reference Laboratory",
        "facility_type": "LABORATORY",
        "specialties": ["Diagnostic Pathology", "Blood Tests", "Biochemistry", "Molecular Diagnostics"],
        "address": "Block E, Sector 18, Rohini, New Delhi, Delhi 110085",
        "city": "New Delhi",
        "pin_code": "110085",
        "phone": "+91 11 3988 5050",
        "emergency_phone": None,
        "rating": 4.6,
        "is_emergency_facility": False,
        "is_open_24x7": False,
        "lat": 28.7183,
        "lng": 77.1265,
        "source": "NABL Accredited Laboratory Registry"
    },
    {
        "id": "fac_apollo_delhi",
        "name": "Apollo 24|7 Pharmacy & Medical Store",
        "facility_type": "PHARMACY",
        "specialties": ["Prescription Dispensing", "Jan Aushadhi Generics", "Vaccines", "Medical Devices"],
        "address": "Main Market, Green Park, New Delhi, Delhi 110016",
        "city": "New Delhi",
        "pin_code": "110016",
        "phone": "+91 11 2686 2112",
        "emergency_phone": None,
        "rating": 4.7,
        "is_emergency_facility": False,
        "is_open_24x7": True,
        "lat": 28.5585,
        "lng": 77.2058,
        "source": "Verified Pharmacy Network"
    },

    # Chandigarh / Punjab
    {
        "id": "fac_pgimer_chd",
        "name": "PGIMER (Postgraduate Institute of Medical Education & Research)",
        "facility_type": "HOSPITAL",
        "specialties": ["Multi-Specialty", "Emergency Department", "Advanced Cardiac Centre", "Advanced Eye Centre", "Trauma Care"],
        "address": "Madhya Marg, Sector 12, Chandigarh 160012",
        "city": "Chandigarh",
        "pin_code": "160012",
        "phone": "+91 172 274 7585",
        "emergency_phone": "112 / +91 172 275 6565",
        "rating": 4.8,
        "is_emergency_facility": True,
        "is_open_24x7": True,
        "lat": 30.7645,
        "lng": 76.7766,
        "source": "Autonomous Institute / Central Health Ministry"
    },
    {
        "id": "fac_fortis_mohali",
        "name": "Fortis Hospital Mohali",
        "facility_type": "HOSPITAL",
        "specialties": ["Multi-Specialty", "Cardiology", "Orthopaedics", "Emergency Department", "Neurology"],
        "address": "Sector 62, Phase VIII, Sahibzada Ajit Singh Nagar, Mohali, Punjab 160062",
        "city": "Mohali",
        "pin_code": "160062",
        "phone": "+91 172 469 2222",
        "emergency_phone": "+91 172 506 1222",
        "rating": 4.6,
        "is_emergency_facility": True,
        "is_open_24x7": True,
        "lat": 30.7055,
        "lng": 76.7212,
        "source": "NABH Accredited Healthcare Network"
    },
    {
        "id": "fac_dmc_ludhiana",
        "name": "Dayanand Medical College & Hospital (DMCH)",
        "facility_type": "HOSPITAL",
        "specialties": ["Multi-Specialty", "Emergency Department", "Cardiology", "Trauma Center"],
        "address": "Civil Lines, Tagore Nagar, Ludhiana, Punjab 141001",
        "city": "Ludhiana",
        "pin_code": "141001",
        "phone": "+91 161 468 8888",
        "emergency_phone": "+91 161 468 7777 / 112",
        "rating": 4.7,
        "is_emergency_facility": True,
        "is_open_24x7": True,
        "lat": 30.9010,
        "lng": 75.8450,
        "source": "Punjab State Medical Directorate"
    },
    {
        "id": "fac_cmc_ludhiana",
        "name": "Christian Medical College & Hospital (CMCH)",
        "facility_type": "HOSPITAL",
        "specialties": ["Multi-Specialty", "Emergency Department", "Pediatrics", "Orthopaedics", "Cardiology"],
        "address": "Brown Road, CMC Campus, Ludhiana, Punjab 141008",
        "city": "Ludhiana",
        "pin_code": "141008",
        "phone": "+91 161 211 5000",
        "emergency_phone": "112 / +91 161 211 5112",
        "rating": 4.6,
        "is_emergency_facility": True,
        "is_open_24x7": True,
        "lat": 30.9120,
        "lng": 75.8620,
        "source": "NABH Verified Medical College"
    },
    {
        "id": "fac_sps_ludhiana",
        "name": "SPS Hospitals (Satguru Partap Singh Hospitals)",
        "facility_type": "HOSPITAL",
        "specialties": ["Multi-Specialty", "Cardiology", "Nephrology", "Emergency Department", "Oncology"],
        "address": "Sherpur Chowk, GT Road, Ludhiana, Punjab 141003",
        "city": "Ludhiana",
        "pin_code": "141003",
        "phone": "+91 161 661 7100",
        "emergency_phone": "+91 161 661 7111 / 112",
        "rating": 4.8,
        "is_emergency_facility": True,
        "is_open_24x7": True,
        "lat": 30.8931,
        "lng": 75.8829,
        "source": "JCI & NABH Certified Super Speciality Care"
    },
    {
        "id": "fac_fortis_ludhiana",
        "name": "Fortis Hospital, Ludhiana",
        "facility_type": "HOSPITAL",
        "specialties": ["Cardiology", "Emergency Medicine", "Neurology", "Orthopaedics", "Critical Care"],
        "address": "Chandigarh Road, Mundian Kalan, Ludhiana, Punjab 141015",
        "city": "Ludhiana",
        "pin_code": "141015",
        "phone": "+91 161 522 5555",
        "emergency_phone": "112 / +91 161 522 5500",
        "rating": 4.7,
        "is_emergency_facility": True,
        "is_open_24x7": True,
        "lat": 30.9174,
        "lng": 75.9255,
        "source": "NABH Accredited Multi-Speciality Hospital"
    },

    # Mumbai / Maharashtra
    {
        "id": "fac_kem_mumbai",
        "name": "King Edward Memorial (KEM) Hospital & Seth GS Medical College",
        "facility_type": "HOSPITAL",
        "specialties": ["Multi-Specialty", "Emergency Department", "Cardiology", "Trauma", "General Surgery"],
        "address": "Acharya Donde Marg, Parel, Mumbai, Maharashtra 400012",
        "city": "Mumbai",
        "pin_code": "400012",
        "phone": "+91 22 2410 7000",
        "emergency_phone": "108 / 112",
        "rating": 4.7,
        "is_emergency_facility": True,
        "is_open_24x7": True,
        "lat": 19.0028,
        "lng": 72.8427,
        "source": "BMC Public Healthcare Directory"
    },
    {
        "id": "fac_hinduja_mumbai",
        "name": "P. D. Hinduja National Hospital & Medical Research Centre",
        "facility_type": "HOSPITAL",
        "specialties": ["Multi-Specialty", "Oncology", "Cardiology", "Neurology", "Emergency Department"],
        "address": "Veer Savarkar Marg, Mahim, Mumbai, Maharashtra 400016",
        "city": "Mumbai",
        "pin_code": "400016",
        "phone": "+91 22 2445 1515",
        "emergency_phone": "+91 22 2445 2222",
        "rating": 4.8,
        "is_emergency_facility": True,
        "is_open_24x7": True,
        "lat": 19.0330,
        "lng": 72.8384,
        "source": "NABH Accredited Healthcare Registry"
    },
    {
        "id": "fac_metropolis_mumbai",
        "name": "Metropolis Healthcare Global Reference Laboratory",
        "facility_type": "LABORATORY",
        "specialties": ["Pathology", "Biochemistry", "Histopathology", "Blood Analysis"],
        "address": "Commercial Building 1A, Kohinoor Mall, Kurla West, Mumbai, Maharashtra 400070",
        "city": "Mumbai",
        "pin_code": "400070",
        "phone": "+91 22 3399 3939",
        "emergency_phone": None,
        "rating": 4.6,
        "is_emergency_facility": False,
        "is_open_24x7": False,
        "lat": 19.0688,
        "lng": 72.8890,
        "source": "NABL Accredited Laboratory Network"
    },

    # Bengaluru / Karnataka
    {
        "id": "fac_manipal_blr",
        "name": "Manipal Hospital, Old Airport Road",
        "facility_type": "HOSPITAL",
        "specialties": ["Multi-Specialty", "Emergency Department", "Cardiology", "Neurology", "Pediatrics"],
        "address": "98, HAL Old Airport Rd, Kodihalli, Bengaluru, Karnataka 560017",
        "city": "Bengaluru",
        "pin_code": "560017",
        "phone": "+91 80 2502 4444",
        "emergency_phone": "+91 80 2502 3333 / 112",
        "rating": 4.7,
        "is_emergency_facility": True,
        "is_open_24x7": True,
        "lat": 12.9592,
        "lng": 77.6496,
        "source": "NABH Accredited Hospital Network"
    },
    {
        "id": "fac_nimhans_blr",
        "name": "NIMHANS (National Institute of Mental Health & Neuro Sciences)",
        "facility_type": "HOSPITAL",
        "specialties": ["Neurology", "Neurosurgery", "Psychiatry", "Emergency Department"],
        "address": "Hosur Road, Lakkasandra, Bengaluru, Karnataka 560029",
        "city": "Bengaluru",
        "pin_code": "560029",
        "phone": "+91 80 2699 5000",
        "emergency_phone": "+91 80 2699 5200 / 112",
        "rating": 4.8,
        "is_emergency_facility": True,
        "is_open_24x7": True,
        "lat": 12.9392,
        "lng": 77.5973,
        "source": "National Institute / Ministry of Health"
    },

    # Specialized Clinics
    {
        "id": "fac_skin_delhi",
        "name": "Kaya Skin Clinic & Dermatology Care",
        "facility_type": "CLINIC",
        "specialties": ["Dermatology", "Skin Infections", "Cosmetic Dermatology"],
        "address": "M-Block Market, Greater Kailash 1, New Delhi, Delhi 110048",
        "city": "New Delhi",
        "pin_code": "110048",
        "phone": "+91 11 4163 1122",
        "emergency_phone": None,
        "rating": 4.4,
        "is_emergency_facility": False,
        "is_open_24x7": False,
        "lat": 28.5520,
        "lng": 77.2380,
        "source": "Verified Specialist Directory"
    },
    {
        "id": "fac_clove_dental",
        "name": "Clove Dental Clinic",
        "facility_type": "CLINIC",
        "specialties": ["Dentistry", "Dental Emergencies", "Oral Surgery"],
        "address": "Sector 17, Chandigarh 160017",
        "city": "Chandigarh",
        "pin_code": "160017",
        "phone": "+91 172 400 9090",
        "emergency_phone": None,
        "rating": 4.5,
        "is_emergency_facility": False,
        "is_open_24x7": False,
        "lat": 30.7398,
        "lng": 76.7827,
        "source": "Dental Healthcare Network"
    }
]


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates the great circle distance in kilometers between two points."""
    R = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


class HealthcareLocatorService:
    def __init__(self, api_key: Optional[str] = None):
        self.google_maps_key = api_key or os.getenv("GOOGLE_MAPS_API_KEY", "")

    def search_facilities(
        self,
        query: Optional[str] = None,
        facility_type: Optional[str] = None,
        specialty_filter: Optional[str] = None,
        user_lat: Optional[float] = None,
        user_lng: Optional[float] = None,
        max_distance_km: float = 50.0,
        emergency_priority: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Searches healthcare directory based on location coordinates, city query,
        facility type, or clinical specialty.
        """
        results = []
        search_term = (query or "").lower().strip()
        spec_term = (specialty_filter or "").lower().strip()

        for fac in VERIFIED_HEALTHCARE_REGISTRY:
            # Filter by facility type (HOSPITAL, CLINIC, LABORATORY, PHARMACY)
            if facility_type and facility_type != "ALL":
                if fac["facility_type"] != facility_type:
                    continue

            # Filter by specialty if requested
            if spec_term:
                fac_specs = [s.lower() for s in fac.get("specialties", [])]
                if not any(spec_term in s for s in fac_specs) and spec_term not in fac["name"].lower():
                    continue

            # Query filter (matches name, address, city, pin code)
            if search_term:
                match_name = search_term in fac["name"].lower()
                match_city = search_term in fac["city"].lower()
                match_addr = search_term in fac["address"].lower()
                match_pin = search_term in fac["pin_code"]
                match_specs = any(search_term in s.lower() for s in fac.get("specialties", []))
                if not (match_name or match_city or match_addr or match_pin or match_specs):
                    continue

            # Calculate distance if user coordinates provided
            item = dict(fac)
            if user_lat is not None and user_lng is not None:
                dist = haversine_distance_km(user_lat, user_lng, fac["lat"], fac["lng"])
                if dist > max_distance_km and not emergency_priority:
                    continue
                item["distance_km"] = dist
            else:
                item["distance_km"] = None

            # Generate Google Maps Navigation URL
            enc_addr = urllib.parse.quote(fac["address"])
            item["maps_url"] = f"https://www.google.com/maps/dir/?api=1&destination={enc_addr}"

            results.append(item)

        # Sort results: Emergency facilities first if emergency priority, then by distance or rating
        if emergency_priority:
            results.sort(key=lambda x: (not x.get("is_emergency_facility", False), x.get("distance_km") or 9999))
        elif user_lat is not None and user_lng is not None:
            results.sort(key=lambda x: x.get("distance_km") or 9999)
        else:
            results.sort(key=lambda x: x.get("rating", 0), reverse=True)

        return results

    def get_intelligent_specialty_matches(self, clinical_concern: str) -> List[str]:
        """Maps reported symptoms and health problems to relevant healthcare provider categories."""
        text = clinical_concern.lower()
        suggestions = []

        if any(w in text for w in ("tooth", "teeth", "gum", "cavity", "dental")):
            suggestions.append("Dentistry")
        if any(w in text for w in ("eye", "vision", "blur", "retina", "cataract")):
            suggestions.append("Ophthalmology")
        if any(w in text for w in ("skin", "rash", "itching", "eczema", "acne", "psoriasis")):
            suggestions.append("Dermatology")
        if any(w in text for w in ("heart", "chest pain", "palpitation", "bp", "hypertension")):
            suggestions.append("Cardiology")
        if any(w in text for w in ("bone", "joint", "fracture", "knee", "spine", "arthritis")):
            suggestions.append("Orthopaedics")
        if any(w in text for w in ("ear", "hearing", "throat", "tonsil", "sinus")):
            suggestions.append("ENT Specialist")
        if any(w in text for w in ("stomach", "gastric", "acidity", "liver", "constipation", "diarrhea")):
            suggestions.append("Gastroenterology")
        if any(w in text for w in ("nerve", "stroke", "paralysis", "seizure", "numbness", "migraine")):
            suggestions.append("Neurology")
        if any(w in text for w in ("blood test", "cbc", "urine test", "lab", "pathology")):
            suggestions.append("Diagnostic Pathology")

        if not suggestions:
            suggestions.append("General Medicine / Primary Care")

        return suggestions
