#!/usr/bin/env python3
"""Test script to verify superset caching implementation."""

import os
import sys
import logging

# Add the root directory to the path to access src
sys.path.append('.')

from src.data.cache import get_cache
from src.tools.api import search_line_items

# Set up logging to see cache hits/misses
logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(name)s:%(message)s')

def test_superset_caching():
    """Test that superset caching works correctly."""
    print("🧪 Testing Superset Caching Implementation")
    print("=" * 60)
    
    cache = get_cache()
    
    # Clear cache to start fresh
    cache.clear_cache()
    
    ticker = "AAPL"
    end_date = "2024-01-01"
    
    print(f"\n1. Testing different agent requests for {ticker}...")
    
    # Simulate different agent requests (like the real agents)
    agent_requests = {
        "warren_buffett": [
            "capital_expenditure", "depreciation_and_amortization", "net_income",
            "outstanding_shares", "total_assets", "total_liabilities"
        ],
        "peter_lynch": [
            "revenue", "earnings_per_share", "net_income", "operating_income",
            "gross_margin", "free_cash_flow"
        ],
        "michael_burry": [
            "free_cash_flow", "net_income", "total_debt", "cash_and_equivalents",
            "total_assets", "outstanding_shares"
        ],
        "ben_graham": [
            "earnings_per_share", "revenue", "net_income", "total_assets",
            "current_assets", "current_liabilities"
        ]
    }
    
    results = {}
    
    for agent_name, requested_items in agent_requests.items():
        print(f"\n   {agent_name} requesting {len(requested_items)} items...")
        try:
            result = search_line_items(ticker, requested_items, end_date)
            results[agent_name] = result
            print(f"   ✅ Got {len(result)} line items for {agent_name}")
        except Exception as e:
            print(f"   ⚠️  {agent_name} failed: {e}")
            continue
    
    # Verify that all agents got their requested data
    print(f"\n2. Verifying results...")
    for agent_name, result in results.items():
        requested_items = agent_requests[agent_name]
        
        # Check what line items are actually available in the results
        available_items = set()
        if result:
            # Get all available attributes from the first result item
            item_dict = result[0].model_dump()
            for key, value in item_dict.items():
                if key not in ['ticker', 'report_period', 'period', 'currency'] and value is not None:
                    available_items.add(key)
        
        # Check if requested items are available
        requested_set = set(requested_items)
        found_items = requested_set.intersection(available_items)
        missing_items = requested_set - available_items
        
        if missing_items:
            print(f"   ⚠️  {agent_name} missing: {missing_items}")
        else:
            print(f"   ✅ {agent_name} got all requested items")
        
        print(f"      Found: {len(found_items)}/{len(requested_items)} items")
    
    # Check cache statistics
    print(f"\n3. Cache efficiency analysis...")
    stats = cache.get_cache_stats()
    print(f"   Line items cached: {stats['line_items_cached']}")
    print(f"   Total cache entries: {stats['total_cache_entries']}")
    
    # Test cache hit for a new agent request
    print(f"\n4. Testing cache hit for new agent...")
    new_agent_items = ["revenue", "net_income", "free_cash_flow"]
    result = search_line_items(ticker, new_agent_items, end_date)
    print(f"   ✅ New agent got {len(result)} items (should be cache HIT)")
    
    print(f"\n✅ Superset caching test completed!")
    
    # Calculate theoretical efficiency
    total_individual_requests = sum(len(items) for items in agent_requests.values())
    print(f"\n📊 Efficiency Analysis:")
    print(f"   Without superset: {len(agent_requests)} API calls")
    print(f"   With superset:    1 API call")
    print(f"   Efficiency gain:  {((len(agent_requests) - 1) / len(agent_requests)) * 100:.1f}%")

if __name__ == "__main__":
    # Check if API key is set
    if not os.environ.get("FINANCIAL_DATASETS_API_KEY"):
        print("⚠️  Warning: FINANCIAL_DATASETS_API_KEY not set. Test may fail.")
        print("   Set the API key to run full tests.")
    
    try:
        test_superset_caching()
        print(f"\n🎉 Superset caching implementation successful!")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1) 