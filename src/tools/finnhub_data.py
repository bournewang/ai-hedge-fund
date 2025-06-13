"""Finnhub Data Adapter

Provides price data (with batch support), per-ticker caching, and rate limiting.
"""

import os
import requests
import time
from typing import List, Dict, Any
from datetime import datetime
from src.data.cache import get_cache
from src.data.models import Price, FinancialMetrics, LineItem, CompanyNews, InsiderTrade
from dateutil import parser

# Finnhub API config
FINNHUB_API_KEY = os.environ.get("FINNHUB_API_KEY")
FINNHUB_BASE_URL = "https://finnhub.io/api/v1"

# Global cache instance
_cache = get_cache()

# Simple in-memory rate limiter (token bucket)
RATE_LIMIT = 60  # calls per minute
TOKEN_BUCKET = RATE_LIMIT
LAST_REFILL = time.time()


def _rate_limit():
    global TOKEN_BUCKET, LAST_REFILL
    now = time.time()
    elapsed = now - LAST_REFILL
    refill = int(elapsed * RATE_LIMIT / 60)
    if refill > 0:
        TOKEN_BUCKET = min(RATE_LIMIT, TOKEN_BUCKET + refill)
        LAST_REFILL = now
    if TOKEN_BUCKET == 0:
        sleep_time = 60 - elapsed
        if sleep_time > 0:
            time.sleep(sleep_time)
        TOKEN_BUCKET = RATE_LIMIT
        LAST_REFILL = time.time()
    TOKEN_BUCKET -= 1


def get_prices_finnhub(tickers: List[str], start_date: str, end_date: str) -> Dict[str, List[Price]]:
    """Fetch prices for multiple tickers using Finnhub /quote endpoint (one by one). Returns dict: ticker -> List[Price]."""
    result: Dict[str, List[Price]] = {}
    today = datetime.now().strftime('%Y-%m-%d')
    for ticker in tickers:
        cache_key = f"finnhub_{ticker}_{start_date}_{end_date}"
        cached = _cache.get_prices(cache_key)
        if cached:
            result[ticker] = [Price(**p) for p in cached]
            continue
        url = f"{FINNHUB_BASE_URL}/quote?symbol={ticker}&token={FINNHUB_API_KEY}"
        print(f"Fetching {url}")
        _rate_limit()
        resp = requests.get(url)
        if resp.status_code == 403:
            print(f"[ERROR] 403 Forbidden for {ticker}: You may not have access to this endpoint on your Finnhub plan.")
            result[ticker] = []
            continue
        if resp.status_code != 200:
            print(f"[ERROR] Finnhub API error for {ticker}: {resp.status_code} {resp.text}")
            result[ticker] = []
            continue
        data = resp.json()
        if not data or data.get('c') is None:
            result[ticker] = []
            continue
        price = Price(
            ticker=ticker,
            date=today,
            open=data.get('o'),
            high=data.get('h'),
            low=data.get('l'),
            close=data.get('c'),
            volume=data.get('v') if data.get('v') is not None else 0,
            adj_close=data.get('c'),
        )
        result[ticker] = [price]
        _cache.set_prices(cache_key, [price.model_dump()])
    return result

def get_historical_prices_finnhub(ticker: str, start_date: str, end_date: str, resolution: str = "D") -> List[Price]:
    """Fetch historical prices for a single ticker using Finnhub's /stock/candle endpoint."""
    cache_key = f"finnhub_hist_{ticker}_{start_date}_{end_date}_{resolution}"
    cached = _cache.get_prices(cache_key)
    if cached:
        return [Price(**p) for p in cached]

    # Convert dates to UNIX timestamps
    start_ts = int(parser.parse(start_date).timestamp())
    end_ts = int(parser.parse(end_date).timestamp())

    url = f"{FINNHUB_BASE_URL}/stock/candle?symbol={ticker}&resolution={resolution}&from={start_ts}&to={end_ts}&token={FINNHUB_API_KEY}"
    _rate_limit()
    resp = requests.get(url)
    if resp.status_code != 200:
        raise Exception(f"Finnhub API error: {resp.status_code} {resp.text}")
    data = resp.json()
    if data.get("s") != "ok":
        return []
    prices = []
    for i in range(len(data["t"])):
        price = Price(
            ticker=ticker,
            date=datetime.utcfromtimestamp(data["t"][i]).strftime('%Y-%m-%d'),
            open=data["o"][i],
            high=data["h"][i],
            low=data["l"][i],
            close=data["c"][i],
            volume=data["v"][i],
            adj_close=data["c"][i],
        )
        prices.append(price)
    _cache.set_prices(cache_key, [p.model_dump() for p in prices])
    return prices 

def get_financials_finnhub(ticker: str, statement: str = "ic", freq: str = "annual") -> List[LineItem]:
    """Fetch company financials (income statement, balance sheet, cash flow) from Finnhub."""
    cache_key = f"finnhub_financials_{ticker}_{statement}_{freq}"
    cached = _cache.get_line_items(cache_key)
    if cached:
        return [LineItem(**item) for item in cached]
    url = f"{FINNHUB_BASE_URL}/stock/financials-reported?symbol={ticker}&token={FINNHUB_API_KEY}"
    _rate_limit()
    resp = requests.get(url)
    if resp.status_code != 200:
        raise Exception(f"Finnhub API error: {resp.status_code} {resp.text}")
    data = resp.json()
    # Finnhub returns a list of reports; map to LineItem
    results = []
    for report in data.get("data", []):
        period = report.get("period")
        for fs in report.get("report", {}).get("ic", []) + report.get("report", {}).get("bs", []) + report.get("report", {}).get("cf", []):
            item = LineItem(
                ticker=ticker,
                report_period=period,
                period=freq,
                currency=fs.get("unit", "USD"),
                **{fs.get("label"): fs.get("value")}
            )
            results.append(item)
    _cache.set_line_items(cache_key, [item.model_dump() for item in results])
    return results

def get_metrics_finnhub(ticker: str) -> FinancialMetrics:
    """Fetch key metrics for a ticker from Finnhub."""
    cache_key = f"finnhub_metrics_{ticker}"
    cached = _cache.get_financial_metrics(cache_key)
    if cached:
        return FinancialMetrics(**cached[0])
    url = f"{FINNHUB_BASE_URL}/stock/metric?symbol={ticker}&metric=all&token={FINNHUB_API_KEY}"
    _rate_limit()
    resp = requests.get(url)
    if resp.status_code != 200:
        raise Exception(f"Finnhub API error: {resp.status_code} {resp.text}")
    data = resp.json().get("metric", {})
    metrics = FinancialMetrics(
        ticker=ticker,
        report_period=datetime.now().strftime('%Y-%m-%d'),
        period="ttm",
        currency="USD",
        market_cap=data.get("marketCapitalization"),
        enterprise_value=data.get("enterpriseValue"),
        price_to_earnings_ratio=data.get("peBasicExclExtraTTM"),
        price_to_book_ratio=data.get("pbAnnual"),
        price_to_sales_ratio=data.get("psTTM"),
        enterprise_value_to_ebitda_ratio=data.get("evToEbitdaAnnual"),
        enterprise_value_to_revenue_ratio=data.get("evToSalesAnnual"),
        free_cash_flow_yield=data.get("freeCashFlowYieldTTM"),
        peg_ratio=data.get("pegAnnual"),
        gross_margin=data.get("grossMarginTTM"),
        operating_margin=data.get("operatingMarginTTM"),
        net_margin=data.get("netProfitMarginTTM"),
        return_on_equity=data.get("roeAnnual"),
        return_on_assets=data.get("roaTTM"),
        return_on_invested_capital=data.get("roiAnnual"),
        asset_turnover=data.get("assetTurnoverAnnual"),
        current_ratio=data.get("currentRatioAnnual"),
        quick_ratio=data.get("quickRatioAnnual"),
        debt_to_equity=data.get("totalDebt/totalEquityAnnual"),
        debt_to_assets=None,
        interest_coverage=None,
        revenue_growth=data.get("revenueGrowth3Y"),
        earnings_growth=data.get("epsGrowth3Y"),
        earnings_per_share_growth=None,
        free_cash_flow_growth=None,
        payout_ratio=data.get("payoutRatioAnnual"),
        earnings_per_share=data.get("epsTTM"),
        book_value_per_share=data.get("bookValuePerShareAnnual"),
        free_cash_flow_per_share=None,
    )
    _cache.set_financial_metrics(cache_key, [metrics.model_dump()])
    return metrics

def get_company_news_finnhub(ticker: str, start_date: str, end_date: str) -> List[CompanyNews]:
    """Fetch company news from Finnhub."""
    cache_key = f"finnhub_news_{ticker}_{start_date}_{end_date}"
    cached = _cache.get_company_news(cache_key)
    if cached:
        return [CompanyNews(**n) for n in cached]
    url = f"{FINNHUB_BASE_URL}/company-news?symbol={ticker}&from={start_date}&to={end_date}&token={FINNHUB_API_KEY}"
    _rate_limit()
    resp = requests.get(url)
    if resp.status_code != 200:
        raise Exception(f"Finnhub API error: {resp.status_code} {resp.text}")
    data = resp.json()
    news_list = []
    for item in data:
        news = CompanyNews(
            ticker=ticker,
            date=datetime.utcfromtimestamp(item.get("datetime")).strftime('%Y-%m-%d'),
            title=item.get("headline", ""),
            content=item.get("summary", ""),
            url=item.get("url", ""),
            source=item.get("source", "")
        )
        news_list.append(news)
    _cache.set_company_news(cache_key, [n.model_dump() for n in news_list])
    return news_list

def get_insider_trades_finnhub(ticker: str, from_date: str, to_date: str) -> List[InsiderTrade]:
    """Fetch insider trades from Finnhub."""
    cache_key = f"finnhub_insider_{ticker}_{from_date}_{to_date}"
    cached = _cache.get_insider_trades(cache_key)
    if cached:
        return [InsiderTrade(**t) for t in cached]
    url = f"{FINNHUB_BASE_URL}/stock/insider-transactions?symbol={ticker}&from={from_date}&to={to_date}&token={FINNHUB_API_KEY}"
    _rate_limit()
    resp = requests.get(url)
    if resp.status_code != 200:
        raise Exception(f"Finnhub API error: {resp.status_code} {resp.text}")
    data = resp.json()
    trades = []
    for item in data.get("data", []):
        trade = InsiderTrade(
            ticker=ticker,
            filing_date=item.get("transactionDate", ""),
            insider_name=item.get("name", ""),
            position=item.get("position", ""),
            transaction_type=item.get("transactionType", ""),
            shares=item.get("share", 0),
            price=item.get("transactionPrice", 0),
            value=item.get("transactionValue", 0)
        )
        trades.append(trade)
    _cache.set_insider_trades(cache_key, [t.model_dump() for t in trades])
    return trades 