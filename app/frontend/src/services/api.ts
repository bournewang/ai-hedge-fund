// Removed: import { NodeStatus, OutputNodeData, useNodeContext } from '@/contexts/node-context';
import { ModelProvider } from '@/services/types';

interface AgentModelConfig {
  agent_id: string;
  model_name?: string;
  model_provider?: ModelProvider;
}

interface HedgeFundRequest {
  tickers: string[];
  selected_agents: string[];
  agent_models?: AgentModelConfig[];
  end_date?: string;
  start_date?: string;
  model_name?: string; // Keep for backwards compatibility, will be removed later
  model_provider?: ModelProvider; // Keep for backwards compatibility, will be removed later
  initial_cash?: number;
  margin_requirement?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
  // Removed runHedgeFund method entirely

  /**
   * Fetches data from the specified API path using GET request.
   * @param path The API path (e.g., '/cached-analysis/available-results-keys')
   * @returns A promise that resolves to the parsed JSON data.
   * @throws An error if the HTTP response is not ok.
   */
  get: async (path: string): Promise<any> => {
    const fullUrl = `${API_BASE_URL}${path}`;
    try {
      const response = await fetch(fullUrl);
      if (!response.ok) {
        // Attempt to get more error info from response body if available
        let errorBody = '';
        try {
          errorBody = await response.text();
        } catch (e) {
          // Ignore if can't read body
        }
        throw new Error(`HTTP error! status: ${response.status}, path: ${path}, details: ${errorBody}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API GET request failed for path: ${path}`, error);
      throw error; // Re-throw the error to be caught by the caller
    }
  },
}; 