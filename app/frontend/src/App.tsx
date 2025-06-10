import React, { useState, useEffect } from 'react';
import { Layout } from './components/layout';
import { ExploreView } from './components/explore/ExploreView';
import { StyleSection } from './components/styles/StyleSection';
import { TickerDetailView } from './components/common/TickerDetailView';
import { MonitorView } from './components/monitor/MonitorView';
import { api } from './services/api'; // Changed apiClient to api

// Define a type for individual agent signal detail
export interface AgentSignalDetail { // Exporting
  agent_name: string;
  signal: string;
  confidence: number;
  reasoning?: string;
  [key: string]: any;
}

// Define a type for the analysis data items within each style/cache_key
export interface AnalysisDataItem { // Exporting
  ticker: string;
  signal?: string | null;     // Overall/primary signal for the ticker in this style
  confidence?: number | null; // Overall/primary confidence for the ticker in this style
  // It could also contain an array of agent-specific signals if the backend structures it that way per ticker per style
  agent_signals?: AgentSignalDetail[]; // Array of signals from different agents for this ticker under this style
  [key: string]: any;
}

// Define a type for the overall analysis data state (map of cache keys (style_hash) to their data)
type AllAnalysisData = Record<string, { styleName?: string; data: AnalysisDataItem[] }>;

// MonitorView will be created as a separate file. Placeholder removed.


export default function App() {
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [selectedTickerData, setSelectedTickerData] = useState<AgentSignalDetail[] | null>(null);

  const [availableCacheKeys, setAvailableCacheKeys] = useState<string[]>([]);
  const [allAnalysisData, setAllAnalysisData] = useState<AllAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Watchlist state
  const [watchlist, setWatchlist] = useState<string[]>(['AAPL', 'TSLA']); // Initial dummy watchlist
  const [monitorTickerInput, setMonitorTickerInput] = useState<string>('');

  const handleAddToWatchlist = (): boolean => { // Return boolean for success
    const newTicker = monitorTickerInput.trim().toUpperCase();
    if (newTicker && !watchlist.includes(newTicker)) {
      setWatchlist([...watchlist, newTicker]);
      setMonitorTickerInput(''); // Clear input
      return true;
    }
    // Let MonitorView handle messages for invalid input or duplicates
    if (!newTicker) {
      console.warn("Attempted to add empty ticker.");
      return false;
    }
    if (watchlist.includes(newTicker)) {
      console.warn(`${newTicker} is already in watchlist.`);
      return false;
    }
    return false; // Should not be reached if logic is correct
  };

  const handleRemoveFromWatchlist = (tickerToRemove: string) => {
    setWatchlist(watchlist.filter(ticker => ticker !== tickerToRemove));
  };

  const handleTickerSelect = (ticker: string) => {
    if (!allAnalysisData) return;

    const details: AgentSignalDetail[] = [];
    // Iterate through all styles/cached data to find all agent signals for the selected ticker
    Object.values(allAnalysisData).forEach(styleEntry => {
      if (styleEntry && styleEntry.data) {
        styleEntry.data.forEach((item: AnalysisDataItem) => {
          if (item.ticker === ticker) {
            // Assuming 'item' itself can be an AgentSignalDetail if data is structured flatly per ticker
            // OR 'item.agent_signals' contains the array if structured hierarchically
            if (item.agent_signals && Array.isArray(item.agent_signals)) {
              details.push(...item.agent_signals);
            } else if (item.agent_name && item.signal && item.confidence) {
              // If the item from styleAnalysis is flat (one agent per row for that ticker)
              details.push({
                agent_name: item.agent_name,
                signal: item.signal,
                confidence: item.confidence,
                reasoning: item.reasoning,
                // any other relevant fields from item
              });
            }
          }
        });
      }
    });

    // Deduplicate agent signals if an agent could appear in multiple styles for the same ticker
    const uniqueDetails = Array.from(new Map(details.map(d => [d.agent_name, d])).values());

    setSelectedTickerData(uniqueDetails);
    setSelectedTicker(ticker);
    // Optionally show right sidebar: setShowRightSidebar(true);
    // Or rely on TickerDetailView's modal nature
  };

  const handleCloseDetailView = () => {
    setSelectedTicker(null);
    setSelectedTickerData(null);
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 1. Fetch available cache keys
        const fetchedKeys = await api.get<string[]>('/cached-analysis/available-results-keys');
        // Ensure fetchedKeys is an array before proceeding
        const keys = Array.isArray(fetchedKeys) ? fetchedKeys : [];
        if (!Array.isArray(fetchedKeys)) {
            console.warn("Fetched keys for cached analysis is not an array:", fetchedKeys);
        }
        setAvailableCacheKeys(keys);

        // 2. Fetch data for ALL available keys
        const fetchedData: AllAnalysisData = {};

        for (const key of keys) {
          try {
            // api.get directly returns the parsed JSON object.
            const responsePayload = await api.get<any>(`/cached-analysis/results/${key}`);

            let signalsData: AnalysisDataItem[] = [];
            // The actual analysis data is expected under the 'analyst_signals' property of the responsePayload
            if (responsePayload && Array.isArray(responsePayload.analyst_signals)) {
              signalsData = responsePayload.analyst_signals;
            } else {
              console.warn(`No 'analyst_signals' array found for key ${key} in payload:`, responsePayload);
            }

            const styleNameFromKey = key.split('_')[0].replace(/([A-Z])/g, ' $1').trim() || "Analysis";
            fetchedData[key] = { styleName: styleNameFromKey, data: signalsData };

          } catch (keyError) {
            console.error(`Error fetching data for key ${key}:`, keyError);
            fetchedData[key] = { styleName: key.split('_')[0].replace(/([A-Z])/g, ' $1').trim() || "Misc", data: [] };
          }
        }
        setAllAnalysisData(fetchedData);

      } catch (e: any) {
        console.error("Error fetching initial data:", e);
        setError(e.message || "Failed to load data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  return (
    <Layout
      leftSidebar={showLeftSidebar ? <div className="p-4 text-white bg-gray-700">Left Sidebar (Filters/Nav)</div> : undefined}
      rightSidebar={showRightSidebar && selectedTicker ? <div className="p-4 text-white bg-gray-700 h-full overflow-y-auto">Contextual Details for {selectedTicker}</div> : (showRightSidebar ? <div className="p-4 text-white bg-gray-700">Right Sidebar</div> : undefined)}
    >
      <div className="main-content p-4 bg-gray-100 min-h-screen">
        {isLoading && <p className="text-center text-lg text-gray-700 py-10">Loading analysis data...</p>}
        {error && <p className="text-center text-lg text-red-500 py-10">Error: {error}</p>}

        {!isLoading && !error && allAnalysisData && Object.keys(allAnalysisData).length > 0 && (
          <>
            <ExploreView
              allAnalysisData={allAnalysisData}
              onTickerSelect={handleTickerSelect}
              isLoading={isLoading}
            />

            <div className="mt-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 px-2">Investment Style Analysis</h2>
              {Object.entries(allAnalysisData).map(([styleKey, styleEntry]) => {
                if (!styleEntry || !styleEntry.data) return null; // Skip if data is missing for a style
                return (
                  <StyleSection
                    key={styleKey}
                    styleName={styleEntry.styleName || "Analysis"}
                    analysisData={styleEntry.data}
                    onTickerSelect={handleTickerSelect}
                    isLoading={isLoading}
                  />
                );
              })}
            </div>
          </>
        )}
        {!isLoading && !error && (!allAnalysisData || Object.keys(allAnalysisData).length === 0) && (
           <p className="text-center text-lg text-gray-500 py-10">No analysis data currently available. Please check back later or ensure the scheduler has run.</p>
        )}

        <div className="my-8"> {/* Added margin for separation */}
          <MonitorView
            watchlist={watchlist}
            allAnalysisData={allAnalysisData}
            onAddToWatchlist={handleAddToWatchlist}
            onRemoveFromWatchlist={handleRemoveFromWatchlist}
            onTickerSelect={handleTickerSelect}
            monitorTickerInput={monitorTickerInput}
            setMonitorTickerInput={setMonitorTickerInput}
            isLoadingAnalysis={isLoading} // Pass the main loading state
          />
        </div>

        <TickerDetailView
          ticker={selectedTicker}
          tickerAnalysisDetails={selectedTickerData}
          onClose={handleCloseDetailView}
        />
      </div>
    </Layout>
  );
}
