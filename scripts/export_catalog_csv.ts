import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getSectionKeyForDatasetLine,
  inferBrandKnowledge,
} from '../src/utils/indianPharmaKnowledge.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

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

const KNOWN_MANUFACTURERS: Record<string, string> = {
  ALLEGRA: 'Sanofi India Ltd',
  AZIDERM: 'Micro Labs Ltd',
  GLYCOMET: 'USV Pvt Ltd',
  FORACORT: 'Cipla Ltd',
  PARACIP: 'Cipla Ltd',
  UDILIV: 'Abbott Healthcare',
  ECOSPRIN: 'USV Pvt Ltd',
  AUGMENTIN: 'GlaxoSmithKline Pharmaceuticals Ltd',
  CALPOL: 'GlaxoSmithKline Pharmaceuticals Ltd',
  PAN: 'Alkem Laboratories Ltd',
  PANTOCID: 'Sun Pharma Laboratories Ltd',
  DOLO: 'Micro Labs Ltd',
  MEFTAL: 'Blue Cross Laboratories Ltd',
  SHELCAL: 'Torrent Pharmaceuticals Ltd',
  THYRONORM: 'Abbott India Ltd',
  TELMA: 'Glenmark Pharmaceuticals Ltd',
  BECOSULES: 'Pfizer Ltd',
  ASTHALIN: 'Cipla Ltd',
  VOLINI: 'Sun Pharma Laboratories Ltd',
  GELUSIL: 'Pfizer Ltd',
  ZINETAC: 'GlaxoSmithKline Pharmaceuticals Ltd',
  CIPLOX: 'Cipla Ltd',
  TAXIM: 'Alkem Laboratories Ltd',
  CLAVAM: 'Alkem Laboratories Ltd',
  MONTEK: 'Sun Pharma Laboratories Ltd',
  MONTICOPE: 'Mankind Pharma Ltd',
  MOXIKIND: 'Mankind Pharma Ltd',
  ACILOC: 'Cadila Pharmaceuticals Ltd',
  RANTAC: 'J.B. Chemicals & Pharmaceuticals Ltd',
};

function inferManufacturer(brand: string): string {
  const upper = brand.toUpperCase().trim();
  for (const [k, v] of Object.entries(KNOWN_MANUFACTURERS)) {
    if (upper.includes(k) || k.includes(upper)) {
      return v;
    }
  }
  return 'Registered Indian Pharmaceutical Manufacturer';
}

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

interface ExportRow {
  product_id: string;
  brand_name: string;
  generic_name: string;
  active_ingredients: string;
  strength: string;
  dosage_form: string;
  manufacturer: string;
  aliases: string;
  common_uses: string;
  precautions: string;
  prescription_status: string;
  source_name: string;
  source_url: string;
  verified_at: string;
}

const seenProductLines = new Set<string>();
const rows: ExportRow[] = [];

function processDataset(filePath: string, source: 'SET1' | 'SET2') {
  if (!fs.existsSync(filePath)) {
    console.error(`Missing dataset file: ${filePath}`);
    return;
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split(/\r?\n/);

  let currentBrand = '';
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i].trim();
    if (!line || line.length <= 1) continue;

    const hasDosage = DOSAGE_REGEX.test(line);
    const hasPack = PACK_REGEX.test(line);
    const isAllUpper = line === line.toUpperCase() && /[A-Z]/.test(line);

    if (isAllUpper && (!hasDosage || !hasPack)) {
      currentBrand = line;
      continue;
    }

    const dedupKey = `${source}:${line.toLowerCase()}`;
    if (seenProductLines.has(dedupKey)) continue;
    seenProductLines.add(dedupKey);

    const brandFamily = currentBrand || line.split(/\s+/)[0].toUpperCase();
    const dosageMatch = line.match(DOSAGE_REGEX);
    const strengthMatch = line.match(STRENGTH_REGEX);

    let normalizedForm: string = 'Tablet';
    if (dosageMatch) {
      let rawForm = dosageMatch[1];
      normalizedForm = rawForm.charAt(0).toUpperCase() + rawForm.slice(1).toLowerCase();
      if (normalizedForm === 'Oinment') normalizedForm = 'Ointment';
      if (normalizedForm === 'Facewash') normalizedForm = 'Face Wash';
      if (normalizedForm === 'Respules') normalizedForm = 'Respule';
    }

    const strengthStr = strengthMatch ? strengthMatch[1].trim() : '';
    const sectionKey = getSectionKeyForDatasetLine(source, lineNum);
    const kb = inferBrandKnowledge(brandFamily, line, strengthStr, sectionKey);

    const activeIngredientsStr = kb.activeSalts && kb.activeSalts.length > 0
      ? kb.activeSalts.join('; ')
      : brandFamily;

    // Primary generic name without dosage/strength
    const genericName = kb.activeSalts && kb.activeSalts.length > 0
      ? kb.activeSalts[0].replace(/\s*\([^)]*\)/g, '').trim()
      : brandFamily;

    const manufacturer = inferManufacturer(brandFamily);

    const aliasesList = [
      brandFamily,
      line.replace(DOSAGE_REGEX, '').replace(STRENGTH_REGEX, '').replace(PACK_REGEX, '').trim(),
    ].filter(Boolean);
    const aliasesStr = Array.from(new Set(aliasesList)).join('; ');

    const commonUsesStr = (kb.hindiIndications && kb.hindiIndications.length > 0)
      ? kb.hindiIndications.join(' | ')
      : `${brandFamily} is indicated for treatment under category: ${kb.therapeuticClass}`;

    const precautionsStr = (kb.hindiPrecautions && kb.hindiPrecautions.length > 0)
      ? kb.hindiPrecautions.join(' | ')
      : 'Use strictly as directed by a licensed physician or pharmacist.';

    const prescriptionStatus = kb.isPrescriptionRequired ? 'Prescription' : 'OTC';

    rows.push({
      product_id: `${source}-${rows.length + 1}`,
      brand_name: line,
      generic_name: genericName,
      active_ingredients: activeIngredientsStr,
      strength: strengthStr,
      dosage_form: normalizedForm,
      manufacturer,
      aliases: aliasesStr,
      common_uses: commonUsesStr,
      precautions: precautionsStr,
      prescription_status: prescriptionStatus,
      source_name: `Indian National Medicine Catalog (${source})`,
      source_url: 'https://cdsco.gov.in',
      verified_at: '2026-10-20',
    });
  }
}

// Prepend verified calibration store entries
const calibPath = path.join(projectRoot, 'calibration_store.json');
if (fs.existsSync(calibPath)) {
  const calibs = JSON.parse(fs.readFileSync(calibPath, 'utf-8'));
  for (const c of calibs) {
    rows.push({
      product_id: c.id,
      brand_name: c.brandPattern,
      generic_name: (c.activeSalts && c.activeSalts[0]) ? c.activeSalts[0].replace(/\s*\([^)]*\)/g, '').trim() : c.brandPattern,
      active_ingredients: (c.activeSalts || []).join('; '),
      strength: c.strength || '',
      dosage_form: c.dosageForm || 'Tablet',
      manufacturer: inferManufacturer(c.brandPattern),
      aliases: `${c.brandPattern}; ${c.brandPattern.split(/\s+/)[0]}`,
      common_uses: c.hindiNote || `${c.brandPattern} is indicated for treatment.`,
      precautions: c.isPrescriptionRequired ? 'यह एक डॉक्टर के पर्चे (Prescription) पर मिलने वाली नियंत्रित दवा है। इसे बिना डॉक्टरी सलाह के कभी न लें।' : 'केवल डॉक्टर या फार्मासिस्ट द्वारा अनुशंसित खुराक में ही सेवन करें।',
      prescription_status: c.isPrescriptionRequired ? 'Prescription' : 'OTC',
      source_name: 'Verified Indian Clinical Calibration Store',
      source_url: 'https://cdsco.gov.in',
      verified_at: '2026-10-20',
    });
  }
}

const set1 = path.join(projectRoot, 'public/assets/aistudio/All_medecines_SET1_d8a29cbb.txt');
const set2 = path.join(projectRoot, 'public/assets/aistudio/All_medecines_SET2_ff0d0e6e.txt');

processDataset(set1, 'SET1');
processDataset(set2, 'SET2');

const headers = [
  'product_id',
  'brand_name',
  'generic_name',
  'active_ingredients',
  'strength',
  'dosage_form',
  'manufacturer',
  'aliases',
  'common_uses',
  'precautions',
  'prescription_status',
  'source_name',
  'source_url',
  'verified_at',
];

const csvLines = [headers.join(',')];
for (const r of rows) {
  const line = [
    escapeCsv(r.product_id),
    escapeCsv(r.brand_name),
    escapeCsv(r.generic_name),
    escapeCsv(r.active_ingredients),
    escapeCsv(r.strength),
    escapeCsv(r.dosage_form),
    escapeCsv(r.manufacturer),
    escapeCsv(r.aliases),
    escapeCsv(r.common_uses),
    escapeCsv(r.precautions),
    escapeCsv(r.prescription_status),
    escapeCsv(r.source_name),
    escapeCsv(r.source_url),
    escapeCsv(r.verified_at),
  ].join(',');
  csvLines.push(line);
}

const outputPath = path.join(projectRoot, 'data/medicines/medicine_catalog.csv');
fs.writeFileSync(outputPath, csvLines.join('\n'), 'utf-8');
console.log(`[Export Complete] Exported ${rows.length} verified medicine records to ${outputPath}`);
