"""API routes for recent analysis results."""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List
import logging

from app.backend.services.recent_analysis import get_recent_analyses_with_performance, clear_old_analyses

router = APIRouter(prefix="/recent-analyses", tags=["recent-analyses"])
logger = logging.getLogger(__name__)


@router.get("")
def get_recent_analyses(limit: int = Query(default=20, ge=1, le=100)) -> Dict[str, Any]:
    """
    Get recent analysis results with performance tracking.
    
    Args:
        limit: Maximum number of analyses to return (1-100)
    
    Returns:
        Dictionary containing success status and analysis data
    """
    try:
        logger.info(f"Fetching {limit} recent analyses")
        
        analyses = get_recent_analyses_with_performance(limit=limit)
        print("analyses", analyses)
        
        return {
            "success": True,
            "data": analyses,
            "total": len(analyses),
            "message": f"Retrieved {len(analyses)} recent analyses"
        }
        
    except Exception as e:
        logger.error(f"Error fetching recent analyses: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch recent analyses")


@router.get("/stats")
def get_recent_analysis_stats() -> Dict[str, Any]:
    """
    Get statistics about recent analyses.
    
    Returns:
        Dictionary containing analysis statistics
    """
    try:
        analyses = get_recent_analyses_with_performance(limit=100)
        
        # Calculate statistics
        total_analyses = len(analyses)
        if total_analyses == 0:
            return {
                "success": True,
                "data": {
                    "total_analyses": 0,
                    "avg_performance": 0,
                    "positive_analyses": 0,
                    "negative_analyses": 0,
                    "success_rate": 0,
                    "top_performers": [],
                    "recent_tickers": []
                }
            }
        
        # Performance statistics
        valid_performances = [a["change_percent_numeric"] for a in analyses if a.get("change_percent_numeric") is not None]
        
        avg_performance = sum(valid_performances) / len(valid_performances) if valid_performances else 0
        positive_count = sum(1 for p in valid_performances if p > 0)
        negative_count = sum(1 for p in valid_performances if p < 0)
        success_rate = (positive_count / len(valid_performances) * 100) if valid_performances else 0
        
        # Top performers (best 5)
        top_performers = sorted(
            [a for a in analyses if a.get("change_percent_numeric") is not None],
            key=lambda x: x["change_percent_numeric"],
            reverse=True
        )[:5]
        
        # Recent unique tickers
        recent_tickers = list(dict.fromkeys([a["ticker"] for a in analyses[:20]]))  # Preserve order, remove duplicates
        
        return {
            "success": True,
            "data": {
                "total_analyses": total_analyses,
                "avg_performance": round(avg_performance, 2),
                "positive_analyses": positive_count,
                "negative_analyses": negative_count,
                "success_rate": round(success_rate, 1),
                "top_performers": [
                    {
                        "ticker": tp["ticker"],
                        "change": tp["change"],
                        "signal": tp["signal"],
                        "time": tp["time"]
                    } for tp in top_performers
                ],
                "recent_tickers": recent_tickers[:10]  # Last 10 unique tickers
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting analysis stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get analysis statistics")


@router.delete("/cleanup")
def cleanup_old_analyses() -> Dict[str, Any]:
    """
    Clean up old analysis records (older than 30 days).
    
    Returns:
        Dictionary containing cleanup results
    """
    try:
        cleared_count = clear_old_analyses()
        
        return {
            "success": True,
            "message": f"Cleaned up {cleared_count} old analysis records",
            "cleared_count": cleared_count
        }
        
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")
        raise HTTPException(status_code=500, detail="Failed to cleanup old analyses")


@router.get("/health")
def recent_analysis_health_check() -> Dict[str, str]:
    """Health check endpoint for recent analysis functionality."""
    try:
        # Test retrieval
        analyses = get_recent_analyses_with_performance(limit=1)
        
        return {
            "status": "healthy",
            "message": f"Recent analysis service operational. {len(analyses)} recent analyses available.",
            "service": "recent_analysis"
        }
        
    except Exception as e:
        logger.error(f"Recent analysis health check failed: {e}")
        return {
            "status": "unhealthy", 
            "error": str(e),
            "service": "recent_analysis"
        } 