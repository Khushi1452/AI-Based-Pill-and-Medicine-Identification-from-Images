"""
Mediscan AI - Authentication & Security Service
Provides PBKDF2-HMAC-SHA256 password hashing, user registration,
secure login, session management, user data export, and privacy-compliant data deletion.
"""

import os
import hashlib
import secrets
import json
import csv
import io
from datetime import datetime
from typing import Optional, Dict, Any, Tuple, List

from ..database import get_db_connection


class AuthService:
    ITERATIONS = 100_000

    @classmethod
    def hash_password(cls, password: str, salt: Optional[str] = None) -> Tuple[str, str]:
        """Hashes a password with PBKDF2-HMAC-SHA256 and a 16-byte random salt."""
        if not salt:
            salt = secrets.token_hex(16)
        key = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            cls.ITERATIONS
        )
        return key.hex(), salt

    @classmethod
    def verify_password(cls, password: str, stored_hash: str, salt: str) -> bool:
        """Constant-time verification of password against stored hash."""
        computed_hash, _ = cls.hash_password(password, salt)
        return secrets.compare_digest(computed_hash, stored_hash)

    @classmethod
    def register_user(
        cls,
        username: str,
        password: str,
        full_name: str,
        email: Optional[str] = None,
        age: Optional[int] = None,
        gender: Optional[str] = None,
        blood_group: Optional[str] = None,
        preferred_language: str = "en"
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """Registers a new user with an isolated profile."""
        username = username.strip().lower()
        if not username or len(username) < 3:
            return False, "Username must be at least 3 characters long.", None
        if not password or len(password) < 6:
            return False, "Password must be at least 6 characters long.", None

        user_id = f"usr_{secrets.token_hex(8)}"
        pwd_hash, salt = cls.hash_password(password)
        now_str = datetime.utcnow().isoformat()

        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                # Check for existing username or email
                cursor.execute("SELECT id FROM users WHERE username = ? OR (email IS NOT NULL AND email = ?)", (username, email))
                if cursor.fetchone():
                    return False, "Username or email is already registered.", None

                cursor.execute("""
                    INSERT INTO users (id, username, email, password_hash, salt, full_name, age, gender, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (user_id, username, email, pwd_hash, salt, full_name.strip(), age, gender, now_str))

                cursor.execute("""
                    INSERT INTO user_profiles (user_id, blood_group, allergies, chronic_conditions, preferred_language, updated_at)
                    VALUES (?, ?, '[]', '[]', ?, ?)
                """, (user_id, blood_group, preferred_language, now_str))

                conn.commit()

                user_dict = {
                    "id": user_id,
                    "username": username,
                    "email": email,
                    "full_name": full_name.strip(),
                    "age": age,
                    "gender": gender,
                    "preferred_language": preferred_language,
                }
                return True, "User registered successfully.", user_dict
        except Exception as e:
            return False, f"Registration failed: {str(e)}", None

    @classmethod
    def authenticate_user(cls, username: str, password: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """Authenticates user credentials and returns full user profile."""
        username = username.strip().lower()
        if not username or not password:
            return False, "Please enter both username and password.", None

        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT u.id, u.username, u.email, u.password_hash, u.salt, u.full_name, u.age, u.gender,
                           p.blood_group, p.allergies, p.chronic_conditions, p.emergency_contact_name,
                           p.emergency_contact_phone, p.preferred_language, p.data_sharing_consent
                    FROM users u
                    LEFT JOIN user_profiles p ON u.id = p.user_id
                    WHERE u.username = ? OR u.email = ?
                """, (username, username))
                row = cursor.fetchone()

                if not row:
                    return False, "Invalid username or password.", None

                if not cls.verify_password(password, row["password_hash"], row["salt"]):
                    return False, "Invalid username or password.", None

                user_data = {
                    "id": row["id"],
                    "username": row["username"],
                    "email": row["email"],
                    "full_name": row["full_name"],
                    "age": row["age"],
                    "gender": row["gender"],
                    "blood_group": row["blood_group"],
                    "allergies": json.loads(row["allergies"]) if row["allergies"] else [],
                    "chronic_conditions": json.loads(row["chronic_conditions"]) if row["chronic_conditions"] else [],
                    "emergency_contact_name": row["emergency_contact_name"],
                    "emergency_contact_phone": row["emergency_contact_phone"],
                    "preferred_language": row["preferred_language"] or "en",
                    "data_sharing_consent": bool(row["data_sharing_consent"]),
                }
                return True, "Authentication successful.", user_data
        except Exception as e:
            return False, f"Authentication error: {str(e)}", None

    @classmethod
    def update_profile(
        cls,
        user_id: str,
        full_name: str,
        age: Optional[int],
        gender: Optional[str],
        blood_group: Optional[str],
        allergies: List[str],
        chronic_conditions: List[str],
        emergency_contact_name: Optional[str],
        emergency_contact_phone: Optional[str],
        preferred_language: str,
        data_sharing_consent: bool,
    ) -> bool:
        """Updates user profile data."""
        now_str = datetime.utcnow().isoformat()
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE users
                    SET full_name = ?, age = ?, gender = ?
                    WHERE id = ?
                """, (full_name, age, gender, user_id))

                cursor.execute("""
                    UPDATE user_profiles
                    SET blood_group = ?, allergies = ?, chronic_conditions = ?,
                        emergency_contact_name = ?, emergency_contact_phone = ?,
                        preferred_language = ?, data_sharing_consent = ?, updated_at = ?
                    WHERE user_id = ?
                """, (
                    blood_group,
                    json.dumps(allergies),
                    json.dumps(chronic_conditions),
                    emergency_contact_name,
                    emergency_contact_phone,
                    preferred_language,
                    1 if data_sharing_consent else 0,
                    now_str,
                    user_id
                ))
                conn.commit()
                return True
        except Exception:
            return False

    @classmethod
    def export_user_data(cls, user_id: str) -> Dict[str, Any]:
        """Gathers all isolated health records for the user in a portable JSON format."""
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Profile
            cursor.execute("SELECT id, username, email, full_name, age, gender, created_at FROM users WHERE id = ?", (user_id,))
            user_row = cursor.fetchone()
            user_info = dict(user_row) if user_row else {}

            cursor.execute("SELECT * FROM user_profiles WHERE user_id = ?", (user_id,))
            prof_row = cursor.fetchone()
            prof_info = dict(prof_row) if prof_row else {}

            # Reports
            cursor.execute("SELECT * FROM medical_reports WHERE user_id = ? ORDER BY report_date DESC", (user_id,))
            reports = [dict(r) for r in cursor.fetchall()]

            # Medications
            cursor.execute("SELECT * FROM medications WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
            meds = [dict(m) for m in cursor.fetchall()]

            # Health Measurements
            cursor.execute("SELECT * FROM health_measurements WHERE user_id = ? ORDER BY measured_at DESC", (user_id,))
            measurements = [dict(m) for m in cursor.fetchall()]

            # Appointments
            cursor.execute("SELECT * FROM appointments WHERE user_id = ? ORDER BY appointment_date DESC", (user_id,))
            appointments = [dict(a) for a in cursor.fetchall()]

            # Saved Facilities
            cursor.execute("SELECT * FROM saved_facilities WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
            facilities = [dict(f) for f in cursor.fetchall()]

            return {
                "export_metadata": {
                    "generated_at": datetime.utcnow().isoformat(),
                    "app": "Mediscan AI Healthcare Assistant",
                    "user_id": user_id,
                },
                "profile": {**user_info, **prof_info},
                "medical_reports": reports,
                "medications": meds,
                "health_measurements": measurements,
                "appointments": appointments,
                "saved_facilities": facilities,
            }

    @classmethod
    def delete_user_account(cls, user_id: str) -> bool:
        """Permanently purges user account and all cascading records."""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
                conn.commit()
                return True
        except Exception:
            return False

    @classmethod
    def ensure_default_user(cls) -> Dict[str, Any]:
        """Ensures a default local demo patient exists for instant demonstration."""
        success, _, user = cls.authenticate_user("patient", "health123")
        if success and user:
            return user
        success, _, user = cls.register_user(
            username="patient",
            password="health123",
            full_name="Khushi",
            email="khushi@example.com",
            age=21,
            gender="Female",
            blood_group="B+",
            preferred_language="en"
        )
        if user:
            cls.update_profile(
                user_id=user["id"],
                full_name="Khushi",
                age=21,
                gender="Female",
                blood_group="B+",
                allergies=["Penicillin"],
                chronic_conditions=[],
                emergency_contact_name="Family Member",
                emergency_contact_phone="+91 98765 43210",
                preferred_language="en",
                data_sharing_consent=True
            )
            _, _, user = cls.authenticate_user("patient", "health123")
            return user or {}
        return {}
