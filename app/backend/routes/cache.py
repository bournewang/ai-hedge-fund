"""Cache monitoring API routes."""

from fastapi import APIRouter
from src.data.cache import get_cache
from src.utils.cache_monitor import get_cache_monitor

router = APIRouter(prefix="/cache", tags=["cache"])


@router.get("/stats")
def get_cache_statistics():
    """Get current cache statistics."""
    cache = get_cache()
    monitor = get_cache_monitor()
    
    cache_stats = cache.get_cache_stats()
    performance_stats = monitor.get_performance_stats()
    
    return {
        "cache_contents": cache_stats,
        "performance": performance_stats,
        "cache_size": cache.get_cache_size() if hasattr(cache, 'get_cache_size') else None
    }


@router.delete("/clear")
def clear_cache():
    """Clear all cache data."""
    cache = get_cache()
    monitor = get_cache_monitor()
    
    cache.clear_cache()
    monitor.reset_stats()
    
    return {"message": "Cache cleared successfully"}


@router.delete("/clear/{ticker}")
def clear_ticker_cache(ticker: str):
    """Clear cache data for a specific ticker."""
    cache = get_cache()
    cache.clear_ticker_cache(ticker)
    
    return {"message": f"Cache cleared for ticker: {ticker}"}


@router.get("/monitor")
def get_cache_monitor_data():
    """Get detailed cache monitoring data."""
    cache = get_cache()
    monitor = get_cache_monitor()
    
    stats = cache.get_cache_stats()
    perf_stats = monitor.get_performance_stats()
    
    # Calculate efficiency metrics
    total_entries = stats['total_cache_entries']
    hit_rate = perf_stats['overall_hit_rate']
    api_calls_saved = perf_stats['api_calls_saved']
    
    return {
        "overview": {
            "total_cache_entries": total_entries,
            "overall_hit_rate": hit_rate,
            "api_calls_saved": api_calls_saved,
            "cache_size_kb": cache.get_cache_size()['disk_size_bytes'] / 1024 if hasattr(cache, 'get_cache_size') else 0
        },
        "by_type": {
            cache_type: {
                "entries": stats.get(f"{cache_type}_cached", 0),
                "hit_rate": perf_stats['hit_rates'].get(cache_type, 0),
                "total_requests": perf_stats['total_requests'].get(cache_type, 0)
            }
            for cache_type in ["prices", "financial_metrics", "line_items", "insider_trades", "company_news", "market_cap", "llm_responses"]
        },
        "cache_directory": cache.get_cache_size()['cache_directory'] if hasattr(cache, 'get_cache_size') else None
    } 