"""
Ticker Symbols API Routes

Provides endpoints for fetching ticker symbols list for frontend caching.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any
import logging

from ..services.ticker_symbols import (
    get_ticker_symbols,
    get_ticker_symbols_stats,
    refresh_ticker_symbols_cache,
    get_popular_tickers_fallback
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ticker-symbols", tags=["ticker-symbols"])

@router.get("/", response_model=List[str])
async def get_all_ticker_symbols(
    force_refresh: bool = Query(False, description="Force refresh from API, bypass cache")
):
    """
    Get all US stock ticker symbols as a simple array.
    
    This endpoint returns just the ticker symbols (e.g., ['AAPL', 'MSFT', 'GOOGL'])
    optimized for frontend caching and autocomplete functionality.
    
    - **force_refresh**: Set to true to bypass cache and fetch fresh data
    
    Returns a simple array of ticker symbols (~60KB, ~18KB compressed).
    """
    try:
        logger.info(f"📡 Ticker symbols requested (force_refresh={force_refresh})")
        
        symbols = get_ticker_symbols(force_refresh=force_refresh)
        
        if not symbols:
            logger.warning("⚠️  No symbols returned, using fallback")
            symbols = get_popular_tickers_fallback()
        
        logger.info(f"✅ Returning {len(symbols)} ticker symbols")
        return symbols
        
    except Exception as e:
        logger.error(f"❌ Error in get_all_ticker_symbols: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch ticker symbols: {str(e)}"
        )

@router.get("/popular", response_model=List[str])
async def get_popular_ticker_symbols():
    """
    Get a curated list of popular ticker symbols.
    
    This is a fast endpoint that returns ~100 popular tickers
    without API calls, useful as a fallback or for quick loading.
    """
    try:
        logger.info("📡 Popular ticker symbols requested")
        symbols = get_popular_tickers_fallback()
        logger.info(f"✅ Returning {len(symbols)} popular ticker symbols")
        return symbols
        
    except Exception as e:
        logger.error(f"❌ Error in get_popular_ticker_symbols: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch popular ticker symbols: {str(e)}"
        )

@router.get("/stats", response_model=Dict[str, Any])
async def get_ticker_symbols_statistics():
    """
    Get statistics about the ticker symbols cache.
    
    Returns information about cache status, count, size, and sample data.
    """
    try:
        logger.info("📊 Ticker symbols stats requested")
        stats = get_ticker_symbols_stats()
        logger.info("✅ Returning ticker symbols statistics")
        return stats
        
    except Exception as e:
        logger.error(f"❌ Error in get_ticker_symbols_statistics: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get ticker symbols statistics: {str(e)}"
        )

@router.post("/refresh")
async def refresh_ticker_symbols():
    """
    Manually refresh the ticker symbols cache.
    
    Forces a fresh fetch from Polygon API and updates the cache.
    This is an admin endpoint for manual cache management.
    """
    try:
        logger.info("🔄 Manual ticker symbols refresh requested")
        
        symbols = refresh_ticker_symbols_cache()
        
        if symbols:
            logger.info(f"✅ Successfully refreshed {len(symbols)} ticker symbols")
            return {
                "success": True,
                "message": f"Successfully refreshed {len(symbols)} ticker symbols",
                "count": len(symbols),
                "sample": symbols[:10]
            }
        else:
            logger.warning("⚠️  Refresh returned no symbols")
            return {
                "success": False,
                "message": "Refresh completed but no symbols were fetched",
                "count": 0,
                "sample": []
            }
            
    except Exception as e:
        logger.error(f"❌ Error in refresh_ticker_symbols: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to refresh ticker symbols: {str(e)}"
        )

@router.get("/health")
async def ticker_symbols_health_check():
    """
    Health check endpoint for ticker symbols service.
    """
    try:
        # Quick health check
        stats = get_ticker_symbols_stats()
        
        return {
            "status": "healthy",
            "service": "ticker-symbols",
            "cached": stats.get("cached", False),
            "count": stats.get("count", 0),
            "cache_size_kb": stats.get("cache_size_kb", 0)
        }
        
    except Exception as e:
        logger.error(f"❌ Health check failed: {e}")
        raise HTTPException(
            status_code=503,
            detail=f"Ticker symbols service unhealthy: {str(e)}"
        )