"""
Mediscan AI - Local ML Matching Service
Uses character (2-5) + word TF-IDF vectorization, cosine similarity retrieval,
strength & dosage attribute calibration, and an abstention policy.
"""

import os
import re
import json
import joblib
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from ..config import settings


class MatchDecision:
    ACCEPTED = "LOCAL_IDENTIFICATION_ACCEPTED"
    ABSTAIN_AMBIGUOUS = "ABSTAIN_AMBIGUOUS"
    ABSTAIN_LOW_CONFIDENCE = "ABSTAIN_LOW_CONFIDENCE"
    ABSTAIN_CONFLICT = "ABSTAIN_CONFLICT"
    REJECT = "REJECT_UNRELIABLE"
    UNIDENTIFIED = "UNIDENTIFIED"


class LocalMedicineMatcher:
    def __init__(self, model_dir: Optional[Path] = None):
        self.model_dir = model_dir or settings.MODELS_DIR
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.catalog_tfidf: Optional[Any] = None
        self.catalog_records: List[Dict[str, Any]] = []
        self.config: Dict[str, Any] = {
            "version": settings.MODEL_VERSION,
            "abstention_threshold": settings.LOCAL_CONFIDENCE_THRESHOLD,
            "ambiguity_margin": settings.AMBIGUITY_MARGIN,
            "ngram_range": [2, 5],
            "max_features": 60000,
            "strength_bonus": 0.12,
            "dosage_bonus": 0.08,
            "strength_mismatch_penalty": 0.35,
            "dosage_mismatch_penalty": 0.25,
        }
        self.is_fitted = False

    @staticmethod
    def clean_text(text: str) -> str:
        if text is None:
            return ""
        s = str(text).strip()
        if not s or s.lower() in ("nan", "none"):
            return ""
        # Separate brand and numbers
        s = re.sub(r"([A-Za-z]{3,})(\d+)", r"\1 \2", s)
        s = re.sub(r"\b[PpBbGg]5[0Oo]?\s*(mg|ml|mcg)\b", r"650 \1", s, flags=re.IGNORECASE)
        s = re.sub(r"(\d+)[Oo](\s*(?:mg|ml|mcg|gm|g|%))", r"\g<1>0\2", s, flags=re.IGNORECASE)
        s = s.lower()
        s = re.sub(r"[^a-z0-9.%\/]+", " ", s)
        return re.sub(r"\s+", " ", s).strip()

    @classmethod
    def extract_strength_tokens(cls, text: Any) -> List[str]:
        if text is None:
            return []
        s = str(text).strip()
        if not s or s.lower() in ("nan", "none"):
            return []
        cleaned = s.lower()
        matches = re.findall(
            r"\b\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*(?:\s*(?:mg|mcg|gm|g|ml|iu|%|\s*w\/w|\s*w\/v))\b",
            cleaned
        )
        tokens = [m.replace(" ", "") for m in matches]
        standalone = re.findall(r"\b(1000|650|625|500|400|300|250|200|150|120|100|80|75|50|40|25|20|10|5)\b", cleaned)
        for s_token in standalone:
            token = f"{s_token}mg"
            if token not in tokens:
                tokens.append(token)
        return tokens

    @staticmethod
    def extract_dosage_form(text: Any) -> Optional[str]:
        if text is None:
            return None
        s = str(text).strip()
        if not s or s.lower() in ("nan", "none"):
            return None
        forms = [
            'eye drops', 'nasal spray', 'tablet', 'capsule', 'softgel',
            'syrup', 'suspension', 'injection', 'inhaler', 'rotacap',
            'respule', 'cream', 'ointment', 'gel', 'lotion', 'solution',
            'powder', 'sachet', 'shampoo', 'soap'
        ]
        norm = s.lower()
        for f in forms:
            if re.search(r"\b" + re.escape(f) + r"\b", norm):
                return f.capitalize()
        return None

    def fit(self, catalog_records: List[Dict[str, Any]]) -> "LocalMedicineMatcher":
        self.catalog_records = catalog_records
        documents = []
        for r in catalog_records:
            brand = r.get("brand_name", "")
            generic = r.get("generic_name", "")
            salts = " ".join(r.get("active_ingredients", []))
            aliases = " ".join(r.get("aliases", []))
            doc = f"{brand} {brand} {aliases} {generic} {salts}".strip()
            documents.append(self.clean_text(doc))

        self.vectorizer = TfidfVectorizer(
            analyzer="char_wb",
            ngram_range=tuple(self.config["ngram_range"]),
            max_features=self.config["max_features"],
            sublinear_tf=True
        )
        self.catalog_tfidf = self.vectorizer.fit_transform(documents)
        self.is_fitted = True
        return self

    def save_artifacts(self, out_dir: Optional[Path] = None) -> None:
        target_dir = out_dir or self.model_dir
        target_dir.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.vectorizer, target_dir / "vectorizer.joblib", compress=3)
        joblib.dump(self.catalog_tfidf, target_dir / "catalog_tfidf.joblib", compress=3)
        with open(target_dir / "catalog_records.json", "w", encoding="utf-8") as f:
            json.dump(self.catalog_records, f, ensure_ascii=False)
        with open(target_dir / "config.json", "w", encoding="utf-8") as f:
            json.dump(self.config, f, indent=2)

    def load_artifacts(self, model_dir: Optional[Path] = None) -> bool:
        target_dir = model_dir or self.model_dir
        vec_path = target_dir / "vectorizer.joblib"
        tfidf_path = target_dir / "catalog_tfidf.joblib"
        rec_path = target_dir / "catalog_records.json"
        cfg_path = target_dir / "config.json"

        if not (vec_path.exists() and tfidf_path.exists() and rec_path.exists()):
            return False

        self.vectorizer = joblib.load(vec_path)
        self.catalog_tfidf = joblib.load(tfidf_path)
        with open(rec_path, "r", encoding="utf-8") as f:
            self.catalog_records = json.load(f)
        if cfg_path.exists():
            with open(cfg_path, "r", encoding="utf-8") as f:
                self.config.update(json.load(f))

        self.is_fitted = True
        return True

    def rank_candidates(self, query_text: str, top_k: int = 10) -> List[Dict[str, Any]]:
        if not self.is_fitted or self.vectorizer is None or self.catalog_tfidf is None:
            raise RuntimeError("Local matching model is not fitted or loaded.")

        norm_query = self.clean_text(query_text)
        if not norm_query:
            return []

        query_vec = self.vectorizer.transform([norm_query])
        similarities = cosine_similarity(query_vec, self.catalog_tfidf).flatten()

        top_indices = np.argsort(similarities)[::-1][:top_k * 4]

        query_strengths = self.extract_strength_tokens(query_text)
        query_form = self.extract_dosage_form(query_text)

        ranked = []
        for idx in top_indices:
            raw_sim = float(similarities[idx])
            if raw_sim < 0.20:
                continue

            rec = dict(self.catalog_records[idx])
            calibrated = raw_sim

            cand_strength = rec.get("strength", "")
            cand_strengths = self.extract_strength_tokens(cand_strength)
            cand_form = rec.get("dosage_form", "")

            # Strength check
            if query_strengths and cand_strengths:
                overlap = set(query_strengths).intersection(set(cand_strengths))
                if overlap:
                    calibrated += self.config["strength_bonus"]
                else:
                    calibrated -= self.config["strength_mismatch_penalty"]

            # Dosage form check
            if query_form and cand_form:
                if query_form.lower() in cand_form.lower():
                    calibrated += self.config["dosage_bonus"]
                else:
                    calibrated -= self.config["dosage_mismatch_penalty"]

            # Exact brand presence boost (within query packaging text)
            brand_norm = self.clean_text(rec["brand_name"])
            if brand_norm and len(brand_norm) >= 3:
                base_brand = re.sub(r"\b\d+['’]?[sS]\b", "", brand_norm)
                base_brand = re.sub(r"\b(tablet|tablets|capsule|capsules|syrup|suspension|injection|rotacap|respule|cream|ointment|gel|drops)\b", "", base_brand).strip()
                if base_brand and len(base_brand) >= 3 and re.search(r"\b" + re.escape(base_brand) + r"\b", norm_query):
                    calibrated += 0.28
                elif norm_query.startswith(brand_norm):
                    calibrated += 0.15

            # Supporting evidence: manufacturer match (as secondary signal only)
            cand_mfg = self.clean_text(str(rec.get("manufacturer", "")))
            if cand_mfg and len(cand_mfg) >= 4:
                mfg_tokens = [w for w in cand_mfg.split() if len(w) > 3 and w not in ("limited", "ltd", "private", "pvt", "laboratories", "pharma", "pharmaceuticals")]
                if any(t in norm_query for t in mfg_tokens):
                    calibrated += 0.05

            calibrated = max(0.0, min(1.0, calibrated))
            rec["raw_cosine_similarity"] = round(raw_sim, 4)
            rec["calibrated_score"] = round(calibrated, 4)
            ranked.append(rec)

        ranked.sort(key=lambda x: x["calibrated_score"], reverse=True)
        return ranked[:top_k]

    def evaluate_decision(self, candidates: List[Dict[str, Any]], query_text: str) -> Dict[str, Any]:
        """
        Applies safety gates and abstention policy to candidate ranking.
        """
        if not candidates:
            return {
                "decision": MatchDecision.UNIDENTIFIED,
                "confidence_score": 0.0,
                "top_candidate": None,
                "reason": "कोई उपयुक्त दवा मेल नहीं खाती।",
            }

        # Check if query is solely manufacturer or packaging boilerplate with no medicine substance
        query_norm = self.clean_text(query_text)
        boilerplate_set = {
            "mfd", "mfg", "by", "marketed", "limited", "ltd", "pvt", "lic", "no", "schedule",
            "prescription", "drug", "warning", "caution", "retail", "registered", "batch", "date",
            "exp", "mrp", "storage", "store", "below", "keep", "out", "reach", "children",
            "temperature", "exceeding", "direct", "sunlight", "protect", "moisture", "tablet",
            "tablets", "capsule", "capsules", "syrup", "contains", "each", "uncoated", "film"
        }
        from .ocr_service import INDIAN_MANUFACTURERS
        mfg_words = set([w for m in INDIAN_MANUFACTURERS for w in m.split()])

        words = [w for w in query_norm.split() if len(w) > 2]
        identifying_words = [w for w in words if w not in boilerplate_set and w not in mfg_words]
        query_strengths = self.extract_strength_tokens(query_text)

        if len(identifying_words) == 0 and len(query_strengths) == 0:
            return {
                "decision": MatchDecision.UNIDENTIFIED,
                "confidence_score": 0.05,
                "top_candidate": None,
                "reason": "Medicine could not be reliably identified from this image. Only manufacturer or regulatory markings were detected.",
            }

        top = candidates[0]
        score = top["calibrated_score"]
        threshold = self.config["abstention_threshold"]
        margin = self.config["ambiguity_margin"]

        # Check for ambiguity with 2nd candidate
        if len(candidates) > 1:
            second_score = candidates[1]["calibrated_score"]
            b1 = self.clean_text(re.sub(r"\b\d+['’]?[sS]\b", "", top.get("brand_name", "")))
            b2 = self.clean_text(re.sub(r"\b\d+['’]?[sS]\b", "", candidates[1].get("brand_name", "")))
            g1 = self.clean_text(str(top.get("generic_name", "")))
            g2 = self.clean_text(str(candidates[1].get("generic_name", "")))

            is_same_brand_line = bool(b1 and b2 and (b1 == b2 or b1.startswith(b2) or b2.startswith(b1)))
            is_same_generic = bool(g1 and g1 == g2)
            is_same_drug = is_same_brand_line or is_same_generic

            if not is_same_drug and (score - second_score) < margin and score > 0.65:
                return {
                    "decision": MatchDecision.ABSTAIN_AMBIGUOUS,
                    "confidence_score": round(score, 3),
                    "top_candidate": top,
                    "runner_up": candidates[1],
                    "reason": f"दो समान दवाओं में संशय ({top['brand_name']} एवं {candidates[1]['brand_name']})।",
                }

        # Check for strength conflict
        query_strengths = self.extract_strength_tokens(query_text)
        cand_strengths = self.extract_strength_tokens(top.get("strength", ""))
        if query_strengths and cand_strengths:
            if not set(query_strengths).intersection(set(cand_strengths)):
                return {
                    "decision": MatchDecision.ABSTAIN_CONFLICT,
                    "confidence_score": round(score, 3),
                    "top_candidate": top,
                    "reason": "दवा की शक्ति (Strength) में भिन्नता है।",
                }

        if score >= threshold:
            return {
                "decision": MatchDecision.ACCEPTED,
                "confidence_score": round(score, 3),
                "top_candidate": top,
                "reason": "स्थानीय कैटलॉग से सटीक मिलान सत्यापित।",
            }

        return {
            "decision": MatchDecision.ABSTAIN_LOW_CONFIDENCE,
            "confidence_score": round(score, 3),
            "top_candidate": top,
            "reason": "सटीक मिलान का विश्वास स्तर आवश्यक सीमा (0.82) से कम है।",
        }
