import asyncio
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from src.tools.api import get_prices, get_financial_metrics # Assuming other data fetching like search_line_items might be added later
from app.backend.services.graph import create_graph, run_graph_async
from src.data.cache import get_cache
from src.utils.analysts import ANALYST_CONFIG
import datetime
import hashlib

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

# --- Constants ---
DEFAULT_TICKERS_TO_MONITOR = ['AAPL', 'MSFT', 'GOOG']
AGENT_STYLES_TO_RUN = ['Value Investing', 'Technical Analysis', 'Growth Investing'] # Added Growth as per analyst list
CACHE_EXPIRY_SECONDS = 24 * 60 * 60  # 24 hours for analysis results

async def fetch_and_cache_all_data(tickers: list[str]):
    """
    Fetches and caches prices and financial metrics for a list of tickers.
    """
    cache = get_cache()
    logger.info(f"Starting data fetch for tickers: {tickers}")
    for ticker in tickers:
        try:
            logger.info(f"Fetching price data for {ticker}...")
            # Determine date range for prices, e.g., past year
            end_date_str = datetime.date.today().strftime("%Y-%m-%d")
            start_date_str = (datetime.date.today() - datetime.timedelta(days=365)).strftime("%Y-%m-%d")

            prices_list = await asyncio.to_thread(get_prices, ticker, start_date_str, end_date_str)
            # get_prices returns list[Price], cache expects list[dict]
            if prices_list:
                # The cache key for set_prices in api.py is f"{ticker}_{start_date}_{end_date}"
                # The cache set_prices method in cache.py takes ticker and list of dicts.
                # It internally calls _merge_data.
                # For scheduled tasks, we might want to overwrite or use a specific key if get_prices itself caches.
                # The current get_prices in api.py caches with a key f"{ticker}_{start_date}_{end_date}".
                # And its set_prices uses that same key.
                # The Cache class set_prices uses only the ticker as key. This is a mismatch.
                # For simplicity, I will assume the Cache class's set_prices is what we want for this scheduled task,
                # which means it will aggregate data under the simple ticker key.
                # However, the `prices` variable from api.get_prices are Pydantic models.
                cache.set_prices(ticker, [p.model_dump() for p in prices_list])
                logger.info(f"Successfully fetched and cached price data for {ticker}.")
            else:
                logger.warning(f"No price data returned for {ticker}.")

            logger.info(f"Fetching financial metrics for {ticker}...")
            # get_financial_metrics(ticker: str, end_date: str, period: str = "ttm", limit: int = 10)
            # For scheduled task, let's get latest TTM data
            financials_list = await asyncio.to_thread(get_financial_metrics, ticker, end_date_str, period="ttm", limit=20)
            if financials_list:
                # Similar to prices, convert Pydantic models to dicts for caching via Cache class
                cache.set_financial_metrics(ticker, [m.model_dump() for m in financials_list])
                logger.info(f"Successfully fetched and cached financial metrics for {ticker}.")
            else:
                logger.warning(f"No financial metrics returned for {ticker}.")

            # TODO: Consider adding other general data fetching here, e.g., company_news, line_items
            # from src.tools.api import get_company_news # search_line_items is not async
            # news_end_date = datetime.date.today().strftime("%Y-%m-%d")
            # news_start_date = (datetime.date.today() - datetime.timedelta(days=30)).strftime("%Y-%m-%d") # Example: last 30 days
            # company_news_list = await asyncio.to_thread(get_company_news, ticker, news_end_date, news_start_date, limit=50)
            # if company_news_list:
            #    cache.set_company_news(ticker, [n.model_dump() for n in company_news_list])


        except Exception as e:
            logger.error(f"Error fetching data for {ticker}: {e}", exc_info=True)
    logger.info(f"Completed data fetch for tickers: {tickers}")

def generate_ticker_list_hash(tickers: list[str]) -> str:
    """Generates a consistent hash for a list of tickers."""
    return hashlib.md5(".".join(sorted(list(set(tickers)))).encode()).hexdigest()

async def run_and_cache_style_analysis(agent_style: str, tickers: list[str]):
    """
    Runs analysis for a given agent style and list of tickers, then caches the results.
    """
    cache = get_cache()
    logger.info(f"Starting analysis for style '{agent_style}' with tickers: {tickers}")

    agents_for_style = {
        key: config
        for key, config in ANALYST_CONFIG.items()
        if config.get("style") == agent_style
    }

    if not agents_for_style:
        logger.warning(f"No agents found for style '{agent_style}'. Skipping analysis.")
        return

    agent_names = list(agents_for_style.keys())
    logger.info(f"Agents for style '{agent_style}': {agent_names}")

    # Construct a unique cache key
    ticker_list_hash = generate_ticker_list_hash(tickers)
    cache_key = f"{agent_style.replace(' ', '_')}_{ticker_list_hash}" # Example: Value_Investing_hashoftickers

    # Dummy values for portfolio and dates as this is for general analysis caching
    # In a real scenario, these might be configurable or represent a common baseline
    dummy_portfolio = {ticker: 10 for ticker in tickers} # Equal weighting for simplicity
    dummy_start_date = (datetime.date.today() - datetime.timedelta(days=365)).strftime("%Y-%m-%d")
    dummy_end_date = datetime.date.today().strftime("%Y-%m-%d")

    try:
        graph_name = f"{agent_style.replace(' ', '_')}_Analysis_Graph"
        compiled_graph = create_graph(
            name=graph_name,
            analyst_names=agent_names,
            portfolio_analyst_name=None, # No portfolio analyst for general style analysis
            default_tickers=tickers,
            default_portfolio=dummy_portfolio
        )
        logger.info(f"Graph '{graph_name}' created successfully for style '{agent_style}'.")

        # Configuration for the graph run
        # The inputs should match what the graph expects.
        # Assuming 'analysts_config_override' is a valid input for run_graph_async
        # to specify tickers and date ranges for the analysts.
        graph_inputs = {
            "analysts_config_override": {
                "default_tickers": tickers,
                "default_start_date": dummy_start_date,
                "default_end_date": dummy_end_date,
                "default_portfolio": dummy_portfolio # Pass portfolio here if analysts need it
            }
        }

        logger.info(f"Running graph '{graph_name}' with inputs: {graph_inputs}")
        # Ensure data is fetched if not already cached by individual agent tools
        # This can be done by having agents use the cache-aware data fetching tools
        # or by running fetch_and_cache_all_data before this analysis.

        analysis_result = await run_graph_async(compiled_graph, inputs=graph_inputs)

        if analysis_result and 'analyst_signals' in analysis_result:
            # Storing only relevant parts, e.g., signals and a summary if available
            # The structure of analysis_result might vary.
            data_to_cache = {
                "analyst_signals": analysis_result["analyst_signals"],
                "last_updated": datetime.datetime.utcnow().isoformat(),
                "tickers_analyzed": tickers,
                "agent_style": agent_style
            }
            if "summary_report" in analysis_result: # Or any other relevant output
                 data_to_cache["summary_report"] = analysis_result["summary_report"]

            cache.set_analysis_results(cache_key, data_to_cache) # Removed expiration from set, diskcache handles it if configured globally
            logger.info(f"Successfully ran and cached analysis for style '{agent_style}' on tickers {tickers}. Cache key: {cache_key}")
        else:
            logger.warning(f"Analysis for style '{agent_style}' did not produce expected results (missing 'analyst_signals'). Result: {analysis_result}")

    except Exception as e:
        logger.error(f"Error running analysis for style '{agent_style}': {e}", exc_info=True)

def schedule_daily_tasks():
    """
    Schedules daily tasks for data fetching and analysis.
    """
    logger.info("Scheduling daily tasks...")

    # Schedule data fetching for all monitored tickers
    # Runs daily at 1:00 AM server time
    scheduler.add_job(
        fetch_and_cache_all_data,
        trigger='cron',
        args=[DEFAULT_TICKERS_TO_MONITOR],
        hour=1,
        minute=0,
        id="daily_fetch_all_data",
        replace_existing=True
    )
    logger.info(f"Scheduled 'fetch_and_cache_all_data' for tickers {DEFAULT_TICKERS_TO_MONITOR} daily at 1:00 AM.")

    # Schedule analysis for each agent style
    # Staggering them by a few minutes
    for i, style in enumerate(AGENT_STYLES_TO_RUN):
        scheduler.add_job(
            run_and_cache_style_analysis,
            trigger='cron',
            args=[style, DEFAULT_TICKERS_TO_MONITOR],
            hour=2, # Start analysis tasks at 2:00 AM
            minute=i * 15,  # Stagger by 15 minutes
            id=f"daily_analysis_{style.replace(' ', '_')}",
            replace_existing=True
        )
        logger.info(f"Scheduled 'run_and_cache_style_analysis' for style '{style}' on tickers {DEFAULT_TICKERS_TO_MONITOR} daily at 2:{i*15:02d} AM.")

    logger.info("All daily tasks scheduled.")

async def start_scheduler():
    """
    Schedules tasks and starts the scheduler.
    """
    logger.info("Initializing and starting scheduler...")
    schedule_daily_tasks()
    scheduler.start()
    logger.info("Scheduler started.")

async def shutdown_scheduler():
    """
    Shuts down the scheduler.
    """
    if scheduler.running:
        logger.info("Shutting down scheduler...")
        scheduler.shutdown()
        logger.info("Scheduler shut down.")
    else:
        logger.info("Scheduler not running.")

if __name__ == '__main__':
    # Example of how to run the scheduler directly for testing
    # In a real app, this would be managed by the FastAPI lifecycle
    async def main():
        await start_scheduler()
        try:
            # Keep the main thread alive to let the scheduler run
            while True:
                await asyncio.sleep(1)
        except (KeyboardInterrupt, SystemExit):
            await shutdown_scheduler()
    asyncio.run(main())
