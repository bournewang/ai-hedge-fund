#!/usr/bin/env python3
"""Script to demonstrate cache monitoring capabilities."""

import os
import sys
import logging

# Add the root directory to the path to access src
sys.path.append('.')

from src.data.cache import get_cache
from src.utils.cache_monitor import get_cache_monitor
from src.tools.api import search_line_items, get_market_cap, get_financial_metrics

# Set up logging to see cache hits/misses
logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(name)s:%(message)s')

def demonstrate_cache_monitoring():
    """Demonstrate cache monitoring capabilities."""
    print("📊 Cache Monitor Demonstration")
    print("=" * 50)
    
    cache = get_cache()
    monitor = get_cache_monitor()
    
    # Reset stats for clean demonstration
    monitor.reset_stats()
    cache.clear_cache()
    
    print("\n1. Initial Cache State:")
    print("-" * 30)
    stats = cache.get_cache_stats()
    for key, value in stats.items():
        print(f"   {key}: {value}")
    
    # Simulate some cache activity
    print("\n2. Simulating API calls...")
    print("-" * 30)
    
    tickers = ["AAPL", "MSFT", "GOOGL"]
    end_date = "2024-01-01"
    
    for i, ticker in enumerate(tickers):
        print(f"\n   Round {i+1}: Analyzing {ticker}")
        
        # These will be cache MISS first time
        try:
            market_cap = get_market_cap(ticker, end_date)
            print(f"     Market cap: ${market_cap:,.0f}" if market_cap else "     Market cap: N/A")
        except Exception as e:
            print(f"     Market cap failed: {e}")
        
        try:
            line_items = search_line_items(ticker, ["revenue", "net_income", "free_cash_flow"], end_date)
            print(f"     Line items: {len(line_items)} retrieved")
        except Exception as e:
            print(f"     Line items failed: {e}")
    
    # Now repeat some calls to show cache hits
    print("\n3. Repeat calls to demonstrate cache hits...")
    print("-" * 30)
    
    for ticker in tickers[:2]:  # Just first 2 to show hits
        print(f"\n   Repeating calls for {ticker} (should be cache HITs)")
        try:
            market_cap = get_market_cap(ticker, end_date)
            line_items = search_line_items(ticker, ["revenue", "net_income"], end_date)
            print(f"     ✅ Got market cap and {len(line_items)} line items")
        except Exception as e:
            print(f"     ❌ Failed: {e}")
    
    print("\n4. Cache Performance Report:")
    print("=" * 50)
    monitor.print_performance_report()
    
    print("\n5. Detailed Cache Statistics:")
    print("-" * 30)
    cache_stats = cache.get_cache_stats()
    for key, value in cache_stats.items():
        print(f"   {key}: {value}")
    
    # Show cache size information
    if hasattr(cache, 'get_cache_size'):
        print("\n6. Cache Size Information:")
        print("-" * 30)
        size_info = cache.get_cache_size()
        for key, value in size_info.items():
            if key == 'disk_size_bytes':
                print(f"   {key}: {value:,} bytes ({value/1024:.1f} KB)")
            else:
                print(f"   {key}: {value}")

def show_live_cache_stats():
    """Show current cache statistics without doing any operations."""
    print("📈 Current Cache Statistics")
    print("=" * 40)
    
    cache = get_cache()
    monitor = get_cache_monitor()
    
    # Cache contents
    stats = cache.get_cache_stats()
    print("\n🗄️  Cache Contents:")
    for key, value in stats.items():
        print(f"   {key:<25}: {value}")
    
    # Performance stats
    print("\n📊 Performance Statistics:")
    perf_stats = monitor.get_performance_stats()
    
    print(f"   Overall hit rate: {perf_stats['overall_hit_rate']:.1%}")
    print(f"   API calls saved: {perf_stats['api_calls_saved']}")
    
    print("\n📋 Hit Rates by Type:")
    for cache_type, hit_rate in perf_stats['hit_rates'].items():
        total_requests = perf_stats['total_requests'][cache_type]
        if total_requests > 0:
            print(f"   {cache_type:<20}: {hit_rate:.1%} ({total_requests} requests)")
    
    # Cache size (if available)
    if hasattr(cache, 'get_cache_size'):
        print("\n💾 Cache Size:")
        size_info = cache.get_cache_size()
        print(f"   Directory: {size_info['cache_directory']}")
        print(f"   Entries: {size_info['total_entries']}")
        print(f"   Size: {size_info['disk_size_bytes']:,} bytes ({size_info['disk_size_bytes']/1024:.1f} KB)")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Cache monitoring utilities')
    parser.add_argument('--demo', action='store_true', help='Run cache monitoring demonstration')
    parser.add_argument('--stats', action='store_true', help='Show current cache statistics')
    parser.add_argument('--clear', action='store_true', help='Clear all cache data')
    
    args = parser.parse_args()
    
    if args.clear:
        cache = get_cache()
        cache.clear_cache()
        print("🗑️  Cache cleared!")
        
    elif args.demo:
        if not os.environ.get("FINANCIAL_DATASETS_API_KEY"):
            print("⚠️  Warning: FINANCIAL_DATASETS_API_KEY not set. Demo may fail.")
        demonstrate_cache_monitoring()
        
    elif args.stats:
        show_live_cache_stats()
        
    else:
        print("Cache Monitor Usage:")
        print("  python show_cache_monitor.py --demo   # Run demonstration")
        print("  python show_cache_monitor.py --stats  # Show current stats")
        print("  python show_cache_monitor.py --clear  # Clear cache") 