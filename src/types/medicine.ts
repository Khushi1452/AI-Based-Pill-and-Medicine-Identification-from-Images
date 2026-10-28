export type LanguageMode = 'en' | 'hinglish' | 'hi';

export type FoodRelation = 'BEFORE_FOOD' | 'AFTER_FOOD' | 'WITH_OR_WITHOUT_FOOD';

export interface MedicineScheduleInfo {
  morning: boolean;
  morning_time?: string;
  afternoon: boolean;
  afternoon_time?: string;
  evening: boolean;
  evening_time?: string;
  bedtime?: boolean;
  frequency_summary: string;
  food_relation: FoodRelation;
  food_instruction: string;
  how_to_take: string;
}

export interface MedicineBenefitItem {
  title: string;
  description: string;
  badge?: string;
}

export interface HindiResponse {
  dawa_ka_naam: string;
  pramukh_ghatak: string;
  karyapranali_aur_upyog: string[];
  sawdhaniyan: string[];
  doctor_paramarsh_sandesh: string;
  kaise_lein?: string;
  kab_lein?: MedicineScheduleInfo;
  laabh_aur_fayde?: MedicineBenefitItem[];
}

export interface EnglishResponse {
  medicine_name: string;
  active_ingredients: string;
  uses_and_indications: string[];
  precautions: string[];
  doctor_pharmacist_advice: string;
  how_to_take?: string;
  schedule?: MedicineScheduleInfo;
  benefits?: MedicineBenefitItem[];
}

export interface HinglishResponse {
  dawa_ka_naam: string;
  pramukh_ghatak: string;
  karyapranali_aur_upyog: string[];
  sawdhaniyan: string[];
  doctor_paramarsh_sandesh: string;
  kaise_lein?: string;
  schedule?: MedicineScheduleInfo;
  benefits?: MedicineBenefitItem[];
}

export interface PackagingEvidence {
  manufacturer?: string | null;
  detected_strengths?: string[];
  dosage_form_detected?: string | null;
  red_box_detected?: boolean;
  orientation_angle?: number;
  ocr_text_excerpt?: string;
  has_identifying_substance?: boolean;
}

export interface MedicineData {
  brand_name: string | null;
  dosage_form: string | null;
  strength: string | null;
  active_salts: string[];
  therapeutic_class: string | null;
  is_prescription_required: boolean | null;
  schedule?: MedicineScheduleInfo;
  benefits?: MedicineBenefitItem[];
  hindi_response: HindiResponse;
  english_response?: EnglishResponse;
  hinglish_response?: HinglishResponse;
  packaging_evidence?: PackagingEvidence;
  disclaimer_hindi: string;
  disclaimer_english?: string;
  disclaimer_hinglish?: string;
}

export interface MedicineAnalysisResponse {
  is_identified: boolean;
  confidence_score: number;
  unclear_reason: string | null;
  unclear_reason_en?: string | null;
  unclear_reason_hinglish?: string | null;
  data: MedicineData;
}

export interface CatalogVariant {
  id: string;
  brandFamily: string;
  productLine: string;
  dosageForm: string | null;
  strength: string | null;
  packSize: string | null;
  datasetSource: 'SET1' | 'SET2';
  therapeuticClass: string;
  inferredSalts: string[];
  isPrescriptionRequired: boolean | null;
  hindiIndications: string[];
  hindiPrecautions: string[];
}

export interface CatalogStats {
  totalProductVariants: number;
  totalBrandFamilies: number;
  set1Variants: number;
  set2Variants: number;
  dosageFormCounts: Record<string, number>;
  therapeuticSectionCounts: Record<string, number>;
  customCalibrationsCount: number;
}

export interface AnalyzeApiEnvelope {
  result: MedicineAnalysisResponse;
  rawJsonString: string;
  catalogMatches: CatalogVariant[];
  groundingMethod:
    | 'two_pass_vision_rag'
    | 'deterministic_kb_assisted'
    | 'local_ai_verified'
    | 'cached_prediction'
    | 'local_ai_rejection';
  validationChecks: {
    validJson: boolean;
    allRequiredKeys: boolean;
    disclaimerPresent: boolean;
    advisoryPresent: boolean;
    nullSafetyCompliant: boolean;
  };
  diagnostics?: {
    isCacheHit?: boolean;
    tokenUsage?: {
      promptTokens: number;
      candidatesTokens: number;
      totalTokens: number;
    };
    timingsMs?: Record<string, number>;
    localModelDecision?: string;
  };
}

export interface CalibrationRule {
  id: string;
  brandPattern: string;
  dosageForm: string;
  strength: string;
  activeSalts: string[];
  therapeuticClass: string;
  isPrescriptionRequired: boolean;
  hindiNote: string;
  createdAt: string;
}

export interface BenchmarkCaseResult {
  caseId: string;
  name: string;
  expectedIdentified: boolean;
  actualIdentified: boolean;
  expectedBrand: string | null;
  actualBrand: string | null;
  expectedStrength: string | null;
  actualStrength: string | null;
  expectedRx: boolean | null;
  actualRx: boolean | null;
  schemaValid: boolean;
  hindiCompliant: boolean;
  passed: boolean;
  confidenceScore: number;
  latencyMs: number;
  outputJson: MedicineAnalysisResponse;
}

export interface BenchmarkSuiteReport {
  timestamp: string;
  totalCases: number;
  passedCases: number;
  accuracyPercent: number;
  results: BenchmarkCaseResult[];
}
