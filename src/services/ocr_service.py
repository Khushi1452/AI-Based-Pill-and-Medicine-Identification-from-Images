"""
Mediscan AI - Multi-Pass OCR & Evidence Extraction Service
Engineered for Indian medicine packaging, foil blister strips, cartons, and bottles:
- Multi-pass execution (Illumination CLAHE, Black-Hat Ink Isolation, Inverted Binary)
- Multi-orientation fallback (0°, 90°, 180°, 270°)
- Structured evidence extraction:
  * Brand Names
  * Active Ingredients & Formulations
  * Strengths (mg, mcg, gm, ml, %, w/w, w/v)
  * Manufacturer / Marketer details (Cipla, Sun Pharma, Torrent, etc.)
  * Schedule H/H1 Prescription Warnings
  * Batch No. & Expiry Date
- Distinction: Never assume manufacturer name alone identifies the medicine.
"""

import os
import re
import cv2
import numpy as np
import pytesseract
from PIL import Image
from typing import Dict, Any, Optional, List, Tuple

from ..config import settings


INDIAN_MANUFACTURERS = [
    "cipla", "sun pharma", "sun pharmaceutical", "torrent", "lupin",
    "alkem", "mankind", "dr. reddy", "dr reddys", "abbott", "glenmark",
    "sanofi", "micro labs", "usv", "zydus", "cadila", "intas",
    "macleods", "aristo", "ipca", "pfizer", "gsk", "glaxosmithkline",
    "hetero", "ajanta", "alembic", "emcure", "leeford", "apex",
]


class OCRService:
    def __init__(self, tesseract_cmd: Optional[str] = None):
        cmd = tesseract_cmd or settings.TESSERACT_CMD
        if cmd and os.path.exists(cmd):
            pytesseract.pytesseract.tesseract_cmd = cmd
        self.cmd = cmd

    @staticmethod
    def clean_ocr_text(raw_text: str) -> str:
        """Corrects optical confusions common in foil packaging OCR."""
        if not raw_text:
            return ""
        s = raw_text

        # 1. Split concatenated brand name and strength number (e.g., PARACIP650 -> PARACIP 650)
        s = re.sub(r"([A-Za-z]{3,})(\d+)", r"\1 \2", s)

        # 2. Split brand concatenated with GSO / G50 / GO (misread of 650)
        s = re.sub(r"([A-Za-z]{3,})(?:[Gg][Ss][0Oo]|[Gg]5[0Oo]|[Gg]50|[Gg][0Oo])\b", r"\1 650", s)

        # 3. Correct P50 mg / B50 mg / G50 mg / PASO mg -> 650 mg
        s = re.sub(r"\b(?:[PpBbGg]5[0Oo]?|[Pp][Aa][Ss][0Oo])\s*(mg|ml|mcg)\b", r"650 \1", s, flags=re.IGNORECASE)

        # 4. Correct letter O inside digit strength sequences (e.g. 65Omg -> 650mg, 12Omg -> 120mg)
        s = re.sub(r"(\d+)[Oo](\s*(?:mg|ml|mcg|gm|g|%))", r"\g<1>0\2", s, flags=re.IGNORECASE)

        # 5. Correct common OCR substitutions for standalone numbers
        s = re.sub(r"\b[GgPp][Ss][0Oo]\b", "650", s)
        s = re.sub(r"\b[GgPp]50\b", "650", s)
        s = re.sub(r"\b[GgPp]5[0Oo]\b", "650", s)
        s = re.sub(r"\b[Pp][Aa][Ss][0Oo]\b", "650", s)
        s = re.sub(r"\b[Il]20\b", "120", s)
        s = re.sub(r"\b[Ss]00\b", "500", s)
        s = re.sub(r"\b[Gg]25\b", "625", s)

        # 6. Normalize extraneous whitespace
        s = re.sub(r"[ \t]+", " ", s)
        s = re.sub(r"\n\s*\n", "\n", s).strip()
        return s

    def extract_text(
        self,
        processed_cv2_image: np.ndarray,
        ink_isolated_image: Optional[np.ndarray] = None,
    ) -> Dict[str, Any]:
        """
        Executes multi-pass OCR tailored for foil blister strips:
        Pass 1: Illumination-normalized CLAHE grayscale.
        Pass 2: Black-Hat ink-isolated image (essential for silver foil reflections).
        Pass 3: Otsu's thresholding + inversion.
        Pass 4: Multi-orientation fallback (if initial passes yield < 3 words).
        """
        passes_text: List[str] = []
        passes_conf: List[float] = []

        # Pass 1: Primary CLAHE
        t1, c1 = self._run_tesseract_pass(processed_cv2_image, psm=11)
        if t1:
            passes_text.append(t1)
            passes_conf.append(c1)

        # Pass 2: Black-Hat Ink Isolation (foil strips)
        if ink_isolated_image is not None:
            t2, c2 = self._run_tesseract_pass(ink_isolated_image, psm=11)
            if t2:
                passes_text.append(t2)
                passes_conf.append(c2)

        # Pass 3: Inverted Binary
        try:
            _, binary = cv2.threshold(processed_cv2_image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            inverted = cv2.bitwise_not(binary)
            t3, c3 = self._run_tesseract_pass(inverted, psm=11)
            if t3:
                passes_text.append(t3)
                passes_conf.append(c3)
        except Exception:
            pass

        # Pass 4: If text is sparse (< 4 words) or confidence is low (< 35), test 180, 90, 270 rotations
        combined_words = sum(len(t.split()) for t in passes_text)
        current_best = float(np.max(passes_conf)) if passes_conf else 0.0
        if combined_words < 4 or current_best < 35.0:
            for angle in (cv2.ROTATE_180, cv2.ROTATE_90_CLOCKWISE, cv2.ROTATE_90_COUNTERCLOCKWISE):
                rot = cv2.rotate(processed_cv2_image, angle)
                t_rot, c_rot = self._run_tesseract_pass(rot, psm=11)
                if len(t_rot.split()) > 3 and c_rot > current_best:
                    passes_text.append(t_rot)
                    passes_conf.append(c_rot)
                    current_best = c_rot
                    break

        # Consolidate text across passes
        merged_text = self._merge_ocr_passes(passes_text)
        cleaned_text = self.clean_ocr_text(merged_text)
        best_conf = float(np.max(passes_conf)) if passes_conf else 0.0

        # Extract structured pharmaceutical evidence
        evidence = self.parse_structured_evidence(cleaned_text)

        alphanumeric = re.sub(r"[^a-zA-Z0-9]", "", cleaned_text)
        is_readable = bool(len(alphanumeric) >= 3 and (best_conf > 10.0 or len(evidence["strengths"]) > 0))

        return {
            "text": cleaned_text,
            "raw_text": merged_text,
            "confidence": round(best_conf, 2),
            "word_count": len(cleaned_text.split()),
            "is_readable": is_readable,
            "passes_evaluated": len(passes_text),
            "evidence": evidence,
            "has_identifying_substance": evidence["has_identifying_substance"],
        }

    def _run_tesseract_pass(self, img: np.ndarray, psm: int = 11) -> Tuple[str, float]:
        try:
            data = pytesseract.image_to_data(
                img,
                config=f"--oem 3 --psm {psm}",
                output_type=pytesseract.Output.DICT
            )
            confs = [int(c) for c in data["conf"] if int(c) > 0]
            avg_conf = float(np.mean(confs)) if confs else 0.0
            words = [data["text"][i] for i in range(len(data["text"])) if int(data["conf"][i]) > 0 and data["text"][i].strip()]
            return " ".join(words), avg_conf
        except Exception:
            return "", 0.0

    @staticmethod
    def _merge_ocr_passes(texts: List[str]) -> str:
        if not texts:
            return ""
        if len(texts) == 1:
            return texts[0]

        # Use longest pass as baseline and append unique tokens
        sorted_passes = sorted(texts, key=lambda t: len(t.split()), reverse=True)
        primary = sorted_passes[0]
        seen_words = set(primary.lower().split())

        supplementary = []
        for extra in sorted_passes[1:]:
            for w in extra.split():
                clean_w = w.strip().lower()
                if len(clean_w) >= 3 and clean_w not in seen_words:
                    seen_words.add(clean_w)
                    supplementary.append(w)

        if supplementary:
            return f"{primary} {' '.join(supplementary)}"
        return primary

    def parse_structured_evidence(self, text: str) -> Dict[str, Any]:
        """
        Parses blister strip evidence into categories:
        - Strengths
        - Formulations
        - Manufacturer names
        - Schedule H/H1 Prescription Warnings
        - Batch & Expiry
        - Identifying substance presence check
        """
        norm = text.lower()

        # 1. Strengths
        strength_matches = re.findall(
            r"\b\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*(?:\s*(?:mg|mcg|gm|g|ml|iu|%|\s*w\/w|\s*w\/v))\b",
            norm
        )
        strengths = list(dict.fromkeys([m.replace(" ", "") for m in strength_matches]))
        standalone = re.findall(r"\b(1000|650|625|500|400|300|250|200|150|120|100|80|75|50|40|25|20|10|5)\b", norm)
        for s in standalone:
            token = f"{s}mg"
            if token not in strengths:
                strengths.append(token)

        # 2. Dosage Form
        forms = [
            "tablet", "capsule", "syrup", "suspension", "injection",
            "rotacap", "inhaler", "respule", "cream", "ointment", "gel",
            "softgel", "drops", "lotion"
        ]
        detected_forms = [f.capitalize() for f in forms if re.search(r"\b" + f + r"\b", norm)]

        # 3. Manufacturer Details
        detected_mfg = []
        for mfg in INDIAN_MANUFACTURERS:
            if mfg in norm:
                detected_mfg.append(mfg.title())

        # 4. Schedule H/H1 Warning Detection
        has_prescription_warning = bool(
            re.search(r"schedule\s+[hHxX]\b", norm)
            or "not to be sold by retail without" in norm
            or "prescription drug" in norm
            or "rx" in norm.split()
        )

        # 5. Batch & Expiry
        has_batch_or_exp = bool(
            re.search(r"\b(b\.?\s*no|exp\.?\s*date|mfg\.?\s*date|m\.?r\.?p)\b", norm)
        )

        # 6. Active Ingredient / Composition patterns (e.g., "Each uncoated tablet contains:")
        has_composition_clause = bool(
            re.search(r"\bcontains\b", norm)
            or re.search(r"\beach\s+(?:film\s+coated|uncoated)?\s*(?:tablet|capsule|ml)\b", norm)
            or re.search(r"\b(?:hydrochloride|ip|bp|usp|fumarate|sodium|potassium|acid)\b", norm)
        )

        # 7. Check if ANY identifying substance (brand name or active ingredient) is present
        # Rule: A manufacturer name alone (e.g., "Cipla Ltd") without a brand or salt is NOT identifying!
        alphanumeric = re.sub(r"[^a-zA-Z0-9]", "", text)
        has_substance = bool(
            len(strengths) > 0
            or has_composition_clause
            or (len(alphanumeric) > 10 and not (len(detected_mfg) > 0 and len(strengths) == 0 and not has_composition_clause))
        )

        # If the ONLY recognizable text is the manufacturer name or batch/prescription warning
        # but zero strengths, zero active salts, and zero brand tokens:
        tokens = [w for w in norm.split() if len(w) > 3]
        mfg_tokens = set([t for m in detected_mfg for t in m.lower().split()])
        boilerplate_tokens = {"schedule", "prescription", "warning", "retail", "registered", "trade", "mark", "licence", "batch", "date", "mfg", "mfd", "marketed", "limited", "ltd", "pvt"}
        unmatched_substantive = [w for w in tokens if w not in mfg_tokens and w not in boilerplate_tokens]

        if len(unmatched_substantive) == 0 and len(strengths) == 0:
            has_substance = False

        return {
            "strengths": strengths,
            "dosage_forms": detected_forms,
            "manufacturers": detected_mfg,
            "has_prescription_warning": has_prescription_warning,
            "has_batch_or_expiry": has_batch_or_exp,
            "has_composition_clause": has_composition_clause,
            "has_identifying_substance": has_substance,
        }
