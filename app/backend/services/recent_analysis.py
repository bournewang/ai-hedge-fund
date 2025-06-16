"""Service for managing recent analysis results in cache."""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from src.data.cache import get_cache
from src.tools.polygon_data import get_latest_price_polygon

logger = logging.getLogger(__name__)
cache = get_cache()


def save_analysis_result(
    tickers: List[str],
    analyst_signals: Dict[str, Dict[str, Any]],
    decisions: Dict[str, Any],
    selected_agents: List[str],
    start_date: str,
    end_date: str
) -> None:
    """
    Save analysis results to cache for recent analysis tracking.
    
    Args:
        tickers: List of analyzed tickers
        analyst_signals: Agent analysis results
        decisions: Final hedge fund decisions
        selected_agents: List of agents used in analysis
        start_date: Analysis start date
        end_date: Analysis end date
    """
    try:
        timestamp = datetime.now().isoformat()
        
        # Process each ticker
        for ticker in tickers:
            # Determine overall signal from decisions
            ticker_decision = decisions.get(ticker, {})
            action = ticker_decision.get("action", "hold").upper()
            confidence = ticker_decision.get("confidence", 0)
            
            # Map action to signal
            if action in ["BUY", "LONG"]:
                signal = "BUY" if confidence < 80 else "STRONG BUY"
            elif action in ["SELL", "SHORT"]:
                signal = "SELL" if confidence < 80 else "STRONG SELL"  
            else:
                signal = "HOLD"
            
            # Get current price for performance tracking
            try:
                current_price_obj = get_latest_price_polygon(ticker)
                initial_price = current_price_obj.close if current_price_obj else None
            except Exception as e:
                logger.warning(f"Could not fetch current price for {ticker}: {e}")
                initial_price = None
            
            # Count agent signals for this ticker
            agent_count = 0
            bullish_count = 0
            for agent_key, agent_results in analyst_signals.items():
                if ticker in agent_results:
                    agent_count += 1
                    agent_signal = agent_results[ticker].get("signal", "").lower()
                    if agent_signal in ["bullish", "buy", "long"]:
                        bullish_count += 1
            
            # Create analysis record
            analysis_record = {
                "id": f"{ticker}_{timestamp}",
                "ticker": ticker,
                "signal": signal,
                "confidence": confidence,
                "timestamp": timestamp,
                "initial_price": initial_price,
                "agents_used": selected_agents,
                "agent_count": agent_count,
                "bullish_agents": bullish_count,
                "bearish_agents": agent_count - bullish_count,
                "analysis_period": f"{start_date} to {end_date}",
                "reasoning": ticker_decision.get("reasoning", "")[:200] + "..." if ticker_decision.get("reasoning", "") else "Analysis completed"
            }
            
            # Save to cache
            cache.add_recent_analysis(analysis_record)
            logger.info(f"Saved analysis result for {ticker} with signal {signal}")
            
    except Exception as e:
        logger.error(f"Error saving analysis results: {e}")


def get_recent_analyses_with_performance(limit: int = 20) -> List[Dict[str, Any]]:
    """
    Get recent analyses with current performance calculations.
    
    Args:
        limit: Maximum number of analyses to return
        
    Returns:
        List of analysis records with performance data
    """
    try:
        # Get cached analyses
        analyses = cache.get_recent_analyses(limit)
        
        # Calculate performance for each analysis
        enriched_analyses = []
        for analysis in analyses:
            try:
                ticker = analysis["ticker"]
                initial_price = analysis.get("initial_price")
                
                # Calculate daily change (today's close vs today's open)
                change_percent = None
                current_price = None
                
                try:
                    # get_latest_price_polygon returns previous close data from Polygon
                    price_data = get_latest_price_polygon(ticker)
                    if price_data:
                        current_price = price_data.close
                        
                        # Calculate daily change: (close - open) / open * 100
                        if price_data.open > 0:
                            change_percent = ((price_data.close - price_data.open) / price_data.open) * 100
                            
                except Exception as e:
                    logger.warning(f"Could not fetch price data for {ticker}: {e}")
                
                # Format change for display
                if change_percent is not None:
                    change_display = f"{change_percent:+.1f}%"
                else:
                    change_display = "N/A"
                
                # Calculate time ago
                try:
                    analysis_time = datetime.fromisoformat(analysis["timestamp"])
                    time_diff = datetime.now() - analysis_time
                    
                    if time_diff.days > 0:
                        time_ago = f"{time_diff.days}d ago"
                    elif time_diff.seconds > 3600:
                        hours = time_diff.seconds // 3600
                        time_ago = f"{hours}h ago"
                    else:
                        minutes = time_diff.seconds // 60
                        time_ago = f"{minutes}m ago"
                except:
                    time_ago = "Unknown"
                
                # Add performance data
                enriched_analysis = analysis.copy()
                enriched_analysis.update({
                    "change": change_display,
                    "change_percent_numeric": change_percent,
                    "time": time_ago,
                    "current_price": current_price if change_percent is not None else None
                })
                
                enriched_analyses.append(enriched_analysis)
                
            except Exception as e:
                logger.warning(f"Error processing analysis {analysis.get('id', 'unknown')}: {e}")
                # Still include the analysis without performance data
                enriched_analysis = analysis.copy()
                enriched_analysis.update({
                    "change": "N/A",
                    "change_percent_numeric": None,
                    "time": "Unknown"
                })
                enriched_analyses.append(enriched_analysis)
        
        return enriched_analyses
        
    except Exception as e:
        logger.error(f"Error getting recent analyses: {e}")
        return []


def clear_old_analyses() -> int:
    """
    Clear old analysis records (called periodically for cleanup).
    
    Returns:
        Number of analyses cleared
    """
    try:
        # Get all analyses
        all_analyses = cache.get_recent_analyses(limit=1000)  # Get all
        
        # Filter to keep only last 30 days
        current_time = datetime.now()
        valid_analyses = []
        
        for analysis in all_analyses:
            try:
                analysis_time = datetime.fromisoformat(analysis["timestamp"])
                days_old = (current_time - analysis_time).days
                
                if days_old <= 30:  # Keep analyses from last 30 days
                    valid_analyses.append(analysis)
            except:
                # Skip analyses with invalid timestamps
                continue
        
        # Clear and re-add valid analyses
        cache.clear_recent_analyses()
        for analysis in valid_analyses:
            cache.add_recent_analysis(analysis)
            
        cleared_count = len(all_analyses) - len(valid_analyses)
        if cleared_count > 0:
            logger.info(f"Cleared {cleared_count} old analysis records")
            
        return cleared_count
        
    except Exception as e:
        logger.error(f"Error clearing old analyses: {e}")
        return 0 