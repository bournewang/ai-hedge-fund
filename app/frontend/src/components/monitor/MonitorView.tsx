import React, { useState } from 'react'; // Added useState
import { AnalysisDataItem, AgentSignalDetail } from '../../App'; // Assuming types are exported from App.tsx or a types file

interface MonitorViewProps {
  watchlist: string[];
  allAnalysisData: Record<string, { styleName?: string; data: AnalysisDataItem[] }> | null;
  onAddToWatchlist: () => boolean; // Now returns boolean
  onRemoveFromWatchlist: (ticker: string) => void;
  onTickerSelect: (ticker: string) => void;
  monitorTickerInput: string;
  setMonitorTickerInput: (value: string) => void;
  isLoadingAnalysis: boolean;
}

// Helper to find the most prominent signal for a ticker from allAnalysisData
const getProminentSignalForTicker = (
  ticker: string,
  allAnalysisData: Record<string, { styleName?: string; data: AnalysisDataItem[] }> | null
): { signal: string | null, confidence: number | null } => {
  if (!allAnalysisData) return { signal: null, confidence: null };

  let bestSignal: string | null = null;
  let highestConfidence: number = -1;

  Object.values(allAnalysisData).forEach(styleEntry => {
    if (styleEntry && styleEntry.data) {
      styleEntry.data.forEach(item => {
        if (item.ticker === ticker) {
          // Check for primary signal on item
          if (item.signal && item.confidence && item.confidence > highestConfidence) {
            highestConfidence = item.confidence;
            bestSignal = item.signal;
          }
          // Check within agent_signals if present and potentially more relevant/stronger
          if (item.agent_signals && Array.isArray(item.agent_signals)) {
            item.agent_signals.forEach((agentSignal: AgentSignalDetail) => {
              if (agentSignal.confidence && agentSignal.confidence > highestConfidence) {
                highestConfidence = agentSignal.confidence;
                bestSignal = agentSignal.signal;
              }
            });
          }
        }
      });
    }
  });
  return { signal: bestSignal, confidence: highestConfidence === -1 ? null : highestConfidence };
};

export const MonitorView: React.FC<MonitorViewProps> = ({
  watchlist,
  allAnalysisData,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onTickerSelect,
  monitorTickerInput,
  setMonitorTickerInput,
  isLoadingAnalysis,
}) => {
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleAddClick = () => {
    setFeedbackMessage(null); // Clear previous message
    const currentInput = monitorTickerInput.trim().toUpperCase();

    if (!currentInput) {
      setFeedbackMessage("Please enter a ticker symbol.");
      return;
    }
    if (watchlist.includes(currentInput)) {
      setFeedbackMessage(`${currentInput} is already in the watchlist.`);
      return;
    }

    const success = onAddToWatchlist(); // This now calls the App.tsx handler
    if (success) {
      setFeedbackMessage(`${currentInput} added to watchlist.`);
      // Clear message after a few seconds
      setTimeout(() => setFeedbackMessage(null), 3000);
    } else {
      // This case should ideally be caught by checks above, but as a fallback:
      setFeedbackMessage(`Failed to add ${currentInput}. It might be invalid or already present.`);
    }
  };

  return (
    <div className="p-4 rounded-lg shadow-md bg-white m-2">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">My Watchlist</h2>

      <div className="flex items-center mb-2">
        <input
          type="text"
          value={monitorTickerInput}
          onChange={(e) => setMonitorTickerInput(e.target.value.toUpperCase())}
          placeholder="Add Ticker (e.g., AAPL)"
          className="border border-gray-300 p-2 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500 flex-grow shadow-sm"
        />
        <button
          onClick={handleAddClick}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold p-2 rounded-r-md shadow-sm"
        >
          Add Ticker
        </button>
      </div>
      {feedbackMessage && (
        <p className={`text-sm mb-4 px-1 ${feedbackMessage.includes('added') ? 'text-green-600' : 'text-red-600'}`}>
          {feedbackMessage}
        </p>
      )}

      {watchlist.length === 0 ? (
        <p className="text-gray-500">Your watchlist is empty. Add tickers to monitor them.</p>
      ) : (
        <div className="space-y-3">
          {watchlist.map(ticker => {
            const { signal, confidence } = isLoadingAnalysis
              ? { signal: "Loading...", confidence: null }
              : getProminentSignalForTicker(ticker, allAnalysisData);

            let signalColorClass = 'text-gray-700';
            if (signal) {
                if (signal.toLowerCase().includes('bullish') || signal.toLowerCase().includes('buy')) signalColorClass = 'text-green-600';
                else if (signal.toLowerCase().includes('bearish') || signal.toLowerCase().includes('sell')) signalColorClass = 'text-red-600';
                else if (signal.toLowerCase().includes('neutral')) signalColorClass = 'text-yellow-600';
            }

            return (
              <div
                key={ticker}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md shadow-sm hover:bg-gray-100 transition-colors"
              >
                <div>
                  <span
                    onClick={() => onTickerSelect(ticker)}
                    className="text-lg font-semibold text-indigo-700 hover:underline cursor-pointer"
                  >
                    {ticker}
                  </span>
                  {isLoadingAnalysis ? (
                     <p className="text-sm text-gray-500">Loading analysis...</p>
                  ): signal ? (
                    <p className={`text-sm ${signalColorClass}`}>
                      Signal: {signal} {confidence !== null ? `(${confidence.toFixed(1)}%)` : ''}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">No specific signal found.</p>
                  )}
                </div>
                <button
                  onClick={() => onRemoveFromWatchlist(ticker)}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-md text-sm"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
