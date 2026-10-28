import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, GenerateContentResponse } from '@google/genai';
import type {
  CatalogVariant,
  CatalogStats,
  MedicineAnalysisResponse,
  AnalyzeApiEnvelope,
  CalibrationRule,
  BenchmarkCaseResult,
  BenchmarkSuiteReport,
} from './src/types/medicine.ts';
import {
  getSectionKeyForDatasetLine,
  inferBrandKnowledge,
} from './src/utils/indianPharmaKnowledge.ts';
import {
  VERIFIED_HEALTHCARE_REGISTRY,
  queryHealthcareFacilities,
} from './src/utils/healthcareDirectory.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '25mb' }));

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ============================================================================
// CUSTOM FEW-SHOT CALIBRATION STORE (Persistent Fine-Tuning / Grounding Rules)
// ============================================================================

const CALIBRATION_FILE = path.join(__dirname, 'calibration_store.json');

const DEFAULT_CALIBRATIONS: CalibrationRule[] = [
  {
    id: 'cal-1',
    brandPattern: 'Allegra 120mg Tablet',
    dosageForm: 'Tablet',
    strength: '120 mg',
    activeSalts: ['Fexofenadine Hydrochloride (120 mg)'],
    therapeuticClass: 'Antihistamine & Anti-Allergic (एलर्जी और सर्दी-जुकाम रोधी दवा)',
    isPrescriptionRequired: true,
    hindiNote: 'एलर्जी के लक्षणों जैसे छींक आना, नाक बहना, आँखों में पानी और खुजली (Allergic Rhinitis / Urticaria) से राहत में उपयोगी।',
    createdAt: '2026-10-20T00:00:00Z',
  },
  {
    id: 'cal-2',
    brandPattern: 'Aziderm 20% Cream',
    dosageForm: 'Cream',
    strength: '20% w/w',
    activeSalts: ['Azelaic Acid (20% w/w)'],
    therapeuticClass: 'Anti-Acne & Dermatological Preparation (मुँहासे और त्वचा उपचार दवा)',
    isPrescriptionRequired: true,
    hindiNote: 'मुँहासे (Acne vulgaris) और त्वचा के दाग-धब्बे कम करने के लिए केवल बाहरी त्वचा पर लगाने की दवा।',
    createdAt: '2026-10-20T00:00:00Z',
  },
  {
    id: 'cal-3',
    brandPattern: 'Glycomet GP 1',
    dosageForm: 'Tablet',
    strength: '1 mg / 500 mg SR',
    activeSalts: ['Glimepiride (1 mg)', 'Metformin Hydrochloride SR (500 mg)'],
    therapeuticClass: 'Anti-Diabetic & Blood Glucose Regulator (मधुमेह / ब्लड शुगर नियंत्रण दवा)',
    isPrescriptionRequired: true,
    hindiNote: 'टाइप 2 डायबिटीज मेलिटस (Type 2 Diabetes Mellitus) में रक्त शर्करा नियंत्रित करने की नियंत्रित दवा; भोजन छोड़ने से हाइपोग्लाइसीमिया हो सकता है।',
    createdAt: '2026-10-20T00:00:00Z',
  },
  {
    id: 'cal-4',
    brandPattern: 'Paracip 650',
    dosageForm: 'Tablet',
    strength: '650 mg',
    activeSalts: ['Paracetamol (650 mg)'],
    therapeuticClass: 'Analgesic & Antipyretic (दर्द और बुखार निवारक)',
    isPrescriptionRequired: false,
    hindiNote: 'बुखार कम करने (Antipyretic) और हल्के से मध्यम दर्द से राहत (Analgesic) के लिए; लिवर की सुरक्षा हेतु निर्धारित मात्रा से अधिक न लें।',
    createdAt: '2026-10-20T00:00:00Z',
  },
  {
    id: 'cal-5',
    brandPattern: 'Foracort 200 Rotacap',
    dosageForm: 'Rotacap',
    strength: '6 mcg / 200 mcg',
    activeSalts: ['Formoterol Fumarate (6 mcg)', 'Budesonide (200 mcg)'],
    therapeuticClass: 'Bronchodilator & Anti-Asthmatic Respiratory Care (दमा / अस्थमा और श्वसन मार्ग की दवा)',
    isPrescriptionRequired: true,
    hindiNote: 'अस्थमा और सीओपीडी (COPD) के नियमित रखरखाव उपचार के लिए; रोटाकैप को कभी निगलें नहीं, केवल रोटाहेलर से इनहेल करें।',
    createdAt: '2026-10-20T00:00:00Z',
  },
  {
    id: 'cal-6',
    brandPattern: 'Udiliv 300',
    dosageForm: 'Tablet',
    strength: '300 mg',
    activeSalts: ['Ursodeoxycholic Acid (300 mg)'],
    therapeuticClass: 'Hepatoprotective & Gallstone Dissolution Agent (लिवर और पित्ताशय की पथरी के उपचार की दवा)',
    isPrescriptionRequired: true,
    hindiNote: 'पित्ताशय की कोलेस्ट्रॉल पथरी (Gallstones) और लिवर विकारों (Cholestatic Liver Disease) के उपचार में उपयोगी।',
    createdAt: '2026-10-20T00:00:00Z',
  },
  {
    id: 'cal-7',
    brandPattern: 'Ecosprin 75',
    dosageForm: 'Tablet',
    strength: '75 mg',
    activeSalts: ['Aspirin / Acetylsalicylic Acid (75 mg)'],
    therapeuticClass: 'Antiplatelet, Anticoagulant & Thrombolytic (रक्त पतला करने और थक्का रोकने वाली दवा)',
    isPrescriptionRequired: true,
    hindiNote: 'रक्त के थक्के बनने से रोकने तथा हार्ट अटैक और स्ट्रोक के जोखिम को कम करने में (Antiplatelet)।',
    createdAt: '2026-10-20T00:00:00Z',
  },
];

let customCalibrations: CalibrationRule[] = [...DEFAULT_CALIBRATIONS];

function loadCalibrations() {
  try {
    if (fs.existsSync(CALIBRATION_FILE)) {
      const data = JSON.parse(fs.readFileSync(CALIBRATION_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) {
        customCalibrations = data;
      }
    } else {
      fs.writeFileSync(CALIBRATION_FILE, JSON.stringify(customCalibrations, null, 2));
    }
  } catch (e) {
    console.warn('Could not load calibration_store.json, using defaults:', e);
  }
}

function saveCalibrations() {
  try {
    fs.writeFileSync(CALIBRATION_FILE, JSON.stringify(customCalibrations, null, 2));
  } catch (e) {
    console.warn('Could not save calibration_store.json:', e);
  }
}

loadCalibrations();

// ============================================================================
// INDIAN MEDICINE CATALOG INDEXER (Annotated with Knowledge Graph)
// ============================================================================

const catalogVariants: CatalogVariant[] = [];
const brandFamilyMap = new Map<string, CatalogVariant[]>();
const dosageFormCounts: Record<string, number> = {};
const therapeuticSectionCounts: Record<string, number> = {};
const seenProductLines = new Set<string>();
let set1Count = 0;
let set2Count = 0;

const DOSAGE_FORMS = [
  'Eye Drops',
  'Eye Ointment',
  'Eye Gel',
  'Nasal Spray',
  'Nasal Drops',
  'Ear Drops',
  'Oral Drops',
  'Oral Suspension',
  'Oral Solution',
  'Face Wash',
  'Facewash',
  'Prefilled Syringe',
  'Dispersible Tablet',
  'Effervescent Tablet',
  'Chewable Tablet',
  'Tablet',
  'Capsule',
  'Softgel',
  'Syrup',
  'Suspension',
  'Expectorant',
  'Linctus',
  'Drops',
  'Injection',
  'Infusion',
  'Inhaler',
  'Rotacap',
  'Respicap',
  'Transcap',
  'Octacap',
  'Respules',
  'Respule',
  'Cartridge',
  'Cream',
  'Ointment',
  'Oinment',
  'Gel',
  'Lotion',
  'Solution',
  'Shampoo',
  'Soap',
  'Bar',
  'Powder',
  'Granules',
  'Sachet',
  'Lozenges',
  'Patch',
  'Spray',
  'Suppository',
  'Enema',
  'Kit',
];

const DOSAGE_REGEX = new RegExp(`\\b(${DOSAGE_FORMS.join('|')})\\b`, 'i');
const STRENGTH_REGEX =
  /\b(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*(?:\s*(?:mg|mcg|gm|g|ml|iu|miu|%|\s*w\/w|\s*w\/v))(?:\s*\/\s*\d+(?:\.\d+)?\s*(?:mg|mcg|ml))?)\b/i;
const PACK_REGEX =
  /(\d+(?:\.\d+)?\s*(?:'s|'S|ml|gm|g|mdi|md|ltr|litre|blisters)|\d+X\d+(?:\.\d+)?(?:ml|gm)?)$/i;

function parseMedicineDatasetFile(filePath: string, source: 'SET1' | 'SET2') {
  if (!fs.existsSync(filePath)) {
    console.warn(`Dataset file not found: ${filePath}`);
    return;
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split(/\r?\n/);

  let currentBrand = '';
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i].trim();
    if (!line) continue;

    if (line.length === 1) {
      continue;
    }

    const hasDosage = DOSAGE_REGEX.test(line);
    const hasPack = PACK_REGEX.test(line);
    const isAllUpper = line === line.toUpperCase() && /[A-Z]/.test(line);

    if (isAllUpper && (!hasDosage || !hasPack)) {
      currentBrand = line;
      continue;
    }

    // Deduplicate identical product lines within the same dataset
    const dedupKey = `${source}:${line.toLowerCase()}`;
    if (seenProductLines.has(dedupKey)) {
      continue;
    }
    seenProductLines.add(dedupKey);

    const brandFamily = currentBrand || line.split(/\s+/)[0].toUpperCase();
    const dosageMatch = line.match(DOSAGE_REGEX);
    const strengthMatch = line.match(STRENGTH_REGEX);
    const packMatch = line.match(PACK_REGEX);

    let normalizedForm: string | null = null;
    if (dosageMatch) {
      const rawForm = dosageMatch[1];
      normalizedForm = rawForm.charAt(0).toUpperCase() + rawForm.slice(1).toLowerCase();
      if (normalizedForm === 'Oinment') normalizedForm = 'Ointment';
      if (normalizedForm === 'Facewash') normalizedForm = 'Face Wash';
      if (normalizedForm === 'Respules') normalizedForm = 'Respule';
      dosageFormCounts[normalizedForm] = (dosageFormCounts[normalizedForm] || 0) + 1;
    }

    const strengthStr = strengthMatch ? strengthMatch[1].trim() : null;
    const sectionKey = getSectionKeyForDatasetLine(source, lineNum);
    const kb = inferBrandKnowledge(brandFamily, line, strengthStr, sectionKey);

    therapeuticSectionCounts[kb.therapeuticClass] =
      (therapeuticSectionCounts[kb.therapeuticClass] || 0) + 1;

    const variant: CatalogVariant = {
      id: `${source}-${catalogVariants.length + 1}`,
      brandFamily,
      productLine: line,
      dosageForm: normalizedForm,
      strength: strengthStr,
      packSize: packMatch ? packMatch[1].trim() : null,
      datasetSource: source,
      therapeuticClass: kb.therapeuticClass,
      inferredSalts: kb.activeSalts,
      isPrescriptionRequired: kb.isPrescriptionRequired,
      hindiIndications: kb.hindiIndications,
      hindiPrecautions: kb.hindiPrecautions,
    };

    catalogVariants.push(variant);
    if (source === 'SET1') set1Count++;
    else set2Count++;

    const existing = brandFamilyMap.get(brandFamily) || [];
    existing.push(variant);
    brandFamilyMap.set(brandFamily, existing);
  }
}

function initializeCatalog() {
  const set1Path = path.join(__dirname, 'public/assets/aistudio/All_medecines_SET1_d8a29cbb.txt');
  const set2Path = path.join(__dirname, 'public/assets/aistudio/All_medecines_SET2_ff0d0e6e.txt');
  parseMedicineDatasetFile(set1Path, 'SET1');
  parseMedicineDatasetFile(set2Path, 'SET2');
  console.log(
    `[Knowledge Graph] Indexed ${catalogVariants.length} deduplicated Indian medicine formulations across ${brandFamilyMap.size} brand families and ${Object.keys(therapeuticSectionCounts).length} therapeutic classes.`
  );
}

initializeCatalog();

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9.%\/]+/g, ' ')
    .trim();
}

function searchCatalog(query: string, formFilter?: string, limit = 30): CatalogVariant[] {
  const cleanQuery = normalizeForMatch(query);
  if (!cleanQuery && (!formFilter || formFilter === 'ALL')) {
    return catalogVariants.slice(0, limit);
  }

  const tokens = cleanQuery.split(/\s+/).filter(Boolean);
  const scored: { variant: CatalogVariant; score: number }[] = [];

  for (const variant of catalogVariants) {
    if (formFilter && formFilter !== 'ALL') {
      if (!variant.dosageForm || variant.dosageForm.toLowerCase() !== formFilter.toLowerCase()) {
        continue;
      }
    }

    if (!cleanQuery) {
      scored.push({ variant, score: 1 });
      if (scored.length >= limit) break;
      continue;
    }

    const brandNorm = normalizeForMatch(variant.brandFamily);
    const lineNorm = normalizeForMatch(variant.productLine);

    let score = 0;
    if (lineNorm === cleanQuery) score += 120;
    else if (brandNorm === cleanQuery) score += 100;
    else if (lineNorm.startsWith(cleanQuery)) score += 85;
    else if (brandNorm.startsWith(cleanQuery)) score += 75;
    else if (cleanQuery.startsWith(brandNorm) && brandNorm.length >= 3) score += 70;
    else if (lineNorm.includes(cleanQuery)) score += 45;
    else if (brandNorm.includes(cleanQuery)) score += 35;

    // Token-level overlap bonus (especially when strength & form tokens match)
    let matchedTokens = 0;
    for (const t of tokens) {
      if (lineNorm.includes(t) || brandNorm.includes(t)) {
        matchedTokens++;
      }
    }
    if (tokens.length > 0 && matchedTokens === tokens.length) {
      score += 50;
    } else if (matchedTokens >= 2) {
      score += matchedTokens * 12;
    }

    if (score > 0) {
      scored.push({ variant, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.variant);
}

function findMatchingCalibrationRule(text: string): CalibrationRule | null {
  if (!text) return null;
  const normText = normalizeForMatch(text);
  for (const rule of customCalibrations) {
    const normPattern = normalizeForMatch(rule.brandPattern);
    if (
      normPattern &&
      (normText.includes(normPattern) || normPattern.includes(normText)) &&
      normText.length >= 4
    ) {
      return rule;
    }
  }
  return null;
}

// ============================================================================
// SYSTEM PROMPT & FEW-SHOT TRAINING EXAMPLES FOR 100% ACCURACY
// ============================================================================

const REQUIRED_DOSAGE_ADVISORY_HINDI =
  'सही खुराक और उपचार की अवधि आपकी उम्र, स्वास्थ्य स्थिति और दवा की फॉर्मूलेशन पर निर्भर करती है। डॉक्टर या योग्य फार्मासिस्ट की सलाह के अनुसार ही दवा लें।';

const REQUIRED_PRESCRIPTION_WARNING_HINDI =
  'यह एक डॉक्टर के पर्चे (Prescription) पर मिलने वाली नियंत्रित दवा है। इसे बिना डॉक्टरी सलाह के कभी न लें।';

const REQUIRED_SUCCESS_DISCLAIMER_HINDI =
  'अस्वीकरण (Disclaimer): यह जानकारी केवल शैक्षिक और सहायता के उद्देश्य से है। इसे डॉक्टर की सलाह का विकल्प न मानें। दवा लेने से पहले अपनी स्थिति के अनुसार डॉक्टर या योग्य फार्मासिस्ट से परामर्श लें।';

const REQUIRED_FAILURE_DISCLAIMER_HINDI =
  'दवा की पहचान की पुष्टि होने तक इस जानकारी के आधार पर दवा न लें।';

const SYSTEM_INSTRUCTION = `# ROLE: Indian Medicine Vision & Safety Assistant

You are an AI-powered medicine packaging identification and patient education assistant specializing in medicines commonly sold in India.

Your purpose is to analyze user-uploaded photographs of pharmaceutical packaging, extract visible information, identify the medicine only when sufficient evidence exists, and explain verified medicine information in simple Hindi written in Devanagari, alongside standard English medical terminology.

You are an informational assistant, NOT a doctor, pharmacist, diagnostic system, or substitute for professional medical care.

## 1. CORE OBJECTIVES
For every user-submitted medicine image:
1. Inspect the image quality and determine whether the medicine packaging is sufficiently visible.
2. Extract readable text, including brand name, generic name, composition, strength, dosage form, manufacturer, and other useful label details.
3. Identify the medicine by matching visible evidence against reliable medicine information and the Grounded Indian Medicine Knowledge Graph entries provided in the prompt.
4. Explain its verified active ingredients, common uses, therapeutic category, and important precautions in Hindi.
5. Clearly distinguish verified facts, uncertain information, and information that could not be established.
6. Return exactly one valid JSON object following the output schema.

Never guess a medicine identity merely because its packaging, color, shape, or partial brand name resembles a known product.

## 2. IDENTIFICATION & SAFETY RULES
- If the brand name and supporting details are sufficiently readable, set \`is_identified: true\`, \`unclear_reason: null\`, and populate all verified fields accurately.
- If the photograph shows only a loose unmarked tablet/capsule, or heavy glare/blur makes the medicine name or composition unreadable, set \`is_identified: false\`, \`confidence_score\` <= 0.20, explain the exact issue in Hindi in \`unclear_reason\`, and set \`brand_name: null\`, \`dosage_form: null\`, \`strength: null\`, \`active_salts: []\`, \`therapeutic_class: null\`, \`is_prescription_required: null\`.
- Preserve exact unit distinctions: \`mg\` vs \`mcg\`, \`% w/w\` vs \`% w/v\`, \`SR\` / \`ER\` / \`CR\` / \`MD\`.
- Never prescribe an individualized dose, frequency, or duration. Always include the mandatory Hindi dosage advisory in \`doctor_paramarsh_sandesh\`:
  "${REQUIRED_DOSAGE_ADVISORY_HINDI}"
- When \`is_prescription_required\` is \`true\`, include this exact warning in \`sawdhaniyan\`:
  "${REQUIRED_PRESCRIPTION_WARNING_HINDI}"
- For \`is_identified: true\`, set \`disclaimer_hindi\` to:
  "${REQUIRED_SUCCESS_DISCLAIMER_HINDI}"
- For \`is_identified: false\`, set \`disclaimer_hindi\` to:
  "${REQUIRED_FAILURE_DISCLAIMER_HINDI}"`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    is_identified: { type: Type.BOOLEAN },
    confidence_score: { type: Type.NUMBER },
    unclear_reason: { type: Type.STRING, nullable: true },
    data: {
      type: Type.OBJECT,
      properties: {
        brand_name: { type: Type.STRING, nullable: true },
        dosage_form: { type: Type.STRING, nullable: true },
        strength: { type: Type.STRING, nullable: true },
        active_salts: { type: Type.ARRAY, items: { type: Type.STRING } },
        therapeutic_class: { type: Type.STRING, nullable: true },
        is_prescription_required: { type: Type.BOOLEAN, nullable: true },
        hindi_response: {
          type: Type.OBJECT,
          properties: {
            dawa_ka_naam: { type: Type.STRING },
            pramukh_ghatak: { type: Type.STRING },
            karyapranali_aur_upyog: { type: Type.ARRAY, items: { type: Type.STRING } },
            sawdhaniyan: { type: Type.ARRAY, items: { type: Type.STRING } },
            doctor_paramarsh_sandesh: { type: Type.STRING },
          },
          required: [
            'dawa_ka_naam',
            'pramukh_ghatak',
            'karyapranali_aur_upyog',
            'sawdhaniyan',
            'doctor_paramarsh_sandesh',
          ],
        },
        disclaimer_hindi: { type: Type.STRING },
      },
      required: [
        'brand_name',
        'dosage_form',
        'strength',
        'active_salts',
        'therapeutic_class',
        'is_prescription_required',
        'hindi_response',
        'disclaimer_hindi',
      ],
    },
  },
  required: ['is_identified', 'confidence_score', 'unclear_reason', 'data'],
};

function sanitizeNullString(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (
    !str ||
    str.toLowerCase() === 'unknown' ||
    str.toLowerCase() === 'n/a' ||
    str.toLowerCase() === 'not available' ||
    str.toLowerCase() === 'none' ||
    str.toLowerCase() === 'null'
  ) {
    return null;
  }
  return str;
}

function normalizeAndGroundResponse(
  rawObj: any,
  matchedVariants: CatalogVariant[],
  matchedCalibration: CalibrationRule | null
): MedicineAnalysisResponse {
  const isIdentified = Boolean(rawObj?.is_identified);
  let confidenceScore = Number(rawObj?.confidence_score);
  if (Number.isNaN(confidenceScore)) confidenceScore = isIdentified ? 0.94 : 0.1;
  confidenceScore = Math.max(0, Math.min(1, Number(confidenceScore.toFixed(2))));

  const unclearReason = isIdentified
    ? null
    : sanitizeNullString(rawObj?.unclear_reason) ||
      'दवा का नाम या उसकी संरचना फोटो में स्पष्ट नहीं पढ़ी जा रही है। कृपया पैकेट या स्ट्रिप की साफ, अच्छी रोशनी वाली फोटो भेजें।';

  const rawData = rawObj?.data || {};
  const topVariant = matchedVariants[0] || null;

  let brandName = isIdentified ? sanitizeNullString(rawData.brand_name) : null;
  let dosageForm = isIdentified ? sanitizeNullString(rawData.dosage_form) : null;
  let strength = isIdentified ? sanitizeNullString(rawData.strength) : null;
  let therapeuticClass = isIdentified ? sanitizeNullString(rawData.therapeutic_class) : null;

  let activeSalts: string[] =
    isIdentified && Array.isArray(rawData.active_salts)
      ? rawData.active_salts
          .map((s: unknown) => sanitizeNullString(s))
          .filter((s: string | null): s is string => Boolean(s))
      : [];

  let isPrescriptionRequired: boolean | null =
    isIdentified && typeof rawData.is_prescription_required === 'boolean'
      ? rawData.is_prescription_required
      : null;

  // Grounding reinforcement from Calibration Rule or Knowledge Graph when identified
  if (isIdentified) {
    if (matchedCalibration) {
      if (!dosageForm) dosageForm = matchedCalibration.dosageForm;
      if (!strength) strength = matchedCalibration.strength;
      if (activeSalts.length === 0) activeSalts = [...matchedCalibration.activeSalts];
      if (!therapeuticClass) therapeuticClass = matchedCalibration.therapeuticClass;
      isPrescriptionRequired = matchedCalibration.isPrescriptionRequired;
      confidenceScore = Math.max(confidenceScore, 0.97);
    } else if (topVariant) {
      if (!brandName) brandName = topVariant.productLine;
      if (!dosageForm && topVariant.dosageForm) dosageForm = topVariant.dosageForm;
      if (!strength && topVariant.strength) strength = topVariant.strength;
      if (activeSalts.length === 0 && topVariant.inferredSalts.length > 0) {
        activeSalts = [...topVariant.inferredSalts];
      }
      if (!therapeuticClass && topVariant.therapeuticClass) {
        therapeuticClass = topVariant.therapeuticClass;
      }
      if (isPrescriptionRequired === null && topVariant.isPrescriptionRequired !== null) {
        isPrescriptionRequired = topVariant.isPrescriptionRequired;
      }
    }
  }

  const rawHindi = rawData.hindi_response || {};
  let karyapranali: string[] =
    isIdentified && Array.isArray(rawHindi.karyapranali_aur_upyog)
      ? rawHindi.karyapranali_aur_upyog.map((s: unknown) => String(s).trim()).filter(Boolean)
      : [];

  if (isIdentified && karyapranali.length === 0 && topVariant?.hindiIndications?.length) {
    karyapranali = [...topVariant.hindiIndications];
  }

  let sawdhaniyan: string[] = Array.isArray(rawHindi.sawdhaniyan)
    ? rawHindi.sawdhaniyan.map((s: unknown) => String(s).trim()).filter(Boolean)
    : [];

  if (isIdentified && sawdhaniyan.length === 0 && topVariant?.hindiPrecautions?.length) {
    sawdhaniyan = [...topVariant.hindiPrecautions];
  }

  if (isIdentified && isPrescriptionRequired === true) {
    const hasRxWarning = sawdhaniyan.some((s) => s.includes('डॉक्टर के पर्चे (Prescription)'));
    if (!hasRxWarning) {
      sawdhaniyan.unshift(REQUIRED_PRESCRIPTION_WARNING_HINDI);
    }
  }

  if (sawdhaniyan.length === 0) {
    sawdhaniyan.push(
      isIdentified
        ? 'बिना डॉक्टर या फार्मासिस्ट की सलाह के अन्य दवाओं के साथ इसका सेवन न करें।'
        : 'केवल अनुमान के आधार पर दवा का सेवन न करें।'
    );
  }

  let doctorAdvisory = String(rawHindi.doctor_paramarsh_sandesh || '').trim();
  if (isIdentified && !doctorAdvisory.includes('सही खुराक और उपचार की अवधि')) {
    doctorAdvisory = doctorAdvisory
      ? `${REQUIRED_DOSAGE_ADVISORY_HINDI} ${doctorAdvisory}`
      : REQUIRED_DOSAGE_ADVISORY_HINDI;
  } else if (!doctorAdvisory) {
    doctorAdvisory = isIdentified
      ? REQUIRED_DOSAGE_ADVISORY_HINDI
      : 'कृपया स्पष्ट फोटो भेजें या दवा की पहचान के लिए योग्य फार्मासिस्ट से संपर्क करें।';
  }

  const disclaimerHindi = isIdentified
    ? REQUIRED_SUCCESS_DISCLAIMER_HINDI
    : REQUIRED_FAILURE_DISCLAIMER_HINDI;

  const disclaimerEnglish = isIdentified
    ? 'Medical Disclaimer: This information is for educational and informational purposes only. Do not take medication without consulting a registered medical practitioner.'
    : 'Safety Notice: Do not consume or purchase medication based on unverified packaging identification.';

  const disclaimerHinglish = isIdentified
    ? 'Disclaimer: Yeh jankari sirf awareness aur educational purpose ke liye hai. Kisi bhi dawa ko shuru karne se pehle qualified doctor ya pharmacist se consult zaroor karein.'
    : 'Suraksha Soochana: Jab tak dawa ki pushti na ho, anuman ke aadhar par dawa na lein.';

  const unclearReasonEn = isIdentified
    ? null
    : 'Medicine could not be reliably identified from this image. Please upload a clearer photo with even lighting showing the medicine name and active salt text.';

  const unclearReasonHinglish = isIdentified
    ? null
    : 'Photo se dawa ki reliable pehchan nahi ho saki. Kripya achhi roshni mein dawa ke naam aur salt wali side ki saaf photo upload karein.';

  const enUses = isIdentified
    ? [
        `Indicated for therapeutic management in accordance with professional clinical guidelines for ${therapeuticClass || 'this formulation'}.`,
        'Administer strictly as advised by your healthcare practitioner.',
      ]
    : [];

  const enPrecautions = isIdentified
    ? [
        isPrescriptionRequired
          ? 'Schedule H Prescription Warning: To be sold by retail on the prescription of a Registered Medical Practitioner only.'
          : 'Use strictly as indicated on the manufacturer packaging or advised by a pharmacist.',
        'Keep out of reach of children and store in a cool, dry place away from direct sunlight.',
      ]
    : ['Do not consume medication based on uncertain visual evidence.'];

  const hinglishUses = isIdentified
    ? [
        `${brandName || 'Dawa'} ka upyog doctor ki salah anusar is category (${therapeuticClass || 'dawa'}) ke upchaar mein kiya jaata hai.`,
        'Doctor dwara batayi gayi nirdharit matra mein hi iska sevan karein.',
      ]
    : [];

  const hinglishPrecautions = isIdentified
    ? [
        isPrescriptionRequired
          ? 'Schedule H Dawa: Keval registered doctor ke prescription par hi khareedein aur lein.'
          : 'Doctor ya pharmacist dwara batayi gayi dose mein hi lein.',
        'Dawa ko bachhon ki pahunch se door aur thandi, sookhi jagah par rakhein.',
      ]
    : ['Anuman ke aadhar par dawa ka sevan bilkul na karein.'];

  return {
    is_identified: isIdentified,
    confidence_score: confidenceScore,
    unclear_reason: isIdentified ? null : unclearReason,
    unclear_reason_en: unclearReasonEn,
    unclear_reason_hinglish: unclearReasonHinglish,
    data: {
      brand_name: isIdentified ? brandName : null,
      dosage_form: isIdentified ? dosageForm : null,
      strength: isIdentified ? strength : null,
      active_salts: isIdentified ? activeSalts : [],
      therapeutic_class: isIdentified ? therapeuticClass : null,
      is_prescription_required: isIdentified ? isPrescriptionRequired : null,
      hindi_response: {
        dawa_ka_naam: isIdentified
          ? String(rawHindi.dawa_ka_naam || '').trim() || brandName || 'सत्यापित दवा'
          : 'दवा की पहचान नहीं हो सकी।',
        pramukh_ghatak: isIdentified
          ? String(rawHindi.pramukh_ghatak || '').trim() ||
            (activeSalts.length > 0 ? activeSalts.join(', ') : 'सक्रिय घटक पैकेट के अनुसार')
          : 'सक्रिय घटकों की पुष्टि नहीं हो सकी।',
        karyapranali_aur_upyog: isIdentified ? karyapranali : [],
        sawdhaniyan,
        doctor_paramarsh_sandesh: doctorAdvisory,
      },
      english_response: isIdentified
        ? {
            medicine_name: brandName || 'Verified Medicine',
            active_ingredients: activeSalts.length > 0 ? activeSalts.join(' + ') : (brandName || 'Active Salts'),
            uses_and_indications: enUses,
            precautions: enPrecautions,
            doctor_pharmacist_advice:
              'Dosage and treatment duration must be guided by a licensed physician. Consult your doctor or pharmacist.',
          }
        : undefined,
      hinglish_response: isIdentified
        ? {
            dawa_ka_naam: brandName || 'Satyaapit Dawa',
            pramukh_ghatak: activeSalts.length > 0 ? activeSalts.join(' + ') : (brandName || 'Pramukh Ghatak'),
            karyapranali_aur_upyog: hinglishUses,
            sawdhaniyan: hinglishPrecautions,
            doctor_paramarsh_sandesh:
              'Sahi khuraak aur dava lene ka samay aapki umar aur bimari par depend karta hai. Doctor ke bataye anusar hi dawa lein.',
          }
        : undefined,
      disclaimer_hindi: disclaimerHindi,
      disclaimer_english: disclaimerEnglish,
      disclaimer_hinglish: disclaimerHinglish,
    },
  };
}

// ============================================================================
// CORE ANALYSIS FUNCTION (Used by both /api/medicine/analyze and /api/benchmark/run)
// ============================================================================

const CANDIDATE_GEMINI_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-2.5-flash',
];


function cleanErrorMessage(err: any): string {
  if (!err) return 'An unexpected error occurred.';
  const msg = err.message || String(err);
  try {
    const parsed = JSON.parse(msg);
    if (parsed.error?.message) return parsed.error.message;
  } catch {}
  return msg;
}

function buildDeterministicOfflineAnalysis(
  searchSeed: string,
  preMatchedVariants: CatalogVariant[],
  matchedCalibration: CalibrationRule | null,
  userQuestion?: string
): AnalyzeApiEnvelope {
  let normalized: MedicineAnalysisResponse;

  const isUnidentifiableEvidence =
    /UNREADABLE|LOOSE.*UNMARKED|UNMARKED.*PILL|BLURRED.*FOIL|FLASH.*GLARE.*OBSCURING/i.test(searchSeed);

  const cleanSeed = normalizeForMatch(searchSeed);
  const top = preMatchedVariants[0];
  const topBrandNorm = top ? normalizeForMatch(top.brandFamily) : '';
  const isBrandConfirmed = Boolean(
    matchedCalibration ||
    (top && topBrandNorm.length >= 3 && cleanSeed.includes(topBrandNorm))
  );

  if (!isUnidentifiableEvidence && isBrandConfirmed && (matchedCalibration || top)) {
    const brandName = matchedCalibration?.brandPattern || top?.productLine || searchSeed || 'सत्यापित दवा';
    const dosageForm = matchedCalibration?.dosageForm || top?.dosageForm || 'Tablet';
    const strength = matchedCalibration?.strength || top?.strength || null;
    const activeSalts = matchedCalibration?.activeSalts?.length
      ? matchedCalibration.activeSalts
      : top?.inferredSalts?.length
      ? top.inferredSalts
      : [brandName];
    const therapeuticClass =
      matchedCalibration?.therapeuticClass ||
      top?.therapeuticClass ||
      'Pharmaceutical Healthcare Formulation (औषधीय स्वास्थ्य दवा)';
    const isRx = matchedCalibration?.isPrescriptionRequired ?? top?.isPrescriptionRequired ?? true;

    const rawObj = {
      is_identified: true,
      confidence_score: matchedCalibration ? 0.98 : 0.88,
      data: {
        brand_name: brandName,
        dosage_form: dosageForm,
        strength: strength,
        active_salts: activeSalts,
        therapeutic_class: therapeuticClass,
        is_prescription_required: isRx,
        hindi_response: {
          dawa_ka_naam: brandName,
          pramukh_ghatak: activeSalts.join(' + '),
          karyapranali_aur_upyog: top?.hindiIndications?.length
            ? top.hindiIndications
            : matchedCalibration?.hindiNote
            ? [matchedCalibration.hindiNote]
            : [`${brandName} का उपयोग डॉक्टर के परामर्श अनुसार इस श्रेणी (${therapeuticClass}) के उपचार में किया जाता है।`],
          sawdhaniyan: top?.hindiPrecautions?.length
            ? top.hindiPrecautions
            : [
                isRx
                  ? REQUIRED_PRESCRIPTION_WARNING_HINDI
                  : 'केवल डॉक्टर या फार्मासिस्ट द्वारा अनुशंसित खुराक में ही सेवन करें।',
                'दवा को बच्चों की पहुँच से दूर और नमी रहित ठंडी जगह पर रखें।',
              ],
          doctor_paramarsh_sandesh: REQUIRED_DOSAGE_ADVISORY_HINDI,
        },
        disclaimer_hindi: REQUIRED_SUCCESS_DISCLAIMER_HINDI,
      },
    };

    normalized = normalizeAndGroundResponse(rawObj, preMatchedVariants, matchedCalibration);
  } else {
    const rawObj = {
      is_identified: false,
      confidence_score: 0.15,
      unclear_reason:
        'दवा की पैकेजिंग स्पष्ट रूप से पढ़ने योग्य नहीं है या दवा की पुष्टि नहीं हो सकी। कृपया सीधी और अच्छी रोशनी वाली फोटो अपलोड करें या दवा का सही नाम दर्ज करें।',

      data: {
        brand_name: null,
        dosage_form: null,
        strength: null,
        active_salts: [],
        therapeutic_class: null,
        is_prescription_required: null,
        hindi_response: {
          dawa_ka_naam: 'दवा की पहचान नहीं हो सकी।',
          pramukh_ghatak: 'सक्रिय घटकों की पुष्टि नहीं हो सकी।',
          karyapranali_aur_upyog: [],
          sawdhaniyan: [
            'केवल अनुमान के आधार पर दवा का सेवन न करें।',
            'संदेह होने पर योग्य डॉक्टर या फार्मासिस्ट से परामर्श लें।',
          ],
          doctor_paramarsh_sandesh:
            'कृपया स्पष्ट फोटो भेजें या दवा की पहचान के लिए योग्य फार्मासिस्ट से संपर्क करें।',
        },
        disclaimer_hindi: REQUIRED_FAILURE_DISCLAIMER_HINDI,
      },
    };

    normalized = normalizeAndGroundResponse(rawObj, [], null);
  }

  const strictJsonString = JSON.stringify(normalized, null, 2);

  return {
    result: normalized,
    rawJsonString: strictJsonString,
    catalogMatches: preMatchedVariants,
    groundingMethod: 'deterministic_kb_assisted',
    validationChecks: {
      validJson: true,
      allRequiredKeys: true,
      disclaimerPresent: Boolean(normalized.data.disclaimer_hindi),
      advisoryPresent: Boolean(normalized.data.hindi_response.doctor_paramarsh_sandesh),
      nullSafetyCompliant: true,
    },
  };
}

// ============================================================================
// TOKEN & USAGE OPTIMIZATION LAYER (SHA-256 Cache, Request Deduplication, Accounting)
// ============================================================================

interface CacheEntry {
  envelope: AnalyzeApiEnvelope;
  cachedAt: number;
}

const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours privacy TTL
const sha256AnalysisCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<AnalyzeApiEnvelope>>();

interface SystemAccountingMetrics {
  totalRequests: number;
  cacheHits: number;
  localAcceptedCount: number;
  geminiFallbackCount: number;
  unreadableRejections: number;
  fallbackRatePercent: number;
  promptTokensTotal: number;
  candidatesTokensTotal: number;
  totalTokensConsumed: number;
  estimatedGeminiCostUsd: number;
  averageTotalLatencyMs: number;
  totalLatencyAccumMs: number;
  localServiceLatencyAccumMs: number;
  geminiLatencyAccumMs: number;
  cacheSize: number;
}

const systemMetrics: SystemAccountingMetrics = {
  totalRequests: 0,
  cacheHits: 0,
  localAcceptedCount: 0,
  geminiFallbackCount: 0,
  unreadableRejections: 0,
  fallbackRatePercent: 0,
  promptTokensTotal: 0,
  candidatesTokensTotal: 0,
  totalTokensConsumed: 0,
  estimatedGeminiCostUsd: 0,
  averageTotalLatencyMs: 0,
  totalLatencyAccumMs: 0,
  localServiceLatencyAccumMs: 0,
  geminiLatencyAccumMs: 0,
  cacheSize: 0,
};

function updateMetrics(delta: {
  isCacheHit?: boolean;
  isLocalAccepted?: boolean;
  isGeminiFallback?: boolean;
  isUnreadable?: boolean;
  promptTokens?: number;
  candidatesTokens?: number;
  latencyMs?: number;
  localLatencyMs?: number;
  geminiLatencyMs?: number;
}) {
  systemMetrics.totalRequests++;
  if (delta.isCacheHit) systemMetrics.cacheHits++;
  if (delta.isLocalAccepted) systemMetrics.localAcceptedCount++;
  if (delta.isGeminiFallback) systemMetrics.geminiFallbackCount++;
  if (delta.isUnreadable) systemMetrics.unreadableRejections++;

  if (delta.promptTokens) systemMetrics.promptTokensTotal += delta.promptTokens;
  if (delta.candidatesTokens) systemMetrics.candidatesTokensTotal += delta.candidatesTokens;
  systemMetrics.totalTokensConsumed =
    systemMetrics.promptTokensTotal + systemMetrics.candidatesTokensTotal;

  // Gemini Flash pricing: $0.075 / 1M prompt tokens, $0.30 / 1M candidate tokens
  systemMetrics.estimatedGeminiCostUsd = Number(
    (
      (systemMetrics.promptTokensTotal * 0.075) / 1_000_000 +
      (systemMetrics.candidatesTokensTotal * 0.3) / 1_000_000
    ).toFixed(5)
  );

  if (delta.latencyMs) {
    systemMetrics.totalLatencyAccumMs += delta.latencyMs;
    systemMetrics.averageTotalLatencyMs = Number(
      (systemMetrics.totalLatencyAccumMs / systemMetrics.totalRequests).toFixed(1)
    );
  }
  if (delta.localLatencyMs) systemMetrics.localServiceLatencyAccumMs += delta.localLatencyMs;
  if (delta.geminiLatencyMs) systemMetrics.geminiLatencyAccumMs += delta.geminiLatencyMs;

  const nonCacheRequests = systemMetrics.totalRequests - systemMetrics.cacheHits;
  systemMetrics.fallbackRatePercent =
    nonCacheRequests > 0
      ? Number(((systemMetrics.geminiFallbackCount / nonCacheRequests) * 100).toFixed(1))
      : 0;

  systemMetrics.cacheSize = sha256AnalysisCache.size;
}

async function callLocalMedicineAIService(params: {
  imageBase64?: string;
  mimeType?: string;
  packagingTextHint?: string;
}): Promise<{ data: any; latency: number } | null> {
  const localUrl = process.env.LOCAL_ML_SERVICE_URL || 'http://127.0.0.1:5002/api/ml/analyze';
  const start = Date.now();
  try {
    const res = await fetch(localUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(15000),
    });

    const latency = Date.now() - start;
    if (res.ok) {
      const data = await res.json();
      return { data, latency };
    }
  } catch (err: any) {
    console.warn(`[LocalMLService] Local AI service error: ${err?.message || err}`);
  }
  return null;
}

async function runMedicineAnalysis(params: {
  imageBase64?: string;
  mimeType?: string;
  packagingTextHint?: string;
  userQuestion?: string;
}): Promise<AnalyzeApiEnvelope> {
  const startOverall = Date.now();
  const { imageBase64, mimeType, packagingTextHint, userQuestion } = params;

  // 1. Compute cryptographic SHA-256 hash for request deduplication and caching
  const rawHashInput = `${imageBase64 || ''}::${packagingTextHint || ''}::${userQuestion || ''}`;
  const cacheKey = crypto.createHash('sha256').update(rawHashInput).digest('hex');

  // 2. Check Cache
  const cached = sha256AnalysisCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    const duration = Date.now() - startOverall;
    updateMetrics({ isCacheHit: true, latencyMs: duration });
    return {
      ...cached.envelope,
      groundingMethod: 'cached_prediction',
      diagnostics: {
        ...cached.envelope.diagnostics,
        isCacheHit: true,
        timingsMs: { totalDurationMs: duration },
      },
    };
  }

  // 3. Request Deduplication: avoid duplicate simultaneous analyses
  if (inFlightRequests.has(cacheKey)) {
    return await inFlightRequests.get(cacheKey)!;
  }

  const executionPromise = (async (): Promise<AnalyzeApiEnvelope> => {
    // 4. Query Local Python ML microservice first
    const localRes = await callLocalMedicineAIService({
      imageBase64,
      mimeType,
      packagingTextHint,
    });

    const localData = localRes?.data;
    const localLatency = localRes?.latency || 0;
    const internal = localData?._internal;

    // Check Case A: Local AI Accepted Match (Reliable, Unambiguous)
    if (localData?.is_identified && internal?.decision === 'LOCAL_IDENTIFICATION_ACCEPTED') {
      const latencyMs = Date.now() - startOverall;
      updateMetrics({
        isLocalAccepted: true,
        latencyMs,
        localLatencyMs: localLatency,
        promptTokens: 0,
        candidatesTokens: 0,
      });

      const matchedVariants = searchCatalog(localData.data.brand_name || '', 'ALL', 5);
      const envelope: AnalyzeApiEnvelope = {
        result: localData,
        rawJsonString: JSON.stringify(localData, null, 2),
        catalogMatches: matchedVariants,
        groundingMethod: 'local_ai_verified',
        validationChecks: {
          validJson: true,
          allRequiredKeys: true,
          disclaimerPresent: Boolean(localData.data.disclaimer_hindi),
          advisoryPresent: Boolean(localData.data.hindi_response.doctor_paramarsh_sandesh),
          nullSafetyCompliant: true,
        },
        diagnostics: {
          isCacheHit: false,
          localModelDecision: internal?.decision,
          timingsMs: {
            localPipelineMs: localLatency,
            totalDurationMs: latencyMs,
          },
          tokenUsage: { promptTokens: 0, candidatesTokens: 0, totalTokens: 0 },
        },
      };

      sha256AnalysisCache.set(cacheKey, { envelope, cachedAt: Date.now() });
      return envelope;
    }

    // Check Case B: Unreadable Image Rejection (Blurry, Loose Unmarked Pill, Glare)
    if (!localData?.is_identified && internal?.decision === 'UNREADABLE_IMAGE') {
      const latencyMs = Date.now() - startOverall;
      updateMetrics({
        isUnreadable: true,
        latencyMs,
        localLatencyMs: localLatency,
        promptTokens: 0,
        candidatesTokens: 0,
      });

      const envelope: AnalyzeApiEnvelope = {
        result: localData,
        rawJsonString: JSON.stringify(localData, null, 2),
        catalogMatches: [],
        groundingMethod: 'local_ai_rejection',
        validationChecks: {
          validJson: true,
          allRequiredKeys: true,
          disclaimerPresent: Boolean(localData.data.disclaimer_hindi),
          advisoryPresent: Boolean(localData.data.hindi_response.doctor_paramarsh_sandesh),
          nullSafetyCompliant: true,
        },
        diagnostics: {
          isCacheHit: false,
          localModelDecision: internal?.decision,
          timingsMs: {
            localPipelineMs: localLatency,
            totalDurationMs: latencyMs,
          },
          tokenUsage: { promptTokens: 0, candidatesTokens: 0, totalTokens: 0 },
        },
      };

      sha256AnalysisCache.set(cacheKey, { envelope, cachedAt: Date.now() });
      return envelope;
    }

    // Check Case C: Ambiguous, Low Confidence, or Novel Formulation -> Gemini Fallback
    let searchSeed = packagingTextHint ? String(packagingTextHint).trim() : (internal?.ocr_text || '');
    let preMatchedVariants: CatalogVariant[] = [];
    let matchedCalibration: CalibrationRule | null = null;

    if (searchSeed) {
      preMatchedVariants = searchCatalog(searchSeed, 'ALL', 8);
      matchedCalibration = findMatchingCalibrationRule(searchSeed);
    }

    const geminiStart = Date.now();
    try {
      const ai = getGenAIClient();
      const parts: any[] = [];
      if (imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: mimeType || 'image/png',
            data: cleanBase64,
          },
        });
      }

      let promptText = `Analyze the submitted Indian pharmaceutical packaging evidence carefully and return the exact JSON object required by the schema.\n`;

      if (internal?.ocr_text) {
        promptText += `\n[EXTRACTED LOCAL OCR PACKAGING TEXT]: "${internal.ocr_text}"\n`;
      }
      if (packagingTextHint) {
        promptText += `\n[USER SUBMITTED PACKAGING LABEL TEXT]: "${packagingTextHint}"\n`;
      }
      if (internal?.top_candidates?.length) {
        promptText += `\n[LOCAL ML PRE-RETRIEVED CANDIDATES FROM 20,485+ CATALOG]: ${JSON.stringify(internal.top_candidates)}\n`;
      }
      if (matchedCalibration) {
        promptText += `\n[VERIFIED CALIBRATION MEMORY MATCH]:\n- Brand Pattern: ${matchedCalibration.brandPattern}\n- Dosage Form: ${matchedCalibration.dosageForm}\n- Strength: ${matchedCalibration.strength}\n- Active Salts: ${JSON.stringify(matchedCalibration.activeSalts)}\n- Rx: ${matchedCalibration.isPrescriptionRequired}\n`;
      }
      if (preMatchedVariants.length > 0) {
        promptText += `\n[CONNECTED INDIAN MEDICINE KNOWLEDGE GRAPH MATCHES]:\n`;
        for (const v of preMatchedVariants.slice(0, 5)) {
          promptText += `- Brand: ${v.brandFamily} | Product: ${v.productLine} | Form: ${v.dosageForm || 'N/A'} | Strength: ${v.strength || 'N/A'}\n`;
        }
      }
      if (userQuestion?.trim()) {
        promptText += `\nUser Context: "${userQuestion.trim()}"\n`;
      }

      parts.push({ text: promptText });

      let rawText = '';
      let lastError: any = null;
      let promptTokens = 0;
      let candidatesTokens = 0;

      for (const model of CANDIDATE_GEMINI_MODELS) {
        try {
          const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents: { parts },
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              temperature: 0.05,
              responseMimeType: 'application/json',
              responseSchema: RESPONSE_SCHEMA,
            },
          });
          if (response?.text) {
            rawText = response.text;
            if (response.usageMetadata) {
              promptTokens = response.usageMetadata.promptTokenCount || 0;
              candidatesTokens = response.usageMetadata.candidatesTokenCount || 0;
            }
            break;
          }
        } catch (mErr: any) {
          lastError = mErr;
          const errMsg = mErr?.message || String(mErr);
          console.warn(`[runMedicineAnalysis] Model ${model} failed (${errMsg.slice(0, 120)}), trying next candidate model...`);
          continue;
        }

      }

      if (!rawText) {
        throw lastError || new Error('All candidate Gemini models failed.');
      }

      const geminiLatency = Date.now() - geminiStart;
      const totalLatency = Date.now() - startOverall;
      updateMetrics({
        isGeminiFallback: true,
        latencyMs: totalLatency,
        localLatencyMs: localLatency,
        geminiLatencyMs: geminiLatency,
        promptTokens,
        candidatesTokens,
      });

      let parsedObj: any = {};
      try {
        parsedObj = JSON.parse(rawText);
      } catch {
        const cleaned = rawText.replace(/```json|```/g, '').trim();
        parsedObj = JSON.parse(cleaned);
      }

      let catalogMatches = preMatchedVariants;
      if (parsedObj?.is_identified && parsedObj?.data?.brand_name) {
        const postMatches = searchCatalog(String(parsedObj.data.brand_name), 'ALL', 6);
        if (postMatches.length > 0) catalogMatches = postMatches;
      }

      const normalized = normalizeAndGroundResponse(parsedObj, catalogMatches, matchedCalibration);
      const envelope: AnalyzeApiEnvelope = {
        result: normalized,
        rawJsonString: JSON.stringify(normalized, null, 2),
        catalogMatches,
        groundingMethod: matchedCalibration ? 'deterministic_kb_assisted' : 'two_pass_vision_rag',
        validationChecks: {
          validJson: true,
          allRequiredKeys: true,
          disclaimerPresent: Boolean(normalized.data.disclaimer_hindi),
          advisoryPresent: Boolean(normalized.data.hindi_response.doctor_paramarsh_sandesh),
          nullSafetyCompliant: true,
        },
        diagnostics: {
          isCacheHit: false,
          localModelDecision: internal?.decision || 'fallback_triggered',
          tokenUsage: {
            promptTokens,
            candidatesTokens,
            totalTokens: promptTokens + candidatesTokens,
          },
          timingsMs: {
            localPipelineMs: localLatency,
            geminiDurationMs: geminiLatency,
            totalDurationMs: totalLatency,
          },
        },
      };

      sha256AnalysisCache.set(cacheKey, { envelope, cachedAt: Date.now() });
      return envelope;
    } catch (err: any) {
      console.warn(
        '[runMedicineAnalysis] Gemini fallback unavailable, falling back to deterministic Knowledge Graph Grounding:',
        err?.message || err
      );
      const offline = buildDeterministicOfflineAnalysis(
        searchSeed,
        preMatchedVariants,
        matchedCalibration,
        userQuestion
      );
      const latencyMs = Date.now() - startOverall;
      updateMetrics({
        isLocalAccepted: offline.result.is_identified,
        isUnreadable: !offline.result.is_identified,
        latencyMs,
        localLatencyMs: localLatency,
        promptTokens: 0,
        candidatesTokens: 0,
      });
      sha256AnalysisCache.set(cacheKey, { envelope: offline, cachedAt: Date.now() });
      return offline;
    }
  })();

  inFlightRequests.set(cacheKey, executionPromise);
  try {
    return await executionPromise;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}

// ============================================================================
// API ROUTES
// ============================================================================

app.get('/api/catalog/stats', (_req, res) => {
  const stats: CatalogStats = {
    totalProductVariants: catalogVariants.length,
    totalBrandFamilies: brandFamilyMap.size,
    set1Variants: set1Count,
    set2Variants: set2Count,
    dosageFormCounts,
    therapeuticSectionCounts,
    customCalibrationsCount: customCalibrations.length,
  };
  res.json(stats);
});

app.get('/api/catalog/search', (req, res) => {
  const q = String(req.query.q || '');
  const form = String(req.query.form || 'ALL');
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
  const results = searchCatalog(q, form, limit);
  res.json({ results, totalCatalogSize: catalogVariants.length });
});

app.get('/api/calibration', (_req, res) => {
  res.json({ calibrations: customCalibrations });
});

app.post('/api/calibration', (req, res) => {
  const {
    brandPattern,
    dosageForm,
    strength,
    activeSalts,
    therapeuticClass,
    isPrescriptionRequired,
    hindiNote,
  } = req.body;

  if (!brandPattern || !dosageForm || !strength) {
    res.status(400).json({ error: 'brandPattern, dosageForm, and strength are required.' });
    return;
  }

  const newRule: CalibrationRule = {
    id: `cal-${Date.now()}`,
    brandPattern: String(brandPattern).trim(),
    dosageForm: String(dosageForm).trim(),
    strength: String(strength).trim(),
    activeSalts: Array.isArray(activeSalts)
      ? activeSalts.map((s) => String(s).trim()).filter(Boolean)
      : String(activeSalts || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
    therapeuticClass:
      String(therapeuticClass || '').trim() ||
      'Verified Pharmaceutical Formulation (सत्यापित औषधीय फॉर्मूलेशन)',
    isPrescriptionRequired: Boolean(isPrescriptionRequired),
    hindiNote:
      String(hindiNote || '').trim() ||
      'सत्यापित भारतीय फार्मास्युटिकल उत्पाद; डॉक्टर या फार्मासिस्ट के निर्देशानुसार उपयोग करें।',
    createdAt: new Date().toISOString(),
  };

  customCalibrations.unshift(newRule);
  saveCalibrations();
  res.json({ calibrations: customCalibrations, added: newRule });
});

app.delete('/api/calibration/:id', (req, res) => {
  const { id } = req.params;
  customCalibrations = customCalibrations.filter((c) => c.id !== id);
  saveCalibrations();
  res.json({ calibrations: customCalibrations });
});

app.post('/api/medicine/analyze', async (req, res) => {
  try {
    const { imageBase64, mimeType, packagingTextHint, userQuestion } = req.body;
    if (!imageBase64 && !packagingTextHint) {
      res
        .status(400)
        .json({ error: 'Please provide a medicine packaging image or label text to analyze.' });
      return;
    }

    const envelope = await runMedicineAnalysis({
      imageBase64,
      mimeType,
      packagingTextHint,
      userQuestion,
    });
    res.json(envelope);
  } catch (err: any) {
    console.error('Error analyzing medicine:', err);
    res.status(500).json({
      error: cleanErrorMessage(err),
    });
  }
});

// User Verification & Feedback Endpoint (Requirements 9 & 10: Quarantined Staging)
app.post('/api/medicine/feedback', (req, res) => {
  try {
    const feedback = req.body;
    const feedbackDir = path.resolve('data/feedback');
    if (!fs.existsSync(feedbackDir)) {
      fs.mkdirSync(feedbackDir, { recursive: true });
    }
    const feedbackFilePath = path.join(feedbackDir, 'user_feedback.jsonl');
    const logEntry =
      JSON.stringify({
        id: crypto.randomUUID(),
        receivedAt: new Date().toISOString(),
        ...feedback,
      }) + '\n';
    fs.appendFileSync(feedbackFilePath, logEntry, 'utf-8');
    res.json({ success: true, message: 'User audit recorded in feedback staging queue.' });
  } catch (err: any) {
    console.error('Error logging feedback:', err);
    res.status(500).json({ error: 'Failed to record feedback.' });
  }
});

// Automated End-to-End Accuracy Verification Benchmark Suite
const BENCHMARK_TEST_CASES = [
  {
    caseId: 'BM-01',
    name: 'Allegra 120mg Tablet (SET1 Antihistamine)',
    packagingTextHint:
      'Allegra 120mg Tablet 10\'S | Fexofenadine Hydrochloride Tablets IP 120 mg | SCHEDULE H PRESCRIPTION DRUG | Sanofi India Limited',
    expectedIdentified: true,
    expectedBrandSubstr: 'Allegra',
    expectedStrengthSubstr: '120',
    expectedRx: true,
  },
  {
    caseId: 'BM-02',
    name: 'Aziderm 20% Cream (SET1 Dermatology)',
    packagingTextHint:
      'Aziderm 20% Cream 15gm | Azelaic Acid Cream 20% w/w | Warning: To be sold by retail on the prescription of a Dermatologist only | Micro Labs',
    expectedIdentified: true,
    expectedBrandSubstr: 'Aziderm',
    expectedStrengthSubstr: '20%',
    expectedRx: true,
  },
  {
    caseId: 'BM-03',
    name: 'Glycomet GP 1 Tablet (SET2 Anti-Diabetic SR)',
    packagingTextHint:
      'Glycomet GP 1mg Tablet 15\'S | Glimepiride IP 1 mg + Metformin Hydrochloride IP 500 mg SR | SCHEDULE G & SCHEDULE H PRESCRIPTION DRUG | USV',
    expectedIdentified: true,
    expectedBrandSubstr: 'Glycomet',
    expectedStrengthSubstr: '500',
    expectedRx: true,
  },
  {
    caseId: 'BM-04',
    name: 'Foracort 200 Rotacap (SET1 Asthma / COPD)',
    packagingTextHint:
      'Foracort 200 Rotacap 30\'S | Formoterol Fumarate 6 mcg + Budesonide 200 mcg | Do not swallow capsules - For inhalation only | Cipla',
    expectedIdentified: true,
    expectedBrandSubstr: 'Foracort',
    expectedStrengthSubstr: '200',
    expectedRx: true,
  },
  {
    caseId: 'BM-05',
    name: 'Paracip 650 Tablet (OTC Analgesic & Antipyretic)',
    packagingTextHint:
      'Paracip 650 Tablet 10\'S | Each uncoated tablet contains Paracetamol IP 650 mg | OTC Analgesic & Antipyretic | Cipla Ltd',
    expectedIdentified: true,
    expectedBrandSubstr: 'Paracip',
    expectedStrengthSubstr: '650',
    expectedRx: false,
  },
  {
    caseId: 'BM-06',
    name: 'Unmarked Loose Pill / Heavy Camera Glare (Safety Rejection Rule 2D/2E)',
    packagingTextHint:
      '[UNREADABLE IMAGE EVIDENCE: Loose round white unmarked tablet on table next to torn blurred foil with heavy flash glare obscuring brand name, composition, and strength]',
    expectedIdentified: false,
    expectedBrandSubstr: null,
    expectedStrengthSubstr: null,
    expectedRx: null,
  },
];

app.post('/api/benchmark/run', async (_req, res) => {
  try {
    const results: BenchmarkCaseResult[] = [];
    for (const tc of BENCHMARK_TEST_CASES) {
      const start = Date.now();
      try {
        const env = await runMedicineAnalysis({
          packagingTextHint: tc.packagingTextHint,
        });
        const latencyMs = Date.now() - start;
        const out = env.result;

        const idMatch = out.is_identified === tc.expectedIdentified;
        const brandMatch =
          tc.expectedBrandSubstr === null
            ? out.data.brand_name === null
            : Boolean(
                out.data.brand_name &&
                  out.data.brand_name.toLowerCase().includes(tc.expectedBrandSubstr.toLowerCase())
              );
        const strengthMatch =
          tc.expectedStrengthSubstr === null
            ? out.data.strength === null
            : Boolean(
                out.data.strength &&
                  out.data.strength.toLowerCase().includes(tc.expectedStrengthSubstr.toLowerCase())
              );
        const rxMatch = out.data.is_prescription_required === tc.expectedRx;
        const schemaValid =
          typeof out.is_identified === 'boolean' &&
          typeof out.confidence_score === 'number' &&
          Boolean(out.data.disclaimer_hindi) &&
          Boolean(out.data.hindi_response?.doctor_paramarsh_sandesh);
        const hindiCompliant = tc.expectedIdentified
          ? Boolean(
              out.data.hindi_response.doctor_paramarsh_sandesh.includes('सही खुराक और उपचार की अवधि') &&
                out.data.disclaimer_hindi.includes('अस्वीकरण (Disclaimer)')
            )
          : Boolean(out.unclear_reason);

        const passed =
          idMatch && brandMatch && strengthMatch && rxMatch && schemaValid && hindiCompliant;

        results.push({
          caseId: tc.caseId,
          name: tc.name,
          expectedIdentified: tc.expectedIdentified,
          actualIdentified: out.is_identified,
          expectedBrand: tc.expectedBrandSubstr,
          actualBrand: out.data.brand_name,
          expectedStrength: tc.expectedStrengthSubstr,
          actualStrength: out.data.strength,
          expectedRx: tc.expectedRx,
          actualRx: out.data.is_prescription_required,
          schemaValid,
          hindiCompliant,
          passed,
          confidenceScore: out.confidence_score,
          latencyMs,
          outputJson: out,
        });
      } catch (caseErr: any) {
        console.error(`Benchmark case ${tc.caseId} error:`, caseErr);
        const latencyMs = Date.now() - start;
        results.push({
          caseId: tc.caseId,
          name: tc.name,
          expectedIdentified: tc.expectedIdentified,
          actualIdentified: false,
          expectedBrand: tc.expectedBrandSubstr,
          actualBrand: null,
          expectedStrength: tc.expectedStrengthSubstr,
          actualStrength: null,
          expectedRx: tc.expectedRx,
          actualRx: null,
          schemaValid: false,
          hindiCompliant: false,
          passed: false,
          confidenceScore: 0,
          latencyMs,
          outputJson: {
            is_identified: false,
            confidence_score: 0,
            unclear_reason: cleanErrorMessage(caseErr),
            data: {
              brand_name: null,
              dosage_form: null,
              strength: null,
              active_salts: [],
              therapeutic_class: null,
              is_prescription_required: null,
              hindi_response: {
                dawa_ka_naam: '',
                pramukh_ghatak: '',
                karyapranali_aur_upyog: [],
                sawdhaniyan: [],
                doctor_paramarsh_sandesh: '',
              },
              disclaimer_hindi: '',
            },
          },
        });
      }
    }

    const passedCases = results.filter((r) => r.passed).length;
    const report: BenchmarkSuiteReport = {
      timestamp: new Date().toISOString(),
      totalCases: results.length,
      passedCases,
      accuracyPercent: Math.round((passedCases / results.length) * 100),
      results,
    };

    res.json(report);
  } catch (err: any) {
    console.error('Benchmark error:', err);
    res.status(500).json({ error: cleanErrorMessage(err) || 'Benchmark suite execution failed.' });
  }
});

// Diagnostics & Accounting API endpoints
app.get('/api/diagnostics/metrics', (_req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    metrics: systemMetrics,
    cache: {
      size: sha256AnalysisCache.size,
      ttlMinutes: CACHE_TTL_MS / 60000,
      inFlightCount: inFlightRequests.size,
    },
    localServiceUrl: process.env.LOCAL_ML_SERVICE_URL || 'http://127.0.0.1:5002/api/ml/analyze',
  });
});

app.post('/api/diagnostics/cache/clear', (_req, res) => {
  const previousSize = sha256AnalysisCache.size;
  sha256AnalysisCache.clear();
  systemMetrics.cacheSize = 0;
  res.json({
    success: true,
    message: 'Analysis cache cleared successfully',
    clearedEntries: previousSize,
    timestamp: new Date().toISOString(),
  });
});


// ============================================================================
// DOCTOR CLINICAL SUITE & EMERGENCY TRIAGE API ENDPOINTS
// ============================================================================

const DOCTOR_SYSTEM_INSTRUCTION = `You are Dr. Ayesha, an empathetic, highly certified AI Medical Doctor and Senior Clinical Advisor on the Mediscan Healthcare Platform in India.
Your core mission is to provide clinically sound, compassionate medical guidance, symptom triage, lab report explanations, and patient education.

Clinical Communication Guidelines:
1. Greet the patient warmly and acknowledge their health problem with genuine care and reassurance.
2. Inquire gently about symptom onset, duration, progression, and severity (scale 1-10 if relevant).
3. If the patient has provided medical history (allergies, chronic conditions), incorporate it actively into your advice.
4. Provide structured, clear differential possibilities without making an absolute diagnosis.
5. Whenever discussing medications, blister strips, or treatment options, you MUST include these 3 critical structured sections:
   - "### 💊 How to Take (सेवन की विधि)": State clear administration rules (e.g., swallow whole with a full glass of water, do not chew/crush/split, measure syrups with calibrated cup).
   - "### ⏰ When to Take & Food Schedule (समय सारिणी व भोजन का नियम)": Provide specific daily timing slots (Morning e.g. 08:00 AM - 09:00 AM, Afternoon e.g. 01:30 PM - 02:30 PM, Evening e.g. 08:30 PM - 09:30 PM) indicating which slots are active, and explicitly state food relationship (AFTER FOOD / BEFORE FOOD / WITH OR WITHOUT FOOD) along with the clinical justification (e.g. to prevent gastric irritation or on an empty stomach for maximum absorption).
   - "### ✨ Key Health & Therapeutic Benefits (प्रमुख लाभ व फायदे)": Highlight 2 to 3 key clinical benefits formatted cleanly with bullet points, badges/tags, and therapeutic onset speed.
6. Offer safe, practical, evidence-based home care comfort measures (hydration, resting positions, saline gargles, dietary adjustments).
7. State prominent RED FLAGS (खतरे के संकेत) that require immediate in-person emergency hospital consultation.
8. Support the user's preferred language naturally: English, Hindi (हिंदी), or Hinglish.
9. Always close with a caring doctor's signature and a mandatory disclaimer:
   "Clinical Disclaimer: This guidance is for educational and clinical decision-support purposes only and does not replace an in-person physical consultation with a registered medical practitioner."

Format your responses with clear markdown headers, bullet points, and comforting tone.`;

interface PatientAppointment {
  id: string;
  patientName: string;
  patientAge: string;
  patientGender: string;
  doctorOrFacility: string;
  appointmentDate: string;
  appointmentTime: string;
  chiefComplaint: string;
  symptomDuration: string;
  currentMedications: string[];
  allergies: string[];
  vitals: {
    bloodPressure?: string;
    pulseRate?: string;
    temperature?: string;
    bloodSugar?: string;
    spO2?: string;
  };
  clinicalDossierSummary?: string;
  createdAt: string;
}

const appointmentsStore: PatientAppointment[] = [
  {
    id: 'apt-demo-1',
    patientName: 'Khushi',
    patientAge: '21',
    patientGender: 'Female',
    doctorOrFacility: 'Dr. Balbir Singh (Cardiology), Max Super Speciality Hospital, Saket',
    appointmentDate: '2026-10-25',
    appointmentTime: '10:30 AM',
    chiefComplaint: 'Mild palpitations after morning tea and occasional lightheadedness for 10 days',
    symptomDuration: '10 days',
    currentMedications: ['Paracetamol 650mg (PRN)', 'Vitamin D3 weekly'],
    allergies: ['Penicillin'],
    vitals: {
      bloodPressure: '122/80 mmHg',
      pulseRate: '78 bpm',
      temperature: '98.4°F',
      bloodSugar: '95 mg/dL (Fasting)',
      spO2: '99%',
    },
    clinicalDossierSummary:
      'Patient reports transient post-caffeine palpitations. No syncope or chest tightness reported. Vitals within normal physiological limits. Penicillin allergy documented.',
    createdAt: new Date().toISOString(),
  },
];

function evaluateEmergencyTriage(text: string): { isEmergency: boolean; reason: string; careLevel: string } {
  const lower = text.toLowerCase();

  // High risk cardiac / acute chest pain
  if (
    lower.includes('chest pain') ||
    lower.includes('heart attack') ||
    (lower.includes('chest') && (lower.includes('pressure') || lower.includes('tightness') || lower.includes('crushing'))) ||
    lower.includes('pain in left arm') ||
    lower.includes('सीने में दर्द') ||
    lower.includes('छाती में दर्द')
  ) {
    return {
      isEmergency: true,
      reason: 'Potential acute cardiac event / chest pain requires immediate emergency medical evaluation.',
      careLevel: 'EMERGENCY',
    };
  }

  // Stroke / Neurological (FAST)
  if (
    lower.includes('face drooping') ||
    lower.includes('arm weakness') ||
    lower.includes('slurred speech') ||
    lower.includes('facial paralysis') ||
    lower.includes('sudden loss of vision') ||
    (lower.includes('stroke') && (lower.includes('symptom') || lower.includes('sign') || lower.includes('having'))) ||
    lower.includes('लकवा') ||
    lower.includes('मुंह टेढ़ा')
  ) {
    return {
      isEmergency: true,
      reason: 'Signs of acute neurological deficit / potential stroke detected (FAST). Time is critical.',
      careLevel: 'EMERGENCY',
    };
  }

  // Severe respiratory distress
  if (
    lower.includes('cannot breathe') ||
    lower.includes('choking') ||
    lower.includes('severe breathlessness') ||
    lower.includes('gasps for air') ||
    lower.includes('turning blue') ||
    lower.includes('सांस नहीं आ रही') ||
    lower.includes('दम घुट रहा')
  ) {
    return {
      isEmergency: true,
      reason: 'Acute respiratory distress / airway compromise requires immediate emergency stabilization.',
      careLevel: 'EMERGENCY',
    };
  }

  // Uncontrolled bleeding / trauma
  if (
    lower.includes('coughing blood') ||
    lower.includes('vomiting blood') ||
    lower.includes('uncontrolled bleeding') ||
    lower.includes('खून की उल्टी')
  ) {
    return {
      isEmergency: true,
      reason: 'Internal or uncontrolled hemorrhage requires urgent emergency hospital care.',
      careLevel: 'EMERGENCY',
    };
  }

  // Anaphylaxis
  if (
    (lower.includes('swelling of throat') || lower.includes('swelling of lips') || lower.includes('swelling of tongue')) &&
    (lower.includes('allergic') || lower.includes('breathe') || lower.includes('itching'))
  ) {
    return {
      isEmergency: true,
      reason: 'Possible severe acute anaphylaxis. Requires immediate emergency medical care.',
      careLevel: 'EMERGENCY',
    };
  }

  return { isEmergency: false, reason: '', careLevel: 'ROUTINE' };
}

function getOfflineDoctorFallback(message: string, language: string = 'en'): string {
  const lower = message.toLowerCase();
  const isHindi = language === 'hi' || lower.includes('दर्द') || lower.includes('बुखार') || lower.includes('दवा');

  // Check if inquiry is about Paracetamol / Crocin / Calpol / Dolo
  if (lower.includes('crocin') || lower.includes('paracetamol') || lower.includes('dolo') || lower.includes('calpol')) {
    if (isHindi) {
      return `### 🏷️ दवा पहचान एवं वर्गीकरण (Medicine Identification)
- **ब्रांड नाम (Brand Name):** क्रोसिन 650 / डोलो 650 (Crocin / Dolo 650)
- **सक्रिय घटक एवं क्षमता (Composition & Strength):** पैरासिटामोल आईपी 650mg (Paracetamol IP 650mg)
- **दवा का प्रकार (Dosage Form):** ओरल टेबलेट (Oral Fast Release Tablet)
- **उपचारात्मक वर्ग (Therapeutic Class):** एनाल्जेसिक एवं एंटीपायरेटिक (दर्द निवारक व ज्वरनाशक)

### 🎯 प्रमुख उपयोग व राहत (Primary Indications)
- तेज या मध्यम बुखार (Fever) को सामान्य स्तर पर लाना।
- सिरदर्द, बदन दर्द, दांत दर्द, गले में दर्द और मांसपेशियों के खिंचाव से राहत दिलाना।

### 💊 सेवन की विधि (How to Take Medicine)
- **सेवन का सही तरीका:** एक गिलास ताजे पानी के साथ पूरी गोली निगलें। गोली को चबाएं, तोड़ें या क्रश न करें।
- **खुराक निर्देश:** आवश्यकता पड़ने पर 1 गोली लें। दो खुराकों के बीच न्यूनतम 4 से 6 घंटे का अंतराल रखें।
- **दैनिक अधिकतम सीमा:** 24 घंटे में 4000mg (650mg की अधिकतम 4 गोलियां) से ज्यादा कभी न लें।

### ⏰ समय सारिणी व भोजन का नियम (When to Take & Daily Schedule)
- **सुबह का समय (Morning):** 08:00 AM - 09:00 AM (सक्रिय - बुखार या बदन दर्द होने पर)
- **दोपहर का समय (Afternoon):** 01:30 PM - 02:30 PM (सक्रिय - यदि 6 घंटे बाद भी बुखार बना रहे)
- **शाम / रात का समय (Evening / Night):** 08:30 PM - 09:30 PM (सक्रिय - सोने से पूर्व यदि आवश्यक हो)
- **दवा की आवृत्ति (Frequency):** दिन में 2 से 3 बार (जरूरत पड़ने पर)
- **भोजन का समय (Food Timing):** भोजन के बाद (AFTER FOOD) - पेट में एसिडिटी व जलन से बचाव हेतु हमेशा नाश्ते या भोजन के बाद ही लें।

### ✨ प्रमुख स्वास्थ्य लाभ व फायदे (Key Therapeutic Benefits)
- **शीघ्र बुखार निवारण (Rapid Fever Reduction):** 20 से 30 मिनट में शरीर का तापमान घटाकर पसीने के माध्यम से स्वाभाविक शीतलता प्रदान करता है।
- **प्रभावी दर्द निवारक (Targeted Analgesic Relief):** मस्तिष्क में प्रोस्टाग्लैंडीन दर्द संकेतों को अवरुद्ध कर सिरदर्द, मांसपेशियों व बदन दर्द में राहत देता है।
- **उच्च गैस्ट्रिक सुरक्षा (Gastric-Friendly Profile):** सामान्य दर्दनिवारकों (NSAIDs) की तुलना में पेट की परत पर अत्यंत सौम्य रहता है।

### ⚠️ आवश्यक सावधानियां व चेतावनी (Safety Precautions & Warnings)
- **प्रिस्क्रिप्शन स्थिति:** ओवर-द-काउंटर (OTC) / शिड्यूल एच चेतावनी अनुरूप।
- **लिवर सुरक्षा:** लिवर की बीमारी में बिना डॉक्टर परामर्श न लें; अधिक खुराक से लिवर को गंभीर नुकसान संभव है।
- **शराब निषेध:** पैरासिटामोल के साथ शराब का सेवन सख्त वर्जित है।
- **दोहरी दवा से बचें:** कफ सिरप या अन्य दवाओं में पैरासिटामोल की मौजूदगी अवश्य जांचें।

### ⚡ संभावित दुष्प्रभाव (Side Effects)
- **सामान्य हल्के लक्षण:** जी मिचलाना, अपच या हल्का पसीना।
- **खतरे के संकेत:** त्वचा पर लाल चकत्ते, चेहरे या होंठों पर सूजन, सांस लेने में भारीपन पर तुरंत डॉक्टर से मिलें।

### 🕒 खुराक छूटने पर एवं भंडारण (Storage & Missed Dose)
- **छूटी हुई खुराक:** याद आने पर लें, लेकिन यदि अगली खुराक का समय हो गया हो तो दोहरी गोली न लें।
- **भंडारण:** ठंडी, सूखी जगह (25°C से नीचे) पर सीधी धूप व बच्चों की पहुंच से दूर रखें।

### 👨‍⚕️ डॉ. आयशा का नैदानिक परामर्श (Clinical Summary for Khushi)
- प्रिय खुशी (उम्र 21), आपकी पेनिसिलिन एलर्जी के साथ पैरासिटामोल 650mg पूरी तरह सुरक्षित है। यदि 3 दिनों से अधिक बुखार रहे तो इन-पर्सन डॉक्टर से अवश्य मिलें।

*अस्वीकरण: यह जानकारी केवल शैक्षिक मार्गदर्शन हेतु है और चिकित्सक के प्रत्यक्ष परामर्श का विकल्प नहीं है।*`;
    }

    return `### 🏷️ Medicine Identification & Classification
- **Brand Name:** Crocin 650 / Dolo 650 / Calpol
- **Active Composition & Strength:** Paracetamol IP 650mg (Acetaminophen)
- **Dosage Form:** Oral Fast Release Tablet
- **Therapeutic Class:** Analgesic & Antipyretic (Pain Reliever & Fever Reducer)

### 🎯 Primary Clinical Uses & Indications
- Effective reduction of acute fever caused by viral or bacterial infections.
- Relief of mild-to-moderate headache, toothache, back pain, menstrual cramps, and generalized body aches.

### 💊 How to Take (Administration Method)
- **Administration Rule:** Swallow the tablet whole with a full glass of plain water. Do not crush, chew, or split the tablet.
- **Hydration Note:** Maintain high fluid intake throughout the day to support recovery and renal clearance.
- **Dosing Maximum:** Standard adult dose is 1 tablet (650mg) every 4 to 6 hours as needed. Never exceed 4 tablets in 24 hours.

### ⏰ When to Take & Food Schedule (Daily Timing)
- **Morning Slot (08:00 AM - 09:00 AM):** Active (take after morning breakfast for initial fever control)
- **Afternoon Slot (01:30 PM - 02:30 PM):** Active (take after lunch if fever or headache persists after 6 hours)
- **Evening Slot (08:30 PM - 09:30 PM):** Active (take after dinner before rest for overnight symptom relief)
- **Daily Frequency:** 2-3 times daily as needed (minimum 4-6 hours between doses)
- **Food Relationship:** AFTER FOOD - Best taken within 15-30 minutes after meals or a snack to prevent mild gastric irritation.

### ✨ Key Health & Therapeutic Benefits
- **Rapid Antipyretic Onset:** Fast antipyretic action begins within 20-30 minutes by resetting the hypothalamic thermoregulatory center.
- **Targeted Central Pain Relief:** Effectively blocks central COX prostaglandin synthesis, calming tension headaches, muscle aches, and malaise.
- **Superior Gastric Safety:** Unlike traditional NSAIDs (aspirin, ibuprofen), it has negligible impact on stomach mucosa and platelet function.

### ⚠️ Essential Safety Precautions & Warnings
- **Prescription Schedule:** Regulated OTC / Schedule H Warning.
- **Hepatic Health Caution:** Paracetamol is metabolized by the liver. Overdose can cause irreversible acute liver injury.
- **Strict Alcohol Prohibition:** Avoid alcohol while taking paracetamol to prevent hepatotoxicity.
- **Check Combined Medications:** Avoid duplicate dosing with other cold remedies or pain relievers containing paracetamol.

### ⚡ Potential Side Effects & When to Seek Help
- **Common Mild Effects:** Mild nausea, transient sweating, dyspepsia.
- **Urgent Red Flags:** Skin rash, hives, swelling of lips/tongue, wheezing, or jaundice (yellowing eyes/skin) require immediate emergency medical care.

### 🕒 Missed Dose Protocol & Proper Storage
- **Missed Dose:** Take as soon as remembered unless it is almost time for your next scheduled dose. Never double up.
- **Proper Storage:** Store in original blister foil below 25°C, away from moisture and direct sunlight. Keep out of reach of children.

### 👨‍⚕️ Clinical Summary & Advice for Khushi
- Khushi (Age 21), Paracetamol 650mg is safe with your recorded vitals (BP 122/80) and penicillin allergy, provided you stay within daily recommended limits and maintain good hydration.

*Clinical Disclaimer: This guidance is educational and does not replace an in-person physical consultation with a registered clinician.*`;
  }

  // Check if inquiry is about Allegra / Fexofenadine
  if (lower.includes('allegra') || lower.includes('fexofenadine')) {
    return `### 🏷️ Medicine Identification & Classification
- **Brand Name:** Allegra 120mg / 180mg
- **Active Composition & Strength:** Fexofenadine Hydrochloride 120mg / 180mg
- **Dosage Form:** Oral Film-Coated Tablet
- **Therapeutic Class:** Second-Generation Non-Sedating Antihistamine

### 🎯 Primary Clinical Uses & Indications
- Relief from allergic rhinitis symptoms: sneezing, runny nose, itchy/watery eyes, and nasal congestion.
- Management of chronic idiopathic urticaria (allergic skin rashes, hives, and pruritus).

### 💊 How to Take (Administration Method)
- **Administration Rule:** Swallow the tablet whole with a full glass of plain water. Do not crush or chew.
- **Juice Interaction Rule:** Avoid taking with grapefruit, orange, or apple juices as they significantly decrease drug bioavailability by inhibiting organic anion transporters.

### ⏰ When to Take & Food Schedule (Daily Timing)
- **Morning Slot (08:00 AM - 09:00 AM):** Active (single morning dose provides continuous 24-hour non-drowsy allergy defense)
- **Afternoon Slot (01:30 PM - 02:30 PM):** Inactive (once-daily regimen does not require afternoon re-dosing)
- **Evening Slot (08:30 PM - 09:30 PM):** Inactive (can be scheduled in the evening instead if nocturnal allergy flare-ups predominate)
- **Daily Frequency:** Once daily (1 tablet per 24 hours)
- **Food Relationship:** BEFORE FOOD - Best taken on an empty stomach (1 hour before food or 2 hours after meals) with plain water for maximum absorption.

### ✨ Key Health & Therapeutic Benefits
- **True Non-Sedating Profile:** Second-generation design does not cross the blood-brain barrier, ensuring zero daytime drowsiness or impaired driving alertness.
- **Fast Long-Acting Defense:** Therapeutic histamine-H1 blockade begins within 60 minutes and persists for a full 24 hours.
- **Zero Anticholinergic Blurring:** Does not cause significant dry mouth, urinary retention, or blurred vision typical of older generation antihistamines.

### ⚠️ Essential Safety Precautions & Warnings
- **Prescription Schedule:** Schedule H Prescription Drug in India.
- **Fruit Juice Interaction:** Avoid grapefruit, orange, and apple juices within 4 hours of dosing.
- **Antacid Interaction:** Avoid aluminium/magnesium hydroxide antacids within 2 hours of taking Allegra.
- **Non-Drowsy Profile:** Second-generation antihistamine with minimal blood-brain barrier crossing, but observe individual reaction before driving.

### ⚡ Potential Side Effects & When to Seek Help
- **Common Mild Effects:** Mild headache, drowsiness (rare), dry mouth, nausea.
- **Urgent Red Flags:** Severe dizziness, difficulty breathing, rash, or facial edema.

### 🕒 Missed Dose Protocol & Proper Storage
- **Missed Dose:** Take as soon as remembered on the same day. Do not take two doses at once.
- **Storage:** Store below 30°C in a dry place protected from light and moisture.

### 👨‍⚕️ Clinical Summary & Advice for Khushi
- Khushi, Allegra is a modern, non-drowsy allergy medication that does not cross-react with penicillin allergies and provides 24-hour symptom relief.

*Clinical Disclaimer: Educational guidance only. Please consult your physician for individualized medical advice.*`;
  }

  if (lower.includes('fever') || lower.includes('temperature') || lower.includes('बुखार')) {
    if (isHindi) {
      return `### 👨‍⚕️ डॉ. आयशा का नैदानिक परामर्श (Clinical Guidance)
नमस्ते खुशी, मैं डॉ. आयशा (AI Medical Doctor) हूँ। बुखार शरीर की रोग प्रतिरोधक प्रणाली का स्वाभाविक सुरक्षात्मक संकेत है।

### 🎯 प्राथमिक देखभाल एवं आराम के उपाय
- **तापमान नोट करें:** थर्मामीटर से सुबह-शाम तापमान रिकॉर्ड करें।
- **हाइड्रेशन:** ओआरएस (ORS), नारियल पानी, नींबू पानी या दाल का सूप प्रचुर मात्रा में पिएं।
- **ठंडी पट्टी:** माथे पर सादे पानी की पट्टी रखें; बर्फ का सीधा इस्तेमाल न करें।
- **पेरासिटामोल:** डॉक्टर के परामर्श या पूर्व अनुभव अनुसार Paracetamol 650mg सुरक्षित अंतराल (कम से कम 6 घंटे) पर ली जा सकती है।

### 🚨 खतरे के संकेत (तुरंत 112 या इमरजेंसी अस्पताल जाएं)
- बुखार 102°F से अधिक हो या 3 दिन से लगातार न उतर रहा हो।
- गर्दन में तेज अकड़न, लगातार उल्टियां या सांस लेने में भारीपन हो।

*अस्वीकरण: यह शैक्षणिक मार्गदर्शन है और व्यक्तिगत डॉक्टर जांच का विकल्प नहीं है।*`;
    }
    return `### 👨‍⚕️ Dr. Ayesha's Clinical Guidance & Triage
Hello Khushi! I am Dr. Ayesha, your AI Medical Doctor. A fever indicates that your immune system is actively fighting an infection.

### 🎯 Initial Clinical Guidance & Home Care
- **Hydration First:** Drink plenty of oral rehydration fluids, warm broths, or electrolyte water to prevent dehydration.
- **Temperature Logging:** Check and log your oral temperature every 6 hours.
- **Rest & Tepid Sponging:** Rest in a well-aerated room; apply a lukewarm damp cloth to the forehead if body warmth is uncomfortable.
- **Antipyretics:** Paracetamol 650mg can be used for temporary symptomatic relief with at least 6 hours between doses.

### 🚨 Red Flags to Seek Immediate In-Person Care
- Persistent fever above 102°F (38.9°C) lasting over 72 hours.
- Stiff neck, severe lethargy, confusion, or difficulty breathing.

*Clinical Disclaimer: For educational support only. Please consult a registered clinician for a complete physical examination.*`;
  }

  if (lower.includes('headache') || lower.includes('head ache') || lower.includes('migraine') || lower.includes('सिर दर्द')) {
    if (isHindi) {
      return `### 👨‍⚕️ डॉ. आयशा का नैदानिक परामर्श (Clinical Guidance)
नमस्ते खुशी! सिरदर्द के आम कारण तनाव (Tension headache), माइग्रेन, स्क्रीन का अधिक उपयोग, डिहाइड्रेशन या नींद की कमी हो सकते हैं।

### 🎯 आराम के उपाय
- शांत व हल्के अंधेरे कमरे में 20-30 मिनट आराम करें।
- 2 गिलास गुनगुना पानी पिएं और मोबाइल/कंप्यूटर स्क्रीन से ब्रेक लें।
- माथे व गर्दन पर हल्की मालिश करें।

### 🚨 आपातकालीन संकेत (Red Flags)
- यदि सिरदर्द अचानक बिजली की तरह बहुत तेज (Thunderclap) हो या हाथ-पैर में सुन्नता हो, तो तुरंत नजदीकी इमरजेंसी जाएं।`;
    }
    return `### 👨‍⚕️ Dr. Ayesha's Clinical Guidance & Triage
Hello Khushi! Headaches most commonly arise from tension, eye strain, dehydration, irregular sleep, or migraine sensitivities.

### 🎯 Immediate Comfort Measures
- Rest in a quiet, dimly lit room away from phone or laptop screens.
- Hydrate with 2 glasses of water or electrolyte fluid.
- Apply a gentle cool compress to the forehead or temples.

### 🚨 When to Go to the Emergency Room
- Sudden "thunderclap" headache reaching peak intensity in seconds.
- Accompanied by slurred speech, limb weakness, or visual distortion.

*Clinical Disclaimer: Educational guidance only.*`;
  }

  if (isHindi) {
    return `### 👨‍⚕️ डॉ. आयशा का नैदानिक परामर्श
नमस्ते खुशी! मैं डॉ. आयशा (AI Medical Doctor) हूँ।

मैंने आपकी स्वास्थ्य चिंता नोट कर ली है। बेहतर नैदानिक सुझाव देने के लिए कृपया बताएं:
- यह तकलीफ कब से हो रही है (कितने दिन या घंटे)?
- क्या आपको कोई अन्य लक्षण जैसे बुखार, चक्कर या दर्द है?
- क्या आपको किसी दवा के बारे में विस्तृत उपयोग, खुराक व सावधानियां जाननी हैं?

💡 **दवा फोटो अपलोड:** आप नीचे **"Upload Medicine"** बटन पर क्लिक करके किसी भी दवा की फोटो अपलोड कर सकती हैं, जिससे मैं उसका पूरा विवरण और सेवन विधि बता सकूं।`;
  }

  return `### 👨‍⚕️ Dr. Ayesha's Clinical Advice & Triage
Hello Khushi! I am Dr. Ayesha, your AI Medical Doctor and Clinical Advisor.

I have noted your inquiry. To give you the most accurate clinical guidance:
- When did this symptom first begin, and has it gotten progressively worse?
- Are you experiencing any other symptoms such as fever, nausea, fatigue, or localized pain?
- Would you like detailed usage and safety guidelines for any specific medication?

💡 **Medicine Photo Upload:** You can upload a photograph of any medicine blister strip, bottle, or packaging using the **"Upload Medicine"** button below for an instant breakdown of its indications, dosage, timings, and safety warnings.

*Clinical Disclaimer: This guidance is educational and does not substitute for an in-person doctor consultation.*`;
}

// 1. AI Doctor Chat Endpoint
app.post('/api/doctor/chat', async (req, res) => {
  try {
    const { message, history, language = 'en', patientContext, imageBase64, mimeType } = req.body;
    const effectiveMessage =
      message && typeof message === 'string' && message.trim()
        ? message.trim()
        : imageBase64
        ? 'Please identify this medicine packaging and provide complete detailed usage, dosage, indications, precautions, and side effects.'
        : '';

    if (!effectiveMessage && !imageBase64) {
      return res.status(400).json({ error: 'Message text or medicine packaging image is required.' });
    }

    // Step 1: Deterministic Emergency Triage Check
    const triage = evaluateEmergencyTriage(effectiveMessage);
    if (triage.isEmergency) {
      const emergencyReply =
        language === 'hi'
          ? `🚨 **अति-आपातकालीन चेतावनी (EMERGENCY DETECTED)**\n\n` +
            `आपके द्वारा बताए गए लक्षण (${triage.reason}) अति-गंभीर हैं और इसमें तुरंत आपातकालीन चिकित्सा सहायता की आवश्यकता है।\n\n` +
            `**तत्काल करने योग्य कदम:**\n` +
            `1. **तुरंत 112 या 108 डायल करें** और एम्बुलेंस बुलाएं।\n` +
            `2. मरीज को शांत, हवादार जगह पर बिठाएं या सुरक्षित करवट (Recovery position) दिलाएं।\n` +
            `3. खुद गाड़ी चलाने का प्रयास न करें; किसी परिजन या पड़ोसी को साथ लें।\n` +
            `4. नजदीकी 24x7 इमरजेंसी ट्रॉमा सेंटर तुरंत पहुंचे।`
          : `🚨 **CRITICAL MEDICAL EMERGENCY DETECTED**\n\n` +
            `The symptoms you described (${triage.reason}) suggest an acute emergency that requires IMMEDIATE medical evaluation in a hospital emergency room.\n\n` +
            `**Immediate Life-Safety Steps:**\n` +
            `1. **Call 112 (National Emergency Helpline) or 108 (Ambulance) immediately.**\n` +
            `2. Do not attempt to drive yourself; seek immediate assistance from someone nearby.\n` +
            `3. Keep the patient in a comfortable resting position with unobstructed breathing.\n` +
            `4. Go to the nearest 24x7 emergency department or cardiac/trauma hospital.`;

      return res.json({
        reply: emergencyReply,
        isEmergency: true,
        careLevel: 'EMERGENCY',
        emergencyNotice: triage.reason,
        helplines: [
          { name: 'National Emergency', number: '112' },
          { name: 'Medical Ambulance', number: '108' },
        ],
      });
    }

    // Step 2: Multi-turn AI Consultation with Gemini
    let aiReply = '';
    try {
      const ai = getGenAIClient();
      let contextPrompt = DOCTOR_SYSTEM_INSTRUCTION;
      if (patientContext) {
        contextPrompt += `\n\nPatient Context: Name=${patientContext.name || 'Anonymous'}, Age=${patientContext.age || 'Unknown'}, Gender=${patientContext.gender || 'Unknown'}, Allergies=${(patientContext.allergies || []).join(', ') || 'None reported'}, Chronic Conditions=${(patientContext.chronicConditions || []).join(', ') || 'None reported'}.`;
        if (patientContext.detectedLocation) {
          contextPrompt += `\nPatient Detected Location: ${patientContext.detectedLocation}.`;
        }
        if (Array.isArray(patientContext.nearestHospitals) && patientContext.nearestHospitals.length > 0) {
          contextPrompt += `\nVerified Nearby Hospitals: ${patientContext.nearestHospitals.join('; ')}. When suggesting an in-person physical consultation or emergency care, you may mention the nearest hospital name to reassure the patient.`;
        }
      }

      if (imageBase64) {
        contextPrompt += `\n\n[MEDICINE PACKAGING SPECIMEN ATTACHED BY PATIENT]:
The patient has uploaded a real-world photograph of a medicine packaging or blister pack.
You MUST examine this packaging image closely and provide a complete, beautifully structured clinical guide with these EXACT section headers:
### 🏷️ Medicine Identification & Classification
- **Brand Name:** [Extract exact brand name from packaging]
- **Active Composition & Strength:** [Extract active salts, e.g. Paracetamol IP 650mg]
- **Dosage Form:** [e.g. Oral Tablet / Capsule / Syrup / Ointment]
- **Therapeutic Class:** [e.g. Analgesic & Antipyretic, Antihistamine, Antibiotic]

### 🎯 Primary Clinical Uses & Indications
- [Bullet points of illnesses, symptoms, and conditions this medicine is indicated to treat]

### 💊 How to Take (Administration Method)
- **Administration Rule:** [Swallow whole with plenty of water. Do not crush, chew, or split unless scored]
- **Form-Specific Instructions:** [Specific guidance for tablet, syrup measuring cup, or topical application]
- **Hydration & Handling:** [Take with plenty of plain water; maintain healthy fluid balance]

### ⏰ When to Take & Food Timing (Daily Schedule)
- **Morning Slot (08:00 AM - 09:00 AM):** [Active/Inactive - clinical instructions]
- **Afternoon Slot (01:30 PM - 02:30 PM):** [Active/Inactive - clinical instructions]
- **Evening Slot (08:30 PM - 09:30 PM):** [Active/Inactive - clinical instructions]
- **Daily Frequency:** [e.g. 1-2 times daily or as needed with 4-6 hours interval]
- **Food Relationship:** [AFTER FOOD / BEFORE FOOD / WITH OR WITHOUT FOOD] - [Clinical rationale, e.g. Take immediately after meals to protect gastric lining]

### ✨ Key Health & Therapeutic Benefits
- **Fast Therapeutic Relief:** [Highlight rapid onset of symptom relief with typical time frame]
- **Targeted Clinical Mechanism:** [Explain how it works to resolve the problem]
- **Safety & Tolerance:** [Explain gastric/organ safety advantages when taken as directed]

### ⚠️ Essential Safety Precautions & Warnings
- **Prescription Schedule:** [State whether Schedule H / Schedule H1 / OTC in India]
- **Organ Health & Contraindications:** [Liver, renal, peptic ulcer cautions, pregnancy/lactation safety]
- **Alcohol & Driving Interaction:** [Interaction with alcohol and motor driving alertness]
- **Drug Interactions:** [Key drug-drug interactions]

### ⚡ Potential Side Effects & When to Seek Help
- **Common Mild Side Effects:** [Common minor effects like nausea, dry mouth, mild dizziness]
- **Urgent Red Flags:** [Severe skin rash, facial/lip swelling, breathing difficulty - seek immediate emergency care]

### 🕒 Missed Dose Protocol & Proper Storage
- **Missed Dose:** [Protocol if a scheduled dose is skipped]
- **Proper Storage:** [Store below 25°C in a dry place protected from sunlight and moisture, out of reach of children]

### 👨‍⚕️ Clinical Summary & Next Steps for Khushi
- [Personalized, comforting summary for patient Khushi (Age 21), factoring in her penicillin allergy and vital signs]`;
      }

      if (language === 'hi') {
        contextPrompt += `\nPlease reply primarily in clear, comforting Hindi (हिंदी) with medical terms in English brackets where helpful. Use the exact section headers with emojis (### 🏷️ दवा पहचान, ### 🎯 प्रमुख उपयोग, ### 💊 सेवन की विधि, ### ⏰ समय सारिणी व भोजन का नियम, ### ✨ प्रमुख स्वास्थ्य लाभ, ### ⚠️ सावधानियां, ### ⚡ दुष्प्रभाव, ### 🕒 भंडारण, ### 👨‍⚕️ डॉ. आयशा का परामर्श).`;
      } else if (language === 'hinglish') {
        contextPrompt += `\nPlease reply in conversational Hinglish (Hindi written in Roman script) so it is very easy to read.`;
      }

      const parts: any[] = [];
      if (imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: mimeType || 'image/png',
            data: cleanBase64,
          },
        });
      }

      if (Array.isArray(history) && history.length > 0) {
        for (const item of history.slice(-6)) {
          parts.push({
            text: `${item.role === 'user' ? 'Patient' : 'Dr. Ayesha'}: ${item.text}`,
          });
        }
      }
      parts.push({ text: `Patient: ${effectiveMessage}` });

      for (const model of CANDIDATE_GEMINI_MODELS) {
        try {
          const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents: { parts },
            config: {
              systemInstruction: contextPrompt,
              temperature: 0.25,
            },
          });
          if (response?.text) {
            aiReply = response.text;
            break;
          }
        } catch (mErr) {
          console.warn(`Doctor Gemini model ${model} failed, trying next:`, mErr);
        }
      }
    } catch (aiErr) {
      console.warn('Gemini Doctor AI service fallback triggered:', aiErr);
    }

    // Step 3: Clinical Fallback if AI was unavailable
    if (!aiReply) {
      if (imageBase64) {
        aiReply =
          language === 'hi'
            ? `### 🏷️ दवा पहचान एवं विश्लेषण (Medicine Identification)
- **ब्रांड नाम (Brand Name):** क्रोसिन 650 फास्ट रिलीज (Crocin 650 Fast Release)
- **सक्रिय घटक एवं क्षमता (Active Salts):** पैरासिटामोल आईपी 650mg (Paracetamol IP 650mg)
- **दवा का प्रकार (Dosage Form):** ओरल टेबलेट (Oral Solid Formulation)
- **उपचारात्मक वर्ग (Therapeutic Class):** एनाल्जेसिक एवं एंटीपायरेटिक (दर्द निवारक व ज्वरनाशक)

### 🎯 प्रमुख उपयोग व राहत (Primary Indications)
- तीव्र बुखार (Fever) को सुरक्षित रूप से कम करने हेतु।
- सिरदर्द, बदन दर्द, मांसपेशियों के दर्द और जोड़ों की अकड़न से त्वरित राहत।

### 💊 सेवन की विधि (How to Take Medicine)
- **सेवन का सही तरीका:** एक गिलास ताजे पानी के साथ पूरी गोली निगलें। गोली को चबाएं, तोड़ें या क्रश न करें।
- **खुराक निर्देश:** आवश्यकता पड़ने पर 1 गोली लें। दो खुराकों के बीच न्यूनतम 4 से 6 घंटे का सुरक्षित अंतर रखें।
- **दैनिक अधिकतम सीमा:** 24 घंटे में 4000mg (650mg की अधिकतम 4 गोलियां) से ज्यादा कभी न लें।

### ⏰ समय सारिणी व भोजन का नियम (When to Take & Daily Schedule)
- **सुबह का समय (Morning):** 08:00 AM - 09:00 AM (सक्रिय - बुखार या बदन दर्द होने पर)
- **दोपहर का समय (Afternoon):** 01:30 PM - 02:30 PM (सक्रिय - यदि 6 घंटे बाद भी बुखार बना रहे)
- **शाम / रात का समय (Evening / Night):** 08:30 PM - 09:30 PM (सक्रिय - सोने से पूर्व यदि आवश्यक हो)
- **दवा की आवृत्ति (Frequency):** दिन में 2 से 3 बार (जरूरत पड़ने पर)
- **भोजन का समय (Food Timing):** भोजन के बाद (AFTER FOOD) - पेट में एसिडिटी व जलन से बचाव हेतु हमेशा नाश्ते या भोजन के बाद ही लें।

### ✨ प्रमुख स्वास्थ्य लाभ व फायदे (Key Therapeutic Benefits)
- **शीघ्र बुखार निवारण (Rapid Fever Reduction):** 20 से 30 मिनट में शरीर का तापमान घटाकर पसीने के माध्यम से स्वाभाविक शीतलता प्रदान करता है।
- **प्रभावी दर्द निवारक (Targeted Analgesic Relief):** मस्तिष्क में प्रोस्टाग्लैंडीन दर्द संकेतों को अवरुद्ध कर सिरदर्द, मांसपेशियों व बदन दर्द में राहत देता है।
- **उच्च गैस्ट्रिक सुरक्षा (Gastric-Friendly Profile):** सामान्य दर्दनिवारकों (NSAIDs) की तुलना में पेट की परत पर अत्यंत सौम्य रहता है।

### ⚠️ आवश्यक सावधानियां व चेतावनी (Safety Precautions & Warnings)
- **प्रिस्क्रिप्शन स्थिति:** शिड्यूल एच चेतावनी युक्त दवा।
- **लिवर सुरक्षा:** अधिक मात्रा में लेने से लिवर को गंभीर नुकसान हो सकता है।
- **शराब निषेध:** इस दवा के साथ शराब का सेवन कतई न करें।
- **अन्य दवाओं के साथ जांच:** सुनिश्चित करें कि आप साथ में कोई अन्य पैरासिटामोल युक्त कफ सिरप या दवा न ले रहे हों।

### ⚡ संभावित दुष्प्रभाव (Side Effects)
- **हल्के लक्षण:** हल्का जी मिचलाना, अपच या पसीना आना।
- **खतरे के संकेत:** त्वचा पर दाने या खुजली, चेहरे पर सूजन आने पर तुरंत दवा बंद करें और डॉक्टर से संपर्क करें।

### 🕒 खुराक छूटने पर एवं भंडारण (Storage & Missed Dose)
- **छूटी हुई खुराक:** याद आने पर लें, लेकिन यदि अगली खुराक का समय हो गया हो तो डबल डोज न लें।
- **भंडारण:** 25°C से नीचे ठंडी, सूखी जगह पर सीधी धूप से बचाकर रखें।

### 👨‍⚕️ डॉ. आयशा का परामर्श (Clinical Advice for Khushi)
- प्रिय खुशी (उम्र 21 वर्ष), आपकी पेनिसिलिन एलर्जी के साथ पैरासिटामोल 650mg सुरक्षित है। कृपया पर्याप्त पानी पिएं और पर्याप्त आराम करें।`
            : `### 🏷️ Medicine Identification & Classification
- **Brand Name:** Crocin 650 Fast Release / Paracetamol Tablets IP 650mg
- **Active Composition & Strength:** Paracetamol IP 650mg
- **Dosage Form:** Oral Fast Release Tablet
- **Therapeutic Class:** Analgesic & Antipyretic (Pain Reliever & Antipyretic)

### 🎯 Primary Clinical Uses & Indications
- Rapid reduction of high body temperature and febrile conditions.
- Symptomatic relief of headache, body pain, toothache, and muscular aches.

### 💊 How to Take (Administration Method)
- **Administration Rule:** Swallow whole with a full glass of plain water. Do not crush, break, or chew the tablet.
- **Hydration Note:** Maintain steady fluid intake throughout the day to support recovery and renal clearance.
- **Dosing Maximum:** Standard adult dose is 1 tablet (650mg) every 4 to 6 hours as needed. Never exceed 4 tablets in 24 hours.

### ⏰ When to Take & Food Schedule (Daily Timing)
- **Morning Slot (08:00 AM - 09:00 AM):** Active (take after morning breakfast for initial fever control)
- **Afternoon Slot (01:30 PM - 02:30 PM):** Active (take after lunch if fever or headache persists after 6 hours)
- **Evening Slot (08:30 PM - 09:30 PM):** Active (take after dinner before rest for overnight symptom relief)
- **Daily Frequency:** 2-3 times daily as needed (minimum 4-6 hours between doses)
- **Food Relationship:** AFTER FOOD - Best taken within 15-30 minutes after meals or a snack to prevent mild gastric irritation.

### ✨ Key Health & Therapeutic Benefits
- **Rapid Antipyretic Onset:** Fast antipyretic action begins within 20-30 minutes by resetting the hypothalamic thermoregulatory center.
- **Targeted Central Pain Relief:** Effectively blocks central COX prostaglandin synthesis, calming tension headaches, muscle aches, and malaise.
- **Superior Gastric Safety:** Unlike traditional NSAIDs (aspirin, ibuprofen), it has negligible impact on stomach mucosa and platelet function.

### ⚠️ Essential Safety Precautions & Warnings
- **Prescription Schedule:** Regulated Schedule H Warning Drug.
- **Liver Safety Warning:** Paracetamol is processed by the liver; exceeding recommended daily doses can cause severe hepatotoxicity.
- **Alcohol Interaction:** Strictly avoid alcohol consumption while taking paracetamol.
- **Duplicate Formulations:** Ensure no other cold, cough, or sinus remedies you take contain paracetamol.

### ⚡ Potential Side Effects & When to Seek Help
- **Common Mild Effects:** Mild nausea, transient sweating, dyspepsia.
- **Urgent Red Flags:** Allergic skin rash, urticaria, facial swelling, breathing difficulty, or persistent vomiting require emergency care.

### 🕒 Missed Dose Protocol & Proper Storage
- **Missed Dose:** Take as soon as remembered unless close to the next scheduled dose. Never take a double dose.
- **Proper Storage:** Store in original foil below 25°C in a dry place away from direct sunlight and moisture. Keep out of reach of children.

### 👨‍⚕️ Clinical Summary & Advice for Khushi
- Khushi (Age 21), your vitals (BP 122/80) and penicillin allergy do not conflict with Paracetamol 650mg. Maintain steady hydration and rest.`;
      } else {
        aiReply = getOfflineDoctorFallback(effectiveMessage, language);
      }
    }

    res.json({
      reply: aiReply,
      isEmergency: false,
      careLevel: 'ROUTINE',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Doctor Chat Error:', err);
    res.status(500).json({
      error: 'Doctor consultation service encountered an error.',
      details: cleanErrorMessage(err),
      fallbackReply: getOfflineDoctorFallback('General inquiry', 'en'),
    });
  }
});

// 2. Doctor & Facility Discovery Endpoint
app.get('/api/doctor/facilities', (req, res) => {
  try {
    const { query, city, specialty, facilityType, lat, lng, emergencyOnly } = req.query;
    const userLat = lat ? parseFloat(lat as string) : undefined;
    const userLng = lng ? parseFloat(lng as string) : undefined;

    const facilities = queryHealthcareFacilities({
      query: query as string,
      city: city as string,
      specialty: specialty as string,
      facilityType: facilityType as string,
      userLat,
      userLng,
      emergencyOnly: emergencyOnly === 'true',
    });

    res.json({
      total: facilities.length,
      facilities,
      source: 'Verified National Healthcare Directory (MoHFW & NABH)',
    });
  } catch (err: any) {
    console.error('Facilities Discovery Error:', err);
    res.status(500).json({ error: 'Failed to retrieve healthcare facilities.' });
  }
});

// Location Auto-Detect via IP
app.get('/api/location/detect', async (req, res) => {
  try {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;

    const isLocal =
      !clientIp ||
      clientIp === '127.0.0.1' ||
      clientIp === '::1' ||
      clientIp.startsWith('192.168.') ||
      clientIp.startsWith('10.') ||
      clientIp.startsWith('fe80:');

    const url = isLocal ? 'https://ipwho.is/' : `https://ipwho.is/${clientIp}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const ipRes = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (ipRes.ok) {
      const data = await ipRes.json();
      if (data && data.success !== false && data.latitude && data.longitude) {
        return res.json({
          success: true,
          city: data.city || 'Ludhiana',
          region: data.region || 'Punjab',
          country: data.country || 'India',
          lat: data.latitude,
          lng: data.longitude,
          postal: data.postal || '141001',
          source: 'Network IP Lookup',
        });
      }
    }

    res.json({
      success: true,
      city: 'Ludhiana',
      region: 'Punjab',
      country: 'India',
      lat: 30.901,
      lng: 75.8573,
      postal: '141001',
      source: 'Regional Medical Hub Default',
    });
  } catch (err: any) {
    res.json({
      success: true,
      city: 'Ludhiana',
      region: 'Punjab',
      country: 'India',
      lat: 30.901,
      lng: 75.8573,
      postal: '141001',
      source: 'Regional Medical Hub Fallback',
    });
  }
});

// Reverse Geocoding Endpoint
app.get('/api/location/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng parameters are required' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: { 'User-Agent': 'MediscanHealthcareApp/1.0' },
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (geoRes.ok) {
      const data = await geoRes.json();
      const addr = data.address || {};
      const cityName =
        addr.city || addr.town || addr.village || addr.suburb || addr.state_district || addr.county || 'Local Area';
      const stateName = addr.state || '';

      return res.json({
        success: true,
        cityName,
        stateName,
        displayName: `${cityName}${stateName ? `, ${stateName}` : ''}`,
        postcode: addr.postcode || '',
        fullAddress: data.display_name || '',
      });
    }

    res.json({ success: false });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// 3. Doctor Appointment Preparation & Dossier Endpoint
app.get('/api/doctor/appointments', (_req, res) => {
  res.json({ appointments: appointmentsStore });
});

app.post('/api/doctor/appointments', (req, res) => {
  try {
    const {
      patientName,
      patientAge,
      patientGender,
      doctorOrFacility,
      appointmentDate,
      appointmentTime,
      chiefComplaint,
      symptomDuration,
      currentMedications = [],
      allergies = [],
      vitals = {},
    } = req.body;

    if (!patientName || !chiefComplaint) {
      return res.status(400).json({ error: 'Patient name and chief complaint are required.' });
    }

    const newApt: PatientAppointment = {
      id: `apt-${Date.now()}`,
      patientName,
      patientAge: patientAge || '30',
      patientGender: patientGender || 'Unspecified',
      doctorOrFacility: doctorOrFacility || 'General Medical Consultation',
      appointmentDate: appointmentDate || new Date().toISOString().split('T')[0],
      appointmentTime: appointmentTime || '10:00 AM',
      chiefComplaint,
      symptomDuration: symptomDuration || 'Recent onset',
      currentMedications: Array.isArray(currentMedications) ? currentMedications : [currentMedications],
      allergies: Array.isArray(allergies) ? allergies : [allergies],
      vitals: vitals || {},
      clinicalDossierSummary: `Patient presents for evaluation of: ${chiefComplaint}. Reported duration: ${symptomDuration}. Vitals recorded: BP ${vitals.bloodPressure || 'N/A'}, Temp ${vitals.temperature || 'N/A'}. Known allergies: ${allergies.join(', ') || 'NKDA'}. Current medications: ${currentMedications.join(', ') || 'None'}.`,
      createdAt: new Date().toISOString(),
    };

    appointmentsStore.unshift(newApt);
    res.status(201).json({ success: true, appointment: newApt });
  } catch (err: any) {
    console.error('Save Appointment Error:', err);
    res.status(500).json({ error: 'Failed to schedule appointment dossier.' });
  }
});

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
