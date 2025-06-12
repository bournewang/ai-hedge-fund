"""Hybrid API Module

This module provides a seamless transition layer between Financial Datasets API and Yahoo Finance.
It allows switching data sources via environment variable and provides fallback mechanisms.

Features:
- Environment variable controlled source switching
- Automatic fallback between data sources
- Performance monitoring and comparison
- Gradual migration support
- Full compatibility with existing codebase
"""

import os
import logging
import time
from typing import List, Optional, Union

from src.data.models import (
    CompanyNews,
    FinancialMetrics,
    Price,
    LineItem,
    InsiderTrade,
)

# Import both API modules
try:
    from src.tools.api import (
        get_prices as get_prices_fd,
        get_financial_metrics as get_financial_metrics_fd,
        search_line_items as search_line_items_fd,
        get_market_cap as get_market_cap_fd,
        get_company_news as get_company_news_fd,
        get_insider_trades as get_insider_trades_fd,
    )
    FINANCIAL_DATASETS_AVAILABLE = True
except ImportError:
    FINANCIAL_DATASETS_AVAILABLE = False

try:
    from src.tools.yahoo_finance_data import (
        get_prices_yahoo,
        get_financial_metrics_yahoo,
        search_line_items_yahoo,
        get_market_cap_yahoo,
        get_company_news_yahoo,
        get_insider_trades_yahoo,
    )
    YAHOO_FINANCE_AVAILABLE = True
except ImportError:
    YAHOO_FINANCE_AVAILABLE = False

# Set up logging
logger = logging.getLogger(__name__)

# Configuration
DEFAULT_DATA_SOURCE = "yahoo"  # Default to Yahoo Finance for cost savings
USE_FALLBACK = True  # Enable automatic fallback
LOG_PERFORMANCE = True  # Log performance comparisons

def get_data_source() -> str:
    """Get the current data source from environment variable."""
    return os.environ.get("DATA_SOURCE", DEFAULT_DATA_SOURCE).lower()

def should_use_yahoo() -> bool:
    """Determine if we should use Yahoo Finance as primary source."""
    source = get_data_source()
    return source in ["yahoo", "yfinance", "free"]

def should_use_financial_datasets() -> bool:
    """Determine if we should use Financial Datasets API as primary source."""
    source = get_data_source()
    return source in ["financial_datasets", "fd", "premium"]

def log_performance(func_name: str, source: str, duration: float, success: bool, data_count: int = 0):
    """Log performance metrics for data source comparisons."""
    if LOG_PERFORMANCE:
        status = "SUCCESS" if success else "FAILED"
        logger.info(f"PERFORMANCE: {func_name} via {source} - {status} in {duration:.3f}s ({data_count} items)")


def get_prices(ticker: str, start_date: str, end_date: str) -> List[Price]:
    """Fetch price data with automatic source selection and fallback."""
    primary_source = "yahoo" if should_use_yahoo() else "financial_datasets"
    
    # Try primary source
    if primary_source == "yahoo" and YAHOO_FINANCE_AVAILABLE:
        start_time = time.time()
        try:
            result = get_prices_yahoo(ticker, start_date, end_date)
            duration = time.time() - start_time
            log_performance("get_prices", "yahoo", duration, True, len(result))
            return result
        except Exception as e:
            duration = time.time() - start_time
            log_performance("get_prices", "yahoo", duration, False)
            logger.warning(f"Yahoo Finance prices failed for {ticker}: {e}")
            
            # Fallback to Financial Datasets if enabled
            if USE_FALLBACK and FINANCIAL_DATASETS_AVAILABLE:
                logger.info(f"Falling back to Financial Datasets API for prices: {ticker}")
                start_time = time.time()
                try:
                    result = get_prices_fd(ticker, start_date, end_date)
                    duration = time.time() - start_time
                    log_performance("get_prices", "financial_datasets", duration, True, len(result))
                    return result
                except Exception as e2:
                    duration = time.time() - start_time
                    log_performance("get_prices", "financial_datasets", duration, False)
                    logger.error(f"Both APIs failed for prices {ticker}: Yahoo={e}, FD={e2}")
            
    elif primary_source == "financial_datasets" and FINANCIAL_DATASETS_AVAILABLE:
        start_time = time.time()
        try:
            result = get_prices_fd(ticker, start_date, end_date)
            duration = time.time() - start_time
            log_performance("get_prices", "financial_datasets", duration, True, len(result))
            return result
        except Exception as e:
            duration = time.time() - start_time
            log_performance("get_prices", "financial_datasets", duration, False)
            logger.warning(f"Financial Datasets prices failed for {ticker}: {e}")
            
            # Fallback to Yahoo Finance if enabled
            if USE_FALLBACK and YAHOO_FINANCE_AVAILABLE:
                logger.info(f"Falling back to Yahoo Finance for prices: {ticker}")
                start_time = time.time()
                try:
                    result = get_prices_yahoo(ticker, start_date, end_date)
                    duration = time.time() - start_time
                    log_performance("get_prices", "yahoo", duration, True, len(result))
                    return result
                except Exception as e2:
                    duration = time.time() - start_time
                    log_performance("get_prices", "yahoo", duration, False)
                    logger.error(f"Both APIs failed for prices {ticker}: FD={e}, Yahoo={e2}")
    
    return []


def get_financial_metrics(
    ticker: str,
    end_date: str,
    period: str = "ttm",
    limit: int = 10,
) -> List[FinancialMetrics]:
    """Fetch financial metrics with automatic source selection and fallback."""
    primary_source = "yahoo" if should_use_yahoo() else "financial_datasets"
    
    # Try primary source
    if primary_source == "yahoo" and YAHOO_FINANCE_AVAILABLE:
        start_time = time.time()
        try:
            result = get_financial_metrics_yahoo(ticker, end_date, period, limit)
            duration = time.time() - start_time
            
            # Check if we got meaningful results or if it's likely rate limited
            if result and len(result) > 0:
                log_performance("get_financial_metrics", "yahoo", duration, True, len(result))
                return result
            else:
                # Empty result might indicate rate limiting - try fallback
                log_performance("get_financial_metrics", "yahoo", duration, False, 0)
                logger.warning(f"Yahoo Finance returned empty results for {ticker} - likely rate limited")
                
                # Fallback to Financial Datasets if enabled
                if USE_FALLBACK and FINANCIAL_DATASETS_AVAILABLE:
                    logger.info(f"Falling back to Financial Datasets API for metrics: {ticker}")
                    start_time = time.time()
                    try:
                        result = get_financial_metrics_fd(ticker, end_date, period, limit)
                        duration = time.time() - start_time
                        log_performance("get_financial_metrics", "financial_datasets", duration, True, len(result))
                        return result
                    except Exception as e2:
                        duration = time.time() - start_time
                        log_performance("get_financial_metrics", "financial_datasets", duration, False)
                        logger.error(f"Financial Datasets API also failed for metrics {ticker}: {e2}")
                
                return []
                
        except Exception as e:
            duration = time.time() - start_time
            log_performance("get_financial_metrics", "yahoo", duration, False)
            logger.warning(f"Yahoo Finance metrics failed for {ticker}: {e}")
            
            # Fallback to Financial Datasets if enabled
            if USE_FALLBACK and FINANCIAL_DATASETS_AVAILABLE:
                logger.info(f"Falling back to Financial Datasets API for metrics: {ticker}")
                start_time = time.time()
                try:
                    result = get_financial_metrics_fd(ticker, end_date, period, limit)
                    duration = time.time() - start_time
                    log_performance("get_financial_metrics", "financial_datasets", duration, True, len(result))
                    return result
                except Exception as e2:
                    duration = time.time() - start_time
                    log_performance("get_financial_metrics", "financial_datasets", duration, False)
                    logger.error(f"Both APIs failed for metrics {ticker}: Yahoo={e}, FD={e2}")
            
    elif primary_source == "financial_datasets" and FINANCIAL_DATASETS_AVAILABLE:
        start_time = time.time()
        try:
            result = get_financial_metrics_fd(ticker, end_date, period, limit)
            duration = time.time() - start_time
            log_performance("get_financial_metrics", "financial_datasets", duration, True, len(result))
            return result
        except Exception as e:
            duration = time.time() - start_time
            log_performance("get_financial_metrics", "financial_datasets", duration, False)
            logger.warning(f"Financial Datasets metrics failed for {ticker}: {e}")
            
            # Fallback to Yahoo Finance if enabled
            if USE_FALLBACK and YAHOO_FINANCE_AVAILABLE:
                logger.info(f"Falling back to Yahoo Finance for metrics: {ticker}")
                start_time = time.time()
                try:
                    result = get_financial_metrics_yahoo(ticker, end_date, period, limit)
                    duration = time.time() - start_time
                    log_performance("get_financial_metrics", "yahoo", duration, True, len(result))
                    return result
                except Exception as e2:
                    duration = time.time() - start_time
                    log_performance("get_financial_metrics", "yahoo", duration, False)
                    logger.error(f"Both APIs failed for metrics {ticker}: FD={e}, Yahoo={e2}")
    
    return []


def search_line_items(
    ticker: str,
    line_items: List[str],
    end_date: str,
    period: str = "ttm",
    limit: int = 10,
) -> List[LineItem]:
    """Fetch line items with automatic source selection and fallback."""
    primary_source = "yahoo" if should_use_yahoo() else "financial_datasets"
    
    # Try primary source
    if primary_source == "yahoo" and YAHOO_FINANCE_AVAILABLE:
        start_time = time.time()
        try:
            result = search_line_items_yahoo(ticker, line_items, end_date, period, limit)
            duration = time.time() - start_time
            log_performance("search_line_items", "yahoo", duration, True, len(result))
            return result
        except Exception as e:
            duration = time.time() - start_time
            log_performance("search_line_items", "yahoo", duration, False)
            logger.warning(f"Yahoo Finance line items failed for {ticker}: {e}")
            
            # Fallback to Financial Datasets if enabled
            if USE_FALLBACK and FINANCIAL_DATASETS_AVAILABLE:
                logger.info(f"Falling back to Financial Datasets API for line items: {ticker}")
                start_time = time.time()
                try:
                    result = search_line_items_fd(ticker, line_items, end_date, period, limit)
                    duration = time.time() - start_time
                    log_performance("search_line_items", "financial_datasets", duration, True, len(result))
                    return result
                except Exception as e2:
                    duration = time.time() - start_time
                    log_performance("search_line_items", "financial_datasets", duration, False)
                    logger.error(f"Both APIs failed for line items {ticker}: Yahoo={e}, FD={e2}")
            
    elif primary_source == "financial_datasets" and FINANCIAL_DATASETS_AVAILABLE:
        start_time = time.time()
        try:
            result = search_line_items_fd(ticker, line_items, end_date, period, limit)
            duration = time.time() - start_time
            log_performance("search_line_items", "financial_datasets", duration, True, len(result))
            return result
        except Exception as e:
            duration = time.time() - start_time
            log_performance("search_line_items", "financial_datasets", duration, False)
            logger.warning(f"Financial Datasets line items failed for {ticker}: {e}")
            
            # Fallback to Yahoo Finance if enabled
            if USE_FALLBACK and YAHOO_FINANCE_AVAILABLE:
                logger.info(f"Falling back to Yahoo Finance for line items: {ticker}")
                start_time = time.time()
                try:
                    result = search_line_items_yahoo(ticker, line_items, end_date, period, limit)
                    duration = time.time() - start_time
                    log_performance("search_line_items", "yahoo", duration, True, len(result))
                    return result
                except Exception as e2:
                    duration = time.time() - start_time
                    log_performance("search_line_items", "yahoo", duration, False)
                    logger.error(f"Both APIs failed for line items {ticker}: FD={e}, Yahoo={e2}")
    
    return []


def get_market_cap(ticker: str, end_date: str) -> Optional[float]:
    """Fetch market cap with automatic source selection and fallback."""
    primary_source = "yahoo" if should_use_yahoo() else "financial_datasets"
    
    # Try primary source
    if primary_source == "yahoo" and YAHOO_FINANCE_AVAILABLE:
        start_time = time.time()
        try:
            result = get_market_cap_yahoo(ticker, end_date)
            duration = time.time() - start_time
            
            # Check if we got a valid result
            if result is not None:
                log_performance("get_market_cap", "yahoo", duration, True)
                return result
            else:
                # No result might indicate rate limiting - try fallback
                log_performance("get_market_cap", "yahoo", duration, False)
                logger.warning(f"Yahoo Finance returned no market cap for {ticker} - likely rate limited")
                
                # Fallback to Financial Datasets if enabled
                if USE_FALLBACK and FINANCIAL_DATASETS_AVAILABLE:
                    logger.info(f"Falling back to Financial Datasets API for market cap: {ticker}")
                    start_time = time.time()
                    try:
                        result = get_market_cap_fd(ticker, end_date)
                        duration = time.time() - start_time
                        log_performance("get_market_cap", "financial_datasets", duration, result is not None)
                        return result
                    except Exception as e2:
                        duration = time.time() - start_time
                        log_performance("get_market_cap", "financial_datasets", duration, False)
                        logger.error(f"Financial Datasets API also failed for market cap {ticker}: {e2}")
                
                return None
                
        except Exception as e:
            duration = time.time() - start_time
            log_performance("get_market_cap", "yahoo", duration, False)
            logger.warning(f"Yahoo Finance market cap failed for {ticker}: {e}")
            
            # Fallback to Financial Datasets if enabled
            if USE_FALLBACK and FINANCIAL_DATASETS_AVAILABLE:
                logger.info(f"Falling back to Financial Datasets API for market cap: {ticker}")
                start_time = time.time()
                try:
                    result = get_market_cap_fd(ticker, end_date)
                    duration = time.time() - start_time
                    log_performance("get_market_cap", "financial_datasets", duration, result is not None)
                    return result
                except Exception as e2:
                    duration = time.time() - start_time
                    log_performance("get_market_cap", "financial_datasets", duration, False)
                    logger.error(f"Both APIs failed for market cap {ticker}: Yahoo={e}, FD={e2}")
            
    elif primary_source == "financial_datasets" and FINANCIAL_DATASETS_AVAILABLE:
        start_time = time.time()
        try:
            result = get_market_cap_fd(ticker, end_date)
            duration = time.time() - start_time
            log_performance("get_market_cap", "financial_datasets", duration, result is not None)
            return result
        except Exception as e:
            duration = time.time() - start_time
            log_performance("get_market_cap", "financial_datasets", duration, False)
            logger.warning(f"Financial Datasets market cap failed for {ticker}: {e}")
            
            # Fallback to Yahoo Finance if enabled
            if USE_FALLBACK and YAHOO_FINANCE_AVAILABLE:
                logger.info(f"Falling back to Yahoo Finance for market cap: {ticker}")
                start_time = time.time()
                try:
                    result = get_market_cap_yahoo(ticker, end_date)
                    duration = time.time() - start_time
                    log_performance("get_market_cap", "yahoo", duration, result is not None)
                    return result
                except Exception as e2:
                    duration = time.time() - start_time
                    log_performance("get_market_cap", "yahoo", duration, False)
                    logger.error(f"Both APIs failed for market cap {ticker}: FD={e}, Yahoo={e2}")
    
    return None


def get_company_news(
    ticker: str,
    end_date: str,
    start_date: Optional[str] = None,
    limit: int = 1000,
) -> List[CompanyNews]:
    """Fetch company news with automatic source selection and fallback."""
    primary_source = "yahoo" if should_use_yahoo() else "financial_datasets"
    
    # Try primary source
    if primary_source == "yahoo" and YAHOO_FINANCE_AVAILABLE:
        start_time = time.time()
        try:
            result = get_company_news_yahoo(ticker, end_date, start_date, limit)
            duration = time.time() - start_time
            log_performance("get_company_news", "yahoo", duration, True, len(result))
            return result
        except Exception as e:
            duration = time.time() - start_time
            log_performance("get_company_news", "yahoo", duration, False)
            logger.warning(f"Yahoo Finance news failed for {ticker}: {e}")
            
            # Fallback to Financial Datasets if enabled
            if USE_FALLBACK and FINANCIAL_DATASETS_AVAILABLE:
                logger.info(f"Falling back to Financial Datasets API for news: {ticker}")
                start_time = time.time()
                try:
                    result = get_company_news_fd(ticker, end_date, start_date, limit)
                    duration = time.time() - start_time
                    log_performance("get_company_news", "financial_datasets", duration, True, len(result))
                    return result
                except Exception as e2:
                    duration = time.time() - start_time
                    log_performance("get_company_news", "financial_datasets", duration, False)
                    logger.error(f"Both APIs failed for news {ticker}: Yahoo={e}, FD={e2}")
            
    elif primary_source == "financial_datasets" and FINANCIAL_DATASETS_AVAILABLE:
        start_time = time.time()
        try:
            result = get_company_news_fd(ticker, end_date, start_date, limit)
            duration = time.time() - start_time
            log_performance("get_company_news", "financial_datasets", duration, True, len(result))
            return result
        except Exception as e:
            duration = time.time() - start_time
            log_performance("get_company_news", "financial_datasets", duration, False)
            logger.warning(f"Financial Datasets news failed for {ticker}: {e}")
            
            # Fallback to Yahoo Finance if enabled
            if USE_FALLBACK and YAHOO_FINANCE_AVAILABLE:
                logger.info(f"Falling back to Yahoo Finance for news: {ticker}")
                start_time = time.time()
                try:
                    result = get_company_news_yahoo(ticker, end_date, start_date, limit)
                    duration = time.time() - start_time
                    log_performance("get_company_news", "yahoo", duration, True, len(result))
                    return result
                except Exception as e2:
                    duration = time.time() - start_time
                    log_performance("get_company_news", "yahoo", duration, False)
                    logger.error(f"Both APIs failed for news {ticker}: FD={e}, Yahoo={e2}")
    
    return []


def get_insider_trades(
    ticker: str,
    end_date: str,
    start_date: Optional[str] = None,
    limit: int = 1000,
) -> List[InsiderTrade]:
    """Fetch insider trades with automatic source selection and fallback."""
    primary_source = "yahoo" if should_use_yahoo() else "financial_datasets"
    
    # Try primary source
    if primary_source == "yahoo" and YAHOO_FINANCE_AVAILABLE:
        start_time = time.time()
        try:
            result = get_insider_trades_yahoo(ticker, end_date, start_date, limit)
            duration = time.time() - start_time
            log_performance("get_insider_trades", "yahoo", duration, True, len(result))
            return result
        except Exception as e:
            duration = time.time() - start_time
            log_performance("get_insider_trades", "yahoo", duration, False)
            logger.warning(f"Yahoo Finance insider trades failed for {ticker}: {e}")
            
            # Fallback to Financial Datasets if enabled
            if USE_FALLBACK and FINANCIAL_DATASETS_AVAILABLE:
                logger.info(f"Falling back to Financial Datasets API for insider trades: {ticker}")
                start_time = time.time()
                try:
                    result = get_insider_trades_fd(ticker, end_date, start_date, limit)
                    duration = time.time() - start_time
                    log_performance("get_insider_trades", "financial_datasets", duration, True, len(result))
                    return result
                except Exception as e2:
                    duration = time.time() - start_time
                    log_performance("get_insider_trades", "financial_datasets", duration, False)
                    logger.error(f"Both APIs failed for insider trades {ticker}: Yahoo={e}, FD={e2}")
            
    elif primary_source == "financial_datasets" and FINANCIAL_DATASETS_AVAILABLE:
        start_time = time.time()
        try:
            result = get_insider_trades_fd(ticker, end_date, start_date, limit)
            duration = time.time() - start_time
            log_performance("get_insider_trades", "financial_datasets", duration, True, len(result))
            return result
        except Exception as e:
            duration = time.time() - start_time
            log_performance("get_insider_trades", "financial_datasets", duration, False)
            logger.warning(f"Financial Datasets insider trades failed for {ticker}: {e}")
            
            # Fallback to Yahoo Finance if enabled
            if USE_FALLBACK and YAHOO_FINANCE_AVAILABLE:
                logger.info(f"Falling back to Yahoo Finance for insider trades: {ticker}")
                start_time = time.time()
                try:
                    result = get_insider_trades_yahoo(ticker, end_date, start_date, limit)
                    duration = time.time() - start_time
                    log_performance("get_insider_trades", "yahoo", duration, True, len(result))
                    return result
                except Exception as e2:
                    duration = time.time() - start_time
                    log_performance("get_insider_trades", "yahoo", duration, False)
                    logger.error(f"Both APIs failed for insider trades {ticker}: FD={e}, Yahoo={e2}")
    
    return []


# Utility functions for migration monitoring
def get_api_status() -> dict:
    """Get status of both APIs for monitoring."""
    return {
        "financial_datasets_available": FINANCIAL_DATASETS_AVAILABLE,
        "yahoo_finance_available": YAHOO_FINANCE_AVAILABLE,
        "current_source": get_data_source(),
        "fallback_enabled": USE_FALLBACK,
        "performance_logging": LOG_PERFORMANCE,
    }


def log_migration_status():
    """Log current migration status for monitoring."""
    status = get_api_status()
    logger.info(f"API Migration Status: {status}")
    
    if status["current_source"] == "yahoo" and not status["yahoo_finance_available"]:
        logger.warning("Yahoo Finance is configured as primary but not available!")
    
    if not status["financial_datasets_available"] and not status["yahoo_finance_available"]:
        logger.error("No data sources available! System will not function properly.")


# Initialize and log status
log_migration_status()

def prices_to_df(prices: List[Price]) -> "pd.DataFrame":
    """Convert prices to a DataFrame - hybrid implementation."""
    import pandas as pd
    
    if not prices:
        # Return empty DataFrame with expected columns
        return pd.DataFrame(columns=["open", "close", "high", "low", "volume", "adj_close"])
    
    # Convert to DataFrame
    df = pd.DataFrame([p.model_dump() for p in prices])
    
    # Handle date column (could be 'date' or 'time' depending on source)
    date_col = 'date' if 'date' in df.columns else 'time'
    df["Date"] = pd.to_datetime(df[date_col])
    df.set_index("Date", inplace=True)
    
    # Ensure numeric columns
    numeric_cols = ["open", "close", "high", "low", "volume"]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    
    # Handle adj_close if present
    if "adj_close" in df.columns:
        df["adj_close"] = pd.to_numeric(df["adj_close"], errors="coerce")
    
    # Sort by date
    df.sort_index(inplace=True)
    
    return df


def get_price_data(ticker: str, start_date: str, end_date: str) -> "pd.DataFrame":
    """Get price data as DataFrame - hybrid implementation."""
    prices = get_prices(ticker, start_date, end_date)
    return prices_to_df(prices) 