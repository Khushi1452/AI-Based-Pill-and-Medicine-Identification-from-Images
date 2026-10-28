"""
Mediscan AI - Pydantic Schemas & Data Contracts
Defines response shapes, validation rules, feedback payloads, and verification statuses.
"""

from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class FieldVerificationStatus(str, Enum):
    VERIFIED_REGULATORY = "VERIFIED_REGULATORY"
    VERIFIED_MANUFACTURER = "VERIFIED_MANUFACTURER"
    VISIBLE_ON_PACKAGING = "VISIBLE_ON_PACKAGING"
    UNVERIFIED_INFERRED = "UNVERIFIED_INFERRED"
    USER_CONFIRMED = "USER_CONFIRMED"
    CONFLICTING = "CONFLICTING"


class IdentificationRoute(str, Enum):
    ROUTE_A_CACHE = "ROUTE_A_CACHE"
    ROUTE_B_LOCAL_MATCH = "ROUTE_B_LOCAL_MATCH"
    ROUTE_C_GEMINI_FALLBACK = "ROUTE_C_GEMINI_FALLBACK"
    ROUTE_D_VERIFICATION_REQUIRED = "ROUTE_D_VERIFICATION_REQUIRED"
    ROUTE_E_UNIDENTIFIED = "ROUTE_E_UNIDENTIFIED"


from pydantic import BaseModel, Field, field_validator
import re


class HindiExplanation(BaseModel):
    dawa_ka_naam: str = Field(..., description="Medicine brand name or identification in Hindi")
    pramukh_ghatak: str = Field(..., description="Active salts / formulation components in Hindi")
    karyapranali_aur_upyog: List[str] = Field(default_factory=list, description="Common clinical uses in Hindi")
    sawdhaniyan: List[str] = Field(default_factory=list, description="Safety precautions in Hindi")
    doctor_paramarsh_sandesh: str = Field(..., description="Doctor / pharmacist advisory message in Hindi")

    @field_validator("karyapranali_aur_upyog", "sawdhaniyan", mode="before")
    @classmethod
    def ensure_list(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            parts = [s.strip() for s in re.split(r"[|\n]", v) if s.strip()]
            return parts if parts else [v.strip()]
        if isinstance(v, (list, tuple)):
            return [str(x).strip() for x in v if str(x).strip() and str(x).lower() not in ("nan", "none")]
        return []


class CandidateMatch(BaseModel):
    product_id: str
    brand_name: str
    generic_name: Optional[str] = None
    strength: Optional[str] = None
    dosage_form: Optional[str] = None
    similarity_score: float = 0.0


class MedicineData(BaseModel):
    brand_name: Optional[str] = None
    generic_name: Optional[str] = None
    strength: Optional[str] = None
    dosage_form: Optional[str] = None
    active_ingredients: List[str] = Field(default_factory=list)
    manufacturer: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None
    therapeutic_class: Optional[str] = None
    prescription_status: Optional[str] = None
    is_prescription_required: Optional[bool] = None
    common_uses: List[str] = Field(default_factory=list)
    precautions: List[str] = Field(default_factory=list)
    hindi_response: HindiExplanation
    disclaimer_hindi: str

    @field_validator("active_ingredients", "common_uses", "precautions", mode="before")
    @classmethod
    def ensure_list(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            parts = [s.strip() for s in re.split(r"[;|\n]", v) if s.strip()]
            return parts if parts else [v.strip()]
        if isinstance(v, (list, tuple)):
            return [str(x).strip() for x in v if str(x).strip() and str(x).lower() not in ("nan", "none")]
        return []


class IdentificationResult(BaseModel):
    analysis_id: str
    image_hash: str
    is_identified: bool
    confidence_score: float
    identification_method: IdentificationRoute
    decision_reason: Optional[str] = None
    data: MedicineData
    field_verification_status: Dict[str, str] = Field(default_factory=dict)
    packaging_evidence: Dict[str, Any] = Field(default_factory=dict)
    exact_visible_text: Optional[str] = None
    ocr_text: Optional[str] = None
    candidate_matches: List[CandidateMatch] = Field(default_factory=list)
    gemini_used: bool = False
    gemini_tokens: Dict[str, int] = Field(
        default_factory=lambda: {"prompt_tokens": 0, "candidate_tokens": 0, "total_tokens": 0}
    )
    processing_duration_ms: float = 0.0
    created_at: str


class FeedbackSubmission(BaseModel):
    analysis_id: str
    feedback_type: str  # "CORRECT" or "INCORRECT"
    field_feedback: Dict[str, bool] = Field(default_factory=dict)
    proposed_corrections: Dict[str, Any] = Field(default_factory=dict)
    user_notes: Optional[str] = None


class FeedbackRecord(BaseModel):
    id: str
    analysis_id: str
    feedback_type: str
    field_feedback: Dict[str, bool]
    proposed_corrections: Dict[str, Any]
    review_status: str = "PENDING"
    reviewed_by: Optional[str] = None
    created_at: str
    updated_at: str


class MedicineCatalogueItem(BaseModel):
    id: Optional[int] = None
    product_id: str
    brand_name: str
    generic_name: Optional[str] = None
    active_ingredients: Optional[str] = None
    strength: Optional[str] = None
    dosage_form: Optional[str] = None
    manufacturer: Optional[str] = None
    therapeutic_class: Optional[str] = None
    common_uses: Optional[str] = None
    precautions: Optional[str] = None
    prescription_status: Optional[str] = "Prescription"
    source_name: Optional[str] = "CDSCO / Jan Aushadhi"
    source_url: Optional[str] = None
    verification_status: str = "VERIFIED_REGULATORY"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
