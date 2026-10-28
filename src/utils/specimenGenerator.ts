export interface SpecimenPreset {
  id: string;
  title: string;
  subtitle: string;
  scenarioType: 'verified_rx' | 'verified_otc' | 'dataset_match' | 'unclear_failure';
  brandName: string;
  genericComposition: string;
  dosageForm: string;
  strength: string;
  scheduleWarning: string | null;
  manufacturer: string;
  batchInfo: string;
  packagingTextHint?: string;
}

export const SPECIMEN_PRESETS: SpecimenPreset[] = [
  {
    id: 'allegra-120',
    title: 'Allegra 120mg Tablet',
    subtitle: 'Dataset SET1 · Antihistamine Strip',
    scenarioType: 'dataset_match',
    brandName: 'Allegra 120mg Tablet 10\'S',
    genericComposition: 'Fexofenadine Hydrochloride Tablets IP 120 mg',
    dosageForm: 'Tablet',
    strength: '120 mg',
    scheduleWarning: 'SCHEDULE H PRESCRIPTION DRUG - CAUTION: Not to be sold by retail without the prescription of a Registered Medical Practitioner.',
    manufacturer: 'Sanofi India Limited',
    batchInfo: 'B.No. AL2609 · MFG. 04/2026 · EXP. 03/2028',
    packagingTextHint: 'Allegra 120mg Tablet',
  },
  {
    id: 'aziderm-20',
    title: 'Aziderm 20% Cream',
    subtitle: 'Dataset SET1 · Topical Dermatology Tube',
    scenarioType: 'dataset_match',
    brandName: 'Aziderm 20% Cream 15gm',
    genericComposition: 'Azelaic Acid Cream 20% w/w in a cream base q.s.',
    dosageForm: 'Cream',
    strength: '20% w/w',
    scheduleWarning: 'Warning: To be sold by retail on the prescription of a Dermatologist / Registered Medical Practitioner only.',
    manufacturer: 'Micro Labs Limited',
    batchInfo: 'B.No. AZD412 · Net Wt. 15 gm · For External Use Only',
    packagingTextHint: 'Aziderm 20% Cream 15gm',
  },
  {
    id: 'glycomet-gp1',
    title: 'Glycomet GP 1 Tablet',
    subtitle: 'Dataset SET2 · Anti-Diabetic Combination',
    scenarioType: 'verified_rx',
    brandName: 'Glycomet GP 1mg Tablet 15\'S',
    genericComposition: 'Glimepiride IP 1 mg + Metformin Hydrochloride IP 500 mg (Sustained Release)',
    dosageForm: 'Tablet',
    strength: '1 mg / 500 mg SR',
    scheduleWarning: 'SCHEDULE G & SCHEDULE H PRESCRIPTION DRUG - CAUTION: It is dangerous to take this preparation except under medical supervision.',
    manufacturer: 'USV Private Limited',
    batchInfo: 'B.No. GGP902 · 15 Tablets Blister Pack',
    packagingTextHint: 'Glycomet GP 1mg Tablet 15\'S',
  },
  {
    id: 'paracetamol-650',
    title: 'Paracetamol 650 mg Strip',
    subtitle: 'Analgesic & Antipyretic · Standard Label',
    scenarioType: 'verified_otc',
    brandName: 'Paracip 650 Tablet 10\'S',
    genericComposition: 'Each uncoated tablet contains: Paracetamol IP 650 mg',
    dosageForm: 'Tablet',
    strength: '650 mg',
    scheduleWarning: null,
    manufacturer: 'Cipla Ltd.',
    batchInfo: 'Warning: Taking more than daily dose of Paracetamol may cause serious liver damage or allergic reactions.',
    packagingTextHint: 'Paracip 650',
  },
  {
    id: 'unclear-loose-pill',
    title: 'Unlabeled Loose Tablet + Glare',
    subtitle: 'Safety Rejection Test · Rule 2D & 2E',
    scenarioType: 'unclear_failure',
    brandName: 'CROPPED / UNREADABLE FOIL',
    genericComposition: ' Blurry / Obscured Text ',
    dosageForm: 'Loose Pill',
    strength: '???',
    scheduleWarning: null,
    manufacturer: 'Unreadable',
    batchInfo: 'Heavy Glare & Cropped Composition',
  },
];

/**
 * Generates a realistic high-resolution PNG data URL of a pharmaceutical package
 * or an intentionally blurred/cropped/loose-pill failure specimen for testing Gemini Vision.
 */
export function renderSpecimenToDataUrl(preset: SpecimenPreset): string {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 560;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Studio neutral surface background
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (preset.scenarioType === 'unclear_failure') {
    // Draw a cropped, blurry foil corner and a loose unmarked white tablet with heavy glare
    ctx.save();
    ctx.filter = 'blur(7px)';

    // Partial torn blister foil off-screen
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-60, 80, 320, 220);

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('...TAB... 10...', 20, 160);
    ctx.font = '18px sans-serif';
    ctx.fillText('Each film coat... mg...', 20, 200);

    // Loose round white pill in center without markings
    ctx.beginPath();
    ctx.arc(540, 290, 85, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    // Score line on loose pill
    ctx.beginPath();
    ctx.moveTo(465, 290);
    ctx.lineTo(615, 290);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Heavy specular camera flash glare over text area
    const grad = ctx.createRadialGradient(220, 190, 10, 220, 190, 240);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.97)');
    grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.75)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 520, 420);

    return canvas.toDataURL('image/png');
  }

  // Draw pharmaceutical carton / blister strip body
  const cardX = 60;
  const cardY = 48;
  const cardW = 840;
  const cardH = 464;

  // Subtle shadow
  ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
  ctx.fillRect(cardX + 8, cardY + 10, cardW, cardH);

  // Main package surface
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cardX, cardY, cardW, cardH);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.strokeRect(cardX, cardY, cardW, cardH);

  // Top medical header band
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(cardX, cardY, cardW, 56);

  // Rx symbol if prescription required
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px serif';
  if (preset.scheduleWarning) {
    ctx.fillText('Rx', cardX + 28, cardY + 37);
  } else {
    ctx.fillText('OTC / IP', cardX + 28, cardY + 37);
  }

  // Dosage form & Strength on top right of header band
  ctx.font = '600 18px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(
    `${preset.dosageForm.toUpperCase()} · ${preset.strength.toUpperCase()}`,
    cardX + cardW - 28,
    cardY + 36
  );
  ctx.textAlign = 'left';

  // Generic / Composition line above Brand Name (Indian Pharma packaging standard)
  ctx.fillStyle = '#334155';
  ctx.font = '600 20px sans-serif';
  ctx.fillText(preset.genericComposition, cardX + 32, cardY + 104, cardW - 64);

  // Prominent Brand Name
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText(preset.brandName, cardX + 32, cardY + 162, cardW - 64);

  // Divider line
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cardX + 32, cardY + 188);
  ctx.lineTo(cardX + cardW - 32, cardY + 188);
  ctx.stroke();

  // Composition & Strength details block
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('COMPOSITION / ACTIVE INGREDIENTS:', cardX + 32, cardY + 224);

  ctx.fillStyle = '#334155';
  ctx.font = '18px sans-serif';
  ctx.fillText(`• Active Formulation: ${preset.genericComposition}`, cardX + 32, cardY + 254, cardW - 64);
  ctx.fillText(
    `• Dosage Form: ${preset.dosageForm}   |   Verified Strength: ${preset.strength}`,
    cardX + 32,
    cardY + 284
  );

  // Schedule H / Red Warning Box (Authentic Indian Drug & Cosmetics Rules box)
  if (preset.scheduleWarning) {
    const warnY = cardY + 310;
    ctx.fillStyle = '#fef2f2';
    ctx.fillRect(cardX + 32, warnY, cardW - 64, 78);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(cardX + 32, warnY, cardW - 64, 78);

    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 15px sans-serif';
    // Wrap warning text into 2 lines
    const words = preset.scheduleWarning.split(' ');
    let line1 = '';
    let line2 = '';
    for (const w of words) {
      if ((line1 + ' ' + w).length < 78) {
        line1 = (line1 + ' ' + w).trim();
      } else {
        line2 = (line2 + ' ' + w).trim();
      }
    }
    ctx.fillText(line1, cardX + 46, warnY + 30, cardW - 92);
    if (line2) {
      ctx.fillText(line2, cardX + 46, warnY + 56, cardW - 92);
    }
  } else {
    const infoY = cardY + 310;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(cardX + 32, infoY, cardW - 64, 78);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cardX + 32, infoY, cardW - 64, 78);

    ctx.fillStyle = '#334155';
    ctx.font = '16px sans-serif';
    ctx.fillText(preset.batchInfo, cardX + 46, infoY + 44, cardW - 92);
  }

  // Manufacturer & Batch Footer
  ctx.fillStyle = '#475569';
  ctx.font = '600 16px sans-serif';
  ctx.fillText(`Manufactured / Marketed in India by: ${preset.manufacturer}`, cardX + 32, cardY + 428);
  ctx.font = '14px monospace';
  ctx.fillStyle = '#64748b';
  ctx.fillText(
    `${preset.batchInfo}  |  Store in a cool, dry place. Keep out of reach of children.`,
    cardX + 32,
    cardY + 448
  );

  return canvas.toDataURL('image/png');
}
