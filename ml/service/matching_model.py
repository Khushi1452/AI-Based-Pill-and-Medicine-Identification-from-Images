"""
Trainable Machine Learning Medicine Matcher & Candidate Ranking Pipeline
Uses character + word TF-IDF vectorization, cosine similarity ranking,
attribute verification (strength, dosage form, salts), and an abstention policy.
"""

import os
import re
import json
import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Any, Optional, Tuple


class MatchDecision:
    ACCEPTED = "LOCAL_IDENTIFICATION_ACCEPTED"
    ABSTAIN_AMBIGUOUS = "ABSTAIN_AMBIGUOUS"
    ABSTAIN_LOW_CONFIDENCE = "ABSTAIN_LOW_CONFIDENCE"
    ABSTAIN_CONFLICT = "ABSTAIN_CONFLICT"
    REJECT = "REJECT_UNRELIABLE"
    UNIDENTIFIED = "UNIDENTIFIED"


class MedicineMatchingModel:
    def __init__(self, model_dir: Optional[str] = None):

        if model_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            model_dir = os.path.join(base_dir, "models", "medicine_matcher")
            
        self.model_dir = model_dir
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.catalog_tfidf: Optional[Any] = None
        self.catalog_records: List[Dict[str, Any]] = []
        self.config: Dict[str, Any] = {
            "version": "1.0.0",
            "abstention_threshold": 0.82,
            "ambiguity_margin": 0.08,
            "ngram_range": [2, 5],
            "max_features": 60000,
            "strength_bonus": 0.12,
            "dosage_bonus": 0.08,
            "strength_mismatch_penalty": 0.35,
            "dosage_mismatch_penalty": 0.25,
        }
        self.is_fitted = False

    @staticmethod
    def clean_ocr_confusions(text: str) -> str:
        if not text:
            return ""
        s = text
        # Split concatenated brand and number: PARACIP650 -> PARACIP 650, PAN40 -> PAN 40
        s = re.sub(r"([A-Za-z]{3,})(\d+)", r"\1 \2", s)
        # Split brand concatenated with GSO / G50 / GO (OCR misread of 650): PARACIPGO -> PARACIP 650
        s = re.sub(r"([A-Za-z]{3,})(?:[Gg][Ss][0Oo]|[Gg]5[0Oo]|[Gg]50|[Gg][0Oo])\b", r"\1 650", s)
        # Correct P50 mg / B50 mg / G50 mg -> 650 mg
        s = re.sub(r"\b[PpBbGg]5[0Oo]?\s*(mg|ml|mcg)\b", r"650 \1", s, flags=re.IGNORECASE)
        # Correct letter O inside digit strength sequences (e.g. 65Omg -> 650mg, 12Omg -> 120mg)
        s = re.sub(r"(\d+)[Oo](\s*(?:mg|ml|mcg|gm|g|%))", r"\g<1>0\2", s, flags=re.IGNORECASE)
        # Correct common OCR substitutions for strength numbers
        s = re.sub(r"\b[Gg][Ss][0Oo]\b", "650", s)
        s = re.sub(r"\b[Gg]50\b", "650", s)
        s = re.sub(r"\b[Gg]5[0Oo]\b", "650", s)
        s = re.sub(r"\b[Il]20\b", "120", s)
        s = re.sub(r"\b[Ss]00\b", "500", s)
        s = re.sub(r"\b[Gg]25\b", "625", s)
        return s

    @classmethod
    def normalize_text(cls, text: str) -> str:
        if not text:
            return ""
        s = cls.clean_ocr_confusions(text).lower()
        # Normalize common punctuation but keep percent and slash for % w/w, mg/ml
        s = re.sub(r"[^a-z0-9.%\/]+", " ", s)
        s = re.sub(r"\s+", " ", s).strip()
        return s

    @classmethod
    def extract_strength_tokens(cls, text: str) -> List[str]:
        """Extract strength patterns like 650 mg, 120mg, 20%, 500 mg, etc."""
        cleaned = cls.clean_ocr_confusions(text)
        matches = re.findall(
            r"\b\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)*(?:\s*(?:mg|mcg|gm|g|ml|iu|%|\s*w\/w|\s*w\/v))\b",
            cleaned,
            flags=re.IGNORECASE
        )
        tokens = [m.lower().replace(" ", "") for m in matches]
        # Also extract standalone common strength numbers when found (e.g., 650, 500, 120, 625, 40)
        # so brand-affixed strengths like 'PARACIP 650' or 'DOLO 650' match '650 mg'
        standalone = re.findall(r"\b(1000|650|625|500|400|300|250|200|150|120|100|80|75|50|40|25|20|10|5)\b", cleaned)
        for s in standalone:
            token = f"{s}mg"
            if token not in tokens:
                tokens.append(token)
        return tokens


    @staticmethod
    def extract_dosage_form(text: str) -> Optional[str]:
        common_forms = [
            'eye drops', 'nasal spray', 'tablet', 'capsule', 'softgel',
            'syrup', 'suspension', 'injection', 'inhaler', 'rotacap',
            'respule', 'cream', 'ointment', 'gel', 'lotion', 'solution',
            'powder', 'sachet', 'shampoo', 'soap'
        ]
        norm = text.lower()
        for f in common_forms:
            if re.search(r"\b" + re.escape(f) + r"\b", norm):
                return f.capitalize()
        return None

    def fit(self, catalog_records: List[Dict[str, Any]]):
        """
        Train / fit the TF-IDF feature space over the verified catalog records.
        Features combine brand_name, generic_name, active_ingredients, and aliases.
        """
        self.catalog_records = catalog_records
        documents = []
        for r in catalog_records:
            brand = r.get("brand_name", "")
            generic = r.get("generic_name", "")
            salts = " ".join(r.get("active_ingredients", []))
            aliases = " ".join(r.get("aliases", []))
            doc = f"{brand} {brand} {aliases} {generic} {salts}".strip()
            documents.append(self.normalize_text(doc))

        self.vectorizer = TfidfVectorizer(
            analyzer="char_wb",
            ngram_range=tuple(self.config["ngram_range"]),
            max_features=self.config["max_features"],
            sublinear_tf=True
        )
        
        self.catalog_tfidf = self.vectorizer.fit_transform(documents)
        self.is_fitted = True
        return self

    def rank_candidates(self, query_text: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """
        Given extracted OCR text, compute cosine similarity,
        apply attribute consistency checking, and return ranked candidates.
        """
        if not self.is_fitted or self.vectorizer is None or self.catalog_tfidf is None:
            raise RuntimeError("Model is not fitted or loaded.")

        norm_query = self.normalize_text(query_text)
        if not norm_query or len(norm_query) < 2:
            return []

        query_vec = self.vectorizer.transform([norm_query])
        sims = cosine_similarity(query_vec, self.catalog_tfidf).flatten()

        # Get initial top-N indices based on raw TF-IDF similarity
        initial_k = min(top_k * 4, len(sims))
        top_indices = np.argpartition(sims, -initial_k)[-initial_k:]
        top_indices = top_indices[np.argsort(-sims[top_indices])]

        query_strengths = self.extract_strength_tokens(query_text)
        query_form = self.extract_dosage_form(query_text)

        candidates = []
        for idx in top_indices:
            raw_sim = float(sims[idx])
            if raw_sim < 0.05:
                continue

            rec = self.catalog_records[idx]
            raw_str = rec.get("strength")
            cand_strength = str(raw_str).strip() if (raw_str is not None and str(raw_str).lower() not in ("nan", "none")) else ""
            raw_form = rec.get("dosage_form")
            cand_form = str(raw_form).strip() if (raw_form is not None and str(raw_form).lower() not in ("nan", "none")) else ""

            adjusted_score = raw_sim
            strength_status = "neutral"
            form_status = "neutral"

            # Check strength agreement
            if cand_strength:
                cand_str_clean = cand_strength.lower().replace(" ", "")
                # Extract number
                num_match = re.search(r"\d+(\.\d+)?", cand_str_clean)
                cand_num = num_match.group(0) if num_match else ""

                if any(cand_str_clean in qs for qs in query_strengths) or (cand_num and any(cand_num in qs for qs in query_strengths)):
                    adjusted_score += self.config.get("strength_bonus", 0.12)
                    strength_status = "matched"
                elif query_strengths and cand_num:
                    # Query has strengths but none matched this candidate
                    adjusted_score -= self.config.get("strength_mismatch_penalty", 0.35)
                    strength_status = "mismatched"

            # Check dosage form agreement
            if cand_form and query_form:
                if cand_form.lower() == query_form.lower():
                    adjusted_score += self.config.get("dosage_bonus", 0.08)
                    form_status = "matched"
                else:
                    adjusted_score -= self.config.get("dosage_mismatch_penalty", 0.25)
                    form_status = "mismatched"

            # Exact brand token bonus
            brand_norm = self.normalize_text(rec.get("brand_name", ""))
            if brand_norm and (brand_norm in norm_query or norm_query in brand_norm):
                adjusted_score += 0.15

            # Clamp confidence score to [0.0, 1.0]
            calibrated_score = round(max(0.0, min(0.99, adjusted_score)), 3)

            candidates.append({
                "product_id": rec.get("product_id"),
                "brand_name": rec.get("brand_name"),
                "generic_name": rec.get("generic_name"),
                "active_ingredients": rec.get("active_ingredients", []),
                "strength": rec.get("strength"),
                "dosage_form": rec.get("dosage_form"),
                "manufacturer": rec.get("manufacturer"),
                "raw_similarity": round(raw_sim, 3),
                "calibrated_score": calibrated_score,
                "strength_status": strength_status,
                "dosage_status": form_status,
                "common_uses": rec.get("common_uses", []),
                "precautions": rec.get("precautions", []),
                "prescription_status": rec.get("prescription_status", "Prescription"),
            })

        # Sort by calibrated score descending
        candidates.sort(key=lambda c: c["calibrated_score"], reverse=True)
        return candidates[:top_k]

    retrieve_candidates = rank_candidates

    def evaluate_decision(self, candidates: Any, query_text: str = "") -> Dict[str, Any]:

        """
        Applies the abstention policy to decide if local match is reliable,
        ambiguous, or requires Gemini fallback.
        """
        # Handle inverted arguments gracefully if caller passes (query_text, candidates)
        if isinstance(candidates, str) and isinstance(query_text, (list, tuple)):
            candidates, query_text = query_text, candidates

        if not candidates:
            return {
                "decision": MatchDecision.UNIDENTIFIED,
                "should_fallback_to_gemini": True,
                "top_candidate": None,
                "confidence_score": 0.10,
                "reason": "No medicine candidates matched the extracted text.",
            }

        top = candidates[0]
        score = top.get("calibrated_score", 0.0)
        norm_q = self.normalize_text(query_text)

        # Explicit attribute conflict check
        if top.get("strength_status") == "mismatched":
            return {
                "decision": MatchDecision.ABSTAIN_CONFLICT,
                "should_fallback_to_gemini": True,
                "top_candidate": top,
                "confidence_score": round(min(score, 0.45), 2),
                "reason": f"Strength mismatch: package specifies different strength than candidate '{top['brand_name']}'.",
            }

        # Ambiguity check: compare against candidate from a conflicting formulation or competing brand
        conflicting_candidate = None
        for second in candidates[1:]:
            # If second candidate's strength explicitly contradicts the query, it is not an ambiguous competitor
            if second.get("strength_status") == "mismatched" and top.get("strength_status") == "matched":
                continue

            norm_top = self.normalize_text(top.get("brand_name", ""))
            norm_sec = self.normalize_text(second.get("brand_name", ""))

            
            # Clean strength comparison
            clean_str_top = re.sub(r"\s+", "", str(top.get("strength") or "").lower())
            clean_str_sec = re.sub(r"\s+", "", str(second.get("strength") or "").lower())
            if clean_str_top in ("nan", "none"): clean_str_top = ""
            if clean_str_sec in ("nan", "none"): clean_str_sec = ""
            nums_top = set(re.findall(r"\d+(?:\.\d+)?", clean_str_top))
            nums_sec = set(re.findall(r"\d+(?:\.\d+)?", clean_str_sec))
            same_strength = (clean_str_top == clean_str_sec) or (nums_top and nums_top == nums_sec)
            
            brand_family_top = norm_top.split()[0] if norm_top else ""
            brand_family_sec = norm_sec.split()[0] if norm_sec else ""
            same_brand_family = (brand_family_top == brand_family_sec and len(brand_family_top) >= 3)

            # If second candidate is a substring / pack-size extension of top candidate (e.g. "foracort 200 rotacap" vs "foracort 200 rotacap 30's")
            clean_brand_top = re.sub(r"\d+['’]s|\d+x\d+|\b\d+gm\b|\b\d+ml\b", "", norm_top).strip()
            clean_brand_sec = re.sub(r"\d+['’]s|\d+x\d+|\b\d+gm\b|\b\d+ml\b", "", norm_sec).strip()
            if clean_brand_top == clean_brand_sec or clean_brand_top in clean_brand_sec or clean_brand_sec in clean_brand_top:
                # Same product line, different pack size
                if not (nums_top and nums_sec and nums_top.isdisjoint(nums_sec)):
                    continue

            # If both are from the same brand family with consistent strength, they are variants of the same product
            if same_brand_family and (same_strength or (nums_top and nums_sec and not nums_top.isdisjoint(nums_sec))):
                continue

            # Multi-word brand qualifier check (e.g. Glycomet GP vs Glycomet SR, Allegra vs Allegra M)
            top_words = norm_top.split()
            sec_words = norm_sec.split()
            prefix_top = " ".join(top_words[:2]) if len(top_words) >= 2 else (top_words[0] if top_words else "")
            prefix_sec = " ".join(sec_words[:2]) if len(sec_words) >= 2 else (sec_words[0] if sec_words else "")
            if norm_q and prefix_top and prefix_sec and prefix_top != prefix_sec:
                if prefix_top in norm_q and prefix_sec not in norm_q:
                    # Verified multi-word brand on packaging: top candidate brand is on packaging, second is not
                    continue

            # Active ingredient corroboration: if query has a distinctive ingredient belonging to top but not second
            top_salts = str(top.get("active_ingredients") or "").lower()
            sec_salts = str(second.get("active_ingredients") or "").lower()
            if top_salts and sec_salts and norm_q:
                top_salt_tokens = [s.strip() for s in re.split(r"[;+()]", top_salts) if len(s.strip()) >= 4 and not s.strip().isdigit()]
                has_top_discriminator = any(st in norm_q and st not in sec_salts for st in top_salt_tokens)
                if has_top_discriminator:
                    continue

            conflicting_candidate = second
            break


        if conflicting_candidate:
            margin = score - conflicting_candidate.get("calibrated_score", 0.0)
            if margin < self.config["ambiguity_margin"] and score >= 0.65:
                return {
                    "decision": MatchDecision.ABSTAIN_AMBIGUOUS,
                    "should_fallback_to_gemini": True,
                    "top_candidate": top,
                    "confidence_score": round(score, 2),
                    "reason": f"Ambiguous formulation match between '{top['brand_name']}' and '{conflicting_candidate['brand_name']}'.",
                }

        # Reliable identification threshold
        if score >= self.config["abstention_threshold"]:
            return {
                "decision": MatchDecision.ACCEPTED,
                "should_fallback_to_gemini": False,
                "top_candidate": top,
                "confidence_score": round(score, 2),
                "reason": "High-confidence local match verified against Indian pharmaceutical catalog.",
            }

        # Moderate confidence below threshold -> fallback to Gemini with hints
        return {
            "decision": MatchDecision.ABSTAIN_LOW_CONFIDENCE,
            "should_fallback_to_gemini": True,
            "top_candidate": top,
            "confidence_score": round(score, 2),
            "reason": f"Local confidence ({score:.2f}) below abstention threshold ({self.config['abstention_threshold']:.2f}).",
        }

    def save_artifacts(self, output_dir: Optional[str] = None):
        """Export trained artifacts and manifest."""
        target_dir = output_dir or self.model_dir
        os.makedirs(target_dir, exist_ok=True)

        joblib.dump(self.vectorizer, os.path.join(target_dir, "vectorizer.joblib"))
        joblib.dump(self.catalog_tfidf, os.path.join(target_dir, "catalog_tfidf.joblib"))

        with open(os.path.join(target_dir, "catalog_records.json"), "w", encoding="utf-8") as f:
            json.dump(self.catalog_records, f, ensure_ascii=False, indent=2)

        with open(os.path.join(target_dir, "config.json"), "w", encoding="utf-8") as f:
            json.dump(self.config, f, indent=2)

        manifest = {
            "model_name": "IndianMedicineMatcherTFIDF",
            "version": self.config["version"],
            "total_records": len(self.catalog_records),
            "feature_count": self.vectorizer.get_feature_names_out().shape[0] if self.vectorizer else 0,
            "framework": "scikit-learn",
            "abstention_threshold": self.config["abstention_threshold"],
            "saved_at": "2026-10-20T19:20:00Z",
        }
        with open(os.path.join(target_dir, "model_manifest.json"), "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)

        print(f"[Model Saved] Artifacts successfully exported to {target_dir}")

    def load_artifacts(self, input_dir: Optional[str] = None):
        """Load saved artifacts safely."""
        target_dir = input_dir or self.model_dir
        vec_path = os.path.join(target_dir, "vectorizer.joblib")
        tfidf_path = os.path.join(target_dir, "catalog_tfidf.joblib")
        rec_path = os.path.join(target_dir, "catalog_records.json")
        cfg_path = os.path.join(target_dir, "config.json")

        if not (os.path.exists(vec_path) and os.path.exists(tfidf_path) and os.path.exists(rec_path)):
            raise FileNotFoundError(f"Missing model artifacts in {target_dir}")

        self.vectorizer = joblib.load(vec_path)
        self.catalog_tfidf = joblib.load(tfidf_path)

        with open(rec_path, "r", encoding="utf-8") as f:
            self.catalog_records = json.load(f)

        if os.path.exists(cfg_path):
            with open(cfg_path, "r", encoding="utf-8") as f:
                self.config.update(json.load(f))

        self.is_fitted = True
        return self


def load_artifacts(input_dir: str) -> Dict[str, Any]:
    """Convenience helper to safely load model artifacts from an artifacts directory."""
    model = MedicineMatchingModel(model_dir=str(input_dir))
    model.load_artifacts(str(input_dir))
    return {
        "model": model,
        "vectorizer": model.vectorizer,
        "catalog_tfidf": model.catalog_tfidf,
        "catalog_records": model.catalog_records,
        "config": model.config,
    }


