import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

# Assuming your FastAPI app instance is created in `app.main.app`
# Adjust the import according to your project structure.
# If `app.main` doesn't exist or `app` is elsewhere, this needs to be changed.
# For this example, let's assume a common structure:
from app.main import app  # Placeholder: Replace with actual app import
from app.backend.models.schemas import HedgeFundRequest # For payload

client = TestClient(app)

@pytest.mark.asyncio
class TestHedgeFundRoutes:

    @patch("app.backend.routes.hedge_fund.run_graph_async", new_callable=AsyncMock) # Patching at the location it's used
    async def test_run_hedge_fund_on_demand_force_refresh(self, mock_run_graph_async):
        # Setup:
        # Mock run_graph_async to avoid actual graph execution and to capture its arguments.
        # It needs to be an AsyncMock because run_hedge_fund awaits it.
        # The mock should simulate returning a valid structure that the endpoint expects to avoid errors in the endpoint itself.
        # A minimal successful result from run_graph_async might look like:
        # {"messages": [{"content": "{}"}], "data": {"analyst_signals": {}}}
        # The actual content of 'messages' would be a JSON string of decisions.
        mock_run_graph_async.return_value = {
            "messages": [{"content": '{"decisions": []}'}], # Minimal valid JSON string
            "data": {"analyst_signals": {}}
        }

        # Sample HedgeFundRequest payload
        test_payload = HedgeFundRequest(
            initial_cash=1000000,
            margin_requirement=0.5,
            tickers=["AAPL", "MSFT"],
            selected_agents=["fundamentals_analyst_agent"],
            model_provider="OpenAI",
            model_name="gpt-4-turbo",
            start_date="2023-01-01",
            end_date="2023-12-31"
        )

        # Action:
        # The TestClient handles JSON serialization for the payload.
        # Note: The original /hedge-fund/run endpoint in App.tsx was sending requestBody as a query parameter for EventSource.
        # However, FastAPI @router.post typically expects a JSON body.
        # The backend route `run_hedge_fund` takes `request: HedgeFundRequest` which implies it expects a POST body.
        # If the endpoint truly expects it as a query param, this test call would need to be adjusted.
        # Assuming standard POST with JSON body here.
        response = client.post("/hedge-fund/run", json=test_payload.model_dump())

        # Assertions:
        # Check if the endpoint responded successfully (even if it's streaming, the initial response should be 200)
        assert response.status_code == 200

        # Assert run_graph_async was called
        mock_run_graph_async.assert_called_once()

        # Get the keyword arguments passed to run_graph_async
        _, kwargs = mock_run_graph_async.call_args

        # Assert force_refresh=True was passed
        assert "force_refresh" in kwargs, "force_refresh should be an argument to run_graph_async"
        assert kwargs["force_refresh"] is True, "force_refresh should be True for on-demand runs"

        # Optionally, verify other arguments if necessary
        assert kwargs["tickers"] == test_payload.tickers
        assert kwargs["model_name"] == test_payload.model_name
        # ... etc. for other important parameters if needed


# Note: If your app creation is more complex or requires specific configurations for testing,
# you might need a fixture to provide the `app` instance.
# For example, if `app.main.app` is not directly importable or needs setup:
#
# @pytest.fixture
# def test_app():
#     # from my_project.main import create_app # Hypothetical app factory
#     # app = create_app(testing=True)
#     # For now, using the direct import assumption
#     from app.main import app
#     return app
#
# client = TestClient(test_app()) # If using a fixture
#
# Also, the SSE nature of the endpoint means that `response.json()` might not be directly usable
# if the response is a stream. However, for testing the call to `run_graph_async`,
# we primarily care about the arguments passed to it before the streaming begins.
# The TestClient will still allow us to get the initial status code.
