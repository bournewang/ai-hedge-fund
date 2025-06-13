"""Polygon.io Data Adapter

This module provides a premium data source using Polygon.io for US stock market data.
It implements the same interface as existing adapters (Yahoo Finance, Finnhub) with enhanced
data quality and reliability for paid Polygon.io accounts.

Features:
- Premium data quality with paid Polygon.io plan
- Batch price processing for multiple tickers
- Real-time and historical market data
- Comprehensive financial statements and metrics
- Company news and insider trading data
- Full compatibility with existing cache system
- Rate limiting for API sustainability
"""

import os
import logging
import time
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from polygon import RESTClient

from src.data.cache import get_cache
from src.data.models import (
    Price,
    FinancialMetrics,
    LineItem,
    CompanyNews,
    InsiderTrade,
)

# Global cache instance
_cache = get_cache()

# Set up logging
logger = logging.getLogger(__name__)

# Polygon.io API configuration
POLYGON_API_KEY = os.environ.get("POLYGON_API_KEY")
if not POLYGON_API_KEY:
    logger.error("POLYGON_API_KEY not found in environment variables")
    raise ValueError("POLYGON_API_KEY must be set in environment variables")

# Initialize Polygon client
_polygon_client = RESTClient(api_key=POLYGON_API_KEY)

# Rate limiting configuration
# Even with paid plan, implement basic rate limiting for robustness
RATE_LIMIT_PER_MINUTE = 1000  # Conservative limit for paid plans
_rate_limiter_tokens = RATE_LIMIT_PER_MINUTE
_rate_limiter_last_refill = time.time()


def _rate_limit():
    """Simple token bucket rate limiter for Polygon API calls."""
    global _rate_limiter_tokens, _rate_limiter_last_refill
    
    now = time.time()
    elapsed = now - _rate_limiter_last_refill
    
    # Refill tokens based on time elapsed
    refill_amount = int(elapsed * RATE_LIMIT_PER_MINUTE / 60)
    if refill_amount > 0:
        _rate_limiter_tokens = min(RATE_LIMIT_PER_MINUTE, _rate_limiter_tokens + refill_amount)
        _rate_limiter_last_refill = now
    
    # Check if we have tokens available
    if _rate_limiter_tokens <= 0:
        sleep_time = 60 / RATE_LIMIT_PER_MINUTE
        logger.info(f"Rate limit reached, sleeping for {sleep_time:.2f} seconds")
        time.sleep(sleep_time)
        _rate_limiter_tokens = 1
    
    _rate_limiter_tokens -= 1


def get_prices_polygon(ticker: str, start_date: str, end_date: str) -> List[Price]:
    """
    Fetch price data for a single ticker from Polygon.io with caching.
    
    Args:
        ticker: Stock ticker symbol (e.g., 'AAPL')
        start_date: Start date in 'YYYY-MM-DD' format
        end_date: End date in 'YYYY-MM-DD' format
    
    Returns:
        List of Price objects sorted by date
    """
    cache_key = f"polygon_prices_{ticker}_{start_date}_{end_date}"
    
    # Check cache first
    if cached_data := _cache.get_prices(cache_key):
        logger.info(f"Cache HIT for polygon_prices: {cache_key}")
        return [Price(**price) for price in cached_data]

    logger.info(f"Cache MISS for polygon_prices: {cache_key}")
    
    try:
        _rate_limit()
        
        # Use Polygon's aggregates endpoint for daily bars
        aggs = _polygon_client.get_aggs(
            ticker=ticker,
            multiplier=1,
            timespan="day",
            from_=start_date,
            to=end_date,
            adjusted=True,
            sort="asc"
        )
        
        prices = []
        if hasattr(aggs, '__iter__'):
            for agg in aggs:
                # Convert timestamp to date string
                date_str = datetime.fromtimestamp(agg.timestamp / 1000).strftime('%Y-%m-%d')
                
                price = Price(
                    ticker=ticker,
                    date=date_str,
                    open=float(agg.open),
                    high=float(agg.high),
                    low=float(agg.low),
                    close=float(agg.close),
                    volume=int(agg.volume),
                    adj_close=float(agg.close)  # Polygon returns adjusted prices by default
                )
                prices.append(price)
        
        # Cache the results
        _cache.set_prices(cache_key, [p.model_dump() for p in prices])
        logger.info(f"Cached polygon_prices for: {cache_key}, got {len(prices)} price points")
        return prices
        
    except Exception as e:
        logger.error(f"Error fetching Polygon.io prices for {ticker}: {e}")
        return []


def get_historical_prices_polygon(tickers: List[str], start_date: str, end_date: str) -> Dict[str, List[Price]]:
    """
    Fetch historical price data for multiple tickers using batch processing.
    
    Args:
        tickers: List of stock ticker symbols
        start_date: Start date in 'YYYY-MM-DD' format
        end_date: End date in 'YYYY-MM-DD' format
    
    Returns:
        Dictionary mapping ticker -> List[Price]
    """
    result: Dict[str, List[Price]] = {}
    
    # Process tickers individually but with optimized caching
    for ticker in tickers:
        try:
            prices = get_prices_polygon(ticker, start_date, end_date)
            result[ticker] = prices
            logger.info(f"Fetched {len(prices)} prices for {ticker}")
        except Exception as e:
            logger.error(f"Failed to fetch prices for {ticker}: {e}")
            result[ticker] = []
    
    return result


def get_latest_price_polygon(ticker: str) -> Optional[Price]:
    """
    Fetch the latest price for a ticker using Polygon's previous close endpoint.
    
    Args:
        ticker: Stock ticker symbol
    
    Returns:
        Latest Price object or None if failed
    """
    cache_key = f"polygon_latest_{ticker}_{datetime.now().strftime('%Y-%m-%d')}"
    
    # Check cache first
    if cached_data := _cache.get_prices(cache_key):
        logger.info(f"Cache HIT for polygon_latest: {cache_key}")
        cached_prices = [Price(**price) for price in cached_data]
        return cached_prices[0] if cached_prices else None

    logger.info(f"Cache MISS for polygon_latest: {cache_key}")
    
    try:
        _rate_limit()
        
        # Get previous close data
        prev_close = _polygon_client.get_previous_close_agg(ticker)
        
        if not prev_close or len(prev_close) == 0:
            logger.warning(f"No previous close data found for {ticker}")
            return None
        
        agg = prev_close[0]  # Get first result
        
        # Convert timestamp to date string
        date_str = datetime.fromtimestamp(agg.timestamp / 1000).strftime('%Y-%m-%d')
        
        price = Price(
            ticker=ticker,
            date=date_str,
            open=float(agg.open),
            high=float(agg.high),
            low=float(agg.low),
            close=float(agg.close),
            volume=int(agg.volume),
            adj_close=float(agg.close)
        )
        
        # Cache the result
        _cache.set_prices(cache_key, [price.model_dump()])
        logger.info(f"Cached polygon_latest for: {cache_key}")
        return price
        
    except Exception as e:
        logger.error(f"Error fetching latest price for {ticker}: {e}")
        return None


# Placeholder functions for future phases
# These will be implemented in subsequent phases

def get_financial_metrics_polygon(
    ticker: str,
    end_date: str,
    period: str = "ttm",
    limit: int = 10,
) -> List[FinancialMetrics]:
    """
    Fetch financial metrics from Polygon.io with caching.
    
    Args:
        ticker: Stock ticker symbol
        end_date: End date for the query
        period: Period type ('ttm' or 'annual')
        limit: Maximum number of periods to return
    
    Returns:
        List of FinancialMetrics objects
    """
    cache_key = f"polygon_metrics_{ticker}_{end_date}_{period}_{limit}"
    
    # Check cache first
    if cached_data := _cache.get_financial_metrics(cache_key):
        logger.info(f"Cache HIT for polygon_financial_metrics: {cache_key}")
        return [FinancialMetrics(**metrics) for metrics in cached_data]

    logger.info(f"Cache MISS for polygon_financial_metrics: {cache_key}")
    
    try:
        _rate_limit()
        
        # Convert period to Polygon timeframe
        timeframe = "annual" if period == "annual" else "quarterly"
        
        # Get financials using the REST API directly due to potential client issues
        import requests
        
        url = f"https://api.polygon.io/vX/reference/financials"
        params = {
            "ticker": ticker,
            "timeframe": timeframe,
            "limit": limit,
            "period_of_report_date.lte": end_date,
            "order": "desc",
            "sort": "period_of_report_date",
            "apikey": POLYGON_API_KEY
        }
        
        response = requests.get(url, params=params)
        if response.status_code != 200:
            logger.error(f"Polygon financials API error: {response.status_code} - {response.text}")
            return []
        
        financials_response = response.json()
        
        metrics_list = []
        
        if financials_response.get('results'):
            for financial_data in financials_response['results']:
                # Extract financial data
                financials = financial_data.get('financials', {})
                income_statement = financials.get('income_statement', {})
                balance_sheet = financials.get('balance_sheet', {})
                cash_flow = financials.get('cash_flow_statement', {})
                
                # Calculate basic metrics from financial data
                metrics = FinancialMetrics(
                    ticker=ticker,
                    report_period=financial_data.get('end_date', end_date),
                    period=period,
                    currency="USD",  # Polygon typically returns USD
                    
                    # Core metrics
                    market_cap=get_market_cap_polygon(ticker, financial_data.get('end_date', end_date)),
                    enterprise_value=None,
                    
                    # Valuation ratios
                    price_to_earnings_ratio=None,
                    price_to_book_ratio=None,
                    price_to_sales_ratio=None,
                    enterprise_value_to_ebitda_ratio=None,
                    enterprise_value_to_revenue_ratio=None,
                    free_cash_flow_yield=None,
                    peg_ratio=None,
                    
                    # Profitability metrics
                    gross_margin=None,
                    operating_margin=None,
                    net_margin=None,
                    
                    # Return metrics
                    return_on_equity=None,
                    return_on_assets=None,
                    return_on_invested_capital=None,
                    
                    # Efficiency metrics
                    asset_turnover=None,
                    inventory_turnover=None,
                    receivables_turnover=None,
                    days_sales_outstanding=None,
                    operating_cycle=None,
                    working_capital_turnover=None,
                    
                    # Liquidity ratios
                    current_ratio=None,
                    quick_ratio=None,
                    cash_ratio=None,
                    operating_cash_flow_ratio=None,
                    
                    # Leverage ratios
                    debt_to_equity=None,
                    debt_to_assets=None,
                    interest_coverage=None,
                    
                    # Growth metrics
                    revenue_growth=None,
                    earnings_growth=None,
                    book_value_growth=None,
                    earnings_per_share_growth=None,
                    free_cash_flow_growth=None,
                    operating_income_growth=None,
                    ebitda_growth=None,
                    
                    # Distribution metrics
                    payout_ratio=None,
                    
                    # Per-share metrics
                    earnings_per_share=income_statement.get('basic_earnings_per_share', {}).get('value') if isinstance(income_statement.get('basic_earnings_per_share'), dict) else income_statement.get('basic_earnings_per_share'),
                    book_value_per_share=None,
                    free_cash_flow_per_share=None,
                )
                
                metrics_list.append(metrics)
        
        # Cache the results
        _cache.set_financial_metrics(cache_key, [m.model_dump() for m in metrics_list])
        logger.info(f"Cached polygon_financial_metrics for: {cache_key}, got {len(metrics_list)} metrics")
        return metrics_list
        
    except Exception as e:
        logger.error(f"Error fetching Polygon.io financial metrics for {ticker}: {e}")
        return []


def get_market_cap_polygon(ticker: str, end_date: str) -> Optional[float]:
    """
    Get market capitalization for a ticker using Polygon.io data.
    
    Args:
        ticker: Stock ticker symbol
        end_date: Date for the query
    
    Returns:
        Market cap as float or None
    """
    cache_key = f"polygon_market_cap_{ticker}_{end_date}"
    
    # Check cache first
    if cached_data := _cache.get_prices(cache_key):
        logger.info(f"Cache HIT for polygon_market_cap: {cache_key}")
        return cached_data[0] if cached_data else None

    logger.info(f"Cache MISS for polygon_market_cap: {cache_key}")
    
    try:
        _rate_limit()
        
        # Get ticker details using REST API directly
        import requests
        
        url = f"https://api.polygon.io/v3/reference/tickers/{ticker}"
        params = {"apikey": POLYGON_API_KEY}
        
        response = requests.get(url, params=params)
        if response.status_code != 200:
            logger.error(f"Polygon ticker details API error: {response.status_code} - {response.text}")
            return None
        
        ticker_data = response.json()
        
        if ticker_data.get('results'):
            market_cap = ticker_data['results'].get('market_cap')
            if market_cap:
                # Cache the result
                _cache.set_prices(cache_key, [market_cap])
                logger.info(f"Cached polygon_market_cap for: {cache_key}")
                return float(market_cap)
        
        return None
        
    except Exception as e:
        logger.error(f"Error fetching market cap for {ticker}: {e}")
        return None


def search_line_items_polygon(
    ticker: str,
    line_items: List[str],
    end_date: str,
    period: str = "ttm",
    limit: int = 10,
) -> List[LineItem]:
    """
    Search for specific line items in financial statements using Polygon.io data.
    
    Args:
        ticker: Stock ticker symbol
        line_items: List of line item names to search for
        end_date: End date for the query
        period: Period type ('ttm' or 'annual')
        limit: Maximum number of periods to return
    
    Returns:
        List of LineItem objects
    """
    cache_key = f"polygon_line_items_{ticker}_{end_date}_{period}_{limit}"
    
    # Check cache first
    if cached_data := _cache.get_line_items(cache_key):
        logger.info(f"Cache HIT for polygon_line_items: {cache_key}")
        all_line_items = [LineItem(**item) for item in cached_data]
        return _filter_line_items_polygon(all_line_items, line_items)

    logger.info(f"Cache MISS for polygon_line_items: {cache_key}")
    
    try:
        _rate_limit()
        
        # Convert period to Polygon timeframe
        timeframe = "annual" if period == "annual" else "quarterly"
        
        # Get financials using REST API directly
        import requests
        
        url = f"https://api.polygon.io/vX/reference/financials"
        params = {
            "ticker": ticker,
            "timeframe": timeframe,
            "limit": limit,
            "period_of_report_date.lte": end_date,
            "order": "desc",
            "sort": "period_of_report_date",
            "include_sources": "false",  # Don't need XBRL source details for performance
            "apikey": POLYGON_API_KEY
        }
        
        response = requests.get(url, params=params)
        if response.status_code != 200:
            logger.error(f"Polygon financials API error: {response.status_code} - {response.text}")
            return []
        
        financials_response = response.json()
        
        line_items_list = []
        
        if financials_response.get('results'):
            for financial_data in financials_response['results']:
                # Extract financial statements
                financials = financial_data.get('financials', {})
                income_statement = financials.get('income_statement', {})
                balance_sheet = financials.get('balance_sheet', {})
                cash_flow = financials.get('cash_flow_statement', {})
                
                # Create LineItem with extracted data
                line_item_data = {
                    'ticker': ticker,
                    'report_period': financial_data.get('end_date', end_date),
                    'period': period,
                    'currency': 'USD'  # Polygon typically returns USD
                }
                
                # Extract all line items from Polygon financial statements
                line_item_data.update(_extract_polygon_line_items(
                    income_statement, balance_sheet, cash_flow
                ))
                
                line_item = LineItem(**line_item_data)
                line_items_list.append(line_item)
        
        # Cache the results
        _cache.set_line_items(cache_key, [item.model_dump() for item in line_items_list])
        logger.info(f"Cached polygon_line_items for: {cache_key}, got {len(line_items_list)} periods")
        
        return _filter_line_items_polygon(line_items_list, line_items)
        
    except Exception as e:
        logger.error(f"Error fetching Polygon.io line items for {ticker}: {e}")
        return []


def get_company_news_polygon(
    ticker: str,
    end_date: str,
    start_date: Optional[str] = None,
    limit: int = 1000,
) -> List[CompanyNews]:
    """
    Fetch company news from Polygon.io using their News API.
    
    Args:
        ticker: Stock ticker symbol
        end_date: End date for news query
        start_date: Start date for news query (optional)
        limit: Maximum number of news items to return
    
    Returns:
        List of CompanyNews objects
    """
    cache_key = f"polygon_news_{ticker}_{start_date}_{end_date}_{limit}"
    
    # Check cache first
    if cached_data := _cache.get_company_news(cache_key):
        logger.info(f"Cache HIT for polygon_company_news: {cache_key}")
        return [CompanyNews(**news) for news in cached_data]

    logger.info(f"Cache MISS for polygon_company_news: {cache_key}")
    
    try:
        _rate_limit()
        
        # Get news using REST API directly
        import requests
        from datetime import datetime
        
        url = f"https://api.polygon.io/v2/reference/news"
        
        # Build parameters
        params = {
            "ticker": ticker,
            "limit": min(limit, 1000),  # Polygon.io limits to 1000 per request
            "order": "desc",
            "sort": "published_utc",
            "apikey": POLYGON_API_KEY
        }
        
        # Add date filters if provided
        if end_date:
            # Convert end_date to datetime and add time component for API
            end_datetime = f"{end_date}T23:59:59.999Z"
            params["published_utc.lte"] = end_datetime
        
        if start_date:
            # Convert start_date to datetime and add time component for API
            start_datetime = f"{start_date}T00:00:00.000Z"
            params["published_utc.gte"] = start_datetime
        
        response = requests.get(url, params=params)
        if response.status_code != 200:
            logger.error(f"Polygon news API error: {response.status_code} - {response.text}")
            return []
        
        news_response = response.json()
        
        news_list = []
        
        if news_response.get('results'):
            for news_item in news_response['results']:
                # Parse the published date
                published_utc = news_item.get('published_utc', '')
                try:
                    # Convert ISO format to date string
                    if published_utc:
                        news_date = datetime.fromisoformat(published_utc.replace('Z', '+00:00')).strftime('%Y-%m-%d')
                    else:
                        news_date = end_date  # Fallback
                except:
                    news_date = end_date  # Fallback on parsing error
                
                # Additional date filtering (Polygon API sometimes returns outside range)
                if start_date and news_date < start_date:
                    continue
                if news_date > end_date:
                    continue
                
                # Extract news data
                news = CompanyNews(
                    ticker=ticker,
                    date=news_date,
                    title=news_item.get('title', ''),
                    content=news_item.get('description', ''),
                    url=news_item.get('article_url', ''),
                    source=news_item.get('publisher', {}).get('name', '') if news_item.get('publisher') else ''
                )
                news_list.append(news)
        
        # Cache the results
        _cache.set_company_news(cache_key, [n.model_dump() for n in news_list])
        logger.info(f"Cached polygon_company_news for: {cache_key}, got {len(news_list)} articles")
        
        return news_list
        
    except Exception as e:
        logger.error(f"Error fetching Polygon.io company news for {ticker}: {e}")
        return []


def get_insider_trades_polygon(
    ticker: str,
    end_date: str,
    start_date: Optional[str] = None,
    limit: int = 1000,
) -> List[InsiderTrade]:
    """
    Fetch insider trading data from Polygon.io.
    
    Note: Polygon.io does not currently provide insider trading data through their API.
    This function is implemented for interface compatibility with other adapters,
    but will always return an empty list.
    
    Args:
        ticker: Stock ticker symbol
        end_date: End date for trades query
        start_date: Start date for trades query (optional)
        limit: Maximum number of trades to return
    
    Returns:
        List of InsiderTrade objects (empty list - not supported by Polygon.io)
    """
    # Polygon.io does not provide insider trading data
    # Returning empty list for interface compatibility
    logger.info(f"Insider trades requested for {ticker}, but Polygon.io does not provide this data type")
    return []


# Utility functions

def is_polygon_available() -> bool:
    """Check if Polygon.io API is available and configured properly."""
    try:
        return POLYGON_API_KEY is not None and len(POLYGON_API_KEY) > 0
    except:
        return False


def get_polygon_api_status() -> Dict[str, Any]:
    """Get Polygon.io API status and configuration info."""
    return {
        "api_available": is_polygon_available(),
        "api_key_configured": POLYGON_API_KEY is not None,
        "rate_limit_per_minute": RATE_LIMIT_PER_MINUTE,
        "current_tokens": _rate_limiter_tokens,
        "client_configured": _polygon_client is not None,
    }


def _get_financial_value(financial_data: Dict, key: str) -> Optional[float]:
    """Safely extract a financial value from a dictionary."""
    try:
        if not financial_data or key not in financial_data:
            return None
        
        value = financial_data[key]
        if value is None:
            return None
        
        # Handle different value formats
        if isinstance(value, dict):
            # Sometimes Polygon returns nested structure with 'value' key
            if 'value' in value:
                return float(value['value'])
            else:
                return None
        
        # Convert to float, handling None and empty values
        return float(value) if value is not None else None
    except (ValueError, TypeError, KeyError):
        return None


def _extract_polygon_line_items(income_statement: Dict, balance_sheet: Dict, cash_flow: Dict) -> Dict[str, Any]:
    """Extract line items from Polygon financial statement data."""
    line_items = {}
    
    # Income Statement items
    if income_statement:
        line_items.update({
            'revenues': _get_financial_value(income_statement, 'revenues'),
            'revenue': _get_financial_value(income_statement, 'revenues'),  # Alternative name
            'gross_profit': _get_financial_value(income_statement, 'gross_profit'),
            'operating_expenses': _get_financial_value(income_statement, 'operating_expenses'),
            'operating_income': _get_financial_value(income_statement, 'operating_income_loss'),
            'operating_income_loss': _get_financial_value(income_statement, 'operating_income_loss'),
            'net_income': _get_financial_value(income_statement, 'net_income_loss'),
            'net_income_loss': _get_financial_value(income_statement, 'net_income_loss'),
            'earnings_per_share': _get_financial_value(income_statement, 'basic_earnings_per_share'),
            'basic_earnings_per_share': _get_financial_value(income_statement, 'basic_earnings_per_share'),
            'diluted_earnings_per_share': _get_financial_value(income_statement, 'diluted_earnings_per_share'),
            'interest_expense': _get_financial_value(income_statement, 'interest_expense'),
            'income_tax_expense': _get_financial_value(income_statement, 'income_tax_expense_benefit'),
            'research_and_development_expenses': _get_financial_value(income_statement, 'research_and_development_expenses'),
            'research_and_development': _get_financial_value(income_statement, 'research_and_development_expenses'),  # Alternative name
            'selling_general_and_administrative_expenses': _get_financial_value(income_statement, 'selling_general_and_administrative_expenses'),
            'operating_expenses': _get_financial_value(income_statement, 'operating_expenses'),
            'operating_expense': _get_financial_value(income_statement, 'operating_expenses'),  # Alternative name
        })
    
    # Balance Sheet items
    if balance_sheet:
        line_items.update({
            'assets': _get_financial_value(balance_sheet, 'assets'),
            'total_assets': _get_financial_value(balance_sheet, 'assets'),
            'current_assets': _get_financial_value(balance_sheet, 'current_assets'),
            'noncurrent_assets': _get_financial_value(balance_sheet, 'noncurrent_assets'),
            'liabilities': _get_financial_value(balance_sheet, 'liabilities'),
            'total_liabilities': _get_financial_value(balance_sheet, 'liabilities'),
            'current_liabilities': _get_financial_value(balance_sheet, 'current_liabilities'),
            'noncurrent_liabilities': _get_financial_value(balance_sheet, 'noncurrent_liabilities'),
            'stockholders_equity': _get_financial_value(balance_sheet, 'equity'),
            'equity': _get_financial_value(balance_sheet, 'equity'),
            'retained_earnings': _get_financial_value(balance_sheet, 'retained_earnings_accumulated_deficit'),
            'cash_and_cash_equivalents': _get_financial_value(balance_sheet, 'cash_and_cash_equivalents_at_carrying_value'),
            'inventory': _get_financial_value(balance_sheet, 'inventory_net'),
            'accounts_receivable': _get_financial_value(balance_sheet, 'accounts_receivable_net_current'),
            'property_plant_equipment_net': _get_financial_value(balance_sheet, 'property_plant_and_equipment_net'),
            'goodwill': _get_financial_value(balance_sheet, 'goodwill'),
            'intangible_assets': _get_financial_value(balance_sheet, 'intangible_assets_net_excluding_goodwill'),
            'accounts_payable': _get_financial_value(balance_sheet, 'accounts_payable_current'),
            'long_term_debt': _get_financial_value(balance_sheet, 'long_term_debt_noncurrent'),
            'short_term_debt': _get_financial_value(balance_sheet, 'short_term_borrowings'),
            'common_stock_shares_outstanding': _get_financial_value(balance_sheet, 'common_stock_shares_outstanding'),
            'outstanding_shares': _get_financial_value(balance_sheet, 'common_stock_shares_outstanding'),  # Alternative name
            'shareholders_equity': _get_financial_value(balance_sheet, 'equity'),  # Alternative name
            'cash_and_equivalents': _get_financial_value(balance_sheet, 'cash_and_cash_equivalents_at_carrying_value'),  # Alternative name
            'goodwill_and_intangible_assets': (_get_financial_value(balance_sheet, 'goodwill') or 0) + (_get_financial_value(balance_sheet, 'intangible_assets_net_excluding_goodwill') or 0) if _get_financial_value(balance_sheet, 'goodwill') is not None or _get_financial_value(balance_sheet, 'intangible_assets_net_excluding_goodwill') is not None else None,
        })
    
    # Cash Flow Statement items
    if cash_flow:
        line_items.update({
            'net_cash_flow_from_operating_activities': _get_financial_value(cash_flow, 'net_cash_flow_from_operating_activities'),
            'operating_cash_flow': _get_financial_value(cash_flow, 'net_cash_flow_from_operating_activities'),
            'net_cash_flow_from_investing_activities': _get_financial_value(cash_flow, 'net_cash_flow_from_investing_activities'),
            'investing_cash_flow': _get_financial_value(cash_flow, 'net_cash_flow_from_investing_activities'),
            'net_cash_flow_from_financing_activities': _get_financial_value(cash_flow, 'net_cash_flow_from_financing_activities'),
            'financing_cash_flow': _get_financial_value(cash_flow, 'net_cash_flow_from_financing_activities'),
            'capital_expenditures': _get_financial_value(cash_flow, 'payments_to_acquire_property_plant_and_equipment'),
            'depreciation_and_amortization': _get_financial_value(cash_flow, 'depreciation_depletion_and_amortization'),
            'dividends_paid': _get_financial_value(cash_flow, 'payments_of_ordinary_dividends'),
            'stock_repurchases': _get_financial_value(cash_flow, 'payments_for_repurchase_of_common_stock'),
            'proceeds_from_issuance_of_common_stock': _get_financial_value(cash_flow, 'proceeds_from_issuance_of_common_stock'),
        })
    
    # Calculate derived metrics
    try:
        # Free Cash Flow
        operating_cf = line_items.get('net_cash_flow_from_operating_activities')
        capex = line_items.get('capital_expenditures') or 0
        if operating_cf is not None:
            line_items['free_cash_flow'] = operating_cf - abs(capex)  # CapEx is usually negative
        
        # Working Capital
        current_assets = line_items.get('current_assets')
        current_liabilities = line_items.get('current_liabilities')
        if current_assets is not None and current_liabilities is not None:
            line_items['working_capital'] = current_assets - current_liabilities
        
        # Total Debt
        long_term_debt = line_items.get('long_term_debt') or 0
        short_term_debt = line_items.get('short_term_debt') or 0
        line_items['total_debt'] = long_term_debt + short_term_debt
        
        # Operating Margin (Operating Income / Revenue)
        operating_income = line_items.get('operating_income') or line_items.get('operating_income_loss')
        revenue = line_items.get('revenues') or line_items.get('revenue')
        if operating_income is not None and revenue is not None and revenue != 0:
            line_items['operating_margin'] = operating_income / revenue
        
        # Gross Margin (Gross Profit / Revenue)  
        gross_profit = line_items.get('gross_profit')
        if gross_profit is not None and revenue is not None and revenue != 0:
            line_items['gross_margin'] = gross_profit / revenue
        
        # Net Margin (Net Income / Revenue)
        net_income = line_items.get('net_income') or line_items.get('net_income_loss')
        if net_income is not None and revenue is not None and revenue != 0:
            line_items['net_margin'] = net_income / revenue
        
        # Capital Expenditure (make positive for consistency)
        if line_items.get('capital_expenditures') is not None:
            line_items['capital_expenditure'] = abs(line_items['capital_expenditures'])
        
        # Dividends and distributions
        if line_items.get('dividends_paid') is not None:
            line_items['dividends_and_other_cash_distributions'] = abs(line_items['dividends_paid'])
        
        # Debt to Equity ratio
        total_debt = line_items.get('total_debt')
        equity = line_items.get('equity') or line_items.get('stockholders_equity')
        if total_debt is not None and equity is not None and equity != 0:
            line_items['debt_to_equity'] = total_debt / equity
        
        # Return on Invested Capital (ROIC) - simplified calculation
        # ROIC ≈ NOPAT / Invested Capital
        # NOPAT ≈ Operating Income * (1 - Tax Rate)
        # Invested Capital ≈ Total Debt + Equity
        operating_income = line_items.get('operating_income') or line_items.get('operating_income_loss')
        if operating_income is not None and equity is not None and total_debt is not None:
            # Estimate tax rate from income statement if available
            net_income = line_items.get('net_income') or line_items.get('net_income_loss')
            income_tax_expense = line_items.get('income_tax_expense')
            
            if net_income is not None and income_tax_expense is not None and (net_income + income_tax_expense) != 0:
                tax_rate = income_tax_expense / (net_income + income_tax_expense)
            else:
                tax_rate = 0.25  # Default estimated corporate tax rate
            
            nopat = operating_income * (1 - tax_rate)
            invested_capital = total_debt + equity
            if invested_capital != 0:
                line_items['return_on_invested_capital'] = nopat / invested_capital
        
    except (ValueError, TypeError):
        pass  # Skip derived calculations if data is missing
    
    # Remove None values
    return {k: v for k, v in line_items.items() if v is not None}


def _filter_line_items_polygon(all_line_items: List[LineItem], requested_items: List[str]) -> List[LineItem]:
    """Filter line items to return only requested items."""
    if not requested_items:
        return all_line_items
    
    # Convert requested items to lowercase for case-insensitive matching
    requested_lower = [item.lower() for item in requested_items]
    
    filtered_items = []
    for line_item in all_line_items:
        # Create a new line item with only the requested fields
        item_dict = line_item.model_dump()
        filtered_dict = {
            'ticker': item_dict['ticker'],
            'report_period': item_dict['report_period'],
            'period': item_dict['period'],
            'currency': item_dict['currency']
        }
        
        # Add requested fields if they exist
        for field_name, field_value in item_dict.items():
            if field_name.lower() in requested_lower and field_value is not None:
                filtered_dict[field_name] = field_value
        
        # Only include this line item if it has at least one requested field
        has_requested_data = any(
            field_name.lower() in requested_lower 
            for field_name in item_dict.keys() 
            if item_dict[field_name] is not None and field_name not in ['ticker', 'report_period', 'period', 'currency']
        )
        
        if has_requested_data:
            filtered_items.append(LineItem(**filtered_dict))
    
    return filtered_items


def _safe_float(value: Any) -> Optional[float]:
    """Safely convert a value to float."""
    try:
        if value is None:
            return None
        return float(value)
    except (ValueError, TypeError):
        return None


def _map_transaction_type(code: Optional[str]) -> str:
    """Map Polygon transaction codes to readable transaction types."""
    if not code:
        return "Unknown"
    
    # Polygon.io transaction codes mapping
    transaction_mapping = {
        "A": "Grant",
        "C": "Conversion", 
        "D": "Disposition (Sale)",
        "F": "Payment of Exercise Price or Tax Liability",
        "G": "Gift",
        "H": "Exercise of Derivative",
        "I": "Discretionary Transaction",
        "J": "Other",
        "K": "Transaction in Equity Swap",
        "L": "Small Acquisition",
        "M": "Exercise/Conversion of Derivative Security",
        "O": "Exercise of Out-of-the-Money Derivative",
        "P": "Purchase", 
        "S": "Sale",
        "U": "Tender of Shares",
        "W": "Acquisition/Disposition by Will or Laws of Descent",
        "X": "Exercise of In-the-Money or At-the-Money Derivative",
        "Z": "Deposit/Withdrawal of Shares"
    }
    
    return transaction_mapping.get(code.upper(), f"Code {code}") 