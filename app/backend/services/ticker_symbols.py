"""
Ticker Symbols Service

Fetches all US stock ticker symbols from Polygon API, extracts just the symbols,
and caches them for fast frontend access.
"""
import os
import requests
import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

# Import cache from the correct path
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
from src.data.cache import get_cache

logger = logging.getLogger(__name__)

POLYGON_API_KEY = os.environ.get("POLYGON_API_KEY")
POLYGON_BASE_URL = "https://api.polygon.io"

def fetch_all_ticker_symbols() -> List[str]:
    """
    Fetch all US stock ticker symbols from Polygon API.
    Returns a list of ticker symbols only (e.g., ['AAPL', 'MSFT', 'GOOGL']).
    """
    if not POLYGON_API_KEY:
        logger.error("POLYGON_API_KEY not found in environment variables")
        return []
    
    logger.info("🔍 Fetching all ticker symbols from Polygon API...")
    
    all_symbols = []
    url = f"{POLYGON_BASE_URL}/v3/reference/tickers"
    next_url = None
    page_count = 0
    
    try:
        while True:
            page_count += 1
            logger.info(f"📄 Fetching page {page_count}...")
            
            if next_url:
                # Add API key to the next_url (Polygon doesn't include it)
                separator = "&" if "?" in next_url else "?"
                next_url_with_key = f"{next_url}{separator}apikey={POLYGON_API_KEY}"
                response = requests.get(next_url_with_key, timeout=30)
            else:
                # First request
                params = {
                    "market": "stocks",
                    "active": "true",
                    "limit": 1000,  # Maximum allowed
                    "apikey": POLYGON_API_KEY
                }
                response = requests.get(url, params=params, timeout=30)
            
            if response.status_code != 200:
                logger.error(f"❌ Polygon API error: {response.status_code} - {response.text}")
                break
            
            data = response.json()
            results = data.get("results", [])
            
            if not results:
                logger.warning(f"⚠️  No results in page {page_count}")
                break
            
            # Extract only the ticker symbols
            page_symbols = [ticker.get("ticker") for ticker in results if ticker.get("ticker")]
            all_symbols.extend(page_symbols)
            
            logger.info(f"✅ Page {page_count}: {len(page_symbols)} symbols (total: {len(all_symbols)})")
            
            # Check for next page
            next_url = data.get("next_url")
            if not next_url:
                logger.info("🏁 Reached last page")
                break
            
            # Safety limit to prevent infinite loops
            if page_count >= 50:  # Should be enough for ~50,000 tickers
                logger.warning("⚠️  Reached page limit (50), stopping")
                break
        
        logger.info(f"🎉 Successfully fetched {len(all_symbols)} ticker symbols in {page_count} pages")
        return sorted(list(set(all_symbols)))  # Remove duplicates and sort
        
    except Exception as e:
        logger.error(f"❌ Error fetching ticker symbols: {e}")
        return []

def get_cached_ticker_symbols() -> Optional[List[str]]:
    """
    Get ticker symbols from cache if available.
    Returns None if not cached or expired.
    """
    try:
        cache = get_cache()
        symbols = cache.get_ticker_symbols()
        
        if symbols:
            logger.info(f"✅ Retrieved {len(symbols)} ticker symbols from cache")
            return symbols
        else:
            logger.info("📭 No ticker symbols found in cache")
            return None
            
    except Exception as e:
        logger.error(f"❌ Error retrieving ticker symbols from cache: {e}")
        return None

def refresh_ticker_symbols_cache() -> List[str]:
    """
    Fetch fresh ticker symbols from API and update cache.
    Returns the list of symbols.
    """
    try:
        logger.info("🔄 Refreshing ticker symbols cache...")
        symbols = fetch_all_ticker_symbols()
        
        if symbols:
            cache = get_cache()
            cache.set_ticker_symbols(symbols)
            logger.info(f"✅ Cached {len(symbols)} ticker symbols")
        else:
            logger.warning("⚠️  No symbols fetched, cache not updated")
        
        return symbols
        
    except Exception as e:
        logger.error(f"❌ Error refreshing ticker symbols cache: {e}")
        return []

def get_ticker_symbols(force_refresh: bool = False) -> List[str]:
    """
    Get ticker symbols with smart caching.
    
    Args:
        force_refresh: If True, bypass cache and fetch fresh data
    
    Returns:
        List of ticker symbols
    """
    try:
        if not force_refresh:
            # Try to get from cache first
            cached_symbols = get_cached_ticker_symbols()
            if cached_symbols:
                return cached_symbols
        
        # Cache miss or force refresh - fetch fresh data
        logger.info("🔄 Cache miss or force refresh - fetching fresh ticker symbols")
        return refresh_ticker_symbols_cache()
        
    except Exception as e:
        logger.error(f"❌ Error in get_ticker_symbols: {e}")
        # Return popular tickers as fallback
        return get_popular_tickers_fallback()

def get_popular_tickers_fallback() -> List[str]:
    """
    Fallback list of popular ticker symbols when API fails.
    """
    return [
        # Tech Giants
        "AAPL", "MSFT", "GOOGL", "GOOG", "AMZN", "META", "TSLA", "NVDA", "NFLX", "ADBE",
        
        # Financial
        "JPM", "BAC", "WFC", "GS", "MS", "C", "USB", "PNC", "TFC", "COF",
        
        # Healthcare
        "JNJ", "PFE", "UNH", "ABBV", "MRK", "TMO", "ABT", "DHR", "BMY", "AMGN",
        
        # Consumer
        "KO", "PEP", "WMT", "HD", "MCD", "NKE", "SBUX", "TGT", "LOW", "COST",
        
        # Industrial
        "BA", "CAT", "GE", "MMM", "HON", "UPS", "RTX", "LMT", "DE", "FDX",
        
        # Energy
        "XOM", "CVX", "COP", "EOG", "SLB", "PSX", "VLO", "MPC", "OXY", "HAL",
        
        # ETFs
        "SPY", "QQQ", "IWM", "VTI", "VOO", "VEA", "VWO", "AGG", "BND", "GLD"
    ]

def get_ticker_symbols_stats() -> Dict[str, Any]:
    """
    Get statistics about ticker symbols cache.
    """
    try:
        cache = get_cache()
        symbols = cache.get_ticker_symbols()
        
        if symbols:
            return {
                "cached": True,
                "count": len(symbols),
                "sample": symbols[:10],  # First 10 symbols
                "cache_size_kb": len(str(symbols)) / 1024,
                "last_updated": "Available in cache"
            }
        else:
            return {
                "cached": False,
                "count": 0,
                "sample": [],
                "cache_size_kb": 0,
                "last_updated": "Not cached"
            }
            
    except Exception as e:
        logger.error(f"❌ Error getting ticker symbols stats: {e}")
        return {
            "cached": False,
            "count": 0,
            "sample": [],
            "cache_size_kb": 0,
            "last_updated": f"Error: {str(e)}"
        }

# Background task function for periodic refresh
async def periodic_ticker_refresh():
    """
    Background task to refresh ticker symbols periodically.
    This can be called by a scheduler or background worker.
    """
    logger.info("🔄 Starting periodic ticker symbols refresh...")
    
    try:
        symbols = refresh_ticker_symbols_cache()
        logger.info(f"✅ Periodic refresh completed: {len(symbols)} symbols cached")
        return True
    except Exception as e:
        logger.error(f"❌ Periodic refresh failed: {e}")
        return False

if __name__ == "__main__":
    # Test the service
    print("🧪 Testing Ticker Symbols Service...")
    
    # Test fetching symbols
    symbols = get_ticker_symbols()
    print(f"📊 Retrieved {len(symbols)} symbols")
    
    if symbols:
        print(f"📋 Sample symbols: {symbols[:20]}")
    
    # Test stats
    stats = get_ticker_symbols_stats()
    print(f"📈 Stats: {stats}")