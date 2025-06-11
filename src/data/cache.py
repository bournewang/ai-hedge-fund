import diskcache
import os

CACHE_DIR = "./.cache_data"

class Cache:
    """Disk-based cache for API responses using diskcache."""

    def __init__(self):
        os.makedirs(CACHE_DIR, exist_ok=True)
        self._prices_cache = diskcache.Cache(os.path.join(CACHE_DIR, 'prices'))
        self._financial_metrics_cache = diskcache.Cache(os.path.join(CACHE_DIR, 'financial_metrics'))
        self._line_items_cache = diskcache.Cache(os.path.join(CACHE_DIR, 'line_items'))
        self._insider_trades_cache = diskcache.Cache(os.path.join(CACHE_DIR, 'insider_trades'))
        self._company_news_cache = diskcache.Cache(os.path.join(CACHE_DIR, 'company_news'))
        self._analysis_results_cache = diskcache.Cache(os.path.join(CACHE_DIR, 'analysis_results'))

    def _merge_data(self, existing: list[dict] | None, new_data: list[dict], key_field: str) -> list[dict]:  # type: ignore
        """Merge existing and new data, avoiding duplicates based on a key field."""
        if not existing:
            return new_data

        # Create a set of existing keys for O(1) lookup
        existing_keys = {item[key_field] for item in existing}

        # Only add items that don't exist yet
        merged = existing.copy()
        merged.extend([item for item in new_data if item[key_field] not in existing_keys])
        return merged

    def get_prices(self, ticker: str, force_refresh: bool = False) -> list[dict[str, any]] | None:
        """Get cached price data if available."""
        if force_refresh:
            return None
        return self._prices_cache.get(ticker)

    def set_prices(self, ticker: str, data: list[dict[str, any]]):
        """Append new price data to cache."""
        existing_data = self._prices_cache.get(ticker)
        merged_data = self._merge_data(existing_data, data, key_field="time")
        self._prices_cache.set(ticker, merged_data)

    def get_financial_metrics(self, ticker: str, force_refresh: bool = False) -> list[dict[str, any]] | None:
        """Get cached financial metrics if available."""
        if force_refresh:
            return None
        return self._financial_metrics_cache.get(ticker)

    def set_financial_metrics(self, ticker: str, data: list[dict[str, any]]):
        """Append new financial metrics to cache."""
        existing_data = self._financial_metrics_cache.get(ticker)
        merged_data = self._merge_data(existing_data, data, key_field="report_period")
        self._financial_metrics_cache.set(ticker, merged_data)

    def get_line_items(self, ticker: str) -> list[dict[str, any]] | None:
        """Get cached line items if available."""
        return self._line_items_cache.get(ticker)

    def set_line_items(self, ticker: str, data: list[dict[str, any]]):
        """Append new line items to cache."""
        existing_data = self._line_items_cache.get(ticker)
        merged_data = self._merge_data(existing_data, data, key_field="report_period")
        self._line_items_cache.set(ticker, merged_data)

    def get_insider_trades(self, ticker: str, force_refresh: bool = False) -> list[dict[str, any]] | None:
        """Get cached insider trades if available."""
        if force_refresh:
            return None
        return self._insider_trades_cache.get(ticker)

    def set_insider_trades(self, ticker: str, data: list[dict[str, any]]):
        """Append new insider trades to cache."""
        existing_data = self._insider_trades_cache.get(ticker)
        merged_data = self._merge_data(existing_data, data, key_field="filing_date")  # Could also use transaction_date if preferred
        self._insider_trades_cache.set(ticker, merged_data)

    def get_company_news(self, ticker: str, force_refresh: bool = False) -> list[dict[str, any]] | None:
        """Get cached company news if available."""
        if force_refresh:
            return None
        return self._company_news_cache.get(ticker)

    def set_company_news(self, ticker: str, data: list[dict[str, any]]):
        """Append new company news to cache."""
        existing_data = self._company_news_cache.get(ticker)
        merged_data = self._merge_data(existing_data, data, key_field="date")
        self._company_news_cache.set(ticker, merged_data)

    def get_analysis_results(self, cache_key: str, force_refresh: bool = False) -> dict | None: # type: ignore
        """Get cached analysis results if available, optionally forcing a cache bypass."""
        if force_refresh:
            return None
        return self._analysis_results_cache.get(cache_key)

    def set_analysis_results(self, cache_key: str, data: dict): # type: ignore
        """Set analysis results into cache, overwriting any existing entry."""
        self._analysis_results_cache.set(cache_key, data)


# Global cache instance
_cache = Cache()


def get_cache() -> Cache:
    """Get the global cache instance."""
    return _cache
