# AI-Based-Pill-and-Medicine-Identification-from-Images
# Mediscan AI — Advanced AI Healthcare Assistant Platform

![Python](https://img.shields.io/badge/Python-3.11-blue.svg)
![Streamlit](https://img.shields.io/badge/UI-Streamlit-FF4B4B.svg)
![Gemini](https://img.shields.io/badge/AI-Google_Gemini-4285F4.svg)
![SQLite](https://img.shields.io/badge/Database-SQLite-003B57.svg)
![Tests](https://img.shields.io/badge/Tests-51_Passing-16865B.svg)

**Mediscan AI** is an AI-powered healthcare assistant and medicine identification platform built with Python, Streamlit, Google Gemini Multimodal AI, Computer Vision, OCR, SQLite, and Machine Learning.

The platform combines medicine image recognition, medical report analysis, symptom guidance, health record management, medication tracking, and emergency assistance in one interface. It combines local processing with optional generative AI features, with an emphasis on safety, privacy, and transparent medical information.

> **Disclaimer:** Mediscan AI is an educational and informational tool. It does not replace professional medical advice, diagnosis, or treatment.

---

## Features

### 1. Home Dashboard
- Health overview and patient profile.
- Medication reminders and adherence actions.
- Recent laboratory reports and vital signs.
- Upcoming appointments and emergency assistance.

### 2. AI Doctor Chat
- Conversational health information assistant.
- English, Hindi, and Punjabi language support.
- Context-aware responses using available health information.
- Medical report attachments and follow-up questions.
- Emergency warning detection before AI-generated guidance.

### 3. Medical Report Analyzer
- PDF report processing using PyMuPDF.
- OCR support for scanned documents using Tesseract.
- Extraction of laboratory biomarkers and reference ranges.
- High, low, and normal result flags.
- Interactive laboratory trend visualizations using Plotly.
- User review and correction of extracted information.

### 4. Medicine Scanner
A hybrid medicine identification pipeline designed for Indian pharmaceutical packaging.

- Local medicine matching using TF-IDF and cosine similarity.
- Character and word n-gram matching.
- Gemini multimodal image analysis as an optional fallback.
- OCR-based medicine text extraction.
- Conflicting-result detection and confidence thresholds.
- Safety abstention for unclear images or unidentified loose pills.
- Medicine information presented with verification indicators.

The project describes a local catalogue of more than 20,485 medicine formulations. Catalogue coverage and verification should be confirmed against the actual dataset included with the project.

### 5. Symptom Checker
- Guided symptom assessment.
- Questions about symptom duration, severity, and location.
- Warning-sign detection and care urgency guidance.
- General supportive-care information and specialty suggestions.

### 6. Find Nearby Care
- Healthcare directory for hospitals, clinics, pharmacies, and diagnostic centres.
- Location-based distance calculations.
- Google Maps navigation links.
- Contact information and emergency care discovery.

Availability and coverage depend on the configured healthcare directory and location data.

### 7. My Health Records
- Patient-specific health record management.
- Medical history and report information.
- Record provenance labels.
- JSON backup export and printable health summaries.

### 8. Medication Tracker
- Medication schedule management.
- Taken, snoozed, and skipped status tracking.
- Medication adherence history.
- Refill reminders based on configured schedules.

### 9. Health Timeline
- Chronological health event history.
- Blood pressure and glucose tracking.
- Laboratory biomarker trends.
- Interactive Plotly charts.

### 10. Appointment Preparation
- Structured summaries for doctor visits.
- Current medication and health concern summaries.
- Abnormal laboratory result summaries.
- Suggested questions to discuss with a healthcare professional.

### 11. Emergency Help
- Emergency contact shortcuts.
- Warning-sign information.
- Emergency service navigation and contact details.

Emergency numbers and contact information should be verified before deployment.

### 12. Settings and Privacy
- Application and AI service diagnostics.
- Configuration for OCR and local machine learning.
- Data management and deletion controls.
- Privacy and security settings.

---

## Medical Emergency Triage

The application is designed to check for potential warning signs before generating AI guidance.

| Level | Category | Intended response |
|---|---|---|
| 1 | Emergency | Seek emergency assistance immediately. |
| 2 | Urgent | Obtain prompt medical assessment. |
| 3 | Routine | Arrange an appropriate healthcare appointment. |
| 4 | General Guidance | Provide general information and explain warning signs. |

**Safety note:** Automated triage may miss serious conditions. A low-risk result does not guarantee that a person is healthy. Seek emergency care when symptoms suggest an emergency.

---

## Technology Stack

| Component | Technologies |
|---|---|
| User interface | Streamlit |
| Programming language | Python |
| Generative AI | Google Gen AI SDK, Gemini |
| Image processing | OpenCV, Pillow |
| Optical Character Recognition | PyTesseract, Tesseract OCR |
| Document processing | PyMuPDF |
| Machine learning | scikit-learn, TF-IDF, cosine similarity |
| Data processing | NumPy, Pandas |
| Visualizations | Plotly |
| Database | SQLite |
| Data validation | Pydantic |
| Testing | pytest |
| Model persistence | joblib |

---

## Architecture

```text
User
  |
  v
Streamlit Healthcare Dashboard
  |
  +--> AI Health Chat --> Optional Gemini API
  |
  +--> Medicine Scanner
  |       |
  |       +--> Image Preprocessing
  |       +--> OCR Text Extraction
  |       +--> Local Medicine Matching
  |       +--> Optional Multimodal AI Fallback
  |
  +--> Medical Report Analyzer
  |       |
  |       +--> PDF/Text Extraction
  |       +--> Biomarker Processing
  |       +--> Trend Visualization
  |
  +--> Symptom Checker and Health Tools
  |
  v
SQLite Database and Local Data
```

The actual execution flow depends on the modules enabled and configured in the application.

---

## Installation and Setup

### Prerequisites

- Python 3.11 recommended.
- Git.
- Tesseract OCR installed and accessible from your system.
- A Google Gemini API key for features that use the online Gemini service.

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_PROJECT_FOLDER>
```

Replace the placeholders with your repository URL and project folder name.

### 2. Create a virtual environment

**Windows PowerShell:**

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**macOS/Linux:**

```bash
python3.11 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file in the project root, following `.env.example` if it exists.

```env
GEMINI_API_KEY=your_actual_api_key
CACHE_TTL_SECONDS=86400
LOCAL_CONFIDENCE_THRESHOLD=0.82
AMBIGUITY_MARGIN=0.08
IMAGE_RETENTION_ENABLED=false
```

Do not upload your real `.env` file or API key to GitHub. Add `.env` to `.gitignore`.

The application can use local fallback functionality only where that fallback is implemented in the code. Gemini-dependent features require a valid API configuration and internet access.

### 5. Run the application

```bash
streamlit run app.py
```

Open the local address shown in your terminal, normally:

```text
http://localhost:8501
```

---

## Running Tests

Run the test suite using:

```bash
python -m pytest -v
```

To run the specific test files described by this project:

```bash
python -m pytest tests/test_mediscan_suite.py tests/test_hybrid_pipeline.py tests/test_blister_strip_recognition.py tests/test_healthcare_platform.py -v
```

The original project notes report 51 passing tests. Re-run the suite in your current environment to confirm the result before publishing a test badge.

---

## Local Medicine Matching Model

The documented training notebook is:

```text
ml/notebooks/medicine_ai_training.ipynb
```

The documented training and artifact-generation script is:

```bash
python scripts/generate_and_run_notebook.py
```

The expected model artefacts are stored under:

```text
ml/models/medicine_matcher/
```

They may include:

- `vectorizer.joblib` — TF-IDF feature extractor.
- `catalog_tfidf.joblib` — Indexed medicine catalogue matrix.
- `catalog_records.json` — Medicine catalogue records.
- `config.json` — Matching thresholds and configuration.

These paths and commands assume the corresponding files are present in your repository.

---

## Privacy and Security

- Keep API keys and credentials in environment variables.
- Use parameterized database queries.
- Apply access controls to patient-specific information.
- Avoid retaining uploaded medical images unless necessary and consented to.
- Verify that authentication, data isolation, encryption, and deletion controls work as intended before deployment.
- Do not commit real patient records, medical reports, passwords, or other sensitive data.

---

## Limitations

- Image quality, lighting, packaging condition, and OCR errors can affect medicine matching.
- A predicted medicine name or confidence score is not proof of identity.
- Medicine information must come from reliable, verifiable sources.
- Generative AI can produce incorrect information and should not independently determine a patient's treatment or dosage.
- This project should not be used as the sole basis for medication decisions.

---

## Future Improvements

- Expand and regularly validate the medicine catalogue.
- Improve image recognition and OCR performance.
- Add more language options.
- Improve accessibility and mobile responsiveness.
- Strengthen privacy controls and automated safety testing.
- Evaluate model accuracy using a representative, labelled test dataset.

---

## Medical Disclaimer

Mediscan AI is developed for educational, research, and health-information purposes. It is not a certified medical device and does not replace a licensed doctor, pharmacist, or other qualified healthcare professional.

Never start, stop, or change medication based solely on this application's output. Always verify medicine identity, strength, usage, and dosage with a qualified healthcare professional. In a medical emergency in India, call **112** or your local emergency service.

---

## Author

**Khushi Pal**

AI, Computer Vision, Machine Learning, and Healthcare Technology Project.

