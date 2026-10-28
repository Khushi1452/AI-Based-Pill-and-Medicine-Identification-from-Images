# Mediscan AI — Advanced AI Healthcare Assistant Platform

[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/)
[![Streamlit](https://img.shields.io/badge/UI-Streamlit-FF4B4B.svg)](https://streamlit.io/)
[![Google Gen AI SDK](https://img.shields.io/badge/Gemini-2.5--Flash-4285F4.svg)](https://ai.google.dev/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57.svg)](https://www.sqlite.org/)
[![Tests](https://img.shields.io/badge/Tests-51%20Passing-16865B.svg)](tests/)

Mediscan AI is a comprehensive, production-grade AI Healthcare Assistant Platform and Indian pharmaceutical identification system built with **Streamlit, Python, Google Gemini Multimodal AI, PyMuPDF, Plotly, and scikit-learn**.

The platform is designed with clinical safety first: hard deterministic triage runs before LLM guidance, user data is isolated with PBKDF2 encryption, laboratory biomarkers are compared longitudinally, and 20,485+ verified CDSCO formulations are cross-checked locally without fabricating medical facts.

---

## 1. 12 Core Platform Navigation Modules

The platform features a clean, minimal healthcare dashboard (White `#FFFFFF`, Subtle Blue `#2563EB`, Slate `#172033`):

1. **🏠 Home Dashboard:** Unified health overview with active patient profile, daily medication reminders with "Mark Taken" actions, recent diagnostic lab summaries, quick vitals logger, upcoming appointments, and instant emergency calling (112).
2. **💬 AI Doctor Chat:** Contextual, empathetic conversational assistant with immediate deterministic emergency detection, multilingual support (English, Hindi, Punjabi), medical profile context, lab report attachments, follow-up chips, and persistent session storage.
3. **📄 Medical Report Analyzer:** Multi-format document parser (PyMuPDF for PDFs, Tesseract for scans) extracting biomarkers, reference intervals, and flags (`HIGH`, `LOW`, `NORMAL`). Includes side-by-side verification, user-editable corrections, and longitudinal multi-report Plotly trend tracking.
4. **💊 Medicine Scanner:** Complete 5-tier hybrid computer vision and ML identification engine for Indian blister strips, foil packaging, and cartons:
   - *Route A:* SHA-256 cryptographic response caching.
   - *Route B:* Character (2–5) & word n-gram TF-IDF matching over 20,485+ CDSCO medicines (&ge; 0.82 confidence; zero API cost).
   - *Route C:* Gemini 2.5 Flash multimodal fallback for reflective, wrinkled packaging.
   - *Route D:* Discrepancy flagging (`CONFLICTING`).
   - *Route E:* Safety abstention on unmarked loose pills or blurred photos.
   - Field-level verification badges and grounded Hindi patient advisory.
5. **🩺 Symptom Checker:** Guided clinical assessment questionnaire (onset, severity, body location, red flags, allergies, pregnancy status) providing 4-tier care urgency triage, qualified possible causes, safe supportive self-care, and specialty recommendations.
6. **🏥 Find Nearby Care:** Location-aware healthcare directory covering verified hospitals, 24/7 emergency departments, clinics, diagnostic labs, and pharmacies across Indian metropolitan and regional hubs (Delhi, Mumbai, Bengaluru, Chandigarh, Ludhiana). Computes exact Haversine distance, links to Google Maps navigation, direct phone calls, and favorites.
7. **📁 My Health Records:** Private, user-isolated medical record vault with strict clinical provenance tracking (`USER_ENTERED`, `EXTRACTED_FROM_REPORT`, `CLINICIAN_PROVIDED`, `AI_GENERATED`). Includes complete JSON backup export and printable clinical dossiers.
8. **⏰ Medication Tracker:** Prescription management with dosing schedules, taken/snoozed/skipped adherence logging, and refill shortage warnings.
9. **📈 Health Timeline:** Unified chronological feed of all health events paired with interactive Plotly trend charts for Blood Pressure (with AHA/ESC clinical zones), Blood Glucose, and extracted lab biomarkers.
10. **📋 Appointment Preparation:** Synthesizes an editable, structured clinical dossier for doctor visits summarizing chief concerns, symptom progression, current meds, abnormal labs, and targeted clinician questions.
11. **🚨 Emergency Help:** High-visibility emergency navigation with one-click direct dialing for **112** (National Emergency), **108** (Ambulance), **102** (Maternal/Infant), **1075** (National Health Helpline), **14416** (Tele-MANAS Mental Crisis), and **1800-116-117** (AIIMS Poison Center), alongside red-flag symptom guides and emergency room directions.
12. **⚙️ Settings and Privacy:** Core engine diagnostics (Tesseract OCR, Gemini API status, SQLite WAL mode), DPDP Act 2023 compliance framework, ML model retraining trigger, and permanent data deletion controls.

---

## 2. Medical Emergency Triage Engine

A deterministic clinical safety layer executes prior to any LLM generation and assigns one of four care urgency levels:

| Level | Urgency | Clinical Meaning | Immediate Action |
| :--- | :--- | :--- | :--- |
| **Level 1** | `EMERGENCY` | Severe warning signs (chest pain, stroke FAST, breathing crisis, severe bleeding, anaphylaxis, poisoning). | Seek emergency assistance now. Direct routing to 112 / 108. |
| **Level 2** | `URGENT` | Acute symptoms requiring prompt attention (high fever with stiff neck, acute abdomen, dehydration). | Visit an outpatient clinic or urgent care within hours. |
| **Level 3** | `ROUTINE` | Persistent, chronic, or sub-acute symptoms without acute danger. | Schedule an in-person primary care appointment. |
| **Level 4** | `GENERAL_GUIDANCE` | Minor, self-limiting concerns. | Supportive home care, education, and red-flag escalation criteria. |

*Safety Rule: The absence of detected warning signs does not imply a user is guaranteed to be healthy. Clear medical disclaimers accompany all guidance.*

---

## 3. Technology Stack

- **Frontend & Navigation:** Streamlit (Custom Light Healthcare Theme `#FFFFFF`, `#F8FAFC`, `#2563EB`, `#172033`).
- **Multimodal AI:** Google Gen AI SDK (`google-genai`) with Gemini 2.5 Flash.
- **Computer Vision & OCR:** Pillow, OpenCV (CLAHE adaptive histogram equalization), PyTesseract.
- **Document Processing:** PyMuPDF (`pymupdf`) for high-speed PDF laboratory report parsing.
- **Interactive Visualizations:** Plotly (`plotly.graph_objects`) for longitudinal biomarker, blood pressure, and glucose trends.
- **Local Machine Learning:** scikit-learn (Character 2–5 and word n-gram TF-IDF vectorizer + Cosine Similarity).
- **Security & Database:** SQLite (WAL mode, parameterized transactions, foreign keys, PBKDF2-HMAC-SHA256 password hashing with 100,000 iterations).
- **Validation:** Pydantic v2 data contracts.
- **Testing:** pytest (51 comprehensive passing tests).

---

## 4. Setup & Running Locally

### 1. Prerequisites
- macOS (Apple Silicon or Intel), Linux, or Windows.
- Python 3.11.
- Tesseract OCR (`brew install tesseract` on macOS).

### 2. Install Dependencies
```bash
# Navigate to project directory
cd "Khushi medicine project"

# Install dependencies using uv or pip into .venv
uv pip install --python .venv/bin/python -r requirements.txt
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and configure your API keys:
```bash
cp .env.example .env
```
Edit `.env`:
```env
GEMINI_API_KEY="your_actual_gemini_api_key"
CACHE_TTL_SECONDS=86400
LOCAL_CONFIDENCE_THRESHOLD=0.82
AMBIGUITY_MARGIN=0.08
IMAGE_RETENTION_ENABLED=false
```
*(Note: If GEMINI_API_KEY is not configured or offline, the platform automatically switches to grounded local clinical fallback templates without crashing).*

### 4. Launch the Platform
Start the Streamlit application:
```bash
.venv/bin/streamlit run app.py
```
Open your web browser at:
```
http://localhost:8501
```

A default demo patient profile (`Pooja Sharma`, 34 F, B+) is automatically pre-configured for instant demonstration.

---

## 5. Running Automated Tests

Run the complete 51-test automated suite covering triage, safety, report extraction, medicine identification, user data isolation, and multilingual responses:

```bash
.venv/bin/pytest tests/test_mediscan_suite.py tests/test_hybrid_pipeline.py tests/test_blister_strip_recognition.py tests/test_healthcare_platform.py -v
```

All 51 tests pass cleanly:
```
======================= 51 passed, 7 warnings in 23.38s ========================
```

---

## 6. Training & Evaluating the Local ML Model

The trainable machine learning pipeline is located at:
```
ml/notebooks/medicine_ai_training.ipynb
```
To run automated model retraining, evaluation, and artifact export:
```bash
.venv/bin/python scripts/generate_and_run_notebook.py
```
Model artifacts are saved to `ml/models/medicine_matcher/`:
- `vectorizer.joblib` (TF-IDF character & word n-gram feature extractor)
- `catalog_tfidf.joblib` (Indexed matrix of 20,485+ CDSCO medicines)
- `catalog_records.json` (Verified metadata store)
- `config.json` (Thresholds & bonuses)

---

## 7. Medical Safety & Compliance Disclaimer

> **अस्वीकरण:** यह प्लेटफॉर्म केवल शैक्षिक, सहायता और स्वास्थ्य नेविगेशन के उद्देश्य से है। इसे किसी लाइसेंस प्राप्त डॉक्टर, चिकित्सक या अस्पताल द्वारा की गई शारीरिक जांच या चिकित्सकीय निदान का विकल्प न मानें। किसी भी लक्षण, नई दवा या उपचार शुरू करने से पहले योग्य डॉक्टर से परामर्श लें। आपातकालीन स्थिति में तुरंत **112** पर कॉल करें।
