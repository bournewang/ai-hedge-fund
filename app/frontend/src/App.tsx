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
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false); // New state for on-demand analysis loading
  const [analysisError, setAnalysisError] = useState<string | null>(null); // Error state for on-demand analysis

  const ON_DEMAND_STYLE_KEY = "On-Demand Analysis"; // Key for storing on-demand results

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

  const runWatchlistAnalysisHandler = async (tickersToAnalyze: string[]) => {
    if (isLoadingAnalysis) return;
    setIsLoadingAnalysis(true);
    setAnalysisError(null);

    const requestBody = {
      initial_cash: 1000000,
      margin_requirement: 0.5,
      tickers: tickersToAnalyze,
      selected_agents: ['fundamentals_analyst_agent', 'technicals_agent', 'sentiment_analyst_agent'], // Ensure these match backend keys
      model_provider: "OpenAI",
      model_name: "gpt-4-turbo",
      start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
    };

    try {
      const eventSource = new EventSource(`${api.defaults.baseURL}/hedge-fund/run?requestBody=${encodeURIComponent(JSON.stringify(requestBody))}`);
      // It seems hedge-fund/run expects a POST request, the EventSource approach above might be incorrect.
      // Reverting to a POST request that initiates an SSE stream if that's how the backend is set up.
      // This part needs to align with how `api.stream` or a similar SSE utility is typically used in this app.
      // For now, let's assume a POST request that returns an EventSource URL or directly streams.
      // The below is a conceptual placeholder for initiating SSE and handling events.

      // This is a simplified conceptual fetch for SSE. Replace with actual SSE handling logic from the project.
      // Usually, you'd have a helper function for this.
      const response = await fetch(`${api.defaults.baseURL}/hedge-fund/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add any other necessary headers, like Authorization if required
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok || !response.body) {
        const errorData = await response.text();
        throw new Error(`Failed to start analysis: ${response.status} ${errorData}`);
      }

      // Assuming the response itself is the SSE stream.
      // This is a very simplified way to handle SSE and likely needs to be replaced
      // with a more robust SSE client or the existing `api.stream` if available.
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\\n'); // SSE events are newline-separated
        buffer = lines.pop() || ''; // Keep the last partial line

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const eventType = line.substring(7);
            // Assuming data is on the next line starting with "data: "
            // This is a very raw way of parsing SSE.
            const dataLineIndex = lines.indexOf(line) + 1;
            if (dataLineIndex < lines.length && lines[dataLineIndex].startsWith('data: ')) {
              const eventDataString = lines[dataLineIndex].substring(6);
              try {
                let eventData;
                try {
                  eventData = JSON.parse(eventDataString);
                } catch (e) {
                  console.error("Error parsing SSE event data string:", eventDataString, e);
                  continue; // Skip this malformed event
                }

                console.log("SSE Event:", eventType, eventData);

                if (eventType === 'start') {
                  console.log("Analysis started for tickers:", tickersToAnalyze);
                } else if (eventType === 'progress') {
                  // console.log("Progress:", eventData.agent, eventData.ticker, eventData.status);
                } else if (eventType === 'complete') {
                  console.log("Analysis complete. Received data:", eventData.data);
                  if (eventData.data && eventData.data.analyst_signals) {
                    setAllAnalysisData(prevData => {
                      const currentOnDemandItems = prevData?.[ON_DEMAND_STYLE_KEY]?.data || [];
                      let updatedTickerListForOnDemand = [...currentOnDemandItems];

                      for (const [ticker, agentSignalsForTicker] of Object.entries(eventData.data.analyst_signals as Record<string, Record<string, any>>)) {
                        const transformedAgentSignalsArray: AgentSignalDetail[] = Object.entries(agentSignalsForTicker).map(([agentName, signalData]) => ({
                          agent_name: agentName, // Assuming backend keys are used as agent_name
                          signal: signalData.signal,
                          confidence: signalData.confidence,
                          reasoning: signalData.reasoning,
                        }));

                        const newItem: AnalysisDataItem = {
                          ticker: ticker,
                          agent_signals: transformedAgentSignalsArray,
                          // Not determining overall signal/confidence for now
                          signal: null,
                          confidence: null,
                        };

                        const existingItemIndex = updatedTickerListForOnDemand.findIndex(item => item.ticker === ticker);
                        if (existingItemIndex > -1) {
                          updatedTickerListForOnDemand[existingItemIndex] = newItem;
                        } else {
                          updatedTickerListForOnDemand.push(newItem);
                        }
                      }

                      return {
                        ...prevData,
                        [ON_DEMAND_STYLE_KEY]: {
                          styleName: "On-Demand Analysis",
                          data: updatedTickerListForOnDemand,
                        },
                      };
                    });
                  }
                } else if (eventType === 'error') {
                  setAnalysisError(eventData.message || "An error occurred during analysis.");
                  console.error("Analysis error event:", eventData);
                  // Consider breaking the loop or closing EventSource on critical error
                  reader.cancel(); // Stop reading the stream
                  break;
                }
              } catch (e) {
                console.error("Error processing SSE event logic:", e);
                // This is an error in the handler logic, not parsing the data string
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Failed to run analysis (fetch or stream setup error):", error);
      setAnalysisError(error.message || "An unexpected error occurred when starting analysis.");
      setIsLoadingAnalysis(false); // Ensure loading is stopped on setup error
    }
    // The finally block was removed here because if the stream is successful,
    // setIsLoadingAnalysis(false) should only be called when the stream is truly done or errors out.
    // For a continuous stream that only ends on 'done' or explicit cancel, this is tricky.
    // Re-adding it for now, but a more robust SSE client would handle this better.
    // If the 'while (true)' loop above correctly exits on 'done' or error, then this is fine.
    finally {
        setIsLoadingAnalysis(false);
    }
  };

  return (
    <Layout
      leftSidebar={showLeftSidebar ? <div className="p-4 text-white bg-gray-700">Left Sidebar (Filters/Nav)</div> : undefined}
      rightSidebar={showRightSidebar && selectedTicker ? <div className="p-4 text-white bg-gray-700 h-full overflow-y-auto">Contextual Details for {selectedTicker}</div> : (showRightSidebar ? <div className="p-4 text-white bg-gray-700">Right Sidebar</div> : undefined)}
    >
      <div className="main-content p-4 bg-gray-100 min-h-screen">
        {isLoading && !isLoadingAnalysis && <p className="text-center text-lg text-gray-700 py-10">Loading initial analysis data...</p>}
        {analysisError && <p className="text-center text-lg text-red-500 py-10">Analysis Error: {analysisError}</p>}

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
            isLoadingAnalysis={isLoadingAnalysis} // Pass the new loading state
            onRunAnalysis={runWatchlistAnalysisHandler} // Pass the handler
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
