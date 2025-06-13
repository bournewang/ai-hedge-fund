"""Clean Hybrid API using Polymorphic Data Sources

This is a much cleaner implementation of the hybrid API using polymorphism
and interfaces instead of repetitive if/elif blocks.
"""

import logging
import time
from typing import List, Optional
from functools import wraps

from src.tools.data_sources import (
    get_current_data_source,
    DataSourceFactory,
    DataSourceInterface,
)
from src.data.models import (
    CompanyNews,
    FinancialMetrics,
    Price,
    LineItem,
    InsiderTrade,
)

logger = logging.getLogger(__name__)

# Configuration
ENABLE_PERFORMANCE_LOGGING = True
ENABLE_FALLBACK = True


def performance_log(func):
    """Decorator to log performance metrics for data source calls."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        if not ENABLE_PERFORMANCE_LOGGING:
            return func(*args, **kwargs)
        
        start_time = time.time()
        data_source = get_current_data_source()
        
        try:
            result = func(*args, **kwargs)
            duration = time.time() - start_time
            
            # Determine data count based on result type
            if isinstance(result, list):
                data_count = len(result)
            elif result is not None:
                data_count = 1
            else:
                data_count = 0
                
            logger.info(f"PERFORMANCE: {func.__name__} via {data_source.name} - SUCCESS in {duration:.3f}s ({data_count} items)")
            return result
            
        except Exception as e:
            duration = time.time() - start_time
            logger.info(f"PERFORMANCE: {func.__name__} via {data_source.name} - FAILED in {duration:.3f}s")
            raise
    
    return wrapper


def with_fallback(func):
    """Decorator to add fallback logic to data source calls."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        if not ENABLE_FALLBACK:
            return func(*args, **kwargs)
        
        primary_source = get_current_data_source()
        
        try:
            # Try primary source
            logger.info(f"🎯 Using {primary_source.name.upper()} for {func.__name__}")
            return func(*args, **kwargs)
            
        except Exception as e:
            logger.warning(f"{primary_source.name} {func.__name__} failed: {e}")
            
            # Try fallback sources
            fallback_sources = ["yahoo", "financial_datasets"]
            current_name = primary_source.name
            
            for fallback_name in fallback_sources:
                if fallback_name == current_name:
                    continue  # Skip the source that already failed
                
                try:
                    logger.info(f"Falling back to {fallback_name} for {func.__name__}")
                    fallback_source = DataSourceFactory.create_data_source(fallback_name)
                    
                    # Call the same method on the fallback source
                    fallback_method = getattr(fallback_source, func.__name__)
                    result = fallback_method(*args, **kwargs)
                    
                    logger.info(f"✅ Fallback to {fallback_name} succeeded for {func.__name__}")
                    return result
                    
                except Exception as e2:
                    logger.warning(f"Fallback {fallback_name} also failed for {func.__name__}: {e2}")
                    continue
            
            # All sources failed
            logger.error(f"All data sources failed for {func.__name__}")
            raise e
    
    return wrapper


# Clean API functions using polymorphism
@performance_log
@with_fallback
def get_prices(ticker: str, start_date: str, end_date: str) -> List[Price]:
    """Fetch price data with automatic source selection and fallback."""
    data_source = get_current_data_source()
    return data_source.get_prices(ticker, start_date, end_date)


@performance_log
@with_fallback
def get_financial_metrics(
    ticker: str,
    end_date: str,
    period: str = "ttm",
    limit: int = 10,
) -> List[FinancialMetrics]:
    """Fetch financial metrics with automatic source selection and fallback."""
    data_source = get_current_data_source()
    return data_source.get_financial_metrics(ticker, end_date, period, limit)


@performance_log
@with_fallback
def get_market_cap(ticker: str, end_date: str) -> Optional[float]:
    """Fetch market cap with automatic source selection and fallback."""
    data_source = get_current_data_source()
    return data_source.get_market_cap(ticker, end_date)


@performance_log
@with_fallback
def search_line_items(
    ticker: str,
    line_items: List[str],
    end_date: str,
    period: str = "ttm",
    limit: int = 10,
) -> List[LineItem]:
    """Fetch line items with automatic source selection and fallback."""
    data_source = get_current_data_source()
    return data_source.search_line_items(ticker, line_items, end_date, period, limit)


@performance_log
@with_fallback
def get_company_news(
    ticker: str,
    end_date: str,
    start_date: Optional[str] = None,
    limit: int = 1000,
) -> List[CompanyNews]:
    """Fetch company news with automatic source selection and fallback."""
    data_source = get_current_data_source()
    return data_source.get_company_news(ticker, end_date, start_date, limit)


@performance_log
@with_fallback
def get_insider_trades(
    ticker: str,
    end_date: str,
    start_date: Optional[str] = None,
    limit: int = 1000,
) -> List[InsiderTrade]:
    """Fetch insider trades with automatic source selection and fallback."""
    data_source = get_current_data_source()
    return data_source.get_insider_trades(ticker, end_date, start_date, limit)


# Utility functions
def get_api_status() -> dict:
    """Get status of all APIs for monitoring."""
    current_source = get_current_data_source()
    available_sources = DataSourceFactory.get_available_sources()
    
    status = {
        "current_source": current_source.name,
        "supported_sources": ["polygon", "polygon.io", "poly", "yahoo", "yfinance", "free", "financial_datasets", "fd", "premium"],
        "available_sources": available_sources,
        "fallback_enabled": ENABLE_FALLBACK,
        "performance_logging": ENABLE_PERFORMANCE_LOGGING,
    }
    
    # Test availability of each source
    for source_name in available_sources:
        try:
            source = DataSourceFactory.create_data_source(source_name)
            status[f"{source_name}_available"] = True
            status[f"{source_name}_configured"] = True
        except Exception as e:
            status[f"{source_name}_available"] = False
            status[f"{source_name}_configured"] = False
            logger.debug(f"Data source {source_name} not available: {e}")
    
    return status


def log_migration_status():
    """Log current migration status for monitoring."""
    status = get_api_status()
    current_source = status["current_source"]
    
    logger.info(f"🎯 CURRENT DATA_SOURCE: {current_source.upper()} (loaded from .env file)")
    logger.info(f"API Status: {status}")
    
    # Check if current source is available
    if not status.get(f"{current_source}_available", False):
        logger.warning(f"{current_source} is configured as primary but not available!")
    
    # Check if any data source is available
    any_available = any(status.get(f"{source}_available", False) for source in status["available_sources"])
    
    if not any_available:
        logger.error("No data sources available! System will not function properly.")


# Utility functions for DataFrame compatibility
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


# Initialize and log status
log_migration_status() 