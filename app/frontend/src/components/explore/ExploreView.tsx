import React from 'react';
import { TickerList } from '../common/TickerList'; // Adjusted path

interface TickerExploreData {
  ticker: string;
  signal?: string | null;
  confidence?: number | null;
  // other relevant data for exploration
}

interface AnalysisDataItem { // Using a more generic name, similar to App.tsx
  ticker: string;
  signal?: string | null;
  confidence?: number | null;
  [key: string]: any;
}

interface ExploreViewProps {
  allAnalysisData: Record<string, { styleName?: string; data: AnalysisDataItem[] }> | null | undefined;
  onTickerSelect: (ticker: string) => void;
  isLoading?: boolean;
}

// Helper function to extract and filter "hot" tickers
const getHotTickers = (
  data: Record<string, { styleName?: string; data: AnalysisDataItem[] }> | null | undefined,
  minConfidence = 70
): Array<AnalysisDataItem> => {
  if (!data) return [];

  const hotTickersMap = new Map<string, AnalysisDataItem>();

  Object.values(data).forEach(styleEntry => { // styleEntry is { styleName, data: AnalysisDataItem[] }
    if (styleEntry && Array.isArray(styleEntry.data)) {
      styleEntry.data.forEach(item => { // item is AnalysisDataItem
        if (item.signal && (item.signal.toLowerCase().includes('bullish') || item.signal.toLowerCase().includes('buy'))) {
          if (typeof item.confidence === 'number' && item.confidence >= minConfidence) {
            const existing = hotTickersMap.get(item.ticker);
            // Prioritize if new item has higher confidence, or if existing has no confidence
            if (!existing || (typeof existing.confidence !== 'number') || item.confidence > existing.confidence) {
               hotTickersMap.set(item.ticker, item);
            }
          }
        }
      });
    }
  });
  // Sort by confidence descending, handling possible undefined confidence
  return Array.from(hotTickersMap.values()).sort((a, b) => {
    const confA = typeof a.confidence === 'number' ? a.confidence : -1;
    const confB = typeof b.confidence === 'number' ? b.confidence : -1;
    return confB - confA;
  });
};


export const ExploreView: React.FC<ExploreViewProps> = ({ allAnalysisData, onTickerSelect, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-4 rounded-lg shadow-md bg-white m-2">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">🔥 Hot Tickers</h2>
        <p className="text-md text-gray-600 mb-4">Loading promising tickers based on market analysis...</p>
        {/* Optional: Add a skeleton loader here */}
      </div>
    );
  }

  const hotTickers = getHotTickers(allAnalysisData);

  return (
    <div className="p-4 m-2 rounded-lg shadow-md bg-white">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">🔥 Hot Tickers (Strong Buys)</h2>
      <p className="text-md text-gray-600 mb-4">
        Displaying tickers with strong bullish signals and high confidence (typically &gt;70%) from recent analyses across various investment styles.
      </p>
      {hotTickers.length > 0 ? (
        <TickerList
          // listTitle is now part of the main heading section above
          tickers={hotTickers}
          onTickerSelect={onTickerSelect}
        />
      ) : (
        <div className="p-4 rounded-lg bg-gray-50 mt-4">
            {/* Title already present above, just the message here */}
            <p className="text-gray-600 text-center">No strong buy signals meeting the criteria currently. Check back later or adjust filters.</p>
        </div>
      )}

      {/* Future sections for ExploreView could be:
        - Market News Summary
        - Sector Performance
        - Recently Added Analysis
      */}
    </div>
  );
};
