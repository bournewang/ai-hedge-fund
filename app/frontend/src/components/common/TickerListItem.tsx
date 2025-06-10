import React from 'react';

interface TickerListItemProps {
  ticker: string;
  signal: string | null | undefined;
  confidence: number | null | undefined;
  onSelect: (ticker: string) => void;
}

export const TickerListItem: React.FC<TickerListItemProps> = ({ ticker, signal, confidence, onSelect }) => {
  // Determine card border color based on signal
  let borderColorClass = 'border-gray-300'; // Default
  if (signal) {
    if (signal.toLowerCase().includes('bullish') || signal.toLowerCase().includes('buy')) {
      borderColorClass = 'border-green-500';
    } else if (signal.toLowerCase().includes('bearish') || signal.toLowerCase().includes('sell')) {
      borderColorClass = 'border-red-500';
    } else if (signal.toLowerCase().includes('neutral')) {
      borderColorClass = 'border-yellow-500';
    }
  }

  return (
    <div
      className={`bg-white shadow-md rounded-lg p-4 m-2 cursor-pointer hover:shadow-lg transition-shadow duration-200 ease-in-out border-l-4 ${borderColorClass}`}
      onClick={() => onSelect(ticker)}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">{ticker}</h3>
        {signal && (
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            signal.toLowerCase().includes('bullish') || signal.toLowerCase().includes('buy') ? 'bg-green-100 text-green-800' :
            signal.toLowerCase().includes('bearish') || signal.toLowerCase().includes('sell') ? 'bg-red-100 text-red-800' :
            signal.toLowerCase().includes('neutral') ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {signal}
          </span>
        )}
      </div>
      {confidence !== null && confidence !== undefined && (
        <p className="text-sm text-gray-600 mt-1">
          Confidence: <span className="font-medium">{Number(confidence).toFixed(2)}%</span>
        </p>
      )}
       {(!signal && confidence === null) && (
         <p className="text-sm text-gray-500 mt-1">No signal data available.</p>
       )}
    </div>
  );
};
