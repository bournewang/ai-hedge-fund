import pytest
import os
import shutil
from src.data.cache import Cache

# Define a fixture for a cache instance to ensure cleanup
@pytest.fixture
def cache_instance():
    # Use a temporary directory for the cache during tests
    temp_cache_dir = "./.test_cache_data"
    original_cache_dir = os.environ.get("CACHE_DIR_OVERRIDE", None)
    os.environ["CACHE_DIR_OVERRIDE"] = temp_cache_dir # Assuming Cache class uses this or similar mechanism for testability
                                                     # If not, this needs to be adapted to how Cache determines its directory.
                                                     # For this example, let's assume Cache() will pick up CACHE_DIR from src.data.cache
                                                     # and we might need to mock that module-level variable or the Cache constructor.

    # If Cache class directly uses CACHE_DIR from its own module, we might need to patch it.
    # For simplicity, let's assume the Cache class can be instantiated with a directory or respects an env var.
    # If Cache class is hardcoded to "./.cache_data", this fixture needs more advanced patching (e.g., monkeypatching `src.data.cache.CACHE_DIR`)

    # Fallback: If Cache class hardcodes its directory, we'll use a workaround for this example.
    # This is not ideal for real tests but demonstrates the intent.
    # We'll assume src.data.cache.CACHE_DIR is the one being used.
    # This requires src.data.cache.CACHE_DIR to be assignable for test purposes or using monkeypatch.

    import src.data.cache # Import late to allow potential patching if needed
    original_module_cache_dir = src.data.cache.CACHE_DIR
    src.data.cache.CACHE_DIR = temp_cache_dir

    instance = Cache()
    yield instance # provide the instance to the test

    # Teardown: remove the temporary cache directory
    if os.path.exists(temp_cache_dir):
        shutil.rmtree(temp_cache_dir)

    # Restore original environment/module variables
    if original_cache_dir:
        os.environ["CACHE_DIR_OVERRIDE"] = original_cache_dir
    else:
        if "CACHE_DIR_OVERRIDE" in os.environ: # Check if it was set by us
             del os.environ["CACHE_DIR_OVERRIDE"]
    src.data.cache.CACHE_DIR = original_module_cache_dir


class TestCacheForceRefresh:

    def test_get_prices_force_refresh(self, cache_instance: Cache):
        ticker = "AAPL"
        sample_data = [{"time": "T1", "value": 100, "open": 100, "close": 100, "high": 100, "low": 100, "volume": 1000}] # Added missing fields for Price model

        cache_instance.set_prices(ticker, sample_data)

        # Action 1: force_refresh=True
        result_forced = cache_instance.get_prices(ticker, force_refresh=True)
        assert result_forced is None, "Should return None when force_refresh is True"

        # Action 2: force_refresh=False
        result_not_forced = cache_instance.get_prices(ticker, force_refresh=False)
        assert result_not_forced == sample_data, "Should return data when force_refresh is False and data exists"

    def test_get_financial_metrics_force_refresh(self, cache_instance: Cache):
        ticker = "MSFT"
        # Example data structure for FinancialMetrics, ensure it matches the actual model
        sample_data = [{"report_period": "2023-Q1", "market_cap": 2e12, "ev_to_ebit": 20.0}]

        cache_instance.set_financial_metrics(ticker, sample_data)

        result_forced = cache_instance.get_financial_metrics(ticker, force_refresh=True)
        assert result_forced is None

        result_not_forced = cache_instance.get_financial_metrics(ticker, force_refresh=False)
        assert result_not_forced == sample_data

    def test_get_insider_trades_force_refresh(self, cache_instance: Cache):
        ticker = "GOOG"
        # Example data for InsiderTrade
        sample_data = [{"filing_date": "2023-01-01", "transaction_type": "buy", "transaction_shares": 100}]

        cache_instance.set_insider_trades(ticker, sample_data)

        result_forced = cache_instance.get_insider_trades(ticker, force_refresh=True)
        assert result_forced is None

        result_not_forced = cache_instance.get_insider_trades(ticker, force_refresh=False)
        assert result_not_forced == sample_data

    def test_get_company_news_force_refresh(self, cache_instance: Cache):
        ticker = "AMZN"
        # Example data for CompanyNews
        sample_data = [{"date": "2023-05-01", "title": "News Title", "sentiment": "positive"}]

        cache_instance.set_company_news(ticker, sample_data)

        result_forced = cache_instance.get_company_news(ticker, force_refresh=True)
        assert result_forced is None

        result_not_forced = cache_instance.get_company_news(ticker, force_refresh=False)
        assert result_not_forced == sample_data

    def test_get_analysis_results_force_refresh(self, cache_instance: Cache):
        cache_key = "my_analysis_key"
        sample_data = {"result": "some_analysis"}

        cache_instance.set_analysis_results(cache_key, sample_data)

        result_forced = cache_instance.get_analysis_results(cache_key, force_refresh=True)
        assert result_forced is None

        result_not_forced = cache_instance.get_analysis_results(cache_key, force_refresh=False)
        assert result_not_forced == sample_data
