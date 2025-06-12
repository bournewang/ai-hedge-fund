"""Rate Limit Manager for Yahoo Finance API

This module handles rate limiting for Yahoo Finance API with intelligent strategies:
- Request throttling and spacing
- Exponential backoff with jitter
- Circuit breaker pattern
- Request queuing and batching
- Distributed delays across multiple tickers
"""

import time
import random
import threading
from collections import defaultdict, deque
from datetime import datetime, timedelta
from typing import Dict, Callable, Any, Optional
import logging

logger = logging.getLogger(__name__)


class RateLimitManager:
    """Manages rate limiting for Yahoo Finance API requests."""
    
    def __init__(self):
        self.request_times = deque(maxlen=100)  # Track last 100 requests
        self.error_counts = defaultdict(int)
        self.last_error_time = defaultdict(float)
        self.circuit_breaker_until = defaultdict(float)
        self.lock = threading.Lock()
        
        # Configuration
        self.max_requests_per_minute = 30  # Conservative limit
        self.min_request_interval = 2.0   # Minimum 2 seconds between requests
        self.circuit_breaker_threshold = 5  # Errors before circuit break
        self.circuit_breaker_duration = 300  # 5 minutes circuit break
        self.base_retry_delay = 3.0
        self.max_retry_delay = 60.0
        
    def can_make_request(self, endpoint: str = "default") -> bool:
        """Check if we can make a request without hitting rate limits."""
        now = time.time()
        
        with self.lock:
            # Check circuit breaker
            if now < self.circuit_breaker_until[endpoint]:
                remaining = self.circuit_breaker_until[endpoint] - now
                logger.warning(f"Circuit breaker active for {endpoint}, {remaining:.0f}s remaining")
                return False
            
            # Check request rate
            one_minute_ago = now - 60
            self.request_times = deque([t for t in self.request_times if t > one_minute_ago], maxlen=100)
            
            if len(self.request_times) >= self.max_requests_per_minute:
                logger.warning(f"Rate limit would be exceeded ({len(self.request_times)}/{self.max_requests_per_minute} per minute)")
                return False
            
            # Check minimum interval
            if self.request_times and (now - self.request_times[-1]) < self.min_request_interval:
                logger.info(f"Minimum request interval not met, waiting...")
                return False
            
            return True
    
    def wait_for_rate_limit(self, endpoint: str = "default") -> None:
        """Wait until we can make a request."""
        while not self.can_make_request(endpoint):
            time.sleep(1.0)
    
    def record_request(self, endpoint: str = "default") -> None:
        """Record a successful request."""
        with self.lock:
            self.request_times.append(time.time())
            # Reset error count on successful request
            self.error_counts[endpoint] = 0
    
    def record_error(self, endpoint: str, error: Exception) -> None:
        """Record an error and potentially trigger circuit breaker."""
        now = time.time()
        
        with self.lock:
            self.error_counts[endpoint] += 1
            self.last_error_time[endpoint] = now
            
            if self.error_counts[endpoint] >= self.circuit_breaker_threshold:
                self.circuit_breaker_until[endpoint] = now + self.circuit_breaker_duration
                logger.error(f"Circuit breaker triggered for {endpoint} after {self.error_counts[endpoint]} errors")
    
    def get_retry_delay(self, endpoint: str, attempt: int) -> float:
        """Calculate retry delay with exponential backoff and jitter."""
        base_delay = min(self.base_retry_delay * (2 ** attempt), self.max_retry_delay)
        jitter = random.uniform(0.5, 1.5)  # Add randomness to prevent thundering herd
        
        # Additional delay based on recent errors
        error_multiplier = 1 + (self.error_counts[endpoint] * 0.5)
        
        return base_delay * jitter * error_multiplier
    
    def execute_with_rate_limiting(self, func: Callable, endpoint: str = "default", max_retries: int = 3) -> Any:
        """Execute a function with rate limiting and retry logic."""
        for attempt in range(max_retries + 1):
            # Wait for rate limit
            self.wait_for_rate_limit(endpoint)
            
            try:
                # Make the request
                result = func()
                self.record_request(endpoint)
                return result
                
            except Exception as e:
                error_msg = str(e).lower()
                is_rate_limit = any(indicator in error_msg for indicator in [
                    "too many requests", "rate limited", "429", "throttled", "quota exceeded"
                ])
                
                if is_rate_limit:
                    self.record_error(endpoint, e)
                    
                    if attempt < max_retries:
                        delay = self.get_retry_delay(endpoint, attempt)
                        logger.warning(f"Rate limited, retrying in {delay:.1f}s (attempt {attempt + 1}/{max_retries + 1})")
                        time.sleep(delay)
                        continue
                    else:
                        logger.error(f"Rate limit exceeded after {max_retries + 1} attempts for {endpoint}")
                        raise
                else:
                    # Non-rate-limit error, don't retry
                    logger.error(f"Non-rate-limit error for {endpoint}: {e}")
                    raise
        
        raise Exception(f"Failed to execute after {max_retries + 1} attempts")


# Global rate limit manager instance
rate_limit_manager = RateLimitManager()


def with_rate_limiting(endpoint: str = "default", max_retries: int = 3):
    """Decorator to add rate limiting to functions."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            def execute():
                return func(*args, **kwargs)
            return rate_limit_manager.execute_with_rate_limiting(execute, endpoint, max_retries)
        return wrapper
    return decorator


def smart_delay_between_tickers(ticker_index: int, total_tickers: int) -> None:
    """Add intelligent delays between ticker requests to distribute load."""
    if total_tickers > 1:
        # Distribute requests over time to avoid bursts
        delay_per_ticker = 1.0  # 1 second base delay
        stagger_delay = (ticker_index * delay_per_ticker) % 10  # Stagger over 10 seconds max
        
        if stagger_delay > 0:
            logger.info(f"Staggering request for ticker {ticker_index + 1}/{total_tickers}, waiting {stagger_delay:.1f}s")
            time.sleep(stagger_delay)


def get_rate_limit_status() -> Dict[str, Any]:
    """Get current rate limiting status for monitoring."""
    now = time.time()
    one_minute_ago = now - 60
    
    recent_requests = len([t for t in rate_limit_manager.request_times if t > one_minute_ago])
    
    return {
        "requests_last_minute": recent_requests,
        "max_requests_per_minute": rate_limit_manager.max_requests_per_minute,
        "circuit_breakers_active": {
            endpoint: until - now
            for endpoint, until in rate_limit_manager.circuit_breaker_until.items()
            if until > now
        },
        "error_counts": dict(rate_limit_manager.error_counts),
        "can_make_request": rate_limit_manager.can_make_request(),
    } 