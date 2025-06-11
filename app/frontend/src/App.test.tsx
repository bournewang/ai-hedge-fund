import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App'; // Assuming App is the default export

// Mock the api service
jest.mock('./services/api', () => ({
  api: {
    get: jest.fn(),
    defaults: { baseURL: 'http://localhost:8000/api/v1' }, // Mock baseURL
    // Mock other methods like post, stream if they exist and are used directly by App.tsx
  },
}));

// Mock global fetch
global.fetch = jest.fn();

const mockApiGet = jest.requireMock('./services/api').api.get;
const mockFetch = global.fetch;

// Helper to create a mock SSE stream
function createMockSseStream(events: Array<{ type: string; data: any }>) {
  let eventIndex = 0;
  const stream = new ReadableStream({
    pull(controller) {
      if (eventIndex < events.length) {
        const event = events[eventIndex++];
        const eventString = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
        controller.enqueue(new TextEncoder().encode(eventString));
      } else {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}


describe('App Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockApiGet.mockReset();
    mockFetch.mockReset();

    // Default mock for initial data load (available-results-keys)
    mockApiGet.mockImplementation(async (url: string) => {
      if (url === '/cached-analysis/available-results-keys') {
        return Promise.resolve(['style_A_key', 'style_B_key']); // Mock some keys
      }
      if (url.startsWith('/cached-analysis/results/')) {
         // Mock data for individual style keys
        return Promise.resolve({ analyst_signals: [{ ticker: "AAPL", agent_name: "TestAgent", signal: "Buy", confidence: 70 }] });
      }
      return Promise.reject(new Error(`Unhandled API GET request: ${url}`));
    });
  });

  test('renders initial layout and loads initial data', async () => {
    render(<App />);
    // Check for some static layout elements
    expect(screen.getByText(/Investment Style Analysis/i)).toBeInTheDocument();

    // Check if loading state appears then disappears
    expect(screen.getByText(/Loading initial analysis data.../i)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(/Loading initial analysis data.../i)).not.toBeInTheDocument());

    // Check if data for mocked styles is displayed (very basic check)
    expect(screen.getByText(/Style A Key/i)).toBeInTheDocument(); // From styleNameFromKey
    expect(screen.getByText(/AAPL/i)).toBeInTheDocument(); // From mock analyst_signals
  });

  describe('runWatchlistAnalysisHandler SSE processing and state updates', () => {
    const ON_DEMAND_STYLE_KEY = "On-Demand Analysis"; // As defined in App.tsx

    test('successful run with "complete" event updates allAnalysisData', async () => {
      render(<App />);
      // Wait for initial load to complete to avoid state update conflicts
      await waitFor(() => expect(screen.queryByText(/Loading initial analysis data.../i)).not.toBeInTheDocument());

      const mockAnalystSignals = {
        "MSFT": { "fundamentals_analyst_agent": { signal: "Buy", confidence: 0.85, reasoning: "Solid fundamentals" } },
        "GOOG": { "technicals_agent": { signal: "Hold", confidence: 0.60, reasoning: "Neutral MACD" } }
      };
      const sseEvents = [
        { type: 'start', data: { message: 'Analysis started' } },
        { type: 'complete', data: { decisions: {}, analyst_signals: mockAnalystSignals } }
      ];
      mockFetch.mockResolvedValueOnce(createMockSseStream(sseEvents));

      // Find and click the "Run Analysis for Watchlist" button
      // Assuming default watchlist has AAPL, TSLA. Button text will reflect this.
      const runAnalysisButton = screen.getByRole('button', { name: /Run Analysis for Watchlist \(2 tickers\)/i });

      await act(async () => {
        fireEvent.click(runAnalysisButton);
      });

      // Check loading states
      expect(screen.getByText(/Analysis Running.../i)).toBeInTheDocument();
      await waitFor(() => expect(screen.queryByText(/Analysis Running.../i)).not.toBeInTheDocument(), { timeout: 2000 }); // Extend timeout if needed

      // Assertions on allAnalysisData (indirectly, by checking if the UI reflects the new data)
      // This part is tricky as it depends on how allAnalysisData is rendered.
      // For now, we can assume that if ON_DEMAND_STYLE_KEY appears in the style sections, data was merged.
      // A more direct way would be to expose allAnalysisData for testing or use a testing utility that can inspect state.

      // Let's check if the MonitorView updates or if a new section for "On-Demand Analysis" appears.
      // Since MonitorView shows prominent signals, and we didn't set one for the new items,
      // we'll check for the presence of the tickers from the on-demand run if they are displayed.
      // This test needs to be adapted based on how `ON_DEMAND_STYLE_KEY` data is actually rendered.
      // If StyleSection is used for ON_DEMAND_STYLE_KEY:
      await waitFor(() => {
        expect(screen.getByText(ON_DEMAND_STYLE_KEY)).toBeInTheDocument();
        // Check for one of the tickers from the mockAnalystSignals within the on-demand section
        const onDemandSection = screen.getByText(ON_DEMAND_STYLE_KEY).closest('section'); // Or appropriate parent selector
        if (onDemandSection) {
            expect(within(onDemandSection).getByText("MSFT")).toBeInTheDocument();
            expect(within(onDemandSection).getByText("GOOG")).toBeInTheDocument();
        } else {
            throw new Error(`${ON_DEMAND_STYLE_KEY} section not found to check tickers.`);
        }
      });
    });

    test('stream emits "error" event, and analysisError state is set', async () => {
      render(<App />);
      await waitFor(() => expect(screen.queryByText(/Loading initial analysis data.../i)).not.toBeInTheDocument());

      const errorMessage = "Backend processing error";
      const sseEvents = [
        { type: 'start', data: { message: 'Analysis started' } },
        { type: 'error', data: { message: errorMessage } }
      ];
      mockFetch.mockResolvedValueOnce(createMockSseStream(sseEvents));

      const runAnalysisButton = screen.getByRole('button', { name: /Run Analysis for Watchlist \(2 tickers\)/i });
      await act(async () => {
        fireEvent.click(runAnalysisButton);
      });

      await waitFor(() => expect(screen.queryByText(/Analysis Running.../i)).not.toBeInTheDocument());
      expect(screen.getByText(`Analysis Error: ${errorMessage}`)).toBeInTheDocument();
    });

    test('JSON parsing error for an event data is logged, processing continues', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      render(<App />);
      await waitFor(() => expect(screen.queryByText(/Loading initial analysis data.../i)).not.toBeInTheDocument());

      const validAnalystSignals = { "ADBE": { "sentiment_analyst_agent": { signal: "Neutral", confidence: 0.5 } } };
      const sseEvents = [
        { type: 'start', data: { message: 'Analysis started' } },
        // Malformed event: type and data are at the same level, and data is not JSON string for data: line
        // The mock stream creator expects data to be an object to be stringified.
        // Let's simulate a bad data line by making the mock stream send it as-is.
      ];
       // Custom mock for this specific test to send malformed data
      const malformedStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("event: start\ndata: {\"message\":\"Analysis started\"}\n\n"));
          controller.enqueue(new TextEncoder().encode("event: progress\ndata: this is not json\n\n")); // Malformed data
          controller.enqueue(new TextEncoder().encode(`event: complete\ndata: ${JSON.stringify({data: {analyst_signals: validAnalystSignals}})}\n\n`));
          controller.close();
        },
      });
      mockFetch.mockResolvedValueOnce(new Response(malformedStream, { headers: { 'Content-Type': 'text/event-stream' } }));

      const runAnalysisButton = screen.getByRole('button', { name: /Run Analysis for Watchlist \(2 tickers\)/i });
      await act(async () => {
        fireEvent.click(runAnalysisButton);
      });

      await waitFor(() => expect(screen.queryByText(/Analysis Running.../i)).not.toBeInTheDocument());

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error parsing SSE event data string:",
        "this is not json", // The malformed data string
        expect.any(Error) // The JSON.parse error
      );

      // Check if data from the valid 'complete' event was still processed
      await waitFor(() => {
        expect(screen.getByText(ON_DEMAND_STYLE_KEY)).toBeInTheDocument();
         const onDemandSection = screen.getByText(ON_DEMAND_STYLE_KEY).closest('section');
        if (onDemandSection) {
            expect(within(onDemandSection).getByText("ADBE")).toBeInTheDocument();
        } else {
            throw new Error(`${ON_DEMAND_STYLE_KEY} section not found to check ticker ADBE.`);
        }
      });
      consoleErrorSpy.mockRestore();
    });
  });
});

// Need to import 'within' if not already available globally by testing-library setup
import { within } from '@testing-library/react';
