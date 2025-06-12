"""FastAPI routes for explore page functionality."""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import logging

from src.tools.yahoo_finance import get_trending_data, get_day_gainers

router = APIRouter(prefix="/explore", tags=["explore"])
logger = logging.getLogger(__name__)


@router.get("/trending")
def get_trending_stocks() -> Dict[str, Any]:
    """
    Get trending stocks data for the explore page.
    
    Returns both day gainers and losers with comprehensive market data.
    """
    try:
        logger.info("Fetching trending stocks data for explore page")
        
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
    Get only day gainers for focused trending data.
    
    Args:
        count: Number of gainers to return (default: 10, max: 25)
    """
    try:
        if count < 1 or count > 25:
            raise HTTPException(status_code=400, detail="Count must be between 1 and 25")
        
        logger.info(f"Fetching {count} day gainers")
        
        gainers = get_day_gainers(count=count)
        
        # Format for frontend
        formatted_gainers = []
        for stock in gainers:
            formatted_gainers.append({
                "symbol": stock.symbol,
                "company_name": stock.company_name,
                "price": round(stock.price, 2),
                "change": round(stock.change, 2),
                "change_percent": round(stock.change_percent, 2),
                "volume": stock.volume,
                "market_cap": stock.market_cap,
                "market_cap_formatted": f"${stock.market_cap / 1_000_000_000:.1f}B" if stock.market_cap >= 1_000_000_000 else f"${stock.market_cap / 1_000_000:.1f}M",
                "sector": stock.sector,
                "exchange": stock.exchange,
                "fifty_two_week_high": stock.fifty_two_week_high,
                "fifty_two_week_low": stock.fifty_two_week_low,
                "pe_ratio": round(stock.pe_ratio, 2) if stock.pe_ratio else None,
                "book_value": round(stock.book_value, 2) if stock.book_value else None
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
        # Test Yahoo Finance connection with minimal request
        test_gainers = get_day_gainers(count=1)
        
        if test_gainers:
            return {"status": "healthy", "yahoo_finance": "connected"}
        else:
            return {"status": "degraded", "yahoo_finance": "no_data"}
            
    except Exception as e:
        logger.error(f"Explore health check failed: {e}")
        return {"status": "unhealthy", "error": str(e)} 