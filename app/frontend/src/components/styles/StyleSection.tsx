import React from 'react';
import { TickerList } from '../common/TickerList'; // Adjusted path

interface TickerStyleData {
  ticker: string;
  signal?: string | null;
  confidence?: number | null;
  // Potentially other style-specific data points in the future
}

interface StyleSectionProps {
  styleName: string;
  analysisData: Array<TickerStyleData> | null | undefined;
  onTickerSelect: (ticker: string) => void;
  isLoading?: boolean; // Optional loading prop
}

export const StyleSection: React.FC<StyleSectionProps> = ({ styleName, analysisData, onTickerSelect, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-4 rounded-lg shadow bg-white m-2">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{styleName}</h2>
        <p className="text-gray-600">Loading analysis data...</p>
        {/* Optional: Add a skeleton loader here */}
      </div>
    );
  }

  if (!analysisData || analysisData.length === 0) {
    return (
      <div className="p-4 rounded-lg shadow bg-white m-2">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{styleName}</h2>
        <p className="text-gray-600">No analysis data available for this style.</p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg shadow-md bg-white m-2">
      <TickerList listTitle={styleName} tickers={analysisData} onTickerSelect={onTickerSelect} />
    </div>
  );
};
