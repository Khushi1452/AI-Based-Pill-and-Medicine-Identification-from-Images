"""
Mediscan AI - Intelligent Image Caching Service (Route A)
Provides fast cryptographic image-hash lookup, cache expiration,
duplicate prevention, and cache hit/miss accounting.
"""

from typing import Dict, Any, Optional
from ..config import settings
from ..database import get_cached_analysis, set_cached_analysis, clear_analysis_cache


class CacheService:
    def __init__(self, ttl_seconds: int = settings.CACHE_TTL_SECONDS):
        self.ttl_seconds = ttl_seconds
        self.hits_count = 0
        self.misses_count = 0

    def get(self, image_hash: str) -> Optional[Dict[str, Any]]:
        """Looks up cached analysis by cryptographic image hash."""
        cached = get_cached_analysis(image_hash)
        if cached:
            self.hits_count += 1
            return cached
        self.misses_count += 1
        return None

    def set(self, image_hash: str, response_data: Dict[str, Any]) -> None:
        """Saves validated analysis result to cache."""
        set_cached_analysis(image_hash, response_data, self.ttl_seconds)

    def clear(self) -> int:
        """Invalidates entire cache."""
        return clear_analysis_cache()

    def get_stats(self) -> Dict[str, Any]:
        total = self.hits_count + self.misses_count
        hit_rate = round((self.hits_count / total * 100), 1) if total > 0 else 0.0
        return {
            "cache_hits": self.hits_count,
            "cache_misses": self.misses_count,
            "total_lookups": total,
            "hit_rate_percent": hit_rate,
        }
