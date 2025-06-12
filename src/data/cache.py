import diskcache as dc
from typing import Dict, List, Any, Optional


class Cache:
    """Persistent cache using diskcache for API responses."""

    def __init__(self, cache_dir: str = "cache_data"):
        # Initialize diskcache with the specified directory
        self._cache = dc.Cache(cache_dir)
        print(f"📁 Initialized persistent cache at: {cache_dir}")

    def _merge_data(self, existing: list[dict] | None, new_data: list[dict], key_field: str) -> list[dict]:
        """Merge existing and new data, avoiding duplicates based on a key field."""
        if not existing:
            return new_data

        # Create a set of existing keys for O(1) lookup
        existing_keys = {item[key_field] for item in existing}

        # Only add items that don't exist yet
        merged = existing.copy()
        merged.extend([item for item in new_data if item[key_field] not in existing_keys])
        return merged

    # Prices cache methods
    def get_prices(self, cache_key: str) -> list[dict[str, any]] | None:
        """Get cached price data if available."""
        return self._cache.get(f"prices:{cache_key}")

    def set_prices(self, cache_key: str, data: list[dict[str, any]]):
        """Cache price data."""
        existing = self.get_prices(cache_key)
        merged_data = self._merge_data(existing, data, key_field="time")
        self._cache.set(f"prices:{cache_key}", merged_data)

    # Financial metrics cache methods
    def get_financial_metrics(self, cache_key: str) -> list[dict[str, any]] | None:
        """Get cached financial metrics if available."""
        return self._cache.get(f"financial_metrics:{cache_key}")

    def set_financial_metrics(self, cache_key: str, data: list[dict[str, any]]):
        """Cache financial metrics data."""
        existing = self.get_financial_metrics(cache_key)
        merged_data = self._merge_data(existing, data, key_field="report_period")
        self._cache.set(f"financial_metrics:{cache_key}", merged_data)

    # Line items cache methods
    def get_line_items(self, cache_key: str) -> list[dict[str, any]] | None:
        """Get cached line items if available."""
        return self._cache.get(f"line_items:{cache_key}")

    def set_line_items(self, cache_key: str, data: list[dict[str, any]]):
        """Cache line items data."""
        existing = self.get_line_items(cache_key)
        merged_data = self._merge_data(existing, data, key_field="report_period")
        self._cache.set(f"line_items:{cache_key}", merged_data)

    # Insider trades cache methods
    def get_insider_trades(self, cache_key: str) -> list[dict[str, any]] | None:
        """Get cached insider trades if available."""
        return self._cache.get(f"insider_trades:{cache_key}")

    def set_insider_trades(self, cache_key: str, data: list[dict[str, any]]):
        """Cache insider trades data."""
        existing = self.get_insider_trades(cache_key)
        merged_data = self._merge_data(existing, data, key_field="filing_date")
        self._cache.set(f"insider_trades:{cache_key}", merged_data)

    # Company news cache methods
    def get_company_news(self, cache_key: str) -> list[dict[str, any]] | None:
        """Get cached company news if available."""
        return self._cache.get(f"company_news:{cache_key}")

    def set_company_news(self, cache_key: str, data: list[dict[str, any]]):
        """Cache company news data."""
        existing = self.get_company_news(cache_key)
        merged_data = self._merge_data(existing, data, key_field="date")
        self._cache.set(f"company_news:{cache_key}", merged_data)

    # Market cap cache methods
    def get_market_cap(self, cache_key: str) -> float | None:
        """Get cached market cap if available."""
        return self._cache.get(f"market_cap:{cache_key}")

    def set_market_cap(self, cache_key: str, market_cap: float):
        """Cache market cap data."""
        self._cache.set(f"market_cap:{cache_key}", market_cap)

    # LLM response cache methods
    def get_llm_response(self, cache_key: str) -> dict[str, any] | None:
        """Get cached LLM response if available."""
        return self._cache.get(f"llm:{cache_key}")

    def set_llm_response(self, cache_key: str, response_data: dict[str, any]):
        """Cache LLM response data."""
        self._cache.set(f"llm:{cache_key}", response_data)

    # Cache management methods
    def get_cache_stats(self) -> dict[str, int]:
        """Get cache statistics for monitoring performance."""
        # Count entries by prefix
        stats = {
            "prices_cached": 0,
            "financial_metrics_cached": 0,
            "line_items_cached": 0,
            "insider_trades_cached": 0,
            "company_news_cached": 0,
            "market_cap_cached": 0,
            "llm_responses_cached": 0,
            "total_cache_entries": len(self._cache)
        }
        
        # Count by prefix (this is approximate since diskcache doesn't have direct prefix counting)
        for key in self._cache:
            if key.startswith("prices:"):
                stats["prices_cached"] += 1
            elif key.startswith("financial_metrics:"):
                stats["financial_metrics_cached"] += 1
            elif key.startswith("line_items:"):
                stats["line_items_cached"] += 1
            elif key.startswith("insider_trades:"):
                stats["insider_trades_cached"] += 1
            elif key.startswith("company_news:"):
                stats["company_news_cached"] += 1
            elif key.startswith("market_cap:"):
                stats["market_cap_cached"] += 1
            elif key.startswith("llm:"):
                stats["llm_responses_cached"] += 1
        
        return stats

    def clear_cache(self):
        """Clear all cached data."""
        self._cache.clear()
        print("🗑️  Cache cleared from disk")

    def clear_ticker_cache(self, ticker: str):
        """Clear all cached data for a specific ticker."""
        keys_to_remove = []
        
        # Find all keys that contain the ticker
        for key in self._cache:
            if f"_{ticker}_" in key or key.endswith(f"_{ticker}") or key.startswith(f"{ticker}_"):
                keys_to_remove.append(key)
        
        # Remove the keys
        for key in keys_to_remove:
            del self._cache[key]
        
        print(f"🗑️  Cleared {len(keys_to_remove)} cache entries for ticker: {ticker}")

    def force_save(self):
        """Force save cache to disk immediately."""
        # diskcache automatically handles persistence, but we can trigger a sync
        self._cache.close()
        self._cache = dc.Cache(self._cache.directory)
        print("💾 Cache synced to disk")

    def get_cache_size(self) -> dict[str, any]:
        """Get cache size information."""
        return {
            "total_entries": len(self._cache),
            "disk_size_bytes": self._cache.volume(),
            "cache_directory": self._cache.directory
        }

    def __del__(self):
        """Cleanup when cache is destroyed."""
        try:
            self._cache.close()
        except:
            pass


# Global cache instance
_cache = Cache()


def get_cache() -> Cache:
    """Get the global cache instance."""
    return _cache
