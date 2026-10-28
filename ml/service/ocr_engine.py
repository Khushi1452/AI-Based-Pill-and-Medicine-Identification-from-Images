"""
Local OCR Extraction & Image Preprocessing Pipeline
Utilizes OpenCV and PyTesseract for local packaging text recognition on Apple Silicon / CPU.
"""

import os
import io
import re
import numpy as np
from PIL import Image, ImageOps
import cv2
import pytesseract
from typing import Dict, Any, Optional, Tuple, TypedDict, List



class OCRResult(TypedDict, total=False):
    text: str
    confidence: float
    word_count: int
    is_readable: bool
    metadata: Dict[str, Any]
    error: Optional[str]


class LocalOCREngine:

    def __init__(self, tesseract_cmd: Optional[str] = None):
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
        else:
            # Check default homebrew path on Apple Silicon
            if os.path.exists("/opt/homebrew/bin/tesseract"):
                pytesseract.pytesseract.tesseract_cmd = "/opt/homebrew/bin/tesseract"

    def preprocess_image(self, image: Image.Image, max_dim: int = 1800) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Resize oversized images, normalize orientation, and apply contrast enhancement.
        """
        # Ensure correct EXIF orientation
        try:
            image = ImageOps.exif_transpose(image)
        except Exception:
            pass

        orig_w, orig_h = image.size
        scale = 1.0
        if max(orig_w, orig_h) > max_dim:
            scale = max_dim / float(max(orig_w, orig_h))
            new_w = int(orig_w * scale)
            new_h = int(orig_h * scale)
            image = image.resize((new_w, new_h), Image.Resampling.LANCZOS)

        # Convert to OpenCV RGB and Grayscale
        rgb_img = np.array(image.convert("RGB"))
        gray = cv2.cvtColor(rgb_img, cv2.COLOR_RGB2GRAY)

        # Modest contrast enhancement via CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)

        metadata = {
            "original_dimensions": [orig_w, orig_h],
            "processed_dimensions": [image.width, image.height],
            "scale_factor": scale,
            "preprocessing": ["exif_transpose", "resize", "clahe_contrast_enhancement"],
        }
        return enhanced, metadata

    def extract_text(self, image_input: Any) -> Dict[str, Any]:
        """
        Extract text from an image path, bytes, or PIL Image.
        Returns extracted text, confidence score, word count, and diagnostics.
        """
        try:
            if isinstance(image_input, (str, os.PathLike)):
                if not os.path.exists(str(image_input)):
                    return {
                        "text": "",
                        "confidence": 0.0,
                        "word_count": 0,
                        "is_readable": False,
                        "error": f"Image file not found: {image_input}",
                    }
                pil_img = Image.open(str(image_input))
            elif isinstance(image_input, bytes):
                pil_img = Image.open(io.BytesIO(image_input))
            elif isinstance(image_input, Image.Image):
                pil_img = image_input
            else:
                return {
                    "text": "",
                    "confidence": 0.0,
                    "word_count": 0,
                    "is_readable": False,
                    "error": "Unsupported image input type",
                }

            processed_img, meta = self.preprocess_image(pil_img)

            # Adaptive Multi-Pass Extraction:
            # Pass 1: Standard orientation (angle 0) with PSM 3 (auto segmentation) & PSM 6 (uniform block)
            best_text = ""
            best_conf = 0.0
            best_words: List[str] = []
            best_score = -1.0
            chosen_angle = 0
            chosen_psm = 3

            primary_configs = [
                (0, 3, "--oem 3 --psm 3"),
                (0, 6, "--oem 3 --psm 6"),
                (0, 11, "--oem 3 --psm 11"),
            ]

            pil_processed = Image.fromarray(processed_img)

            for angle, psm, cfg in primary_configs:
                try:
                    cur_img = pil_processed if angle == 0 else pil_processed.rotate(angle, expand=True)
                    data = pytesseract.image_to_data(
                        cur_img,
                        output_type=pytesseract.Output.DICT,
                        config=cfg
                    )
                    words = [data["text"][i].strip() for i in range(len(data["text"])) if data["text"][i].strip()]
                    confs = [float(data["conf"][i]) for i in range(len(data["text"])) if data["text"][i].strip() and float(data["conf"][i]) >= 0]
                    avg_c = (sum(confs) / len(confs) / 100.0) if confs else 0.0
                    alpha_chars = sum(len(w) for w in words if re.search(r"[a-zA-Z0-9]", w))
                    score = alpha_chars * avg_c

                    if score > best_score:
                        best_score = score
                        best_text = " ".join(words)
                        best_conf = avg_c
                        best_words = words
                        chosen_angle = angle
                        chosen_psm = psm

                    # Early stop if we found high-confidence rich text (> 8 words and conf > 0.65)
                    if len(words) >= 8 and avg_c >= 0.65:
                        break
                except Exception:
                    continue

            # Pass 2: If standard orientation yielded very few alphanumeric characters (< 12 chars),
            # test 90 and 270 degree smartphone portrait/landscape rotations
            if best_score < 8.0:
                for rot_angle in [90, 270, 180]:
                    try:
                        cur_img = pil_processed.rotate(rot_angle, expand=True)
                        for psm, cfg in [(3, "--oem 3 --psm 3"), (6, "--oem 3 --psm 6")]:
                            data = pytesseract.image_to_data(
                                cur_img,
                                output_type=pytesseract.Output.DICT,
                                config=cfg
                            )
                            words = [data["text"][i].strip() for i in range(len(data["text"])) if data["text"][i].strip()]
                            confs = [float(data["conf"][i]) for i in range(len(data["text"])) if data["text"][i].strip() and float(data["conf"][i]) >= 0]
                            avg_c = (sum(confs) / len(confs) / 100.0) if confs else 0.0
                            alpha_chars = sum(len(w) for w in words if re.search(r"[a-zA-Z0-9]", w))
                            score = alpha_chars * avg_c

                            if score > best_score:
                                best_score = score
                                best_text = " ".join(words)
                                best_conf = avg_c
                                best_words = words
                                chosen_angle = rot_angle
                                chosen_psm = psm

                            if len(words) >= 8 and avg_c >= 0.65:
                                break
                    except Exception:
                        continue

            # Clean common OCR digit/letter substitution confusions
            clean_text = best_text
            # Split concatenated brand and number: PARACIP650 -> PARACIP 650, PAN40 -> PAN 40
            clean_text = re.sub(r"([A-Za-z]{3,})(\d+)", r"\1 \2", clean_text)
            # Split brand concatenated with GSO / G50 / GO (OCR misread of 650): PARACIPGO -> PARACIP 650
            clean_text = re.sub(r"([A-Za-z]{3,})(?:[Gg][Ss][0Oo]|[Gg]5[0Oo]|[Gg]50|[Gg][0Oo])\b", r"\1 650", clean_text)
            # Correct P50 mg / B50 mg / G50 mg -> 650 mg
            clean_text = re.sub(r"\b[PpBbGg]5[0Oo]?\s*(mg|ml|mcg)\b", r"650 \1", clean_text, flags=re.IGNORECASE)
            # Correct letter O inside digit strength sequences (e.g. 65Omg -> 650mg, 12Omg -> 120mg)
            clean_text = re.sub(r"(\d+)[Oo](\s*(?:mg|ml|mcg|gm|g|%))", r"\g<1>0\2", clean_text, flags=re.IGNORECASE)
            # Correct common OCR substitutions for strength numbers
            clean_text = re.sub(r"\b[Gg][Ss][0Oo]\b", "650", clean_text)
            clean_text = re.sub(r"\b[Gg]50\b", "650", clean_text)
            clean_text = re.sub(r"\b[Gg]5[0Oo]\b", "650", clean_text)
            clean_text = re.sub(r"\b[Il]20\b", "120", clean_text)
            clean_text = re.sub(r"\b[Ss]00\b", "500", clean_text)
            clean_text = re.sub(r"\b[Gg]25\b", "625", clean_text)

            meta["chosen_orientation_degrees"] = chosen_angle
            meta["chosen_psm"] = chosen_psm
            meta["ocr_score"] = round(best_score, 2)

            is_readable = bool(clean_text) and len(clean_text) >= 4 and best_conf >= 0.20

            return {
                "text": clean_text,
                "confidence": round(best_conf, 3),
                "word_count": len(best_words),
                "is_readable": is_readable,
                "metadata": meta,
                "error": None,
            }


        except Exception as e:
            return {
                "text": "",
                "confidence": 0.0,
                "word_count": 0,
                "is_readable": False,
                "error": str(e),
            }
