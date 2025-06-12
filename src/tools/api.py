import datetime
import os
import pandas as pd
import requests
import logging

from src.data.cache import get_cache
from src.data.models import (
    CompanyNews,
    CompanyNewsResponse,
    FinancialMetrics,
    FinancialMetricsResponse,
    Price,
    PriceResponse,
    LineItem,
    LineItemResponse,
    InsiderTrade,
    InsiderTradeResponse,
    CompanyFactsResponse,
)

# Global cache instance
_cache = get_cache()

# Set up logging for cache performance
logger = logging.getLogger(__name__)

# Define the superset of all line items used across agents
LINE_ITEMS_SUPERSET = [
    "book_value_per_share",
    "capital_expenditure", 
    "cash_and_equivalents",
    "current_assets",
    "current_liabilities",
    "debt_to_equity",
    "depreciation_and_amortization",
    "dividends_and_other_cash_distributions",
    "earnings_per_share",
    "ebit",
    "ebitda",
    "free_cash_flow",
    "goodwill_and_intangible_assets",
    "gross_margin",
    "gross_profit",
    "interest_expense",
    "issuance_or_purchase_of_equity_shares",
    "net_income",
    "operating_expense",
    "operating_income",
    "operating_margin",
    "outstanding_shares",
    "research_and_development",
    "return_on_invested_capital",
    "revenue",
    "shareholders_equity",
    "total_assets",
    "total_debt",
    "total_liabilities",
    "working_capital",
]


def get_prices(ticker: str, start_date: str, end_date: str) -> list[Price]:
    """Fetch price data from cache or API."""
    # Create a cache key that includes all parameters to ensure exact matches
    cache_key = f"{ticker}_{start_date}_{end_date}"
    
    # Check cache first - simple exact match
    if cached_data := _cache.get_prices(cache_key):
        logger.info(f"Cache HIT for prices: {cache_key}")
        return [Price(**price) for price in cached_data]

    logger.info(f"Cache MISS for prices: {cache_key}")
    # If not in cache, fetch from API
    headers = {}
    if api_key := os.environ.get("FINANCIAL_DATASETS_API_KEY"):
        headers["X-API-KEY"] = api_key

    url = f"https://api.financialdatasets.ai/prices/?ticker={ticker}&interval=day&interval_multiplier=1&start_date={start_date}&end_date={end_date}"
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Error fetching data: {ticker} - {response.status_code} - {response.text}")

    # Parse response with Pydantic model
    price_response = PriceResponse(**response.json())
    prices = price_response.prices

    if not prices:
        return []

    # Cache the results using the comprehensive cache key
    _cache.set_prices(cache_key, [p.model_dump() for p in prices])
    logger.info(f"Cached prices for: {cache_key}")
    return prices


def get_financial_metrics(
    ticker: str,
    end_date: str,
    period: str = "ttm",
    limit: int = 10,
) -> list[FinancialMetrics]:
    """Fetch financial metrics from cache or API."""
    # Create a cache key that includes all parameters to ensure exact matches
    cache_key = f"{ticker}_{period}_{end_date}_{limit}"
    
    # Check cache first - simple exact match
    if cached_data := _cache.get_financial_metrics(cache_key):
        logger.info(f"Cache HIT for financial_metrics: {cache_key}")
        return [FinancialMetrics(**metric) for metric in cached_data]

    logger.info(f"Cache MISS for financial_metrics: {cache_key}")
    # If not in cache, fetch from API
    headers = {}
    if api_key := os.environ.get("FINANCIAL_DATASETS_API_KEY"):
        headers["X-API-KEY"] = api_key

    url = f"https://api.financialdatasets.ai/financial-metrics/?ticker={ticker}&report_period_lte={end_date}&limit={limit}&period={period}"
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Error fetching data: {ticker} - {response.status_code} - {response.text}")

    # Parse response with Pydantic model
    metrics_response = FinancialMetricsResponse(**response.json())
    financial_metrics = metrics_response.financial_metrics

    if not financial_metrics:
        return []

    # Cache the results as dicts using the comprehensive cache key
    _cache.set_financial_metrics(cache_key, [m.model_dump() for m in financial_metrics])
    logger.info(f"Cached financial_metrics for: {cache_key}")
    return financial_metrics


def search_line_items(
    ticker: str,
    line_items: list[str],
    end_date: str,
    period: str = "ttm",
    limit: int = 10,
) -> list[LineItem]:
    """Fetch line items from cache or API using superset caching strategy."""
    # Create cache key based on ticker, period, date, limit only (not specific line items)
    # This enables superset caching where we fetch all line items once
    cache_key = f"{ticker}_{end_date}_{period}_{limit}"
    
    # Check cache first for the superset
    if cached_data := _cache.get_line_items(cache_key):
        logger.info(f"Cache HIT for line_items: {cache_key} (superset)")
        all_line_items = [LineItem(**item) for item in cached_data]
        
        # Filter to return only requested line items
        # LineItem objects store the actual values as dynamic attributes
        requested_set = set(line_items)
        filtered_results = []
        
        for item in all_line_items:
            # Check if this item has any of the requested line items as attributes
            item_dict = item.model_dump()
            has_requested_data = False
            
            for requested_item in requested_set:
                if requested_item in item_dict and item_dict[requested_item] is not None:
                    has_requested_data = True
                    break
            
            if has_requested_data:
                filtered_results.append(item)
        
        return filtered_results

    logger.info(f"Cache MISS for line_items: {cache_key} (fetching superset)")
    
    # If not in cache, fetch the SUPERSET from API (not just requested items)
    headers = {}
    if api_key := os.environ.get("FINANCIAL_DATASETS_API_KEY"):
        headers["X-API-KEY"] = api_key

    url = "https://api.financialdatasets.ai/financials/search/line-items"

    # Request the full superset to maximize cache efficiency
    body = {
        "tickers": [ticker],
        "line_items": LINE_ITEMS_SUPERSET,  # Always fetch superset
        "end_date": end_date,
        "period": period,
        "limit": limit,
    }
    response = requests.post(url, headers=headers, json=body)
    if response.status_code != 200:
        raise Exception(f"Error fetching data: {ticker} - {response.status_code} - {response.text}")
    data = response.json()
    response_model = LineItemResponse(**data)
    search_results = response_model.search_results
    if not search_results:
        return []

    # Cache the FULL superset results
    _cache.set_line_items(cache_key, [item.model_dump() for item in search_results[:limit]])
    logger.info(f"Cached line_items superset for: {cache_key} ({len(search_results)} items)")
    
    # Filter and return only the requested line items
    # For fresh API results, we can return all since we fetched the superset
    # But let's be consistent and filter here too
    requested_set = set(line_items)
    filtered_results = []
    
    for item in search_results[:limit]:
        # Check if this item has any of the requested line items as attributes
        item_dict = item.model_dump()
        has_requested_data = False
        
        for requested_item in requested_set:
            if requested_item in item_dict and item_dict[requested_item] is not None:
                has_requested_data = True
                break
        
        if has_requested_data:
            filtered_results.append(item)
    
    return filtered_results


def get_insider_trades(
    ticker: str,
    end_date: str,
    start_date: str | None = None,
    limit: int = 1000,
) -> list[InsiderTrade]:
    """Fetch insider trades from cache or API."""
    # Create a cache key that includes all parameters to ensure exact matches
    cache_key = f"{ticker}_{start_date or 'none'}_{end_date}_{limit}"
    
    # Check cache first - simple exact match
    if cached_data := _cache.get_insider_trades(cache_key):
        logger.info(f"Cache HIT for insider_trades: {cache_key}")
        return [InsiderTrade(**trade) for trade in cached_data]

    logger.info(f"Cache MISS for insider_trades: {cache_key}")
    # If not in cache, fetch from API
    headers = {}
    if api_key := os.environ.get("FINANCIAL_DATASETS_API_KEY"):
        headers["X-API-KEY"] = api_key

    all_trades = []
    current_end_date = end_date

    while True:
        url = f"https://api.financialdatasets.ai/insider-trades/?ticker={ticker}&filing_date_lte={current_end_date}"
        if start_date:
            url += f"&filing_date_gte={start_date}"
        url += f"&limit={limit}"

        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            raise Exception(f"Error fetching data: {ticker} - {response.status_code} - {response.text}")

        data = response.json()
        response_model = InsiderTradeResponse(**data)
        insider_trades = response_model.insider_trades

        if not insider_trades:
            break

        all_trades.extend(insider_trades)

        # Only continue pagination if we have a start_date and got a full page
        if not start_date or len(insider_trades) < limit:
            break

        # Update end_date to the oldest filing date from current batch for next iteration
        current_end_date = min(trade.filing_date for trade in insider_trades).split("T")[0]

        # If we've reached or passed the start_date, we can stop
        if current_end_date <= start_date:
            break

    if not all_trades:
        return []

    # Cache the results using the comprehensive cache key
    _cache.set_insider_trades(cache_key, [trade.model_dump() for trade in all_trades])
    logger.info(f"Cached insider_trades for: {cache_key}")
    return all_trades


def get_company_news(
    ticker: str,
    end_date: str,
    start_date: str | None = None,
    limit: int = 1000,
) -> list[CompanyNews]:
    """Fetch company news from cache or API."""
    # Create a cache key that includes all parameters to ensure exact matches
    cache_key = f"{ticker}_{start_date or 'none'}_{end_date}_{limit}"
    
    # Check cache first - simple exact match
    if cached_data := _cache.get_company_news(cache_key):
        logger.info(f"Cache HIT for company_news: {cache_key}")
        return [CompanyNews(**news) for news in cached_data]

    logger.info(f"Cache MISS for company_news: {cache_key}")
    # If not in cache, fetch from API
    headers = {}
    if api_key := os.environ.get("FINANCIAL_DATASETS_API_KEY"):
        headers["X-API-KEY"] = api_key

    all_news = []
    current_end_date = end_date

    while True:
        url = f"https://api.financialdatasets.ai/news/?ticker={ticker}&end_date={current_end_date}"
        if start_date:
            url += f"&start_date={start_date}"
        url += f"&limit={limit}"

        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            raise Exception(f"Error fetching data: {ticker} - {response.status_code} - {response.text}")

        data = response.json()
        response_model = CompanyNewsResponse(**data)
        company_news = response_model.news

        if not company_news:
            break

        all_news.extend(company_news)

        # Only continue pagination if we have a start_date and got a full page
        if not start_date or len(company_news) < limit:
            break

        # Update end_date to the oldest date from current batch for next iteration
        current_end_date = min(news.date for news in company_news).split("T")[0]

        # If we've reached or passed the start_date, we can stop
        if current_end_date <= start_date:
            break

    if not all_news:
        return []

    # Cache the results using the comprehensive cache key
    _cache.set_company_news(cache_key, [news.model_dump() for news in all_news])
    logger.info(f"Cached company_news for: {cache_key}")
    return all_news


def get_market_cap(
    ticker: str,
    end_date: str,
) -> float | None:
    """Fetch market cap from cache or API."""
    # Create a cache key that includes all parameters to ensure exact matches
    cache_key = f"{ticker}_{end_date}"
    
    # Check cache first - simple exact match
    if cached_data := _cache.get_market_cap(cache_key):
        logger.info(f"Cache HIT for market_cap: {cache_key}")
        return cached_data
    
    logger.info(f"Cache MISS for market_cap: {cache_key}")
    market_cap = None
    
    # Check if end_date is today
    if end_date == datetime.datetime.now().strftime("%Y-%m-%d"):
        # Get the market cap from company facts API
        headers = {}
        if api_key := os.environ.get("FINANCIAL_DATASETS_API_KEY"):
            headers["X-API-KEY"] = api_key

        url = f"https://api.financialdatasets.ai/company/facts/?ticker={ticker}"
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            print(f"Error fetching company facts: {ticker} - {response.status_code}")
            return None

        data = response.json()
        response_model = CompanyFactsResponse(**data)
        market_cap = response_model.company_facts.market_cap
    else:
        financial_metrics = get_financial_metrics(ticker, end_date)
        if not financial_metrics:
            return None

        market_cap = financial_metrics[0].market_cap

        if not market_cap:
            return None

    # Cache the result using the comprehensive cache key
    if market_cap is not None:
        _cache.set_market_cap(cache_key, market_cap)
        logger.info(f"Cached market_cap for: {cache_key}")
    
    return market_cap


def prices_to_df(prices: list[Price]) -> pd.DataFrame:
    """Convert prices to a DataFrame."""
    df = pd.DataFrame([p.model_dump() for p in prices])
    df["Date"] = pd.to_datetime(df["time"])
    df.set_index("Date", inplace=True)
    numeric_cols = ["open", "close", "high", "low", "volume"]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df.sort_index(inplace=True)
    return df


# Update the get_price_data function to use the new functions
def get_price_data(ticker: str, start_date: str, end_date: str) -> pd.DataFrame:
    prices = get_prices(ticker, start_date, end_date)
    return prices_to_df(prices)
