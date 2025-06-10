import React from 'react';

interface AgentSignalDetail {
  agent_name: string; // Assuming this field exists from backend
  signal: string;
  confidence: number;
  reasoning?: string; // Optional reasoning
  [key: string]: any; // Allow other fields from agent signal
}

interface TickerDetailViewProps {
  ticker: string | null;
  // This should be a collection of all agent signals for the selected ticker
  // For example: AgentSignalDetail[] or Record<string, AgentSignalDetail>
  tickerAnalysisDetails: AgentSignalDetail[] | null;
  onClose: () => void;
}

export const TickerDetailView: React.FC<TickerDetailViewProps> = ({ ticker, tickerAnalysisDetails, onClose }) => {
  if (!ticker || !tickerAnalysisDetails) {
    return null; // Or a "Select a ticker" message if preferred, but null hides it
  }

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold text-gray-800">{ticker} - Detailed Analysis</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 text-2xl font-semibold"
            aria-label="Close detail view"
          >
            &times;
          </button>
        </div>

        {tickerAnalysisDetails.length > 0 ? (
          <div className="space-y-4">
            {tickerAnalysisDetails.map((detail, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-md shadow-sm bg-gray-50">
                <h3 className="text-xl font-semibold text-indigo-700">{detail.agent_name || `Agent ${index + 1}`}</h3>
                <p className="mt-1">
                  <span className="font-medium text-gray-700">Signal: </span>
                  <span className={`font-semibold ${
                    detail.signal.toLowerCase().includes('bullish') || detail.signal.toLowerCase().includes('buy') ? 'text-green-600' :
                    detail.signal.toLowerCase().includes('bearish') || detail.signal.toLowerCase().includes('sell') ? 'text-red-600' :
                    detail.signal.toLowerCase().includes('neutral') ? 'text-yellow-600' : 'text-gray-800'
                  }`}>
                    {detail.signal}
                  </span>
                </p>
                <p>
                  <span className="font-medium text-gray-700">Confidence: </span>
                  <span className="text-gray-800">{detail.confidence ? `${Number(detail.confidence).toFixed(2)}%` : 'N/A'}</span>
                </p>
                {detail.reasoning && (
                  <p className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Reasoning: </span>{detail.reasoning}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No detailed analysis available for this ticker from the selected data sources.</p>
        )}
      </div>
    </div>
  );
};
