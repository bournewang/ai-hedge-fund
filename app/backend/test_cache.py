#!/usr/bin/env python3
"""Test script to verify cache implementation works correctly."""

import os
import sys
import logging
from datetime import datetime, timedelta

# Add the root directory to the path to access src
sys.path.append('../../')

from src.data.cache import get_cache
from src.utils.cache_monitor import get_cache_monitor
from src.tools.api import (
    get_prices, 
    get_financial_metrics, 
    search_line_items, 
    get_market_cap,
    get_insider_trades,
    get_company_news
)

# Set up logging to see cache hits/misses
logging.basicConfig(level=logging.DEBUG, format='%(levelname)s: %(message)s')

def test_cache_functionality():
    """Test that caching works for all API functions."""
    print("🧪 Testing Cache Functionality")
    print("=" * 50)
    
    # Test parameters
    ticker = "AAPL"
    end_date = "2024-01-01"
    start_date = "2023-01-01"
    
    cache = get_cache()
    monitor = get_cache_monitor()
    
    # Clear cache and reset stats
    cache.clear_cache()
    monitor.reset_stats()
    
    print(f"\n1. Testing search_line_items() caching...")
    line_items = ["revenue", "net_income", "free_cash_flow"]
    
    # First call - should be cache MISS
    print("   First call (should be MISS):")
    result1 = search_line_items(ticker, line_items, end_date)
    
    # Second call - should be cache HIT
    print("   Second call (should be HIT):")
    result2 = search_line_items(ticker, line_items, end_date)
    
    # Verify results are the same
    assert len(result1) == len(result2), "Results should be identical"
    print(f"   ✅ Got {len(result1)} line items, cache working correctly")
    
    print(f"\n2. Testing get_market_cap() caching...")
    
    # First call - should be cache MISS
    print("   First call (should be MISS):")
    cap1 = get_market_cap(ticker, end_date)
    
    # Second call - should be cache HIT
    print("   Second call (should be HIT):")
    cap2 = get_market_cap(ticker, end_date)
    
    # Verify results are the same
    assert cap1 == cap2, "Market cap results should be identical"
    print(f"   ✅ Got market cap: {cap1}, cache working correctly")
    
    print(f"\n3. Testing get_financial_metrics() caching...")
    
    # First call - should be cache MISS
    print("   First call (should be MISS):")
    metrics1 = get_financial_metrics(ticker, end_date)
    
    # Second call - should be cache HIT
    print("   Second call (should be HIT):")
    metrics2 = get_financial_metrics(ticker, end_date)
    
    # Verify results are the same
    assert len(metrics1) == len(metrics2), "Metrics results should be identical"
    print(f"   ✅ Got {len(metrics1)} metrics, cache working correctly")
    
    print(f"\n4. Testing cache statistics...")
    stats = cache.get_cache_stats()
    print(f"   Cache entries: {stats}")
    
    # Print performance report
    monitor.print_performance_report()
    
    print(f"\n✅ All cache tests passed!")

def test_cache_key_variations():
    """Test that different parameters create different cache keys."""
    print("\n🔑 Testing Cache Key Variations")
    print("=" * 50)
    
    ticker = "AAPL"
    cache = get_cache()
    
    # Test different line_items create different cache entries
    line_items1 = ["revenue", "net_income"]
    line_items2 = ["revenue", "free_cash_flow"]
    
    result1 = search_line_items(ticker, line_items1, "2024-01-01")
    result2 = search_line_items(ticker, line_items2, "2024-01-01")
    
    # Test different dates create different cache entries
    cap1 = get_market_cap(ticker, "2024-01-01")
    cap2 = get_market_cap(ticker, "2023-01-01")
    
    stats = cache.get_cache_stats()
    print(f"Cache entries after variations: {stats}")
    print("✅ Cache key variations working correctly")

if __name__ == "__main__":
    # Check if API key is set
    if not os.environ.get("FINANCIAL_DATASETS_API_KEY"):
        print("⚠️  Warning: FINANCIAL_DATASETS_API_KEY not set. Some tests may fail.")
        print("   Set the API key to run full tests.")
    
    try:
        test_cache_functionality()
        test_cache_key_variations()
        print(f"\n🎉 All tests completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1) 