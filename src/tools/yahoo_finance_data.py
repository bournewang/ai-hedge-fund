"""Yahoo Finance Data Adapter

This module provides a free alternative to the Financial Datasets API using Yahoo Finance.
It implements the same interface as the existing API functions but uses yfinance as the data source.

Features:
- Free data access (no API keys required)
- Real-time market data
- Comprehensive financial statements  
- Historical price data
- Company news and insider trades
- Full compatibility with existing cache system
"""

import datetime
import logging
import pandas as pd
import yfinance as yf
from typing import List, Optional, Dict, Any
from datetime import timedelta
import time
import random

from src.data.cache import get_cache
from src.data.models import (
    CompanyNews,
    FinancialMetrics,
    Price,
    LineItem,
    InsiderTrade,
)

# Global cache instance
_cache = get_cache()

# Set up logging
logger = logging.getLogger(__name__)

# Define mapping from our line item names to Yahoo Finance keys
YAHOO_LINE_ITEM_MAPPING = {
    # Income Statement mappings
    "revenue": "Total Revenue",
    "gross_profit": "Gross Profit", 
    "operating_income": "Operating Income",
    "net_income": "Net Income",
    "ebit": "EBIT",
    "ebitda": "EBITDA",
    "earnings_per_share": "Basic EPS",
    "operating_expense": "Operating Expense",
    "interest_expense": "Interest Expense",
    "research_and_development": "Research And Development",
    
    # Balance Sheet mappings
    "total_assets": "Total Assets",
    "total_liabilities": "Total Liab",
    "shareholders_equity": "Stockholder Equity",
    "current_assets": "Current Assets",
    "current_liabilities": "Current Liabilities",
    "cash_and_equivalents": "Cash And Cash Equivalents",
    "total_debt": "Total Debt",
    "goodwill_and_intangible_assets": "Goodwill And Other Intangible Assets",
    "outstanding_shares": "Share Issued",
    
    # Cash Flow mappings  
    "free_cash_flow": "Free Cash Flow",
    "capital_expenditure": "Capital Expenditure", 
    "depreciation_and_amortization": "Depreciation And Amortization",
    "dividends_and_other_cash_distributions": "Cash Dividends Paid",
    "issuance_or_purchase_of_equity_shares": "Issuance Of Stock",
    
    # Calculated metrics
    "working_capital": None,  # Will be calculated
    "book_value_per_share": None,  # Will be calculated
    "gross_margin": None,  # Will be calculated  
    "operating_margin": None,  # Will be calculated
    "debt_to_equity": None,  # Will be calculated
    "return_on_invested_capital": None,  # Will be calculated
}


def get_prices_yahoo(ticker: str, start_date: str, end_date: str) -> List[Price]:
    """Fetch price data from Yahoo Finance with caching."""
    cache_key = f"yahoo_{ticker}_{start_date}_{end_date}"
    
    # Check cache first
    if cached_data := _cache.get_prices(cache_key):
        logger.info(f"Cache HIT for yahoo_prices: {cache_key}")
        return [Price(**price) for price in cached_data]

    logger.info(f"Cache MISS for yahoo_prices: {cache_key}")
    
    try:
        # Fetch data from Yahoo Finance
        stock = yf.Ticker(ticker)
        hist = stock.history(start=start_date, end=end_date)
        
        prices = []
        for date, row in hist.iterrows():
            price = Price(
                ticker=ticker,
                date=date.strftime('%Y-%m-%d'),
                open=float(row['Open']),
                high=float(row['High']),
                low=float(row['Low']),
                close=float(row['Close']),
                volume=int(row['Volume']),
                adj_close=float(row.get('Adj Close', row['Close']))
            )
            prices.append(price)
        
        # Cache the results
        _cache.set_prices(cache_key, [p.model_dump() for p in prices])
        logger.info(f"Cached yahoo_prices for: {cache_key}")
        return prices
        
    except Exception as e:
        logger.error(f"Error fetching Yahoo Finance prices for {ticker}: {e}")
        return []


def get_financial_metrics_yahoo(
    ticker: str,
    end_date: str,
    period: str = "ttm",
    limit: int = 10,
) -> List[FinancialMetrics]:
    """Fetch financial metrics from Yahoo Finance with caching."""
    cache_key = f"yahoo_metrics_{ticker}_{period}_{end_date}_{limit}"
    
    # Check cache first
    if cached_data := _cache.get_financial_metrics(cache_key):
        logger.info(f"Cache HIT for yahoo_financial_metrics: {cache_key}")
        return [FinancialMetrics(**metric) for metric in cached_data]

    logger.info(f"Cache MISS for yahoo_financial_metrics: {cache_key}")
    
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        
        # Get financial statements for calculations
        financials = stock.financials
        balance_sheet = stock.balance_sheet
        cashflow = stock.cashflow
        
        metrics_list = []
        
        # Get recent periods based on limit
        periods_to_process = min(limit, 4)  # Yahoo typically provides 4 years max
        
        for i in range(periods_to_process):
            # Calculate report period (work backwards from current date)
            base_date = datetime.datetime.strptime(end_date, '%Y-%m-%d')
            if period == "annual":
                report_date = base_date - timedelta(days=365 * i)
            else:  # ttm
                report_date = base_date - timedelta(days=90 * i)
            
            report_period = report_date.strftime('%Y-%m-%d')
            
            # Extract key metrics from Yahoo Finance info
            metrics = FinancialMetrics(
                ticker=ticker,
                report_period=report_period,
                period=period,
                currency=info.get('currency', 'USD'),
                market_cap=info.get('marketCap'),
                enterprise_value=info.get('enterpriseValue'),
                price_to_earnings_ratio=info.get('trailingPE'),
                price_to_book_ratio=info.get('priceToBook'),
                price_to_sales_ratio=info.get('priceToSalesTrailing12Months'),
                enterprise_value_to_ebitda_ratio=info.get('enterpriseToEbitda'),
                enterprise_value_to_revenue_ratio=info.get('enterpriseToRevenue'),
                free_cash_flow_yield=_calculate_fcf_yield(info),
                peg_ratio=info.get('pegRatio'),
                gross_margin=info.get('grossMargins'),
                operating_margin=info.get('operatingMargins'),
                net_margin=info.get('profitMargins'),
                return_on_equity=info.get('returnOnEquity'),
                return_on_assets=info.get('returnOnAssets'),
                return_on_invested_capital=_calculate_roic(info, balance_sheet),
                asset_turnover=_calculate_asset_turnover(info, balance_sheet),
                current_ratio=info.get('currentRatio'),
                quick_ratio=info.get('quickRatio'),
                debt_to_equity=info.get('debtToEquity'),
                debt_to_assets=_calculate_debt_to_assets(balance_sheet),
                interest_coverage=_calculate_interest_coverage(financials),
                revenue_growth=info.get('revenueGrowth'),
                earnings_growth=info.get('earningsGrowth'),
                earnings_per_share_growth=info.get('earningsQuarterlyGrowth'),
                free_cash_flow_growth=_calculate_fcf_growth(cashflow),
                payout_ratio=info.get('payoutRatio'),
                earnings_per_share=info.get('trailingEps'),
                book_value_per_share=info.get('bookValue'),
                free_cash_flow_per_share=_calculate_fcf_per_share(info, cashflow),
            )
            metrics_list.append(metrics)
        
        # Cache the results
        _cache.set_financial_metrics(cache_key, [m.model_dump() for m in metrics_list])
        logger.info(f"Cached yahoo_financial_metrics for: {cache_key}")
        return metrics_list
        
    except Exception as e:
        logger.error(f"Error fetching Yahoo Finance metrics for {ticker}: {e}")
        return []


def search_line_items_yahoo(
    ticker: str,
    line_items: List[str],
    end_date: str,
    period: str = "ttm",
    limit: int = 10,
) -> List[LineItem]:
    """Fetch line items from Yahoo Finance with caching."""
    cache_key = f"yahoo_line_items_{ticker}_{end_date}_{period}_{limit}"
    
    # Check cache first for the superset
    if cached_data := _cache.get_line_items(cache_key):
        logger.info(f"Cache HIT for yahoo_line_items: {cache_key}")
        all_line_items = [LineItem(**item) for item in cached_data]
        
        # Filter to return only requested line items
        return _filter_line_items(all_line_items, line_items)

    logger.info(f"Cache MISS for yahoo_line_items: {cache_key}")
    
    try:
        stock = yf.Ticker(ticker)
        
        # Get financial statements
        if period == "annual":
            financials = stock.financials
            balance_sheet = stock.balance_sheet  
            cashflow = stock.cashflow
        else:  # quarterly/ttm
            financials = stock.quarterly_financials
            balance_sheet = stock.quarterly_balance_sheet
            cashflow = stock.quarterly_cashflow
        
        line_items_list = []
        
        # Process available periods (up to limit)
        available_periods = min(len(financials.columns), limit) if not financials.empty else 0
        
        for i in range(available_periods):
            period_date = financials.columns[i]
            report_period = period_date.strftime('%Y-%m-%d')
            
            # Create LineItem with all available data
            line_item_data = {
                'ticker': ticker,
                'report_period': report_period,
                'period': period,
                'currency': 'USD'  # Default, could be improved
            }
            
            # Extract data from financial statements
            line_item_data.update(_extract_line_items_from_statements(
                financials.iloc[:, i] if not financials.empty else pd.Series(),
                balance_sheet.iloc[:, i] if not balance_sheet.empty else pd.Series(),
                cashflow.iloc[:, i] if not cashflow.empty else pd.Series()
            ))
            
            line_item = LineItem(**line_item_data)
            line_items_list.append(line_item)
        
        # Cache the results
        _cache.set_line_items(cache_key, [item.model_dump() for item in line_items_list])
        logger.info(f"Cached yahoo_line_items for: {cache_key}")
        
        return _filter_line_items(line_items_list, line_items)
        
    except Exception as e:
        logger.error(f"Error fetching Yahoo Finance line items for {ticker}: {e}")
        return []


def get_market_cap_yahoo(ticker: str, end_date: str) -> Optional[float]:
    """Fetch market cap from Yahoo Finance with caching."""
    cache_key = f"yahoo_market_cap_{ticker}_{end_date}"
    
    # Check cache first
    if cached_data := _cache.get_market_cap(cache_key):
        logger.info(f"Cache HIT for yahoo_market_cap: {cache_key} {cached_data}")
        return cached_data
    
    logger.info(f"Cache MISS for yahoo_market_cap: {cache_key}")
    
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        market_cap = info.get('marketCap')
        
        if market_cap is not None:
            _cache.set_market_cap(cache_key, market_cap)
            logger.info(f"Cached yahoo_market_cap for: {cache_key}")
        
        return market_cap
        
    except Exception as e:
        logger.error(f"Error fetching Yahoo Finance market cap for {ticker}: {e}")
        return None


def get_company_news_yahoo(
    ticker: str,
    end_date: str,
    start_date: Optional[str] = None,
    limit: int = 1000,
) -> List[CompanyNews]:
    """Fetch company news from Yahoo Finance with caching."""
    cache_key = f"yahoo_news_{ticker}_{start_date}_{end_date}_{limit}"
    
    # Check cache first
    if cached_data := _cache.get_company_news(cache_key):
        logger.info(f"Cache HIT for yahoo_company_news: {cache_key}")
        return [CompanyNews(**news) for news in cached_data]

    logger.info(f"Cache MISS for yahoo_company_news: {cache_key}")
    
    try:
        stock = yf.Ticker(ticker)
        news_data = stock.news
        
        news_list = []
        for item in news_data[:limit]:
            # Convert timestamp to date string
            news_date = datetime.datetime.fromtimestamp(
                item.get('providerPublishTime', 0)
            ).strftime('%Y-%m-%d')
            
            # Filter by date range if specified
            if start_date and news_date < start_date:
                continue
            if news_date > end_date:
                continue
                
            news = CompanyNews(
                ticker=ticker,
                date=news_date,
                title=item.get('title', ''),
                content=item.get('summary', ''),
                url=item.get('link', ''),
                source=item.get('publisher', '')
            )
            news_list.append(news)
        
        # Cache the results
        _cache.set_company_news(cache_key, [n.model_dump() for n in news_list])
        logger.info(f"Cached yahoo_company_news for: {cache_key}")
        return news_list
        
    except Exception as e:
        logger.error(f"Error fetching Yahoo Finance news for {ticker}: {e}")
        return []


def get_insider_trades_yahoo(
    ticker: str,
    end_date: str,
    start_date: Optional[str] = None,
    limit: int = 1000,
) -> List[InsiderTrade]:
    """Fetch insider trades from Yahoo Finance with caching."""
    cache_key = f"yahoo_insider_{ticker}_{start_date}_{end_date}_{limit}"
    
    # Check cache first
    if cached_data := _cache.get_insider_trades(cache_key):
        logger.info(f"Cache HIT for yahoo_insider_trades: {cache_key}")
        return [InsiderTrade(**trade) for trade in cached_data]

    logger.info(f"Cache MISS for yahoo_insider_trades: {cache_key}")
    
    try:
        stock = yf.Ticker(ticker)
        insider_data = stock.insider_trades
        
        trades_list = []
        if insider_data is not None and not insider_data.empty:
            for _, row in insider_data.head(limit).iterrows():
                # Convert to our InsiderTrade format
                filing_date = row.get('Start Date', '').strftime('%Y-%m-%d') if pd.notna(row.get('Start Date')) else ''
                
                # Filter by date range if specified
                if start_date and filing_date < start_date:
                    continue
                if filing_date > end_date:
                    continue
                
                trade = InsiderTrade(
                    ticker=ticker,
                    filing_date=filing_date,
                    insider_name=str(row.get('Insider', '')),
                    position=str(row.get('Position', '')),
                    transaction_type=str(row.get('Transaction', '')),
                    shares=float(row.get('Shares', 0)) if pd.notna(row.get('Shares')) else 0.0,
                    price=float(row.get('Value', 0)) if pd.notna(row.get('Value')) else 0.0,
                    value=float(row.get('Value', 0)) if pd.notna(row.get('Value')) else 0.0
                )
                trades_list.append(trade)
        
        # Cache the results
        _cache.set_insider_trades(cache_key, [t.model_dump() for t in trades_list])
        logger.info(f"Cached yahoo_insider_trades for: {cache_key}")
        return trades_list
        
    except Exception as e:
        logger.error(f"Error fetching Yahoo Finance insider trades for {ticker}: {e}")
        return []


# Helper functions for calculations
def _calculate_fcf_yield(info: Dict) -> Optional[float]:
    """Calculate free cash flow yield."""
    try:
        fcf = info.get('freeCashflow')
        market_cap = info.get('marketCap')
        if fcf and market_cap and market_cap > 0:
            return fcf / market_cap
    except:
        pass
    return None


def _calculate_roic(info: Dict, balance_sheet: pd.DataFrame) -> Optional[float]:
    """Calculate return on invested capital."""
    try:
        # This is a simplified ROIC calculation
        roe = info.get('returnOnEquity')
        if roe:
            return roe  # Simplified - could be improved with more detailed calculation
    except:
        pass
    return None


def _calculate_asset_turnover(info: Dict, balance_sheet: pd.DataFrame) -> Optional[float]:
    """Calculate asset turnover ratio."""
    try:
        total_revenue = info.get('totalRevenue')
        if not balance_sheet.empty and total_revenue:
            total_assets = balance_sheet.loc['Total Assets'].iloc[0] if 'Total Assets' in balance_sheet.index else None
            if total_assets and total_assets > 0:
                return total_revenue / total_assets
    except:
        pass
    return None


def _calculate_debt_to_assets(balance_sheet: pd.DataFrame) -> Optional[float]:
    """Calculate debt to assets ratio."""
    try:
        if not balance_sheet.empty:
            total_debt = balance_sheet.loc['Total Debt'].iloc[0] if 'Total Debt' in balance_sheet.index else None
            total_assets = balance_sheet.loc['Total Assets'].iloc[0] if 'Total Assets' in balance_sheet.index else None
            if total_debt and total_assets and total_assets > 0:
                return total_debt / total_assets
    except:
        pass
    return None


def _calculate_interest_coverage(financials: pd.DataFrame) -> Optional[float]:
    """Calculate interest coverage ratio."""
    try:
        if not financials.empty:
            ebit = financials.loc['EBIT'].iloc[0] if 'EBIT' in financials.index else None
            interest_expense = financials.loc['Interest Expense'].iloc[0] if 'Interest Expense' in financials.index else None
            if ebit and interest_expense and interest_expense > 0:
                return ebit / interest_expense
    except:
        pass
    return None


def _calculate_fcf_growth(cashflow: pd.DataFrame) -> Optional[float]:
    """Calculate free cash flow growth."""
    try:
        if not cashflow.empty and len(cashflow.columns) >= 2:
            current_fcf = cashflow.loc['Free Cash Flow'].iloc[0] if 'Free Cash Flow' in cashflow.index else None
            previous_fcf = cashflow.loc['Free Cash Flow'].iloc[1] if 'Free Cash Flow' in cashflow.index else None
            if current_fcf and previous_fcf and previous_fcf != 0:
                return (current_fcf - previous_fcf) / abs(previous_fcf)
    except:
        pass
    return None


def _calculate_fcf_per_share(info: Dict, cashflow: pd.DataFrame) -> Optional[float]:
    """Calculate free cash flow per share."""
    try:
        fcf = info.get('freeCashflow')
        shares = info.get('sharesOutstanding')
        if fcf and shares and shares > 0:
            return fcf / shares
    except:
        pass
    return None


def _extract_line_items_from_statements(
    financials: pd.Series,
    balance_sheet: pd.Series, 
    cashflow: pd.Series
) -> Dict[str, Any]:
    """Extract line items from Yahoo Finance financial statements."""
    line_items = {}
    
    # Helper function to safely get values
    def safe_get(series: pd.Series, key: str) -> Optional[float]:
        try:
            if key in series.index and pd.notna(series[key]):
                return float(series[key])
        except:
            pass
        return None
    
    # Map line items from financial statements
    for our_key, yahoo_key in YAHOO_LINE_ITEM_MAPPING.items():
        if yahoo_key is None:
            continue  # Skip calculated fields for now
            
        # Try to find the value in the appropriate statement
        value = None
        if not financials.empty:
            value = safe_get(financials, yahoo_key)
        if value is None and not balance_sheet.empty:
            value = safe_get(balance_sheet, yahoo_key)
        if value is None and not cashflow.empty:
            value = safe_get(cashflow, yahoo_key)
            
        if value is not None:
            line_items[our_key] = value
    
    # Calculate derived metrics
    if 'current_assets' in line_items and 'current_liabilities' in line_items:
        line_items['working_capital'] = line_items['current_assets'] - line_items['current_liabilities']
    
    if 'shareholders_equity' in line_items and 'outstanding_shares' in line_items and line_items['outstanding_shares'] > 0:
        line_items['book_value_per_share'] = line_items['shareholders_equity'] / line_items['outstanding_shares']
    
    if 'gross_profit' in line_items and 'revenue' in line_items and line_items['revenue'] > 0:
        line_items['gross_margin'] = line_items['gross_profit'] / line_items['revenue']
    
    if 'operating_income' in line_items and 'revenue' in line_items and line_items['revenue'] > 0:
        line_items['operating_margin'] = line_items['operating_income'] / line_items['revenue']
    
    if 'total_debt' in line_items and 'shareholders_equity' in line_items and line_items['shareholders_equity'] > 0:
        line_items['debt_to_equity'] = line_items['total_debt'] / line_items['shareholders_equity']
    
    return line_items


def _filter_line_items(all_line_items: List[LineItem], requested_items: List[str]) -> List[LineItem]:
    """Filter line items to return only those containing requested data."""
    requested_set = set(requested_items)
    filtered_results = []
    
    for item in all_line_items:
        item_dict = item.model_dump()
        has_requested_data = False
        
        for requested_item in requested_set:
            if requested_item in item_dict and item_dict[requested_item] is not None:
                has_requested_data = True
                break
        
        if has_requested_data:
            filtered_results.append(item)
    
    return filtered_results


def is_rate_limited_error(error_msg: str) -> bool:
    """Check if error message indicates rate limiting."""
    rate_limit_indicators = [
        "Too Many Requests",
        "Rate limited",
        "429",
        "rate limit",
        "throttled",
        "quota exceeded"
    ]
    return any(indicator.lower() in str(error_msg).lower() for indicator in rate_limit_indicators)


def retry_with_backoff(func, max_retries: int = 3, base_delay: float = 1.0):
    """Retry a function with exponential backoff for rate limiting."""
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if is_rate_limited_error(str(e)):
                if attempt < max_retries - 1:  # Not the last attempt
                    delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                    logger.warning(f"Rate limited, retrying in {delay:.1f}s (attempt {attempt + 1}/{max_retries})")
                    time.sleep(delay)
                    continue
                else:
                    logger.error(f"Rate limit exceeded after {max_retries} attempts")
                    raise
            else:
                # Non-rate-limit error, don't retry
                raise
    return None 