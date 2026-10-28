"""
Mediscan AI - Medicine Verification Service
Implements a multi-tier evidence hierarchy and field-level verification:
1. Readable Packaging Evidence (OCR text)
2. Official Manufacturer Product Information
3. Reliable Indian Regulatory / Government References (CDSCO / Jan Aushadhi)
4. Reputable Pharmaceutical References
"""

import re
from typing import Dict, Any, Optional, List, Tuple
from ..schemas import FieldVerificationStatus


class VerificationService:
    @staticmethod
    def _normalize(text: Optional[str]) -> str:
        if not text:
            return ""
        clean = text.lower()
        clean = re.sub(r"[^a-z0-9.%\/]+", " ", clean)
        return re.sub(r"\s+", " ", clean).strip()

    def verify_field_level(
        self,
        extracted_data: Dict[str, Any],
        ocr_text: str,
        matched_catalog_record: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, str]:
        """
        Computes granular, field-level verification status for each key attribute.
        Distinguishes packaging-visible facts from catalogue-verified and unverified inferences.
        """
        statuses = {}
        norm_ocr = self._normalize(ocr_text)

        # 1. Brand Name Verification
        brand = extracted_data.get("brand_name")
        norm_brand = self._normalize(brand)
        if not brand:
            statuses["brand_name"] = FieldVerificationStatus.UNVERIFIED_INFERRED.value
        elif matched_catalog_record:
            cat_brand = self._normalize(matched_catalog_record.get("brand_name"))
            if norm_brand == cat_brand or (cat_brand and cat_brand in norm_brand):
                statuses["brand_name"] = FieldVerificationStatus.VERIFIED_REGULATORY.value
            elif norm_brand in norm_ocr:
                statuses["brand_name"] = FieldVerificationStatus.VISIBLE_ON_PACKAGING.value
            else:
                statuses["brand_name"] = FieldVerificationStatus.CONFLICTING.value
        elif norm_brand and norm_brand in norm_ocr:
            statuses["brand_name"] = FieldVerificationStatus.VISIBLE_ON_PACKAGING.value
        else:
            statuses["brand_name"] = FieldVerificationStatus.UNVERIFIED_INFERRED.value

        # 2. Strength Verification
        strength = extracted_data.get("strength")
        norm_str = self._normalize(strength)
        if not strength:
            statuses["strength"] = FieldVerificationStatus.UNVERIFIED_INFERRED.value
        elif matched_catalog_record:
            cat_str = self._normalize(matched_catalog_record.get("strength"))
            if cat_str and (cat_str == norm_str or cat_str in norm_str or norm_str in cat_str):
                statuses["strength"] = FieldVerificationStatus.VERIFIED_REGULATORY.value
            elif norm_str in norm_ocr or any(t in norm_ocr.split() for t in norm_str.split()):
                statuses["strength"] = FieldVerificationStatus.VISIBLE_ON_PACKAGING.value
            else:
                statuses["strength"] = FieldVerificationStatus.CONFLICTING.value
        elif norm_str and (norm_str in norm_ocr or any(t in norm_ocr.split() for t in norm_str.split())):
            statuses["strength"] = FieldVerificationStatus.VISIBLE_ON_PACKAGING.value
        else:
            statuses["strength"] = FieldVerificationStatus.UNVERIFIED_INFERRED.value

        # 3. Dosage Form Verification
        form = extracted_data.get("dosage_form")
        norm_form = self._normalize(form)
        if not form:
            statuses["dosage_form"] = FieldVerificationStatus.UNVERIFIED_INFERRED.value
        elif matched_catalog_record:
            cat_form = self._normalize(matched_catalog_record.get("dosage_form"))
            if cat_form and cat_form in norm_form:
                statuses["dosage_form"] = FieldVerificationStatus.VERIFIED_REGULATORY.value
            elif norm_form in norm_ocr:
                statuses["dosage_form"] = FieldVerificationStatus.VISIBLE_ON_PACKAGING.value
            else:
                statuses["dosage_form"] = FieldVerificationStatus.CONFLICTING.value
        elif norm_form and norm_form in norm_ocr:
            statuses["dosage_form"] = FieldVerificationStatus.VISIBLE_ON_PACKAGING.value
        else:
            statuses["dosage_form"] = FieldVerificationStatus.UNVERIFIED_INFERRED.value

        # 4. Active Ingredients Verification
        ingredients = extracted_data.get("active_ingredients", [])
        if not ingredients:
            statuses["active_ingredients"] = FieldVerificationStatus.UNVERIFIED_INFERRED.value
        elif matched_catalog_record:
            cat_salts = [self._normalize(s) for s in matched_catalog_record.get("active_ingredients", [])]
            match_count = 0
            for ing in ingredients:
                norm_ing = self._normalize(ing)
                if any(cs in norm_ing or norm_ing in cs for cs in cat_salts if cs):
                    match_count += 1
            if match_count == len(ingredients) and match_count > 0:
                statuses["active_ingredients"] = FieldVerificationStatus.VERIFIED_REGULATORY.value
            elif match_count > 0:
                statuses["active_ingredients"] = FieldVerificationStatus.VISIBLE_ON_PACKAGING.value
            else:
                statuses["active_ingredients"] = FieldVerificationStatus.UNVERIFIED_INFERRED.value
        else:
            # Check if ingredients appear in packaging text
            found = 0
            for ing in ingredients:
                norm_ing = self._normalize(ing)
                if norm_ing and norm_ing in norm_ocr:
                    found += 1
            statuses["active_ingredients"] = (
                FieldVerificationStatus.VISIBLE_ON_PACKAGING.value
                if found > 0
                else FieldVerificationStatus.UNVERIFIED_INFERRED.value
            )

        # 5. Manufacturer Verification
        mfg = extracted_data.get("manufacturer")
        norm_mfg = self._normalize(mfg)
        if not mfg:
            statuses["manufacturer"] = FieldVerificationStatus.UNVERIFIED_INFERRED.value
        elif matched_catalog_record:
            cat_mfg = self._normalize(matched_catalog_record.get("manufacturer"))
            if cat_mfg and (cat_mfg in norm_mfg or norm_mfg in cat_mfg):
                statuses["manufacturer"] = FieldVerificationStatus.VERIFIED_MANUFACTURER.value
            elif norm_mfg in norm_ocr:
                statuses["manufacturer"] = FieldVerificationStatus.VISIBLE_ON_PACKAGING.value
            else:
                statuses["manufacturer"] = FieldVerificationStatus.UNVERIFIED_INFERRED.value
        elif norm_mfg and norm_mfg in norm_ocr:
            statuses["manufacturer"] = FieldVerificationStatus.VISIBLE_ON_PACKAGING.value
        else:
            statuses["manufacturer"] = FieldVerificationStatus.UNVERIFIED_INFERRED.value

        # 6. Prescription Status Verification
        rx = extracted_data.get("prescription_status")
        if not rx or rx == "Unverified / Unknown":
            statuses["prescription_status"] = FieldVerificationStatus.UNVERIFIED_INFERRED.value
        elif matched_catalog_record:
            statuses["prescription_status"] = FieldVerificationStatus.VERIFIED_REGULATORY.value
        elif "rx" in norm_ocr or "schedule" in norm_ocr:
            statuses["prescription_status"] = FieldVerificationStatus.VISIBLE_ON_PACKAGING.value
        else:
            statuses["prescription_status"] = FieldVerificationStatus.UNVERIFIED_INFERRED.value

        return statuses

    @staticmethod
    def evaluate_catalogue_promotion_eligibility(
        field_verification: Dict[str, str], user_confirmed: bool = False
    ) -> Tuple[bool, str]:
        """
        Enforces strict safety governance:
        Never promote records into the trusted catalogue solely because a user clicked 'Correct'.
        Promotion requires regulatory or manufacturer-backed verification on critical fields.
        """
        required_fields = ["brand_name", "strength", "active_ingredients"]
        for rf in required_fields:
            status = field_verification.get(rf)
            if status not in (
                FieldVerificationStatus.VERIFIED_REGULATORY.value,
                FieldVerificationStatus.VERIFIED_MANUFACTURER.value,
            ):
                return False, f"फील्ड '{rf}' का आधिकारिक सत्यापन आवश्यक है; केवल यूज़र पुष्टि पर्याप्त नहीं है।"

        return True, "सभी महत्वपूर्ण फार्मास्युटिकल फील्ड आधिकारिक संदर्भों से सत्यापित हैं।"
