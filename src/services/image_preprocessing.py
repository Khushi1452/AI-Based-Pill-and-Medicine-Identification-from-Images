"""
Mediscan AI - Advanced Blister Strip Image Preprocessing Service
Specifically engineered for real-world Indian medicine blister strips:
- Specular foil glare attenuation & wrinkle shadow flattening
- Background illumination normalization (morphological closing)
- Morphological Black-Hat ink isolation on metallic silver foil
- Automatic orientation detection & correction (0°, 90°, 180°, 270°)
- Red prescription box detection (Schedule H/H1 regulatory markings)
- Loose unmarked pill safety abstention
"""

import io
import os
import hashlib
import numpy as np
from PIL import Image, ImageOps
import cv2
import pytesseract
from typing import Dict, Any, Tuple, Optional, Union, List

from ..config import settings


class ImagePreprocessor:
    def __init__(self, max_dim: int = settings.MAX_IMAGE_DIM):
        self.max_dim = max_dim

    @staticmethod
    def compute_sha256(image_bytes: bytes) -> str:
        """Computes a SHA-256 cryptographic hash of image bytes for caching and provenance."""
        return hashlib.sha256(image_bytes).hexdigest()

    def load_and_validate_image(
        self, image_input: Union[bytes, io.BytesIO, Image.Image, str]
    ) -> Tuple[Image.Image, bytes, str]:
        """Validates format and decodes into a PIL Image and raw bytes."""
        if isinstance(image_input, bytes):
            image_bytes = image_input
            pil_img = Image.open(io.BytesIO(image_bytes))
        elif isinstance(image_input, io.BytesIO):
            image_bytes = image_input.getvalue()
            pil_img = Image.open(image_input)
        elif isinstance(image_input, Image.Image):
            pil_img = image_input
            buf = io.BytesIO()
            pil_img.save(buf, format="PNG")
            image_bytes = buf.getvalue()
        elif isinstance(image_input, str):
            if not os.path.exists(image_input):
                raise FileNotFoundError(f"Image path not found: {image_input}")
            with open(image_input, "rb") as f:
                image_bytes = f.read()
            pil_img = Image.open(io.BytesIO(image_bytes))
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")

        try:
            pil_img = ImageOps.exif_transpose(pil_img)
        except Exception:
            pass

        fmt = (pil_img.format or "PNG").upper()
        if fmt not in ("JPEG", "JPG", "PNG", "WEBP"):
            raise ValueError(f"Unsupported image format: {fmt}. Allowed: JPG, JPEG, PNG, WEBP.")

        image_hash = self.compute_sha256(image_bytes)
        return pil_img, image_bytes, image_hash

    def correct_orientation(self, pil_image: Image.Image) -> Tuple[Image.Image, int]:
        """
        Detects orientation angle (0, 90, 180, 270) using Tesseract OSD
        and rotates the packaging so text flows horizontally.
        """
        try:
            # Check OSD on a scaled-down thumbnail for speed
            thumb = pil_image.copy()
            thumb.thumbnail((1000, 1000))
            osd = pytesseract.image_to_osd(thumb, output_type=pytesseract.Output.DICT)
            rotate_angle = osd.get("rotate", 0)
            confidence = osd.get("orientation_conf", 0.0)

            # Only rotate if confidence is above minimal threshold and rotation needed
            if rotate_angle in (90, 180, 270) and confidence >= 2.0:
                rotated = pil_image.rotate(360 - rotate_angle, expand=True)
                return rotated, rotate_angle
        except Exception:
            pass
        return pil_image, 0

    def preprocess_for_ocr(self, pil_image: Image.Image) -> Tuple[np.ndarray, Dict[str, Any]]:
        """
        Multi-stage preprocessing pipeline tailored for silver foil blister packs:
        1. Auto-orientation correction.
        2. Bounded scaling.
        3. Background illumination normalization (flattens wrinkle shadows & creases).
        4. Specular glare attenuation.
        5. Morphological Black-Hat ink isolation.
        6. Red prescription warning box detection.
        """
        # 1. Orientation correction
        oriented_image, rot_angle = self.correct_orientation(pil_image)

        orig_w, orig_h = oriented_image.size
        scale = 1.0
        if max(orig_w, orig_h) > self.max_dim:
            scale = self.max_dim / float(max(orig_w, orig_h))
            new_w = int(orig_w * scale)
            new_h = int(orig_h * scale)
            oriented_image = oriented_image.resize((new_w, new_h), Image.Resampling.LANCZOS)

        # 2. RGB and Grayscale arrays
        rgb_img = np.array(oriented_image.convert("RGB"))
        gray = cv2.cvtColor(rgb_img, cv2.COLOR_RGB2GRAY)

        # 3. Detect Red Prescription Warning Box (Indian Drugs & Cosmetics Act Schedule H/H1)
        red_box_detected, red_box_ratio = self.detect_red_prescription_box(rgb_img)

        # 4. Illumination Normalization & Glare Suppression
        # Use large morphological closing to estimate non-uniform lighting across foil wrinkles
        kernel_bg = cv2.getStructuringElement(cv2.MORPH_RECT, (31, 31))
        bg_illumination = cv2.morphologyEx(gray, cv2.MORPH_CLOSE, kernel_bg)
        bg_illumination = np.maximum(bg_illumination, 1)  # Prevent division by zero
        normalized_gray = cv2.divide(gray, bg_illumination, scale=255)

        # 5. Attenuate Specular Glare (hotspots > 240)
        glare_mask = (gray > 240).astype(np.uint8) * 255
        if np.sum(glare_mask) > 0 and np.mean(glare_mask) < 60:
            # Subtle inpaint of hot glare spots to reconstruct text edges
            try:
                normalized_gray = cv2.inpaint(normalized_gray, glare_mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)
            except Exception:
                pass

        # 6. Apply Adaptive CLAHE
        clahe = cv2.createCLAHE(clipLimit=2.4, tileGridSize=(8, 8))
        enhanced = clahe.apply(normalized_gray)

        # 7. Black-Hat Transform for Silver Foil Ink Extraction
        # Isolates dark ink printed on highly reflective metallic surfaces
        kernel_ink = cv2.getStructuringElement(cv2.MORPH_RECT, (11, 11))
        blackhat = cv2.morphologyEx(enhanced, cv2.MORPH_BLACKHAT, kernel_ink)
        # Invert blackhat so text is dark on white
        ink_isolated = cv2.bitwise_not(cv2.normalize(blackhat, None, 0, 255, cv2.NORM_MINMAX))

        metadata = {
            "original_width": orig_w,
            "original_height": orig_h,
            "processed_width": oriented_image.width,
            "processed_height": oriented_image.height,
            "scale_factor": scale,
            "rotation_angle": rot_angle,
            "red_prescription_box_detected": red_box_detected,
            "red_box_ratio": round(red_box_ratio, 4),
            "operations": [
                "auto_orientation",
                "resize_bounded",
                "illumination_normalization",
                "glare_attenuation",
                "clahe_adaptive_contrast",
                "blackhat_ink_isolation",
            ],
            "ink_isolated_image": ink_isolated,
        }
        return enhanced, metadata

    @staticmethod
    def detect_red_prescription_box(rgb_img: np.ndarray) -> Tuple[bool, float]:
        """
        Detects the prominent red prescription box mandatory on Indian Schedule H/H1 medicines.
        Uses HSV color thresholding for vivid red ink.
        """
        hsv = cv2.cvtColor(rgb_img, cv2.COLOR_RGB2HSV)
        # Red spans both ends of Hue (0-10 and 165-180)
        lower_red1 = np.array([0, 70, 50])
        upper_red1 = np.array([10, 255, 255])
        lower_red2 = np.array([165, 70, 50])
        upper_red2 = np.array([180, 255, 255])

        mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
        mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
        red_mask = mask1 | mask2

        red_pixels = int(np.count_nonzero(red_mask))
        total_pixels = rgb_img.shape[0] * rgb_img.shape[1]
        ratio = red_pixels / float(total_pixels) if total_pixels > 0 else 0.0

        # Schedule H red box usually covers at least 0.4% of package surface
        has_red_box = bool(ratio > 0.004)
        return has_red_box, ratio

    @staticmethod
    def detect_loose_unmarked_pill(pil_image: Image.Image, ocr_text: str) -> bool:
        """
        Safety Check: Detects loose pills photographed without readable packaging text.
        A loose pill without readable packaging or imprint cannot be safely identified.
        """
        clean_text = "".join(c for c in ocr_text if c.isalnum())
        if len(clean_text) >= 4:
            return False

        np_img = np.array(pil_image.convert("L"))
        h, w = np_img.shape
        if max(h, w) > 500:
            scale = 500.0 / max(h, w)
            np_img = cv2.resize(np_img, (int(w * scale), int(h * scale)))

        blurred = cv2.GaussianBlur(np_img, (7, 7), 0)
        edges = cv2.Canny(blurred, 30, 100)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        total_area = np_img.shape[0] * np_img.shape[1]
        for c in contours:
            area = cv2.contourArea(c)
            if 0.05 * total_area < area < 0.50 * total_area:
                perimeter = cv2.arcLength(c, True)
                if perimeter > 0:
                    circularity = 4 * np.pi * (area / (perimeter * perimeter))
                    if circularity > 0.40 and len(clean_text) < 4:
                        return True
        return False

    @staticmethod
    def maybe_store_image(image_bytes: bytes, image_hash: str) -> Optional[str]:
        """Saves image to disk if user privacy configuration allows image retention."""
        if not settings.IMAGE_RETENTION_ENABLED:
            return None
        settings.STORED_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
        file_path = settings.STORED_IMAGES_DIR / f"{image_hash}.png"
        try:
            with open(file_path, "wb") as f:
                f.write(image_bytes)
            return str(file_path)
        except Exception:
            return None
