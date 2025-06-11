import pytest
from unittest.mock import patch, MagicMock

# Assuming tools.api is structured such that these can be imported.
# Adjust imports based on actual file structure and available classes/functions.
from src.tools import api as tools_api # aliasing to avoid conflict
from src.data.cache import Cache # For type hinting mock cache
from src.data.models import FinancialMetrics, Price, InsiderTrade, CompanyNews # For constructing return values

# Test data
AAPL = "AAPL"
START_DATE = "2023-01-01"
END_DATE = "2023-12-31"
PERIOD = "annual"
LIMIT = 1

@pytest.fixture
def mock_cache_instance():
    """Fixture to create a mock Cache instance."""
    mock_cache = MagicMock(spec=Cache)
    return mock_cache

@patch('src.tools.api.get_cache') # Patch where get_cache is looked up (in src.tools.api module)
class TestApiForceRefresh:

    # --- Test get_financial_metrics ---
    @patch('src.tools.api.requests.get') # Mocking the actual 'requests.get' call
    def test_get_financial_metrics_force_refresh(self, mock_requests_get, mock_get_cache_func, mock_cache_instance):
        mock_get_cache_func.return_value = mock_cache_instance

        # Mock API response
        mock_api_response = MagicMock()
        mock_api_response.status_code = 200
        # Ensure the JSON matches FinancialMetricsResponse structure
        mock_api_response.json.return_value = {"financial_metrics": [{"ticker": AAPL, "report_period": "2023", "market_cap": 2.5e12}]}
        mock_requests_get.return_value = mock_api_response

        sample_metric = FinancialMetrics(ticker=AAPL, report_period="2023", market_cap=2.5e12) # Example

        # Scenario 1: Cache miss, no force_refresh
        mock_cache_instance.get_financial_metrics.return_value = None
        tools_api.get_financial_metrics(AAPL, END_DATE, period=PERIOD, limit=LIMIT, force_refresh=False)
        mock_requests_get.assert_called_once()
        mock_cache_instance.set_financial_metrics.assert_called_once_with(
            f"{AAPL}_{PERIOD}_{END_DATE}_{LIMIT}", [sample_metric.model_dump()]
        )
        mock_requests_get.reset_mock()
        mock_cache_instance.reset_mock()
        mock_get_cache_func.return_value = mock_cache_instance # re-assign for next scenario

        # Scenario 2: Cache hit, no force_refresh
        mock_cache_instance.get_financial_metrics.return_value = [sample_metric.model_dump()]
        tools_api.get_financial_metrics(AAPL, END_DATE, period=PERIOD, limit=LIMIT, force_refresh=False)
        mock_requests_get.assert_not_called()
        mock_cache_instance.set_financial_metrics.assert_not_called()
        mock_requests_get.reset_mock()
        mock_cache_instance.reset_mock()
        mock_get_cache_func.return_value = mock_cache_instance


        # Scenario 3: Cache hit, with force_refresh
        # The cache's get_financial_metrics is now expected to return None due to force_refresh=True passed to it
        mock_cache_instance.get_financial_metrics.return_value = None # This is what tools.api will see

        tools_api.get_financial_metrics(AAPL, END_DATE, period=PERIOD, limit=LIMIT, force_refresh=True)

        # Check that cache was called with force_refresh=True
        mock_cache_instance.get_financial_metrics.assert_called_once_with(f"{AAPL}_{PERIOD}_{END_DATE}_{LIMIT}", force_refresh=True)
        mock_requests_get.assert_called_once() # API should be called
        mock_cache_instance.set_financial_metrics.assert_called_once_with(
            f"{AAPL}_{PERIOD}_{END_DATE}_{LIMIT}", [sample_metric.model_dump()]
        )

    # --- Test get_prices ---
    @patch('src.tools.api.requests.get')
    def test_get_prices_force_refresh(self, mock_requests_get, mock_get_cache_func, mock_cache_instance):
        mock_get_cache_func.return_value = mock_cache_instance
        mock_api_response = MagicMock()
        mock_api_response.status_code = 200
        mock_api_response.json.return_value = {"prices": [{"time": "T1", "open": 1, "close": 1, "high": 1, "low": 1, "volume": 1}]}
        mock_requests_get.return_value = mock_api_response
        sample_price = Price(time="T1", open=1, close=1, high=1, low=1, volume=1)
        cache_key_prices = f"{AAPL}_{START_DATE}_{END_DATE}"

        # Scenario 1: Cache miss, no force_refresh
        mock_cache_instance.get_prices.return_value = None
        tools_api.get_prices(AAPL, START_DATE, END_DATE, force_refresh=False)
        mock_requests_get.assert_called_once()
        mock_cache_instance.set_prices.assert_called_once_with(cache_key_prices, [sample_price.model_dump()])
        mock_requests_get.reset_mock()
        mock_cache_instance.reset_mock()
        mock_get_cache_func.return_value = mock_cache_instance

        # Scenario 2: Cache hit, no force_refresh
        mock_cache_instance.get_prices.return_value = [sample_price.model_dump()]
        tools_api.get_prices(AAPL, START_DATE, END_DATE, force_refresh=False)
        mock_requests_get.assert_not_called()
        mock_cache_instance.set_prices.assert_not_called()
        mock_requests_get.reset_mock()
        mock_cache_instance.reset_mock()
        mock_get_cache_func.return_value = mock_cache_instance

        # Scenario 3: Cache hit, with force_refresh
        mock_cache_instance.get_prices.return_value = None # tools.api sees None due to its call with force_refresh=True
        tools_api.get_prices(AAPL, START_DATE, END_DATE, force_refresh=True)
        mock_cache_instance.get_prices.assert_called_once_with(cache_key_prices, force_refresh=True)
        mock_requests_get.assert_called_once()
        mock_cache_instance.set_prices.assert_called_once_with(cache_key_prices, [sample_price.model_dump()])

    # --- Test get_insider_trades ---
    @patch('src.tools.api.requests.get')
    def test_get_insider_trades_force_refresh(self, mock_requests_get, mock_get_cache_func, mock_cache_instance):
        mock_get_cache_func.return_value = mock_cache_instance
        mock_api_response = MagicMock()
        mock_api_response.status_code = 200
        mock_api_response.json.return_value = {"insider_trades": [{"filing_date": "D1", "transaction_type": "P", "transaction_shares": 100}]}
        mock_requests_get.return_value = mock_api_response
        sample_trade = InsiderTrade(filing_date="D1", transaction_type="P", transaction_shares=100)
        cache_key_trades = f"{AAPL}_none_{END_DATE}_{1000}" # Assuming default limit and no start_date

        # Scenario 1: Cache miss, no force_refresh
        mock_cache_instance.get_insider_trades.return_value = None
        tools_api.get_insider_trades(AAPL, END_DATE, force_refresh=False) # Using default limit and no start_date
        mock_requests_get.assert_called_once()
        mock_cache_instance.set_insider_trades.assert_called_once_with(cache_key_trades, [sample_trade.model_dump()])
        mock_requests_get.reset_mock()
        mock_cache_instance.reset_mock()
        mock_get_cache_func.return_value = mock_cache_instance

        # Scenario 2: Cache hit, no force_refresh
        mock_cache_instance.get_insider_trades.return_value = [sample_trade.model_dump()]
        tools_api.get_insider_trades(AAPL, END_DATE, force_refresh=False)
        mock_requests_get.assert_not_called()
        mock_cache_instance.set_insider_trades.assert_not_called()
        mock_requests_get.reset_mock()
        mock_cache_instance.reset_mock()
        mock_get_cache_func.return_value = mock_cache_instance

        # Scenario 3: Cache hit, with force_refresh
        mock_cache_instance.get_insider_trades.return_value = None
        tools_api.get_insider_trades(AAPL, END_DATE, force_refresh=True)
        mock_cache_instance.get_insider_trades.assert_called_once_with(cache_key_trades, force_refresh=True)
        mock_requests_get.assert_called_once()
        mock_cache_instance.set_insider_trades.assert_called_once_with(cache_key_trades, [sample_trade.model_dump()])

    # --- Test get_company_news ---
    @patch('src.tools.api.requests.get')
    def test_get_company_news_force_refresh(self, mock_requests_get, mock_get_cache_func, mock_cache_instance):
        mock_get_cache_func.return_value = mock_cache_instance
        mock_api_response = MagicMock()
        mock_api_response.status_code = 200
        mock_api_response.json.return_value = {"news": [{"date": "D1", "title": "T1", "sentiment": "neutral"}]}
        mock_requests_get.return_value = mock_api_response
        sample_news = CompanyNews(date="D1", title="T1", sentiment="neutral")
        cache_key_news = f"{AAPL}_none_{END_DATE}_{1000}" # Assuming default limit and no start_date


        # Scenario 1: Cache miss, no force_refresh
        mock_cache_instance.get_company_news.return_value = None
        tools_api.get_company_news(AAPL, END_DATE, force_refresh=False) # Using default limit and no start_date
        mock_requests_get.assert_called_once()
        mock_cache_instance.set_company_news.assert_called_once_with(cache_key_news, [sample_news.model_dump()])
        mock_requests_get.reset_mock()
        mock_cache_instance.reset_mock()
        mock_get_cache_func.return_value = mock_cache_instance

        # Scenario 2: Cache hit, no force_refresh
        mock_cache_instance.get_company_news.return_value = [sample_news.model_dump()]
        tools_api.get_company_news(AAPL, END_DATE, force_refresh=False)
        mock_requests_get.assert_not_called()
        mock_cache_instance.set_company_news.assert_not_called()
        mock_requests_get.reset_mock()
        mock_cache_instance.reset_mock()
        mock_get_cache_func.return_value = mock_cache_instance

        # Scenario 3: Cache hit, with force_refresh
        mock_cache_instance.get_company_news.return_value = None
        tools_api.get_company_news(AAPL, END_DATE, force_refresh=True)
        mock_cache_instance.get_company_news.assert_called_once_with(cache_key_news, force_refresh=True)
        mock_requests_get.assert_called_once()
        mock_cache_instance.set_company_news.assert_called_once_with(cache_key_news, [sample_news.model_dump()])

    # --- Test get_price_data (indirectly tests get_prices force_refresh pass-through) ---
    @patch('src.tools.api.get_prices') # Mock the internal get_prices call within tools.api
    def test_get_price_data_passes_force_refresh(self, mock_internal_get_prices, mock_get_cache_func, mock_cache_instance):
        mock_get_cache_func.return_value = mock_cache_instance # Though not directly used by get_price_data, good to have if it were

        # Mock what get_prices would return (a list of Price objects)
        mock_internal_get_prices.return_value = [Price(time="T1", open=1, close=1, high=1, low=1, volume=1)]

        # Call with force_refresh=True
        tools_api.get_price_data(AAPL, START_DATE, END_DATE, force_refresh=True)
        mock_internal_get_prices.assert_called_once_with(AAPL, START_DATE, END_DATE, force_refresh=True)

        mock_internal_get_prices.reset_mock()

        # Call with force_refresh=False
        tools_api.get_price_data(AAPL, START_DATE, END_DATE, force_refresh=False)
        mock_internal_get_prices.assert_called_once_with(AAPL, START_DATE, END_DATE, force_refresh=False)

# Note: search_line_items and get_market_cap are not directly tested here for force_refresh
# as search_line_items was stated to not have caching, and get_market_cap uses get_financial_metrics internally.
# If get_market_cap had its own caching layer for market cap data distinct from financial_metrics, it would also need tests.
# For get_market_cap, its force_refresh behavior is implicitly tested via get_financial_metrics tests if it correctly
# passes the force_refresh flag down. An integration test or more specific unit test could verify this pass-through.
