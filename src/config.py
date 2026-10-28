"""
Mediscan AI - Configuration Module
Centralized settings, file paths, safety constants, and environment loading.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Project Root
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Load .env file
ENV_PATH = PROJECT_ROOT / ".env"
if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
else:
    load_dotenv()


class Settings:
    # API Keys & Secrets
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "").strip()

    # File Paths
    PROJECT_ROOT: Path = PROJECT_ROOT
    DATA_DIR: Path = PROJECT_ROOT / "data"
    DATABASE_PATH: Path = DATA_DIR / "mediscan.db"
    CATALOG_CSV_PATH: Path = DATA_DIR / "medicines" / "medicine_catalog.csv"
    MODELS_DIR: Path = PROJECT_ROOT / "ml" / "models" / "medicine_matcher"
    FEEDBACK_DIR: Path = DATA_DIR / "feedback"
    PENDING_REVIEW_DIR: Path = DATA_DIR / "pending_review"
    STORED_IMAGES_DIR: Path = DATA_DIR / "stored_images"

    # Runtime Flags & Config
    IMAGE_RETENTION_ENABLED: bool = os.getenv("IMAGE_RETENTION_ENABLED", "false").lower() in ("true", "1")
    CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "86400"))
    LOCAL_CONFIDENCE_THRESHOLD: float = float(os.getenv("LOCAL_CONFIDENCE_THRESHOLD", "0.82"))
    AMBIGUITY_MARGIN: float = float(os.getenv("AMBIGUITY_MARGIN", "0.08"))
    MAX_IMAGE_DIM: int = 1800
    REQUEST_TIMEOUT_SECONDS: float = float(os.getenv("REQUEST_TIMEOUT_SECONDS", "30.0"))

    # Versions
    MODEL_VERSION: str = "1.1.0"
    PROMPT_VERSION: str = "2.1.0"

    # Tesseract Binary Location
    TESSERACT_CMD: str = os.getenv(
        "TESSERACT_CMD",
        "/opt/homebrew/bin/tesseract" if os.path.exists("/opt/homebrew/bin/tesseract") else "tesseract"
    )

    # Standard Healthcare Color Palette (Light Theme Only)
    THEME_COLORS = {
        "background": "#FFFFFF",
        "secondary_background": "#F7F9FC",
        "primary_blue": "#2563EB",
        "primary_blue_hover": "#1D4ED8",
        "main_text": "#172033",
        "secondary_text": "#697586",
        "borders": "#E6EAF0",
        "success": "#16865B",
        "success_bg": "#ECFDF5",
        "warning": "#B7791F",
        "warning_bg": "#FFFBEB",
        "error": "#C84747",
        "error_bg": "#FEF2F2",
    }

    # Prescribed Medical Disclaimers & Hindi Advisories
    HINDI_DISCLAIMER: str = (
        "अस्वीकरण: यह जानकारी केवल शैक्षिक और सहायता के उद्देश्य से है। "
        "इसे डॉक्टर की सलाह का विकल्प न मानें। दवा लेने से पहले अपनी स्थिति के अनुसार डॉक्टर या योग्य फार्मासिस्ट से परामर्श लें।"
    )
    HINDI_DOSAGE_ADVISORY: str = (
        "सही खुराक और उपचार की अवधि आपकी उम्र, स्वास्थ्य स्थिति और दवा की फॉर्मूलेशन पर निर्भर करती है। "
        "डॉक्टर या योग्य फार्मासिस्ट की सलाह के अनुसार ही दवा लें।"
    )
    HINDI_PRESCRIPTION_WARNING: str = (
        "यह एक डॉक्टर के पर्चे (Prescription) पर मिलने वाली नियंत्रित दवा है। इसे बिना डॉक्टरी सलाह के कभी न लें।"
    )
    HINDI_UNVERIFIED_WARNING: str = (
        "दवा की पहचान की पुष्टि होने तक इस जानकारी के आधार पर दवा न लें।"
    )


settings = Settings()
