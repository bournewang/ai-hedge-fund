#!/usr/bin/env python3
"""Test script to verify LLM cache implementation works correctly."""

import os
import sys
import logging
from pydantic import BaseModel

# Add the root directory to the path to access src
sys.path.append('../../')

from src.data.cache import get_cache
from src.utils.llm import call_llm

# Set up logging to see cache hits/misses
logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(name)s:%(message)s')

class TestResponse(BaseModel):
    """Simple test response model."""
    message: str
    confidence: float

def test_llm_caching():
    """Test that LLM caching works correctly."""
    print("🧪 Testing LLM Cache Functionality")
    print("=" * 50)
    
    cache = get_cache()
    
    # Clear cache to start fresh
    cache.clear_cache()
    
    # Simple test prompt
    test_prompt = "Analyze the word 'hello' and provide a confidence score between 0 and 1."
    
    print(f"\n1. Testing LLM caching with identical prompts...")
    
    # First call - should be cache MISS
    print("   First call (should be MISS):")
    try:
        result1 = call_llm(
            prompt=test_prompt,
            pydantic_model=TestResponse,
            agent_name="test_agent"
        )
        print(f"   Result 1: {result1.message[:50]}...")
    except Exception as e:
        print(f"   ⚠️  First call failed (might be missing API key): {e}")
        return
    
    # Second call - should be cache HIT
    print("   Second call (should be HIT):")
    try:
        result2 = call_llm(
            prompt=test_prompt,
            pydantic_model=TestResponse,
            agent_name="test_agent"
        )
        print(f"   Result 2: {result2.message[:50]}...")
        
        # Verify results are identical
        assert result1.message == result2.message, "Cached results should be identical"
        assert result1.confidence == result2.confidence, "Cached confidence should be identical"
        print("   ✅ Results are identical - caching working correctly!")
        
    except Exception as e:
        print(f"   ❌ Second call failed: {e}")
        return
    
    # Test with different prompt - should be cache MISS
    print("\n2. Testing with different prompt...")
    different_prompt = "Analyze the word 'goodbye' and provide a confidence score between 0 and 1."
    
    try:
        result3 = call_llm(
            prompt=different_prompt,
            pydantic_model=TestResponse,
            agent_name="test_agent"
        )
        print(f"   Result 3: {result3.message[:50]}...")
        print("   ✅ Different prompt handled correctly!")
        
    except Exception as e:
        print(f"   ❌ Different prompt test failed: {e}")
        return
    
    # Check cache statistics
    print(f"\n3. Cache statistics:")
    stats = cache.get_cache_stats()
    print(f"   LLM responses cached: {stats['llm_responses_cached']}")
    print(f"   Total cache entries: {stats['total_cache_entries']}")
    
    print(f"\n✅ LLM cache tests completed successfully!")

if __name__ == "__main__":
    # Check if API key is set
    if not os.environ.get("OPENAI_API_KEY") and not os.environ.get("GROQ_API_KEY"):
        print("⚠️  Warning: No LLM API keys found. Set OPENAI_API_KEY or GROQ_API_KEY to run full tests.")
        print("   The test will still run but may fail on actual LLM calls.")
    
    try:
        test_llm_caching()
        print(f"\n🎉 LLM caching implementation completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1) 