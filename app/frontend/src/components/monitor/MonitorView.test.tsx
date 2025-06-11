import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MonitorView } from './MonitorView'; // Adjust path as necessary
import { AnalysisDataItem, AgentSignalDetail } from '../../App'; // Assuming types are in App.tsx

// Mock props factory
const createMockProps = (overrides: Partial<React.ComponentProps<typeof MonitorView>> = {}) => {
  const defaultProps: React.ComponentProps<typeof MonitorView> = {
    watchlist: ['AAPL', 'MSFT'],
    allAnalysisData: {
      "style1": {
        styleName: "Growth Investing",
        data: [
          { ticker: "AAPL", signal: "Buy", confidence: 75, agent_signals: [{ agent_name: "Agent1", signal: "Buy", confidence: 75 }] },
        ]
      }
    },
    onAddToWatchlist: jest.fn(() => true),
    onRemoveFromWatchlist: jest.fn(),
    onTickerSelect: jest.fn(),
    monitorTickerInput: '',
    setMonitorTickerInput: jest.fn(),
    isLoadingAnalysis: false,
    onRunAnalysis: jest.fn(), // Mock for the new handler
  };
  return { ...defaultProps, ...overrides };
};

describe('MonitorView', () => {
  test('renders correctly with watchlist items', () => {
    const props = createMockProps();
    render(<MonitorView {...props} />);

    expect(screen.getByText('My Watchlist')).toBeInTheDocument();
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('MSFT')).toBeInTheDocument();
    expect(screen.getByText(/Run Analysis for Watchlist/i)).toBeInTheDocument();
  });

  test('renders empty state message when watchlist is empty', () => {
    const props = createMockProps({ watchlist: [] });
    render(<MonitorView {...props} />);
    expect(screen.getByText('Your watchlist is empty. Add tickers to monitor them.')).toBeInTheDocument();
  });

  describe("'Run Analysis for Watchlist' button behavior", () => {
    test('button is present and enabled when watchlist is not empty and not loading', () => {
      const props = createMockProps({ watchlist: ['GOOG'], isLoadingAnalysis: false });
      render(<MonitorView {...props} />);
      const runButton = screen.getByRole('button', { name: /Run Analysis for Watchlist \(1 tickers\)/i });
      expect(runButton).toBeInTheDocument();
      expect(runButton).toBeEnabled();
    });

    test('button is disabled if watchlist is empty', () => {
      const props = createMockProps({ watchlist: [], isLoadingAnalysis: false });
      render(<MonitorView {...props} />);
      // The button might not render at all if watchlist is empty based on current implementation,
      // or it might render disabled. Let's check if it's NOT there or disabled.
      // Based on MonitorView.tsx, it conditionally renders if watchlist.length > 0
      const runButton = screen.queryByRole('button', { name: /Run Analysis for Watchlist/i });
      expect(runButton).not.toBeInTheDocument();
    });

    test('button shows "Run Analysis for Watchlist (X tickers)" with correct count', () => {
      const props = createMockProps({ watchlist: ['TSLA', 'NVDA', 'AMD'], isLoadingAnalysis: false });
      render(<MonitorView {...props} />);
      const runButton = screen.getByRole('button', { name: /Run Analysis for Watchlist \(3 tickers\)/i });
      expect(runButton).toBeInTheDocument();
    });

    test('button is disabled and shows "Analysis Running..." if isLoadingAnalysis is true', () => {
      const props = createMockProps({ watchlist: ['IBM'], isLoadingAnalysis: true });
      render(<MonitorView {...props} />);
      const runButton = screen.getByRole('button', { name: /Analysis Running.../i });
      expect(runButton).toBeInTheDocument();
      expect(runButton).toBeDisabled();
    });

    test('calls onRunAnalysis with watchlist content when clicked', () => {
      const mockOnRunAnalysis = jest.fn();
      const watchlistContent = ['PYPL', 'SQ'];
      const props = createMockProps({
        watchlist: watchlistContent,
        isLoadingAnalysis: false,
        onRunAnalysis: mockOnRunAnalysis
      });
      render(<MonitorView {...props} />);

      const runButton = screen.getByRole('button', { name: /Run Analysis for Watchlist \(2 tickers\)/i });
      fireEvent.click(runButton);

      expect(mockOnRunAnalysis).toHaveBeenCalledTimes(1);
      expect(mockOnRunAnalysis).toHaveBeenCalledWith(watchlistContent);
    });

    test('does not call onRunAnalysis if watchlist is empty (button should not be there or be disabled)', () => {
        const mockOnRunAnalysis = jest.fn();
        // Case 1: Button is not rendered
        const props1 = createMockProps({ watchlist: [], onRunAnalysis: mockOnRunAnalysis });
        render(<MonitorView {...props1} />);
        const runButton1 = screen.queryByRole('button', { name: /Run Analysis for Watchlist/i });
        if (runButton1) { // If it does render (e.g. if logic changes)
            fireEvent.click(runButton1); // it should be disabled, so click shouldn't call
        }
        expect(mockOnRunAnalysis).not.toHaveBeenCalled();

        // Case 2: If button were to render but be disabled (not current logic, but for completeness)
        // const props2 = createMockProps({ watchlist: [], onRunAnalysis: mockOnRunAnalysis, /* hypothetical prop to force render */ });
        // render(<MonitorView {...props2} />);
        // const runButton2 = screen.getByRole('button', { name: /Run Analysis for Watchlist/i });
        // expect(runButton2).toBeDisabled();
        // fireEvent.click(runButton2);
        // expect(mockOnRunAnalysis).not.toHaveBeenCalled();
    });
  });

  // Test for adding a ticker (existing functionality, good to keep)
  test('feedback message is shown when adding a ticker', () => {
    const props = createMockProps({ monitorTickerInput: 'NEWTICKER' });
    // Need to set monitorTickerInput via the props passed to render for this to work,
    // or simulate typing into the input if setMonitorTickerInput is what updates it.
    // For simplicity, assume onAddToWatchlist is called by handleAddClick.

    render(<MonitorView {...props} />);
    const addButton = screen.getByRole('button', { name: /Add Ticker/i });
    const input = screen.getByPlaceholderText('Add Ticker (e.g., AAPL)');

    // Simulate typing - this depends on how setMonitorTickerInput is implemented by parent
    // Here we assume MonitorView itself doesn't manage the state of monitorTickerInput directly
    // but calls setMonitorTickerInput prop.
    // For this unit test, it's more about testing MonitorView's direct logic.
    // We can mock that onAddToWatchlist is called correctly.

    // Let's refine this: handleAddClick uses monitorTickerInput from props.
    // So, we need to ensure that the input field change updates that prop via setMonitorTickerInput mock
    // For this test, we'll assume monitorTickerInput is already 'NEWTICKER' as per props.

    fireEvent.click(addButton);
    expect(props.onAddToWatchlist).toHaveBeenCalled();
    // Feedback message display is internal to MonitorView
    // If onAddToWatchlist returns true, it should show success.
    expect(screen.getByText(`NEWTICKER added to watchlist.`)).toBeInTheDocument();
  });
});
