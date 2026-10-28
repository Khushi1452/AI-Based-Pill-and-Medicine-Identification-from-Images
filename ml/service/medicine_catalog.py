"""
Medicine Catalog Service
Provides fast in-memory indexing, multi-attribute candidate retrieval,
and verified medicine record lookups for Indian pharmaceutical products.
"""

import os
import re
import csv
from typing import List, Dict, Any, Optional, Tuple

class MedicineCatalogService:
    def __init__(self, catalog_csv_path: Optional[str] = None):
        if catalog_csv_path is None:
            # Default location relative to workspace root
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            catalog_csv_path = os.path.join(base_dir, "data", "medicines", "medicine_catalog.csv")
            
        self.catalog_csv_path = catalog_csv_path
        self.records: List[Dict[str, Any]] = []
        self.records_by_id: Dict[str, Dict[str, Any]] = {}
        self.brand_index: Dict[str, List[int]] = {}
        self.generic_index: Dict[str, List[int]] = {}
        self.is_loaded = False
        
        if os.path.exists(self.catalog_csv_path):
            self.load_catalog()

    def load_catalog(self) -> int:
        self.records = []
        self.records_by_id = {}
        self.brand_index = {}
        self.generic_index = {}
        
        with open(self.catalog_csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader):
                prod_id = row.get("product_id", f"PROD-{idx+1}")
                record = {
                    "product_id": prod_id,
                    "brand_name": row.get("brand_name", "").strip(),
                    "generic_name": row.get("generic_name", "").strip(),
                    "active_ingredients": [s.strip() for s in row.get("active_ingredients", "").split(";") if s.strip()],
                    "strength": row.get("strength", "").strip(),
                    "dosage_form": row.get("dosage_form", "").strip(),
                    "manufacturer": row.get("manufacturer", "").strip(),
                    "aliases": [a.strip() for a in row.get("aliases", "").split(";") if a.strip()],
                    "common_uses": [u.strip() for u in row.get("common_uses", "").split("|") if u.strip()],
                    "precautions": [p.strip() for p in row.get("precautions", "").split("|") if p.strip()],
                    "prescription_status": row.get("prescription_status", "Prescription").strip(),
                    "source_name": row.get("source_name", "").strip(),
                    "source_url": row.get("source_url", "").strip(),
                    "verified_at": row.get("verified_at", "").strip(),
                }
                self.records.append(record)
                self.records_by_id[prod_id] = record
                
                # Index brand tokens
                brand_norm = self.normalize_text(record["brand_name"])
                if brand_norm:
                    tokens = set(brand_norm.split())
                    for t in tokens:
                        if len(t) >= 2:
                            self.brand_index.setdefault(t, []).append(idx)
                            
                # Index generic / active salts
                generic_norm = self.normalize_text(record["generic_name"])
                if generic_norm:
                    for t in set(generic_norm.split()):
                        if len(t) >= 2:
                            self.generic_index.setdefault(t, []).append(idx)

        self.is_loaded = True
        return len(self.records)

    @staticmethod
    def normalize_text(text: str) -> str:
        if not text:
            return ""
        # Lowercase, normalize punctuation, preserve key characters like %, /
        clean = text.lower()
        clean = re.sub(r"[^a-z0-9.%\/]+", " ", clean)
        return clean.strip()

    def get_by_id(self, product_id: str) -> Optional[Dict[str, Any]]:
        return self.records_by_id.get(product_id)

    def exact_brand_match(self, brand: str) -> List[Dict[str, Any]]:
        norm_brand = self.normalize_text(brand)
        if not norm_brand:
            return []
        matches = []
        for r in self.records:
            if self.normalize_text(r["brand_name"]) == norm_brand:
                matches.append(r)
        return matches

    def search_candidates(self, query: str, limit: int = 20) -> List[Tuple[Dict[str, Any], float]]:
        norm_q = self.normalize_text(query)
        if not norm_q:
            return []
            
        q_tokens = set(norm_q.split())
        candidate_indices = set()
        
        for t in q_tokens:
            if t in self.brand_index:
                candidate_indices.update(self.brand_index[t][:300])
            if t in self.generic_index:
                candidate_indices.update(self.generic_index[t][:150])

        scored: List[Tuple[Dict[str, Any], float]] = []
        for idx in candidate_indices:
            rec = self.records[idx]
            brand_norm = self.normalize_text(rec["brand_name"])
            generic_norm = self.normalize_text(rec["generic_name"])
            
            score = 0.0
            if brand_norm == norm_q:
                score += 100.0
            elif brand_norm.startswith(norm_q):
                score += 80.0
            elif norm_q.startswith(brand_norm) and len(brand_norm) >= 3:
                score += 70.0
            elif norm_q in brand_norm:
                score += 50.0
                
            # Token overlap
            brand_tokens = set(brand_norm.split())
            overlap = len(q_tokens.intersection(brand_tokens))
            score += overlap * 15.0
            
            if generic_norm and generic_norm in norm_q:
                score += 30.0

            if score > 0:
                scored.append((rec, score))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:limit]

    def verify_attributes(self, candidate: Dict[str, Any], extracted_text: str) -> Dict[str, Any]:
        """
        Compares candidate attributes against extracted text.
        Returns match flags and consistency scores.
        """
        norm_text = self.normalize_text(extracted_text)
        
        # Check strength
        strength = candidate.get("strength", "")
        strength_match = False
        if strength:
            norm_str = self.normalize_text(strength)
            if norm_str in norm_text:
                strength_match = True
            else:
                # Numerical match check (e.g. "650" in "paracip 650 tablet")
                num_match = re.search(r"\b\d+(\.\d+)?\b", strength)
                if num_match and re.search(r"\b" + re.escape(num_match.group(0)) + r"\b", norm_text):
                    strength_match = True

        # Check dosage form
        form = candidate.get("dosage_form", "")
        form_match = False
        if form:
            norm_form = self.normalize_text(form)
            if norm_form in norm_text:
                form_match = True

        # Check active ingredients
        salts = candidate.get("active_ingredients", [])
        salts_matched = []
        for s in salts:
            norm_salt = self.normalize_text(s)
            salt_words = [w for w in norm_salt.split() if len(w) > 3]
            if salt_words and all(w in norm_text for w in salt_words[:2]):
                salts_matched.append(s)

        return {
            "strength_match": strength_match,
            "dosage_form_match": form_match,
            "salts_matched": salts_matched,
            "is_attribute_consistent": (strength_match or not strength) and (form_match or not form),
        }
