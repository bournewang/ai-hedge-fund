"""FastAPI routes for explore page functionality."""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import logging

from src.tools.polygon_data import get_trending_data, get_day_gainers

router = APIRouter(prefix="/explore", tags=["explore"])
logger = logging.getLogger(__name__)


@router.get("/trending")
def get_trending_stocks() -> Dict[str, Any]:
    """
    Get trending stocks data for the explore page.
    
    Returns both day gainers and losers with comprehensive market data.
    """
    try:
        logger.info("Fetching trending stocks data for explore page using Polygon.io")
        
        trending_data = get_trending_data()
        
        if "error" in trending_data:
            logger.error(f"Error fetching trending data: {trending_data['error']}")
            raise HTTPException(status_code=500, detail="Failed to fetch trending stocks data")
        
        logger.info(f"Successfully returned {trending_data['total_gainers']} gainers and {trending_data['total_losers']} losers")
        
        return {
            "success": True,
            "data": trending_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_trending_stocks: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/gainers")
def get_gainers_only(count: int = 10) -> Dict[str, Any]:
    """
    Get only day gainers for focused trending data using Polygon.io.
    
    Args:
        count: Number of gainers to return (default: 10, max: 25)
    """
    try:
        if count < 1 or count > 25:
            raise HTTPException(status_code=400, detail="Count must be between 1 and 25")
        
        logger.info(f"Fetching {count} day gainers using Polygon.io")
        
        gainers = get_day_gainers(count=count)
        
        # Format for frontend (Polygon returns dict format, not object)
        formatted_gainers = []
        for stock_data in gainers:
            # Format market cap
            market_cap = stock_data.get('market_cap', 0)
            if market_cap >= 1_000_000_000:
                market_cap_formatted = f"${market_cap / 1_000_000_000:.1f}B"
            elif market_cap >= 1_000_000:
                market_cap_formatted = f"${market_cap / 1_000_000:.1f}M"
            else:
                market_cap_formatted = f"${market_cap:,.0f}" if market_cap > 0 else "N/A"
            
            formatted_gainers.append({
                "symbol": stock_data.get('symbol', ''),
                "company_name": stock_data.get('company_name', ''),
                "price": round(stock_data.get('price', 0), 2),
                "change": round(stock_data.get('change', 0), 2),
                "change_percent": round(stock_data.get('change_percent', 0), 2),
                "volume": stock_data.get('volume', 0),
                "market_cap": market_cap,
                "market_cap_formatted": market_cap_formatted,
                "sector": stock_data.get('sector'),
                "exchange": stock_data.get('exchange', 'US'),
                "fifty_two_week_high": stock_data.get('fifty_two_week_high'),
                "fifty_two_week_low": stock_data.get('fifty_two_week_low'),
                "pe_ratio": stock_data.get('pe_ratio'),
                "book_value": stock_data.get('book_value')
            })
        
        return {
            "success": True,
            "data": {
                "gainers": formatted_gainers,
                "total": len(formatted_gainers),
                "timestamp": "now"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching gainers: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch day gainers")


@router.get("/analyze/{symbol}")
def analyze_trending_stock(symbol: str) -> Dict[str, Any]:
    """
    Quick redirect endpoint for analyzing a trending stock.
    This will redirect to the main analysis page with the ticker pre-filled.
    
    Args:
        symbol: Stock ticker symbol to analyze
    """
    try:
        # Convert to uppercase for consistency
        symbol = symbol.upper()
        
        logger.info(f"Redirecting to analysis for trending stock: {symbol}")
        
        return {
            "success": True,
            "redirect_to": f"/api/hedge-fund/analyze",
            "ticker": symbol,
            "message": f"Redirecting to AI analysis for {symbol}"
        }
        
    except Exception as e:
        logger.error(f"Error setting up analysis redirect for {symbol}: {e}")
        raise HTTPException(status_code=500, detail="Failed to setup analysis redirect")


@router.get("/health")
def explore_health_check() -> Dict[str, str]:
    """Health check endpoint for explore functionality."""
    try:
        # Test Polygon.io connection with minimal request
        test_gainers = get_day_gainers(count=1)
        
        if test_gainers:
            return {"status": "healthy", "polygon_io": "connected", "data_source": "polygon"}
        else:
            return {"status": "degraded", "polygon_io": "no_data", "data_source": "polygon"}
            
    except Exception as e:
        logger.error(f"Explore health check failed: {e}")
        return {"status": "unhealthy", "error": str(e), "data_source": "polygon"} 