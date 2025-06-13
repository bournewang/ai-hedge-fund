"""Data Source Interface and Implementations

Clean polymorphic approach for data sources using abstract interfaces.
Each data source implements the same interface with different underlying APIs.
"""

import os
import logging
from abc import ABC, abstractmethod
from typing import List, Optional

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from src.data.models import (
    CompanyNews,
    FinancialMetrics,
    Price,
    LineItem,
    InsiderTrade,
)

logger = logging.getLogger(__name__)


class DataSourceInterface(ABC):
    """Abstract interface for all data sources."""
    
    @abstractmethod
    def get_prices(self, ticker: str, start_date: str, end_date: str) -> List[Price]:
        """Fetch price data for a ticker."""
        pass
    
    @abstractmethod
    def get_financial_metrics(self, ticker: str, end_date: str, period: str = "ttm", limit: int = 10) -> List[FinancialMetrics]:
        """Fetch financial metrics for a ticker."""
        pass
    
    @abstractmethod
    def get_market_cap(self, ticker: str, end_date: str) -> Optional[float]:
        """Fetch market cap for a ticker."""
        pass
    
    @abstractmethod
    def search_line_items(self, ticker: str, line_items: List[str], end_date: str, period: str = "ttm", limit: int = 10) -> List[LineItem]:
        """Search for specific line items in financial statements."""
        pass
    
    @abstractmethod
    def get_company_news(self, ticker: str, end_date: str, start_date: Optional[str] = None, limit: int = 1000) -> List[CompanyNews]:
        """Fetch company news for a ticker."""
        pass
    
    @abstractmethod
    def get_insider_trades(self, ticker: str, end_date: str, start_date: Optional[str] = None, limit: int = 1000) -> List[InsiderTrade]:
        """Fetch insider trades for a ticker."""
        pass
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Return the name of this data source."""
        pass


class PolygonDataSource(DataSourceInterface):
    """Polygon.io data source implementation."""
    
    def __init__(self):
        try:
            from .polygon_data import (
                get_prices_polygon,
                get_financial_metrics_polygon,
                get_market_cap_polygon,
                search_line_items_polygon,
                get_company_news_polygon,
                get_insider_trades_polygon,
                is_polygon_available,
            )
            self._get_prices = get_prices_polygon
            self._get_financial_metrics = get_financial_metrics_polygon
            self._get_market_cap = get_market_cap_polygon
            self._search_line_items = search_line_items_polygon
            self._get_company_news = get_company_news_polygon
            self._get_insider_trades = get_insider_trades_polygon
            self._available = is_polygon_available()
        except ImportError as e:
            logger.error(f"Failed to import Polygon.io data functions: {e}")
            self._available = False
    
    @property
    def name(self) -> str:
        return "polygon"
    
    def get_prices(self, ticker: str, start_date: str, end_date: str) -> List[Price]:
        if not self._available:
            raise RuntimeError("Polygon.io data source not available")
        return self._get_prices(ticker, start_date, end_date)
    
    def get_financial_metrics(self, ticker: str, end_date: str, period: str = "ttm", limit: int = 10) -> List[FinancialMetrics]:
        if not self._available:
            raise RuntimeError("Polygon.io data source not available")
        return self._get_financial_metrics(ticker, end_date, period, limit)
    
    def get_market_cap(self, ticker: str, end_date: str) -> Optional[float]:
        if not self._available:
            raise RuntimeError("Polygon.io data source not available")
        return self._get_market_cap(ticker, end_date)
    
    def search_line_items(self, ticker: str, line_items: List[str], end_date: str, period: str = "ttm", limit: int = 10) -> List[LineItem]:
        if not self._available:
            raise RuntimeError("Polygon.io data source not available")
        return self._search_line_items(ticker, line_items, end_date, period, limit)
    
    def get_company_news(self, ticker: str, end_date: str, start_date: Optional[str] = None, limit: int = 1000) -> List[CompanyNews]:
        if not self._available:
            raise RuntimeError("Polygon.io data source not available")
        return self._get_company_news(ticker, end_date, start_date, limit)
    
    def get_insider_trades(self, ticker: str, end_date: str, start_date: Optional[str] = None, limit: int = 1000) -> List[InsiderTrade]:
        if not self._available:
            raise RuntimeError("Polygon.io data source not available")
        return self._get_insider_trades(ticker, end_date, start_date, limit)


class YahooDataSource(DataSourceInterface):
    """Yahoo Finance data source implementation."""
    
    def __init__(self):
        try:
            from .yahoo_finance_data import (
                get_prices_yahoo,
                get_financial_metrics_yahoo,
                get_market_cap_yahoo,
                search_line_items_yahoo,
                get_company_news_yahoo,
                get_insider_trades_yahoo,
            )
            self._get_prices = get_prices_yahoo
            self._get_financial_metrics = get_financial_metrics_yahoo
            self._get_market_cap = get_market_cap_yahoo
            self._search_line_items = search_line_items_yahoo
            self._get_company_news = get_company_news_yahoo
            self._get_insider_trades = get_insider_trades_yahoo
            self._available = True
        except ImportError as e:
            logger.error(f"Failed to import Yahoo Finance data functions: {e}")
            self._available = False
    
    @property
    def name(self) -> str:
        return "yahoo"
    
    def get_prices(self, ticker: str, start_date: str, end_date: str) -> List[Price]:
        if not self._available:
            raise RuntimeError("Yahoo Finance data source not available")
        return self._get_prices(ticker, start_date, end_date)
    
    def get_financial_metrics(self, ticker: str, end_date: str, period: str = "ttm", limit: int = 10) -> List[FinancialMetrics]:
        if not self._available:
            raise RuntimeError("Yahoo Finance data source not available")
        return self._get_financial_metrics(ticker, end_date, period, limit)
    
    def get_market_cap(self, ticker: str, end_date: str) -> Optional[float]:
        if not self._available:
            raise RuntimeError("Yahoo Finance data source not available")
        return self._get_market_cap(ticker, end_date)
    
    def search_line_items(self, ticker: str, line_items: List[str], end_date: str, period: str = "ttm", limit: int = 10) -> List[LineItem]:
        if not self._available:
            raise RuntimeError("Yahoo Finance data source not available")
        return self._search_line_items(ticker, line_items, end_date, period, limit)
    
    def get_company_news(self, ticker: str, end_date: str, start_date: Optional[str] = None, limit: int = 1000) -> List[CompanyNews]:
        if not self._available:
            raise RuntimeError("Yahoo Finance data source not available")
        return self._get_company_news(ticker, end_date, start_date, limit)
    
    def get_insider_trades(self, ticker: str, end_date: str, start_date: Optional[str] = None, limit: int = 1000) -> List[InsiderTrade]:
        if not self._available:
            raise RuntimeError("Yahoo Finance data source not available")
        return self._get_insider_trades(ticker, end_date, start_date, limit)


class FinancialDatasetsDataSource(DataSourceInterface):
    """Financial Datasets API data source implementation."""
    
    def __init__(self):
        try:
            from .api import (
                get_prices as get_prices_fd,
                get_financial_metrics as get_financial_metrics_fd,
                get_market_cap as get_market_cap_fd,
                search_line_items as search_line_items_fd,
                get_company_news as get_company_news_fd,
                get_insider_trades as get_insider_trades_fd,
            )
            self._get_prices = get_prices_fd
            self._get_financial_metrics = get_financial_metrics_fd
            self._get_market_cap = get_market_cap_fd
            self._search_line_items = search_line_items_fd
            self._get_company_news = get_company_news_fd
            self._get_insider_trades = get_insider_trades_fd
            self._available = True
        except ImportError as e:
            logger.error(f"Failed to import Financial Datasets API functions: {e}")
            self._available = False
    
    @property
    def name(self) -> str:
        return "financial_datasets"
    
    def get_prices(self, ticker: str, start_date: str, end_date: str) -> List[Price]:
        if not self._available:
            raise RuntimeError("Financial Datasets API data source not available")
        return self._get_prices(ticker, start_date, end_date)
    
    def get_financial_metrics(self, ticker: str, end_date: str, period: str = "ttm", limit: int = 10) -> List[FinancialMetrics]:
        if not self._available:
            raise RuntimeError("Financial Datasets API data source not available")
        return self._get_financial_metrics(ticker, end_date, period, limit)
    
    def get_market_cap(self, ticker: str, end_date: str) -> Optional[float]:
        if not self._available:
            raise RuntimeError("Financial Datasets API data source not available")
        return self._get_market_cap(ticker, end_date)
    
    def search_line_items(self, ticker: str, line_items: List[str], end_date: str, period: str = "ttm", limit: int = 10) -> List[LineItem]:
        if not self._available:
            raise RuntimeError("Financial Datasets API data source not available")
        return self._search_line_items(ticker, line_items, end_date, period, limit)
    
    def get_company_news(self, ticker: str, end_date: str, start_date: Optional[str] = None, limit: int = 1000) -> List[CompanyNews]:
        if not self._available:
            raise RuntimeError("Financial Datasets API data source not available")
        return self._get_company_news(ticker, end_date, start_date, limit)
    
    def get_insider_trades(self, ticker: str, end_date: str, start_date: Optional[str] = None, limit: int = 1000) -> List[InsiderTrade]:
        if not self._available:
            raise RuntimeError("Financial Datasets API data source not available")
        return self._get_insider_trades(ticker, end_date, start_date, limit)


class DataSourceFactory:
    """Factory for creating data source instances based on configuration."""
    
    _instances = {}  # Singleton pattern for caching instances
    
    @classmethod
    def create_data_source(cls, source_name: Optional[str] = None) -> DataSourceInterface:
        """Create a data source instance based on configuration."""
        if source_name is None:
            source_name = cls._get_configured_source()
        
        # Use singleton pattern to cache instances
        if source_name not in cls._instances:
            if source_name in ["polygon", "polygon.io", "poly"]:
                cls._instances[source_name] = PolygonDataSource()
            elif source_name in ["yahoo", "yfinance", "free"]:
                cls._instances[source_name] = YahooDataSource()
            elif source_name in ["financial_datasets", "fd", "premium"]:
                cls._instances[source_name] = FinancialDatasetsDataSource()
            else:
                # Default to Yahoo Finance for unknown sources
                logger.warning(f"Unknown data source '{source_name}', defaulting to Yahoo Finance")
                cls._instances[source_name] = YahooDataSource()
        
        return cls._instances[source_name]
    
    @classmethod
    def _get_configured_source(cls) -> str:
        """Get the configured data source from environment."""
        return os.environ.get("DATA_SOURCE", "yahoo").lower()
    
    @classmethod
    def get_available_sources(cls) -> List[str]:
        """Get list of available data source names."""
        return ["polygon", "yahoo", "financial_datasets"]
    
    @classmethod
    def clear_cache(cls):
        """Clear the singleton cache (useful for testing)."""
        cls._instances.clear()


# Convenience function for getting the current data source
def get_current_data_source() -> DataSourceInterface:
    """Get the current configured data source instance."""
    return DataSourceFactory.create_data_source() 