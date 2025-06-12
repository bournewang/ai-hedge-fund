"""Yahoo Finance API integration for trending stocks data."""

import requests
import logging
import time
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

from src.data.cache import get_cache
from src.utils.cache_monitor import get_cache_monitor

logger = logging.getLogger(__name__)

# Global cache instances
_cache = get_cache()
_monitor = get_cache_monitor()

@dataclass
class TrendingStock:
    """Data structure for trending stock information."""
    symbol: str
    company_name: str
    price: float
    change: float
    change_percent: float
    volume: int
    market_cap: int
    sector: Optional[str] = None
    exchange: Optional[str] = None
    fifty_two_week_high: Optional[float] = None
    fifty_two_week_low: Optional[float] = None
    pe_ratio: Optional[float] = None
    book_value: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert TrendingStock to dictionary for caching."""
        return {
            "symbol": self.symbol,
            "company_name": self.company_name,
            "price": self.price,
            "change": self.change,
            "change_percent": self.change_percent,
            "volume": self.volume,
            "market_cap": self.market_cap,
            "sector": self.sector,
            "exchange": self.exchange,
            "fifty_two_week_high": self.fifty_two_week_high,
            "fifty_two_week_low": self.fifty_two_week_low,
            "pe_ratio": self.pe_ratio,
            "book_value": self.book_value
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TrendingStock':
        """Create TrendingStock from dictionary (for loading from cache)."""
        return cls(**data)


def _make_yahoo_request(url: str, params: Dict[str, Any], max_retries: int = 3) -> Optional[Dict]:
    """
    Make a request to Yahoo Finance API with retry logic and proper headers.
    
    Args:
        url: API endpoint URL
        params: Request parameters
        max_retries: Maximum number of retry attempts
    
    Returns:
        JSON response data or None if failed
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    }
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Making Yahoo Finance request (attempt {attempt + 1}/{max_retries})")
            
            response = requests.get(url, params=params, headers=headers, timeout=15)
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                # Rate limited, wait and retry
                wait_time = (attempt + 1) * 2  # Exponential backoff: 2, 4, 6 seconds
                logger.warning(f"Rate limited by Yahoo Finance. Waiting {wait_time}s before retry...")
                time.sleep(wait_time)
                continue
            else:
                logger.warning(f"Yahoo Finance returned status {response.status_code}: {response.text}")
                if attempt == max_retries - 1:
                    response.raise_for_status()
                continue
                
        except requests.RequestException as e:
            logger.warning(f"Request attempt {attempt + 1} failed: {e}")
            if attempt == max_retries - 1:
                raise
            time.sleep(1)  # Brief delay before retry
    
    return None


def get_day_gainers(count: int = 10) -> List[TrendingStock]:
    """
    Fetch day gainers from Yahoo Finance API with caching.
    
    Args:
        count: Number of gainers to fetch (default: 10, max: 25)
    
    Returns:
        List of TrendingStock objects
    """
    try:
        # Limit count to reasonable maximum
        count = min(count, 25)
        
        # Create cache key
        cache_key = f"day_gainers_{count}"
        
        # Check cache first
        cached_data = _cache.get_trending_stocks(cache_key)
        if cached_data:
            logger.info(f"Cache HIT: Retrieved {len(cached_data)} day gainers from cache")
            _monitor.log_hit("trending_stocks", cache_key)
            return [TrendingStock.from_dict(stock_data) for stock_data in cached_data]
        
        # Cache miss - fetch from API
        logger.info(f"Cache MISS: Fetching {count} day gainers from Yahoo Finance API")
        _monitor.log_miss("trending_stocks", cache_key)
        
        url = "https://query2.finance.yahoo.com/v1/finance/screener/predefined/saved"
        params = {
            "count": count,
            "scrIds": "day_gainers"
        }
        
        data = _make_yahoo_request(url, params)
        if not data:
            logger.error("Failed to get valid response from Yahoo Finance")
            return []
        
        # Extract quotes from the response
        quotes = data.get("finance", {}).get("result", [{}])[0].get("quotes", [])
        
        if not quotes:
            logger.warning("No quotes found in Yahoo Finance response")
            return []
        
        trending_stocks = []
        for quote in quotes:
            try:
                stock = TrendingStock(
                    symbol=quote.get("symbol", ""),
                    company_name=quote.get("longName", quote.get("shortName", "")),
                    price=quote.get("regularMarketPrice", 0.0),
                    change=quote.get("regularMarketChange", 0.0),
                    change_percent=quote.get("regularMarketChangePercent", 0.0),
                    volume=quote.get("regularMarketVolume", 0),
                    market_cap=quote.get("marketCap", 0),
                    sector=quote.get("sector"),
                    exchange=quote.get("fullExchangeName", quote.get("exchange")),
                    fifty_two_week_high=quote.get("fiftyTwoWeekHigh"),
                    fifty_two_week_low=quote.get("fiftyTwoWeekLow"),
                    pe_ratio=quote.get("forwardPE"),
                    book_value=quote.get("bookValue")
                )
                trending_stocks.append(stock)
                
            except Exception as e:
                logger.warning(f"Error parsing quote data for {quote.get('symbol', 'unknown')}: {e}")
                continue
        
        # Cache the results
        if trending_stocks:
            stock_dicts = [stock.to_dict() for stock in trending_stocks]
            _cache.set_trending_stocks(cache_key, stock_dicts)
            logger.info(f"Cached {len(trending_stocks)} day gainers with 5-minute TTL")
        
        logger.info(f"Successfully fetched {len(trending_stocks)} day gainers")
        return trending_stocks
        
    except Exception as e:
        logger.error(f"Unexpected error fetching day gainers: {e}")
        return []


def get_day_losers(count: int = 10) -> List[TrendingStock]:
    """
    Fetch day losers from Yahoo Finance API.
    
    Args:
        count: Number of losers to fetch (default: 10, max: 25)
    
    Returns:
        List of TrendingStock objects
    """
    try:
        count = min(count, 25)
        
        url = "https://query2.finance.yahoo.com/v1/finance/screener/predefined/saved"
        params = {
            "count": count,
            "scrIds": "day_losers"  # This endpoint might not exist, will gracefully handle
        }
        
        logger.info(f"Fetching {count} day losers from Yahoo Finance")
        
        data = _make_yahoo_request(url, params)
        if not data:
            logger.warning("Could not fetch day losers, endpoint might not be available")
            return []
        
        quotes = data.get("finance", {}).get("result", [{}])[0].get("quotes", [])
        
        trending_stocks = []
        for quote in quotes:
            try:
                stock = TrendingStock(
                    symbol=quote.get("symbol", ""),
                    company_name=quote.get("longName", quote.get("shortName", "")),
                    price=quote.get("regularMarketPrice", 0.0),
                    change=quote.get("regularMarketChange", 0.0),
                    change_percent=quote.get("regularMarketChangePercent", 0.0),
                    volume=quote.get("regularMarketVolume", 0),
                    market_cap=quote.get("marketCap", 0),
                    sector=quote.get("sector"),
                    exchange=quote.get("fullExchangeName", quote.get("exchange")),
                    fifty_two_week_high=quote.get("fiftyTwoWeekHigh"),
                    fifty_two_week_low=quote.get("fiftyTwoWeekLow"),
                    pe_ratio=quote.get("forwardPE"),
                    book_value=quote.get("bookValue")
                )
                trending_stocks.append(stock)
                
            except Exception as e:
                logger.warning(f"Error parsing quote data for {quote.get('symbol', 'unknown')}: {e}")
                continue
        
        logger.info(f"Successfully fetched {len(trending_stocks)} day losers")
        return trending_stocks
        
    except Exception as e:
        logger.warning(f"Could not fetch day losers: {e}")
        return []  # Gracefully fail for losers since it might not be available


def format_market_cap(market_cap: int) -> str:
    """Format market cap into human readable string."""
    if market_cap >= 1_000_000_000_000:  # Trillion
        return f"${market_cap / 1_000_000_000_000:.1f}T"
    elif market_cap >= 1_000_000_000:  # Billion
        return f"${market_cap / 1_000_000_000:.1f}B"
    elif market_cap >= 1_000_000:  # Million
        return f"${market_cap / 1_000_000:.1f}M"
    else:
        return f"${market_cap:,}"


def get_trending_data() -> Dict[str, Any]:
    """
    Get comprehensive trending data for the explore page.
    
    Returns:
        Dictionary containing gainers, losers, and metadata
    """
    try:
        # Focus on gainers since they're more reliable
        gainers = get_day_gainers(count=10)
        losers = get_day_losers(count=5)  # This might return empty list
        
        # Format data for frontend
        formatted_gainers = []
        for stock in gainers:
            formatted_gainers.append({
                "symbol": stock.symbol,
                "company_name": stock.company_name,
                "price": round(stock.price, 2),
                "change": round(stock.change, 2),
                "change_percent": round(stock.change_percent, 2),
                "volume": stock.volume,
                "market_cap": stock.market_cap,
                "market_cap_formatted": format_market_cap(stock.market_cap),
                "sector": stock.sector,
                "exchange": stock.exchange,
                "fifty_two_week_high": stock.fifty_two_week_high,
                "fifty_two_week_low": stock.fifty_two_week_low,
                "pe_ratio": round(stock.pe_ratio, 2) if stock.pe_ratio else None,
                "book_value": round(stock.book_value, 2) if stock.book_value else None
            })
        
        formatted_losers = []
        for stock in losers:
            formatted_losers.append({
                "symbol": stock.symbol,
                "company_name": stock.company_name,
                "price": round(stock.price, 2),
                "change": round(stock.change, 2),
                "change_percent": round(stock.change_percent, 2),
                "volume": stock.volume,
                "market_cap": stock.market_cap,
                "market_cap_formatted": format_market_cap(stock.market_cap),
                "sector": stock.sector,
                "exchange": stock.exchange,
                "fifty_two_week_high": stock.fifty_two_week_high,
                "fifty_two_week_low": stock.fifty_two_week_low,
                "pe_ratio": round(stock.pe_ratio, 2) if stock.pe_ratio else None,
                "book_value": round(stock.book_value, 2) if stock.book_value else None
            })
        
        return {
            "gainers": formatted_gainers,
            "losers": formatted_losers,
            "timestamp": "now",  # You might want to add actual timestamp
            "total_gainers": len(formatted_gainers),
            "total_losers": len(formatted_losers)
        }
        
    except Exception as e:
        logger.error(f"Error getting trending data: {e}")
        return {
            "gainers": [],
            "losers": [],
            "timestamp": "now",
            "total_gainers": 0,
            "total_losers": 0,
            "error": str(e)
        }