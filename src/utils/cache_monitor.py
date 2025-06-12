"""Cache performance monitoring utilities."""

import logging
from typing import Dict, Any
from src.data.cache import get_cache

logger = logging.getLogger(__name__)


class CacheMonitor:
    """Monitor cache performance and provide statistics."""
    
    def __init__(self):
        self.cache = get_cache()
        self.hit_counts: Dict[str, int] = {}
        self.miss_counts: Dict[str, int] = {}
    
    def log_hit(self, cache_type: str, cache_key: str):
        """Log a cache hit."""
        self.hit_counts[cache_type] = self.hit_counts.get(cache_type, 0) + 1
        logger.debug(f"Cache HIT [{cache_type}]: {cache_key}")
    
    def log_miss(self, cache_type: str, cache_key: str):
        """Log a cache miss."""
        self.miss_counts[cache_type] = self.miss_counts.get(cache_type, 0) + 1
        logger.debug(f"Cache MISS [{cache_type}]: {cache_key}")
    
    def get_hit_rate(self, cache_type: str) -> float:
        """Get hit rate for a specific cache type."""
        hits = self.hit_counts.get(cache_type, 0)
        misses = self.miss_counts.get(cache_type, 0)
        total = hits + misses
        return hits / total if total > 0 else 0.0
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get comprehensive cache performance statistics."""
        cache_stats = self.cache.get_cache_stats()
        
        performance_stats = {
            "cache_contents": cache_stats,
            "hit_rates": {},
            "total_requests": {},
            "api_calls_saved": 0
        }
        
        total_hits = 0
        total_requests = 0
        
        for cache_type in ["prices", "financial_metrics", "line_items", "insider_trades", "company_news", "market_cap", "trending_stocks"]:
            hits = self.hit_counts.get(cache_type, 0)
            misses = self.miss_counts.get(cache_type, 0)
            total = hits + misses
            
            performance_stats["hit_rates"][cache_type] = self.get_hit_rate(cache_type)
            performance_stats["total_requests"][cache_type] = total
            
            total_hits += hits
            total_requests += total
        
        performance_stats["overall_hit_rate"] = total_hits / total_requests if total_requests > 0 else 0.0
        performance_stats["api_calls_saved"] = total_hits
        
        return performance_stats
    
    def print_performance_report(self):
        """Print a formatted cache performance report."""
        stats = self.get_performance_stats()
        
        print("\n" + "="*60)
        print("CACHE PERFORMANCE REPORT")
        print("="*60)
        
        print(f"\nOverall Hit Rate: {stats['overall_hit_rate']:.2%}")
        print(f"Total API Calls Saved: {stats['api_calls_saved']}")
        
        print(f"\nCache Contents:")
        for cache_type, count in stats['cache_contents'].items():
            if cache_type != 'total_cache_entries':
                print(f"  {cache_type}: {count} entries")
        
        print(f"\nHit Rates by Cache Type:")
        for cache_type, hit_rate in stats['hit_rates'].items():
            total_requests = stats['total_requests'][cache_type]
            if total_requests > 0:
                print(f"  {cache_type}: {hit_rate:.2%} ({total_requests} requests)")
        
        print("="*60)
    
    def reset_stats(self):
        """Reset performance statistics."""
        self.hit_counts.clear()
        self.miss_counts.clear()


# Global cache monitor instance
_cache_monitor = CacheMonitor()


def get_cache_monitor() -> CacheMonitor:
    """Get the global cache monitor instance."""
    return _cache_monitor 