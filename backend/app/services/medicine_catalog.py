"""
Medicine Catalog Service (Data Access Layer)
Provides exact brand matching, alias matching, generic ingredient matching,
strength and formulation comparison, and source provenance for Indian medicines.
"""

import os
import sys

# Import core implementation
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if base_dir not in sys.path:
    sys.path.insert(0, base_dir)

from typing import Optional
from ml.service.medicine_catalog import MedicineCatalogService

_catalog_instance: Optional[MedicineCatalogService] = None

def get_catalog_service(catalog_csv_path: Optional[str] = None) -> MedicineCatalogService:
    global _catalog_instance
    if _catalog_instance is None:
        _catalog_instance = MedicineCatalogService(catalog_csv_path)
    return _catalog_instance

__all__ = ["MedicineCatalogService", "get_catalog_service"]

