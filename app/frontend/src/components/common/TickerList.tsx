import React from 'react';
import { TickerListItem } from './TickerListItem';

interface TickerData {
  ticker: string;
  signal?: string | null;     // Optional: signal might not always be present
  confidence?: number | null; // Optional: confidence might not always be present
}

interface TickerListProps {
  tickers: Array<TickerData>;
  onTickerSelect: (ticker: string) => void;
  listTitle?: string;
}

export const TickerList: React.FC<TickerListProps> = ({ tickers, onTickerSelect, listTitle }) => {
  if (!tickers || tickers.length === 0) {
    return <p className="text-gray-500 p-4">No tickers to display.</p>;
  }

  return (
    <div className="py-2">
      {listTitle && <h2 className="text-2xl font-semibold text-gray-700 px-4 py-2">{listTitle}</h2>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {tickers.map((item) => (
          <TickerListItem
            key={item.ticker}
            ticker={item.ticker}
            signal={item.signal}
            confidence={item.confidence}
            onSelect={onTickerSelect}
          />
        ))}
      </div>
    </div>
  );
};
