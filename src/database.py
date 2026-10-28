"""
Mediscan AI - SQLite Database Layer
Handles thread-safe persistence, migrations, schema initialization,
catalogue seeding, analysis logging, and user feedback audit trails.
"""

import sqlite3
import json
import csv
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

from .config import settings


def get_db_connection() -> sqlite3.Connection:
    """Creates a new SQLite connection with foreign keys and dict-like row access."""
    conn = sqlite3.connect(str(settings.DATABASE_PATH), timeout=20.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn


def init_db(seed_catalog: bool = True) -> None:
    """Initializes tables, creates indexes, and optionally seeds verified catalogue data."""
    settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    with get_db_connection() as conn:
        cursor = conn.cursor()

        # 1. Medicines Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS medicines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id TEXT UNIQUE NOT NULL,
            brand_name TEXT NOT NULL,
            generic_name TEXT,
            active_ingredients TEXT,
            strength TEXT,
            dosage_form TEXT,
            manufacturer TEXT,
            therapeutic_class TEXT,
            common_uses TEXT,
            precautions TEXT,
            prescription_status TEXT DEFAULT 'Prescription',
            source_name TEXT DEFAULT 'CDSCO / Jan Aushadhi',
            source_url TEXT,
            verification_status TEXT NOT NULL DEFAULT 'VERIFIED_REGULATORY',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_med_brand ON medicines(brand_name COLLATE NOCASE);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_med_generic ON medicines(generic_name COLLATE NOCASE);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_med_prod_id ON medicines(product_id);")

        # 2. Analysis Records Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS analysis_records (
            id TEXT PRIMARY KEY NOT NULL,
            image_hash TEXT NOT NULL,
            image_reference TEXT,
            ocr_text TEXT,
            extracted_fields TEXT,
            candidate_product_ids TEXT,
            selected_product_id TEXT,
            identification_method TEXT NOT NULL,
            confidence_metadata TEXT,
            field_verification_status TEXT,
            gemini_used INTEGER NOT NULL DEFAULT 0,
            model_version TEXT,
            prompt_version TEXT,
            processing_duration REAL DEFAULT 0.0,
            created_at TEXT NOT NULL
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_analysis_hash ON analysis_records(image_hash);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_analysis_created ON analysis_records(created_at DESC);")

        # 3. Feedback Records Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS feedback_records (
            id TEXT PRIMARY KEY NOT NULL,
            analysis_id TEXT NOT NULL,
            feedback_type TEXT NOT NULL,
            field_feedback TEXT,
            proposed_corrections TEXT,
            review_status TEXT NOT NULL DEFAULT 'PENDING',
            reviewed_by TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (analysis_id) REFERENCES analysis_records(id) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_feedback_analysis ON feedback_records(analysis_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback_records(review_status);")

        # 4. Model Versions Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS model_versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            model_name TEXT NOT NULL,
            artifact_path TEXT NOT NULL,
            dataset_version TEXT NOT NULL,
            training_date TEXT NOT NULL,
            evaluation_metrics TEXT,
            deployment_status TEXT NOT NULL DEFAULT 'ACTIVE'
        );
        """)

        # 5. Analysis Response Cache Table (Route A caching)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS analysis_cache (
            image_hash TEXT PRIMARY KEY NOT NULL,
            response_json TEXT NOT NULL,
            created_at REAL NOT NULL,
            expires_at REAL NOT NULL
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_cache_expires ON analysis_cache(expires_at);")

        # 6. Users Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY NOT NULL,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            full_name TEXT NOT NULL,
            age INTEGER,
            gender TEXT,
            created_at TEXT NOT NULL
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);")

        # 7. User Profiles Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_profiles (
            user_id TEXT PRIMARY KEY NOT NULL,
            blood_group TEXT,
            allergies TEXT DEFAULT '[]',
            chronic_conditions TEXT DEFAULT '[]',
            emergency_contact_name TEXT,
            emergency_contact_phone TEXT,
            preferred_language TEXT DEFAULT 'en',
            data_sharing_consent INTEGER DEFAULT 0,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # 8. Chat Conversations Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_conversations (
            id TEXT PRIMARY KEY NOT NULL,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_conversations(user_id);")

        # 9. Chat Messages Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY NOT NULL,
            conversation_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            care_level TEXT,
            triage_flag INTEGER DEFAULT 0,
            attachments_json TEXT DEFAULT '[]',
            created_at TEXT NOT NULL,
            FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_msg_conv ON chat_messages(conversation_id);")

        # 10. Medical Reports Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS medical_reports (
            id TEXT PRIMARY KEY NOT NULL,
            user_id TEXT NOT NULL,
            report_title TEXT NOT NULL,
            report_type TEXT DEFAULT 'OTHER',
            report_date TEXT,
            raw_text TEXT,
            biomarkers_json TEXT DEFAULT '[]',
            ai_summary_json TEXT DEFAULT '{}',
            user_corrected INTEGER DEFAULT 0,
            file_name TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_rep_user ON medical_reports(user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_rep_date ON medical_reports(report_date DESC);")

        # 11. Symptom Assessments Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS symptom_assessments (
            id TEXT PRIMARY KEY NOT NULL,
            user_id TEXT NOT NULL,
            main_symptom TEXT NOT NULL,
            duration TEXT,
            severity TEXT,
            body_location TEXT,
            associated_symptoms TEXT,
            age_range TEXT,
            relevant_conditions TEXT,
            pregnancy_status TEXT,
            current_medications TEXT,
            care_urgency TEXT NOT NULL,
            possible_causes_json TEXT DEFAULT '[]',
            self_care_guidance_json TEXT DEFAULT '[]',
            escalation_signs_json TEXT DEFAULT '[]',
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_symptom_user ON symptom_assessments(user_id);")

        # 12. Medications Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS medications (
            id TEXT PRIMARY KEY NOT NULL,
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            strength TEXT,
            dosage_form TEXT,
            instructions TEXT,
            frequency TEXT,
            start_date TEXT,
            end_date TEXT,
            refill_reminder_days INTEGER DEFAULT 0,
            status TEXT DEFAULT 'ACTIVE',
            provenance TEXT DEFAULT 'USER_ENTERED',
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_meds_user ON medications(user_id);")

        # 13. Medication Logs Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS medication_logs (
            id TEXT PRIMARY KEY NOT NULL,
            medication_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            status TEXT NOT NULL,
            scheduled_time TEXT,
            logged_at TEXT NOT NULL,
            notes TEXT,
            FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_medlog_user ON medication_logs(user_id);")

        # 14. Health Measurements Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS health_measurements (
            id TEXT PRIMARY KEY NOT NULL,
            user_id TEXT NOT NULL,
            measurement_type TEXT NOT NULL,
            value_numeric REAL NOT NULL,
            secondary_value REAL,
            unit TEXT NOT NULL,
            source TEXT DEFAULT 'USER_ENTERED',
            notes TEXT,
            measured_at TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_meas_user ON health_measurements(user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_meas_type ON health_measurements(measurement_type);")

        # 15. Appointments Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY NOT NULL,
            user_id TEXT NOT NULL,
            doctor_name TEXT,
            specialty TEXT,
            facility_name TEXT,
            appointment_date TEXT NOT NULL,
            reason TEXT,
            prep_summary_json TEXT DEFAULT '{}',
            status TEXT DEFAULT 'SCHEDULED',
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_appt_user ON appointments(user_id);")

        # 16. Saved Healthcare Facilities Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS saved_facilities (
            id TEXT PRIMARY KEY NOT NULL,
            user_id TEXT NOT NULL,
            facility_name TEXT NOT NULL,
            facility_type TEXT NOT NULL,
            specialty TEXT,
            address TEXT,
            phone TEXT,
            rating REAL,
            distance_km REAL,
            lat REAL,
            lng REAL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_fac_user ON saved_facilities(user_id);")

        # 17. Feedback Audit Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS feedback_audit (
            id TEXT PRIMARY KEY NOT NULL,
            user_id TEXT,
            feedback_category TEXT NOT NULL,
            reference_id TEXT,
            input_data_summary TEXT,
            model_output_summary TEXT,
            user_rating TEXT,
            user_corrections TEXT,
            review_status TEXT DEFAULT 'PENDING',
            created_at TEXT NOT NULL
        );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_cat ON feedback_audit(feedback_category);")

        conn.commit()

    if seed_catalog:
        seed_catalog_if_empty()


def seed_catalog_if_empty() -> int:
    """Populates medicines table from verified catalog CSV if currently empty."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM medicines;")
        count = cursor.fetchone()[0]
        if count > 0:
            return count

        csv_path = settings.CATALOG_CSV_PATH
        if not csv_path.exists():
            print(f"[Database] Catalogue CSV not found at {csv_path}, skipping seed.")
            return 0

        print(f"[Database] Seeding medicines table from {csv_path}...")
        now_str = datetime.utcnow().isoformat()
        records_to_insert = []
        
        with open(csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader):
                prod_id = row.get("product_id") or f"PROD-{idx+1}"
                records_to_insert.append((
                    prod_id,
                    row.get("brand_name", "").strip(),
                    row.get("generic_name", "").strip(),
                    row.get("active_ingredients", "").strip(),
                    row.get("strength", "").strip(),
                    row.get("dosage_form", "").strip(),
                    row.get("manufacturer", "").strip(),
                    row.get("therapeutic_class", f"Pharmaceutical ({row.get('generic_name', '')})").strip(),
                    row.get("common_uses", "").strip(),
                    row.get("precautions", "").strip(),
                    row.get("prescription_status", "Prescription").strip(),
                    row.get("source_name", "Verified Indian Regulatory Store").strip(),
                    row.get("source_url", "https://cdsco.gov.in").strip(),
                    "VERIFIED_REGULATORY",
                    now_str,
                    now_str,
                ))

        cursor.executemany("""
            INSERT OR IGNORE INTO medicines (
                product_id, brand_name, generic_name, active_ingredients, strength,
                dosage_form, manufacturer, therapeutic_class, common_uses, precautions,
                prescription_status, source_name, source_url, verification_status,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, records_to_insert)
        conn.commit()
        
        cursor.execute("SELECT COUNT(*) FROM medicines;")
        inserted_count = cursor.fetchone()[0]
        print(f"[Database] Seeded {inserted_count} verified Indian medicine records.")
        return inserted_count


# ============================================================================
# ANALYSIS RECORD OPERATIONS
# ============================================================================

def save_analysis_record(record: Dict[str, Any]) -> str:
    """Inserts an analysis execution record with provenance and timing."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO analysis_records (
                id, image_hash, image_reference, ocr_text, extracted_fields,
                candidate_product_ids, selected_product_id, identification_method,
                confidence_metadata, field_verification_status, gemini_used,
                model_version, prompt_version, processing_duration, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            record["id"],
            record["image_hash"],
            record.get("image_reference"),
            record.get("ocr_text", ""),
            json.dumps(record.get("extracted_fields", {}), ensure_ascii=False),
            json.dumps(record.get("candidate_product_ids", []), ensure_ascii=False),
            record.get("selected_product_id"),
            record["identification_method"],
            json.dumps(record.get("confidence_metadata", {}), ensure_ascii=False),
            json.dumps(record.get("field_verification_status", {}), ensure_ascii=False),
            1 if record.get("gemini_used") else 0,
            record.get("model_version", settings.MODEL_VERSION),
            record.get("prompt_version", settings.PROMPT_VERSION),
            float(record.get("processing_duration", 0.0)),
            record.get("created_at", datetime.utcnow().isoformat()),
        ))
        conn.commit()
        return record["id"]


def get_analysis_record(record_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves an analysis record by unique ID."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM analysis_records WHERE id = ?;", (record_id,))
        row = cursor.fetchone()
        if not row:
            return None
        d = dict(row)
        d["extracted_fields"] = json.loads(d["extracted_fields"]) if d["extracted_fields"] else {}
        d["candidate_product_ids"] = json.loads(d["candidate_product_ids"]) if d["candidate_product_ids"] else []
        d["confidence_metadata"] = json.loads(d["confidence_metadata"]) if d["confidence_metadata"] else {}
        d["field_verification_status"] = json.loads(d["field_verification_status"]) if d["field_verification_status"] else {}
        d["gemini_used"] = bool(d["gemini_used"])
        return d


def list_recent_analyses(limit: int = 50) -> List[Dict[str, Any]]:
    """Returns recent analysis records for the history view."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, image_hash, selected_product_id, identification_method,
                   gemini_used, processing_duration, created_at, extracted_fields,
                   field_verification_status
            FROM analysis_records
            ORDER BY created_at DESC
            LIMIT ?;
        """, (limit,))
        results = []
        for row in cursor.fetchall():
            d = dict(row)
            d["extracted_fields"] = json.loads(d["extracted_fields"]) if d["extracted_fields"] else {}
            d["field_verification_status"] = json.loads(d["field_verification_status"]) if d["field_verification_status"] else {}
            d["gemini_used"] = bool(d["gemini_used"])
            results.append(d)
        return results


def delete_analysis_record(record_id: str) -> bool:
    """Removes an analysis record and associated feedback (user privacy control)."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM analysis_records WHERE id = ?;", (record_id,))
        conn.commit()
        return cursor.rowcount > 0


# ============================================================================
# FEEDBACK RECORD OPERATIONS
# ============================================================================

def save_feedback_record(feedback: Dict[str, Any]) -> str:
    """Saves user feedback and challenges to the database."""
    now_str = datetime.utcnow().isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO feedback_records (
                id, analysis_id, feedback_type, field_feedback,
                proposed_corrections, review_status, reviewed_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            feedback["id"],
            feedback["analysis_id"],
            feedback["feedback_type"],
            json.dumps(feedback.get("field_feedback", {}), ensure_ascii=False),
            json.dumps(feedback.get("proposed_corrections", {}), ensure_ascii=False),
            feedback.get("review_status", "PENDING"),
            feedback.get("reviewed_by"),
            feedback.get("created_at", now_str),
            now_str,
        ))
        conn.commit()
        return feedback["id"]


def get_feedback_for_analysis(analysis_id: str) -> List[Dict[str, Any]]:
    """Returns feedback records for a specific analysis."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM feedback_records
            WHERE analysis_id = ?
            ORDER BY created_at DESC;
        """, (analysis_id,))
        results = []
        for row in cursor.fetchall():
            d = dict(row)
            d["field_feedback"] = json.loads(d["field_feedback"]) if d["field_feedback"] else {}
            d["proposed_corrections"] = json.loads(d["proposed_corrections"]) if d["proposed_corrections"] else {}
            results.append(d)
        return results


def list_pending_feedback(limit: int = 50) -> List[Dict[str, Any]]:
    """Lists feedback waiting for human-in-the-loop review."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT f.*, a.image_hash, a.ocr_text, a.extracted_fields
            FROM feedback_records f
            LEFT JOIN analysis_records a ON f.analysis_id = a.id
            WHERE f.review_status = 'PENDING'
            ORDER BY f.created_at DESC
            LIMIT ?;
        """, (limit,))
        results = []
        for row in cursor.fetchall():
            d = dict(row)
            d["field_feedback"] = json.loads(d["field_feedback"]) if d["field_feedback"] else {}
            d["proposed_corrections"] = json.loads(d["proposed_corrections"]) if d["proposed_corrections"] else {}
            d["extracted_fields"] = json.loads(d["extracted_fields"]) if d.get("extracted_fields") else {}
            results.append(d)
        return results


def update_feedback_status(feedback_id: str, new_status: str, reviewed_by: str = "Admin") -> bool:
    """Updates review status of a feedback submission ('APPROVED' or 'REJECTED')."""
    now_str = datetime.utcnow().isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE feedback_records
            SET review_status = ?, reviewed_by = ?, updated_at = ?
            WHERE id = ?;
        """, (new_status, reviewed_by, now_str, feedback_id))
        conn.commit()
        return cursor.rowcount > 0


# ============================================================================
# MEDICINE CATALOGUE OPERATIONS
# ============================================================================

def get_medicine_by_id(product_id: str) -> Optional[Dict[str, Any]]:
    """Fetches a verified medicine record by product ID."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM medicines WHERE product_id = ?;", (product_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


def search_medicines(query: str, limit: int = 30) -> List[Dict[str, Any]]:
    """Searches medicines by brand or generic name."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        term = f"%{query.strip()}%"
        cursor.execute("""
            SELECT * FROM medicines
            WHERE brand_name LIKE ? OR generic_name LIKE ? OR active_ingredients LIKE ?
            ORDER BY brand_name ASC
            LIMIT ?;
        """, (term, term, term, limit))
        return [dict(r) for r in cursor.fetchall()]


def get_catalogue_stats() -> Dict[str, Any]:
    """Returns count and verification breakdown of medicine records."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM medicines;")
        total_meds = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM analysis_records;")
        total_analyses = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM feedback_records WHERE feedback_type = 'CORRECT';")
        correct_feedbacks = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM feedback_records WHERE feedback_type = 'INCORRECT';")
        incorrect_feedbacks = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM feedback_records WHERE review_status = 'PENDING';")
        pending_reviews = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM analysis_records WHERE gemini_used = 1;")
        gemini_analyses = cursor.fetchone()[0]

        return {
            "total_medicines": total_meds,
            "total_analyses": total_analyses,
            "correct_feedbacks": correct_feedbacks,
            "incorrect_feedbacks": incorrect_feedbacks,
            "pending_reviews": pending_reviews,
            "gemini_analyses": gemini_analyses,
            "local_analyses": total_analyses - gemini_analyses,
        }


# ============================================================================
# ANALYSIS CACHE (ROUTE A) OPERATIONS
# ============================================================================

def get_cached_analysis(image_hash: str) -> Optional[Dict[str, Any]]:
    """Retrieves valid cached analysis by image hash if unexpired."""
    now = time.time()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT response_json FROM analysis_cache
            WHERE image_hash = ? AND expires_at > ?;
        """, (image_hash, now))
        row = cursor.fetchone()
        if row:
            try:
                return json.loads(row["response_json"])
            except Exception:
                return None
        return None


def set_cached_analysis(image_hash: str, response_data: Dict[str, Any], ttl_seconds: int = 86400) -> None:
    """Stores an analysis result in cache with TTL."""
    now = time.time()
    expires = now + ttl_seconds
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO analysis_cache (image_hash, response_json, created_at, expires_at)
            VALUES (?, ?, ?, ?);
        """, (image_hash, json.dumps(response_data, ensure_ascii=False), now, expires))
        conn.commit()


def clear_analysis_cache() -> int:
    """Deletes all items from cache table."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM analysis_cache;")
        deleted = cursor.rowcount
        conn.commit()
        return deleted


# ============================================================================
# CHAT CONVERSATION & MESSAGE OPERATIONS
# ============================================================================

def create_chat_conversation(user_id: str, title: str) -> str:
    import uuid
    conv_id = f"conv_{uuid.uuid4().hex[:12]}"
    now_str = datetime.utcnow().isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO chat_conversations (id, user_id, title, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        """, (conv_id, user_id, title, now_str, now_str))
        conn.commit()
    return conv_id


def list_chat_conversations(user_id: str) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, user_id, title, created_at, updated_at
            FROM chat_conversations
            WHERE user_id = ?
            ORDER BY updated_at DESC
        """, (user_id,))
        return [dict(r) for r in cursor.fetchall()]


def get_chat_conversation(conv_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM chat_conversations WHERE id = ? AND user_id = ?", (conv_id, user_id))
        row = cursor.fetchone()
        return dict(row) if row else None


def delete_chat_conversation(conv_id: str, user_id: str) -> bool:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM chat_conversations WHERE id = ? AND user_id = ?", (conv_id, user_id))
        conn.commit()
        return cursor.rowcount > 0


def add_chat_message(
    conversation_id: str,
    user_id: str,
    role: str,
    content: str,
    care_level: Optional[str] = None,
    triage_flag: int = 0,
    attachments: Optional[List[Dict[str, Any]]] = None
) -> str:
    import uuid
    msg_id = f"msg_{uuid.uuid4().hex[:12]}"
    now_str = datetime.utcnow().isoformat()
    att_json = json.dumps(attachments or [], ensure_ascii=False)
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO chat_messages (id, conversation_id, user_id, role, content, care_level, triage_flag, attachments_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (msg_id, conversation_id, user_id, role, content, care_level, triage_flag, att_json, now_str))
        cursor.execute("UPDATE chat_conversations SET updated_at = ? WHERE id = ?", (now_str, conversation_id))
        conn.commit()
    return msg_id


def get_chat_messages(conversation_id: str, user_id: str) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, conversation_id, user_id, role, content, care_level, triage_flag, attachments_json, created_at
            FROM chat_messages
            WHERE conversation_id = ? AND user_id = ?
            ORDER BY created_at ASC
        """, (conversation_id, user_id))
        rows = cursor.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            try:
                d["attachments"] = json.loads(d.get("attachments_json") or "[]")
            except Exception:
                d["attachments"] = []
            result.append(d)
        return result


def search_chat_messages(user_id: str, query: str) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT m.id, m.conversation_id, c.title as conversation_title, m.role, m.content, m.created_at
            FROM chat_messages m
            JOIN chat_conversations c ON m.conversation_id = c.id
            WHERE m.user_id = ? AND m.content LIKE ?
            ORDER BY m.created_at DESC LIMIT 30
        """, (user_id, f"%{query}%"))
        return [dict(r) for r in cursor.fetchall()]


# ============================================================================
# MEDICAL REPORTS & BIOMARKERS
# ============================================================================

def save_medical_report(
    user_id: str,
    report_title: str,
    report_type: str,
    report_date: Optional[str],
    raw_text: str,
    biomarkers: List[Dict[str, Any]],
    ai_summary: Dict[str, Any],
    file_name: Optional[str] = None
) -> str:
    import uuid
    rep_id = f"rep_{uuid.uuid4().hex[:12]}"
    now_str = datetime.utcnow().isoformat()
    if not report_date:
        report_date = now_str[:10]
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO medical_reports (
                id, user_id, report_title, report_type, report_date, raw_text,
                biomarkers_json, ai_summary_json, user_corrected, file_name, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
        """, (
            rep_id, user_id, report_title, report_type, report_date, raw_text,
            json.dumps(biomarkers, ensure_ascii=False),
            json.dumps(ai_summary, ensure_ascii=False),
            file_name, now_str
        ))
        conn.commit()
    return rep_id


def list_medical_reports(user_id: str) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, user_id, report_title, report_type, report_date, biomarkers_json,
                   ai_summary_json, user_corrected, file_name, created_at
            FROM medical_reports
            WHERE user_id = ?
            ORDER BY report_date DESC, created_at DESC
        """, (user_id,))
        rows = cursor.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            try:
                d["biomarkers"] = json.loads(d.get("biomarkers_json") or "[]")
                d["ai_summary"] = json.loads(d.get("ai_summary_json") or "{}")
            except Exception:
                d["biomarkers"] = []
                d["ai_summary"] = {}
            result.append(d)
        return result


def get_medical_report(report_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM medical_reports WHERE id = ? AND user_id = ?", (report_id, user_id))
        row = cursor.fetchone()
        if not row:
            return None
        d = dict(row)
        try:
            d["biomarkers"] = json.loads(d.get("biomarkers_json") or "[]")
            d["ai_summary"] = json.loads(d.get("ai_summary_json") or "{}")
        except Exception:
            d["biomarkers"] = []
            d["ai_summary"] = {}
        return d


def update_medical_report_biomarkers(report_id: str, user_id: str, biomarkers: List[Dict[str, Any]]) -> bool:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE medical_reports
            SET biomarkers_json = ?, user_corrected = 1
            WHERE id = ? AND user_id = ?
        """, (json.dumps(biomarkers, ensure_ascii=False), report_id, user_id))
        conn.commit()
        return cursor.rowcount > 0


def delete_medical_report(report_id: str, user_id: str) -> bool:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM medical_reports WHERE id = ? AND user_id = ?", (report_id, user_id))
        conn.commit()
        return cursor.rowcount > 0


# ============================================================================
# SYMPTOM ASSESSMENTS
# ============================================================================

def save_symptom_assessment(user_id: str, assessment_data: Dict[str, Any]) -> str:
    import uuid
    assess_id = f"sym_{uuid.uuid4().hex[:12]}"
    now_str = datetime.utcnow().isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO symptom_assessments (
                id, user_id, main_symptom, duration, severity, body_location,
                associated_symptoms, age_range, relevant_conditions, pregnancy_status,
                current_medications, care_urgency, possible_causes_json,
                self_care_guidance_json, escalation_signs_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            assess_id, user_id,
            assessment_data.get("main_symptom", "General concern"),
            assessment_data.get("duration", ""),
            assessment_data.get("severity", "Moderate"),
            assessment_data.get("body_location", ""),
            assessment_data.get("associated_symptoms", ""),
            assessment_data.get("age_range", ""),
            assessment_data.get("relevant_conditions", ""),
            assessment_data.get("pregnancy_status", "No / Not applicable"),
            assessment_data.get("current_medications", ""),
            assessment_data.get("care_urgency", "ROUTINE"),
            json.dumps(assessment_data.get("possible_causes", []), ensure_ascii=False),
            json.dumps(assessment_data.get("self_care_guidance", []), ensure_ascii=False),
            json.dumps(assessment_data.get("escalation_signs", []), ensure_ascii=False),
            now_str
        ))
        conn.commit()
    return assess_id


def list_symptom_assessments(user_id: str) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM symptom_assessments WHERE user_id = ? ORDER BY created_at DESC
        """, (user_id,))
        rows = cursor.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            try:
                d["possible_causes"] = json.loads(d.get("possible_causes_json") or "[]")
                d["self_care_guidance"] = json.loads(d.get("self_care_guidance_json") or "[]")
                d["escalation_signs"] = json.loads(d.get("escalation_signs_json") or "[]")
            except Exception:
                pass
            result.append(d)
        return result


# ============================================================================
# MEDICATIONS & LOGS
# ============================================================================

def save_medication(
    user_id: str,
    name: str,
    strength: Optional[str] = None,
    dosage_form: Optional[str] = None,
    instructions: Optional[str] = None,
    frequency: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    refill_days: int = 0,
    provenance: str = "USER_ENTERED"
) -> str:
    import uuid
    med_id = f"med_{uuid.uuid4().hex[:12]}"
    now_str = datetime.utcnow().isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO medications (
                id, user_id, name, strength, dosage_form, instructions,
                frequency, start_date, end_date, refill_reminder_days, status, provenance, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
        """, (
            med_id, user_id, name.strip(), strength, dosage_form, instructions,
            frequency, start_date or now_str[:10], end_date, refill_days, provenance, now_str
        ))
        conn.commit()
    return med_id


def list_medications(user_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if status:
            cursor.execute("SELECT * FROM medications WHERE user_id = ? AND status = ? ORDER BY created_at DESC", (user_id, status))
        else:
            cursor.execute("SELECT * FROM medications WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        return [dict(r) for r in cursor.fetchall()]


def update_medication_status(med_id: str, user_id: str, status: str) -> bool:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE medications SET status = ? WHERE id = ? AND user_id = ?", (status, med_id, user_id))
        conn.commit()
        return cursor.rowcount > 0


def delete_medication(med_id: str, user_id: str) -> bool:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM medications WHERE id = ? AND user_id = ?", (med_id, user_id))
        conn.commit()
        return cursor.rowcount > 0


def log_medication_action(
    medication_id: str,
    user_id: str,
    status: str,
    scheduled_time: Optional[str] = None,
    notes: Optional[str] = None
) -> str:
    import uuid
    log_id = f"mlog_{uuid.uuid4().hex[:12]}"
    now_str = datetime.utcnow().isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO medication_logs (id, medication_id, user_id, status, scheduled_time, logged_at, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (log_id, medication_id, user_id, status, scheduled_time or now_str, now_str, notes))
        conn.commit()
    return log_id


def list_medication_logs(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT l.*, m.name as medication_name, m.strength
            FROM medication_logs l
            JOIN medications m ON l.medication_id = m.id
            WHERE l.user_id = ?
            ORDER BY l.logged_at DESC LIMIT ?
        """, (user_id, limit))
        return [dict(r) for r in cursor.fetchall()]


# ============================================================================
# HEALTH MEASUREMENTS
# ============================================================================

def save_health_measurement(
    user_id: str,
    measurement_type: str,
    value_numeric: float,
    unit: str,
    secondary_value: Optional[float] = None,
    source: str = "USER_ENTERED",
    measured_at: Optional[str] = None,
    notes: Optional[str] = None
) -> str:
    import uuid
    m_id = f"meas_{uuid.uuid4().hex[:12]}"
    now_str = datetime.utcnow().isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO health_measurements (
                id, user_id, measurement_type, value_numeric, secondary_value,
                unit, source, notes, measured_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            m_id, user_id, measurement_type, value_numeric, secondary_value,
            unit, source, notes, measured_at or now_str, now_str
        ))
        conn.commit()
    return m_id


def list_health_measurements(
    user_id: str,
    measurement_type: Optional[str] = None,
    limit: int = 100
) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if measurement_type:
            cursor.execute("""
                SELECT * FROM health_measurements
                WHERE user_id = ? AND measurement_type = ?
                ORDER BY measured_at ASC LIMIT ?
            """, (user_id, measurement_type, limit))
        else:
            cursor.execute("""
                SELECT * FROM health_measurements
                WHERE user_id = ?
                ORDER BY measured_at DESC LIMIT ?
            """, (user_id, limit))
        return [dict(r) for r in cursor.fetchall()]


def delete_health_measurement(measurement_id: str, user_id: str) -> bool:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM health_measurements WHERE id = ? AND user_id = ?", (measurement_id, user_id))
        conn.commit()
        return cursor.rowcount > 0


# ============================================================================
# APPOINTMENTS
# ============================================================================

def save_appointment(
    user_id: str,
    doctor_name: Optional[str],
    specialty: Optional[str],
    facility_name: Optional[str],
    appointment_date: str,
    reason: Optional[str],
    prep_summary: Optional[Dict[str, Any]] = None
) -> str:
    import uuid
    appt_id = f"apt_{uuid.uuid4().hex[:12]}"
    now_str = datetime.utcnow().isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO appointments (
                id, user_id, doctor_name, specialty, facility_name,
                appointment_date, reason, prep_summary_json, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'SCHEDULED', ?)
        """, (
            appt_id, user_id, doctor_name, specialty, facility_name,
            appointment_date, reason, json.dumps(prep_summary or {}, ensure_ascii=False), now_str
        ))
        conn.commit()
    return appt_id


def list_appointments(user_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if status:
            cursor.execute("SELECT * FROM appointments WHERE user_id = ? AND status = ? ORDER BY appointment_date ASC", (user_id, status))
        else:
            cursor.execute("SELECT * FROM appointments WHERE user_id = ? ORDER BY appointment_date ASC", (user_id,))
        rows = cursor.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            try:
                d["prep_summary"] = json.loads(d.get("prep_summary_json") or "{}")
            except Exception:
                d["prep_summary"] = {}
            result.append(d)
        return result


def update_appointment(appt_id: str, user_id: str, status: str, prep_summary: Optional[Dict[str, Any]] = None) -> bool:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if prep_summary is not None:
            cursor.execute("""
                UPDATE appointments
                SET status = ?, prep_summary_json = ?
                WHERE id = ? AND user_id = ?
            """, (status, json.dumps(prep_summary, ensure_ascii=False), appt_id, user_id))
        else:
            cursor.execute("UPDATE appointments SET status = ? WHERE id = ? AND user_id = ?", (status, appt_id, user_id))
        conn.commit()
        return cursor.rowcount > 0


def delete_appointment(appt_id: str, user_id: str) -> bool:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM appointments WHERE id = ? AND user_id = ?", (appt_id, user_id))
        conn.commit()
        return cursor.rowcount > 0


# ============================================================================
# SAVED HEALTHCARE FACILITIES
# ============================================================================

def save_facility(
    user_id: str,
    facility_name: str,
    facility_type: str,
    specialty: Optional[str] = None,
    address: Optional[str] = None,
    phone: Optional[str] = None,
    rating: Optional[float] = None,
    distance_km: Optional[float] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None
) -> str:
    import uuid
    fac_id = f"fac_{uuid.uuid4().hex[:12]}"
    now_str = datetime.utcnow().isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO saved_facilities (
                id, user_id, facility_name, facility_type, specialty,
                address, phone, rating, distance_km, lat, lng, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            fac_id, user_id, facility_name, facility_type, specialty,
            address, phone, rating, distance_km, lat, lng, now_str
        ))
        conn.commit()
    return fac_id


def list_saved_facilities(user_id: str) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM saved_facilities WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        return [dict(r) for r in cursor.fetchall()]


def delete_saved_facility(facility_id: str, user_id: str) -> bool:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM saved_facilities WHERE id = ? AND user_id = ?", (facility_id, user_id))
        conn.commit()
        return cursor.rowcount > 0


# ============================================================================
# AUDIT & RESPONSIBLE FEEDBACK
# ============================================================================

def save_audit_feedback(
    user_id: Optional[str],
    category: str,
    ref_id: Optional[str],
    in_summary: str,
    out_summary: str,
    rating: str,
    corrections: Optional[str] = None
) -> str:
    import uuid
    audit_id = f"aud_{uuid.uuid4().hex[:12]}"
    now_str = datetime.utcnow().isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO feedback_audit (
                id, user_id, feedback_category, reference_id, input_data_summary,
                model_output_summary, user_rating, user_corrections, review_status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)
        """, (
            audit_id, user_id, category, ref_id, in_summary,
            out_summary, rating, corrections, now_str
        ))
        conn.commit()
    return audit_id


def list_audit_feedbacks(category: Optional[str] = None) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if category:
            cursor.execute("SELECT * FROM feedback_audit WHERE feedback_category = ? ORDER BY created_at DESC", (category,))
        else:
            cursor.execute("SELECT * FROM feedback_audit ORDER BY created_at DESC")
        return [dict(r) for r in cursor.fetchall()]
