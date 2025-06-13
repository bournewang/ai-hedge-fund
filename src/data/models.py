from typing import List, Optional, Dict, Union, Any
from pydantic import BaseModel


class Price(BaseModel):
    ticker: str
    date: str
    open: float
    close: float
    high: float
    low: float
    volume: int
    adj_close: Optional[float] = None


class PriceResponse(BaseModel):
    ticker: str
    prices: List[Price]


class FinancialMetrics(BaseModel):
    ticker: str
    report_period: str
    period: str
    currency: str
    market_cap: Optional[float]
    enterprise_value: Optional[float]
    price_to_earnings_ratio: Optional[float]
    price_to_book_ratio: Optional[float]
    price_to_sales_ratio: Optional[float]
    enterprise_value_to_ebitda_ratio: Optional[float]
    enterprise_value_to_revenue_ratio: Optional[float]
    free_cash_flow_yield: Optional[float]
    peg_ratio: Optional[float]
    gross_margin: Optional[float]
    operating_margin: Optional[float]
    net_margin: Optional[float]
    return_on_equity: Optional[float]
    return_on_assets: Optional[float]
    return_on_invested_capital: Optional[float]
    asset_turnover: Optional[float]
    inventory_turnover: Optional[float]
    receivables_turnover: Optional[float]
    days_sales_outstanding: Optional[float]
    operating_cycle: Optional[float]
    working_capital_turnover: Optional[float]
    current_ratio: Optional[float]
    quick_ratio: Optional[float]
    cash_ratio: Optional[float]
    operating_cash_flow_ratio: Optional[float]
    debt_to_equity: Optional[float]
    debt_to_assets: Optional[float]
    interest_coverage: Optional[float]
    revenue_growth: Optional[float]
    earnings_growth: Optional[float]
    book_value_growth: Optional[float]
    earnings_per_share_growth: Optional[float]
    free_cash_flow_growth: Optional[float]
    operating_income_growth: Optional[float]
    ebitda_growth: Optional[float]
    payout_ratio: Optional[float]
    earnings_per_share: Optional[float]
    book_value_per_share: Optional[float]
    free_cash_flow_per_share: Optional[float]


class FinancialMetricsResponse(BaseModel):
    financial_metrics: List[FinancialMetrics]


class LineItem(BaseModel):
    ticker: str
    report_period: str
    period: str
    currency: str
    
    # Common financial statement line items that agents expect
    # Revenue items
    revenues: Optional[float] = None
    revenue: Optional[float] = None
    
    # Profitability items
    gross_profit: Optional[float] = None
    operating_income: Optional[float] = None
    operating_income_loss: Optional[float] = None
    net_income: Optional[float] = None
    net_income_loss: Optional[float] = None
    
    # Margin ratios
    operating_margin: Optional[float] = None
    gross_margin: Optional[float] = None
    net_margin: Optional[float] = None
    
    # Cash flow items
    free_cash_flow: Optional[float] = None
    net_cash_flow_from_operating_activities: Optional[float] = None
    operating_cash_flow: Optional[float] = None
    
    # Balance sheet items
    assets: Optional[float] = None
    total_assets: Optional[float] = None
    current_assets: Optional[float] = None
    liabilities: Optional[float] = None
    total_liabilities: Optional[float] = None
    current_liabilities: Optional[float] = None
    stockholders_equity: Optional[float] = None
    equity: Optional[float] = None
    working_capital: Optional[float] = None
    total_debt: Optional[float] = None
    
    # Investment items
    capital_expenditures: Optional[float] = None
    capital_expenditure: Optional[float] = None
    research_and_development_expenses: Optional[float] = None
    research_and_development: Optional[float] = None
    depreciation_and_amortization: Optional[float] = None
    
    # Asset items
    intangible_assets: Optional[float] = None
    goodwill: Optional[float] = None
    goodwill_and_intangible_assets: Optional[float] = None
    cash_and_cash_equivalents: Optional[float] = None
    cash_and_equivalents: Optional[float] = None
    inventory: Optional[float] = None
    accounts_receivable: Optional[float] = None
    accounts_payable: Optional[float] = None
    
    # Debt items
    long_term_debt: Optional[float] = None
    short_term_debt: Optional[float] = None
    
    # Equity items
    shareholders_equity: Optional[float] = None
    retained_earnings: Optional[float] = None
    common_stock_shares_outstanding: Optional[float] = None
    outstanding_shares: Optional[float] = None
    
    # Expense items
    operating_expenses: Optional[float] = None
    operating_expense: Optional[float] = None
    selling_general_and_administrative_expenses: Optional[float] = None
    interest_expense: Optional[float] = None
    income_tax_expense: Optional[float] = None
    
    # Distribution items  
    dividends_paid: Optional[float] = None
    dividends_and_other_cash_distributions: Optional[float] = None
    
    # Per share items
    earnings_per_share: Optional[float] = None
    basic_earnings_per_share: Optional[float] = None
    diluted_earnings_per_share: Optional[float] = None
    
    # Financial ratios and derived metrics
    return_on_invested_capital: Optional[float] = None
    debt_to_equity: Optional[float] = None
    
    # Allow additional fields dynamically
    model_config = {"extra": "allow"}


class LineItemResponse(BaseModel):
    search_results: List[LineItem]


class InsiderTrade(BaseModel):
    ticker: str
    filing_date: str
    insider_name: Optional[str] = None
    position: Optional[str] = None
    transaction_type: Optional[str] = None
    shares: Optional[float] = None
    price: Optional[float] = None
    value: Optional[float] = None
    # Legacy fields for compatibility
    issuer: Optional[str] = None
    name: Optional[str] = None
    title: Optional[str] = None
    is_board_director: Optional[bool] = None
    transaction_date: Optional[str] = None
    transaction_shares: Optional[float] = None
    transaction_price_per_share: Optional[float] = None
    transaction_value: Optional[float] = None
    shares_owned_before_transaction: Optional[float] = None
    shares_owned_after_transaction: Optional[float] = None
    security_title: Optional[str] = None


class InsiderTradeResponse(BaseModel):
    insider_trades: List[InsiderTrade]


class CompanyNews(BaseModel):
    ticker: str
    date: str
    title: str
    content: Optional[str] = None
    url: Optional[str] = None
    source: Optional[str] = None
    # Legacy fields for compatibility
    author: Optional[str] = None
    sentiment: Optional[str] = None


class CompanyNewsResponse(BaseModel):
    news: List[CompanyNews]


class CompanyFacts(BaseModel):
    ticker: str
    name: str
    cik: Optional[str] = None
    industry: Optional[str] = None
    sector: Optional[str] = None
    category: Optional[str] = None
    exchange: Optional[str] = None
    is_active: Optional[bool] = None
    listing_date: Optional[str] = None
    location: Optional[str] = None
    market_cap: Optional[float] = None
    number_of_employees: Optional[int] = None
    sec_filings_url: Optional[str] = None
    sic_code: Optional[str] = None
    sic_industry: Optional[str] = None
    sic_sector: Optional[str] = None
    website_url: Optional[str] = None
    weighted_average_shares: Optional[int] = None


class CompanyFactsResponse(BaseModel):
    company_facts: CompanyFacts


class Position(BaseModel):
    cash: float = 0.0
    shares: int = 0
    ticker: str


class Portfolio(BaseModel):
    positions: Dict[str, Position]  # ticker -> Position mapping
    total_cash: float = 0.0


class AnalystSignal(BaseModel):
    signal: Optional[str] = None
    confidence: Optional[float] = None
    reasoning: Union[Dict, str, None] = None
    max_position_size: Optional[float] = None  # For risk management signals


class TickerAnalysis(BaseModel):
    ticker: str
    analyst_signals: Dict[str, AnalystSignal]  # agent_name -> signal mapping


class AgentStateData(BaseModel):
    tickers: List[str]
    portfolio: Portfolio
    start_date: str
    end_date: str
    ticker_analyses: Dict[str, TickerAnalysis]  # ticker -> analysis mapping


class AgentStateMetadata(BaseModel):
    show_reasoning: bool = False
    model_config = {"extra": "allow"}
