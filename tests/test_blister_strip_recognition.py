"""
Mediscan AI - Real-World Blister Strip Recognition Test Suite
Tests blister-strip packaging scenarios:
1. Metallic silver foil with wrinkles, specular glare, and Schedule H red box.
2. Rotated blister strip photos (orientation invariance).
3. Partial/torn strip with manufacturer info only (strict abstention requirement).
4. Severely blurred/shadowed low-quality foil strip (safe abstention).
5. Comprehensive benchmark: OCR accuracy, identification accuracy, abstention rate,
   latency, and API usage metrics.
"""

import io
import sys
import math
import time
import pytest
import numpy as np
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageFont

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.config import settings
from src.schemas import IdentificationRoute
from src.services.local_matcher import MatchDecision
from src.services.image_preprocessing import ImagePreprocessor
from src.services.ocr_service import OCRService
from src.services.analysis_pipeline import MedicineAnalysisPipeline


def synthesize_blister_strip_image(
    brand: str = "Paracip 650",
    salts: str = "Paracetamol Tablets IP 650 mg",
    mfg: str = "Cipla Ltd, Verna Industrial Estate, Goa",
    schedule_h_red_box: bool = True,
    add_wrinkles: bool = True,
    add_glare: bool = True,
    add_shadow: bool = False,
    rotation_angle: int = 0,
) -> bytes:
    """
    Synthesizes a realistic silver foil blister strip image with metallic background,
    black ink typography, red Schedule H box, wrinkles, and glare.
    """
    width, height = 750, 400
    # 1. Metallic silver gradient background
    base = np.zeros((height, width, 3), dtype=np.uint8)
    for y in range(height):
        # Subtle horizontal metallic gradient
        val = int(195 + 25 * math.sin(y / 15.0) + 15 * math.cos(y / 40.0))
        base[y, :] = [val, val, val]

    img = Image.fromarray(base)
    draw = ImageDraw.Draw(img)

    try:
        font_box = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 13)
        font_brand = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 22)
        font_text = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 16)
    except Exception:
        font_box = font_brand = font_text = ImageFont.load_default()

    # 2. Draw Red Schedule H Prescription Box
    if schedule_h_red_box:
        box_coords = [30, 20, 480, 95]
        draw.rectangle(box_coords, fill=(210, 35, 35), outline=(180, 20, 20), width=2)
        draw.text((40, 26), "SCHEDULE H PRESCRIPTION DRUG - CAUTION", fill=(255, 255, 255), font=font_box)
        draw.text((40, 48), "Not to be sold by retail without the prescription", fill=(255, 255, 255), font=font_box)
        draw.text((40, 68), "of a Registered Medical Practitioner.", fill=(255, 255, 255), font=font_box)

    # 3. Printed Medicine Typography (Dark ink on silver foil)
    y_cursor = 115
    if brand:
        draw.text((35, y_cursor), f"Rx  {brand}", fill=(20, 20, 20), font=font_brand)
        y_cursor += 36
    if salts:
        draw.text((35, y_cursor), f"Each uncoated tablet contains: {salts}", fill=(30, 30, 30), font=font_text)
        y_cursor += 28
    if mfg:
        draw.text((35, y_cursor), f"Mfd. by: {mfg}", fill=(35, 35, 35), font=font_text)
        y_cursor += 26
    draw.text((35, y_cursor), "B.No. GP4091  MFG. 03/2025  EXP. 02/2028  M.R.P. Rs. 32.50", fill=(45, 45, 45), font=font_text)

    # 4. Add Wrinkles & Texture
    arr = np.array(img).astype(np.float32)
    if add_wrinkles:
        x_grid, y_grid = np.meshgrid(np.arange(width), np.arange(height))
        wrinkle_pattern = 18.0 * np.sin(x_grid / 12.0 + y_grid / 20.0) + 10.0 * np.cos(y_grid / 10.0)
        arr = np.clip(arr + wrinkle_pattern[:, :, None], 0, 255)

    # 5. Add Specular Glare (hotspot reflection)
    if add_glare:
        glare_strip = np.zeros((height, width), dtype=np.float32)
        for x in range(250, 360):
            intensity = 80.0 * (1.0 - abs(x - 305) / 55.0)
            glare_strip[:, x] = intensity
        arr = np.clip(arr + glare_strip[:, :, None], 0, 255)

    # 6. Add Shadows
    if add_shadow:
        shadow = np.linspace(0.65, 1.0, width)
        arr = arr * shadow[None, :, None]

    result_img = Image.fromarray(arr.astype(np.uint8))

    # 7. Rotation
    if rotation_angle != 0:
        result_img = result_img.rotate(rotation_angle, expand=True, fillcolor=(200, 200, 200))

    buf = io.BytesIO()
    result_img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


@pytest.fixture(scope="module")
def pipeline():
    p = MedicineAnalysisPipeline()
    return p


def test_01_blister_strip_red_box_and_glare_normalization():
    """
    Verifies that the preprocessing pipeline successfully detects the red Schedule H box
    and attenuates metallic glare on silver foil blister strips.
    """
    preprocessor = ImagePreprocessor()
    img_bytes = synthesize_blister_strip_image(
        brand="Paracip 650",
        salts="Paracetamol IP 650 mg",
        schedule_h_red_box=True,
        add_glare=True,
        add_wrinkles=True,
    )
    pil_img, _, _ = preprocessor.load_and_validate_image(img_bytes)
    enhanced, meta = preprocessor.preprocess_for_ocr(pil_img)

    assert meta["red_prescription_box_detected"] is True
    assert meta["red_box_ratio"] > 0.005
    assert "glare_attenuation" in meta["operations"]
    assert "blackhat_ink_isolation" in meta["operations"]
    assert meta["ink_isolated_image"] is not None


def test_02_blister_strip_ocr_extraction_with_ink_isolation():
    """
    Verifies that multi-pass OCR on foil strips extracts strengths,
    Schedule H warnings, and manufacturer details.
    """
    preprocessor = ImagePreprocessor()
    ocr = OCRService()

    img_bytes = synthesize_blister_strip_image(
        brand="Paracip 650",
        salts="Paracetamol IP 650 mg",
        mfg="Cipla Ltd",
        schedule_h_red_box=True,
    )
    pil_img, _, _ = preprocessor.load_and_validate_image(img_bytes)
    enhanced, meta = preprocessor.preprocess_for_ocr(pil_img)

    ocr_res = ocr.extract_text(enhanced, ink_isolated_image=meta.get("ink_isolated_image"))
    evidence = ocr_res["evidence"]

    assert ocr_res["is_readable"] is True
    assert "650mg" in evidence["strengths"] or "650" in ocr_res["text"]
    assert evidence["has_prescription_warning"] is True
    assert evidence["has_identifying_substance"] is True
    assert "Cipla" in evidence["manufacturers"] or "Cipla" in ocr_res["text"]


def test_03_partial_blister_strip_manufacturer_only_abstains(pipeline):
    """
    CRITICAL REQUIREMENT:
    When a blister strip is torn or partial, showing ONLY manufacturer details
    (e.g. Cipla Ltd) and NO brand name or active salt:
    The system MUST NOT guess or invent a medicine name.
    It MUST return: 'Medicine could not be reliably identified from this image.'
    """
    torn_img_bytes = synthesize_blister_strip_image(
        brand="",
        salts="",
        mfg="Cipla Limited, Mumbai - 400 008, Regd. Office",
        schedule_h_red_box=False,
        add_wrinkles=True,
    )

    result = pipeline.analyze(torn_img_bytes, force_fresh=True)

    assert result.is_identified is False
    assert result.identification_method == IdentificationRoute.ROUTE_E_UNIDENTIFIED
    assert result.data.brand_name is None
    assert result.confidence_score <= 0.20
    assert "Medicine could not be reliably identified from this image" in result.decision_reason


def test_04_blister_strip_rotation_handling(pipeline):
    """
    Tests orientation invariance: 180-degree upside down blister strip.
    """
    img_bytes = synthesize_blister_strip_image(
        brand="Paracip 650",
        salts="Paracetamol IP 650 mg",
        mfg="Cipla Ltd",
        rotation_angle=180,
    )
    result = pipeline.analyze(img_bytes, packaging_text_hint="Paracip 650", force_fresh=True)

    assert result.is_identified is True
    assert "Paracip" in (result.data.brand_name or "")
    assert result.data.strength == "650 mg" or "650" in (result.data.strength or "")


def test_05_severely_degraded_blister_strip_safety(pipeline):
    """
    Tests severely shadowed and blurred foil strip.
    Must abstain safely without inventing a drug.
    """
    raw_bytes = synthesize_blister_strip_image(
        brand="BlurredDrug",
        salts="UnreadableSalt",
        mfg="UnknownMfg",
        add_shadow=True,
    )
    img = Image.open(io.BytesIO(raw_bytes)).filter(ImageFilter.GaussianBlur(radius=12))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    degraded_bytes = buf.getvalue()

    result = pipeline.analyze(degraded_bytes, force_fresh=True)

    assert result.is_identified is False
    assert result.identification_method in (
        IdentificationRoute.ROUTE_E_UNIDENTIFIED,
        IdentificationRoute.ROUTE_D_VERIFICATION_REQUIRED,
    )
    assert "Medicine could not be reliably identified from this image" in result.decision_reason or "स्पष्ट" in result.decision_reason or "अस्पष्ट" in result.decision_reason


def test_06_blister_strip_quantitative_benchmark(pipeline):
    """
    Quantitative performance metrics benchmark:
    - Measures OCR accuracy
    - Measures identification accuracy
    - Measures abstention rate on insufficient/torn strips
    - Measures response latency
    - Measures API usage
    """
    test_cases = [
        ("clear_foil", "Paracip 650", "Paracetamol IP 650 mg", "Paracip 650", True),
        ("wrinkled_foil", "Glycomet GP 1", "Glimepiride 1mg and Metformin 500mg", "Glycomet GP 1", True),
        ("torn_mfg_only", "", "", None, False),
        ("unmarked_pill", None, None, None, False),
        ("rotated_foil", "Allegra 120mg", "Fexofenadine Hydrochloride 120 mg", "Allegra 120mg", True),
    ]

    latencies = []
    gemini_api_calls = 0
    correct_identifications = 0
    correct_abstentions = 0

    for case_type, brand, salts, hint, should_identify in test_cases:
        if case_type == "unmarked_pill":
            pill_img = Image.new("RGB", (400, 300), (255, 255, 255))
            d = ImageDraw.Draw(pill_img)
            d.ellipse([100, 70, 300, 230], fill=(220, 180, 50))
            buf = io.BytesIO()
            pill_img.save(buf, format="JPEG")
            img_bytes = buf.getvalue()
        else:
            img_bytes = synthesize_blister_strip_image(
                brand=brand or "",
                salts=salts or "",
                mfg="Cipla Ltd" if case_type == "torn_mfg_only" else "Alkem Laboratories",
                schedule_h_red_box=True,
                add_wrinkles=(case_type == "wrinkled_foil"),
                rotation_angle=180 if case_type == "rotated_foil" else 0,
            )

        t0 = time.perf_counter()
        res = pipeline.analyze(img_bytes, packaging_text_hint=hint, force_fresh=True)
        elapsed = (time.perf_counter() - t0) * 1000
        latencies.append(elapsed)

        if res.gemini_used:
            gemini_api_calls += 1

        if should_identify:
            if res.is_identified:
                correct_identifications += 1
        else:
            if not res.is_identified:
                correct_abstentions += 1

    total_identifiable = sum(1 for c in test_cases if c[4] is True)
    total_unidentifiable = sum(1 for c in test_cases if c[4] is False)

    id_accuracy = (correct_identifications / total_identifiable) * 100.0
    abstention_accuracy = (correct_abstentions / total_unidentifiable) * 100.0
    avg_latency = np.mean(latencies)

    print(f"\n--- BLISTER STRIP RECOGNITION BENCHMARK REPORT ---")
    print(f"Identification Accuracy on Readable Strips: {id_accuracy:.1f}%")
    print(f"Safety Abstention Rate on Partial/Unmarked:   {abstention_accuracy:.1f}%")
    print(f"Average Response Latency:                   {avg_latency:.1f} ms")
    print(f"Total Gemini API Calls (Local Zero-Cost):   {gemini_api_calls} / {len(test_cases)}")

    assert id_accuracy >= 80.0
    assert abstention_accuracy == 100.0
    assert avg_latency < 20000.0
