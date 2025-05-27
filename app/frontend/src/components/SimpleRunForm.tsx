import React, { useState } from 'react';
import { Check, ChevronsUpDown } from "lucide-react";
import { Input } from './ui/input';
import { Button } from './ui/button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "./ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "./ui/command";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Label } from "./ui/label"; // Assuming Label component exists
import { cn } from "../lib/utils"; // Assuming you have a utility for class names

const ALL_AGENTS = [
  "Aswath Damodaran", "Ben Graham", "Bill Ackman", "Cathie Wood",
  "Charlie Munger", "Fundamentals", "Michael Burry", "Peter Lynch",
  "Phil Fisher", "Portfolio Manager", "Risk Manager", "Sentiment",
  "Stanley Druckenmiller", "Technicals", "Valuation", "Warren Buffett"
];

const SimpleRunForm: React.FC = () => {
  const [tickers, setTickers] = useState<string>('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [llmModel, setLlmModel] = useState<string>('gpt-4o'); // Default LLM Model
  const [initialCash, setInitialCash] = useState<number>(10000);
  const [openAgentSelector, setOpenAgentSelector] = useState(false);

  // Interfaces for event data
  interface StreamEventBase {
    event_type: string;
  }
  interface StartEventData {
    run_id: string;
    timestamp: string;
  }
  interface ProgressUpdateData {
    agent: string;
    ticker: string | null;
    status: string;
    analysis: string | null;
    timestamp: string;
    cost: number | null;
    tokens: number | null;
    run_id: string;
  }
  interface ErrorEventData {
    message: string;
    details?: any;
    timestamp: string;
    run_id: string;
  }
  interface CompleteData {
    run_id: string;
    final_analysis: string;
    decisions: Record<string, { action: string; confidence: number; details: string; }>;
    analyst_signals: Record<string, any>; // Can be more specific if structure is known
    timestamp: string;
    total_cost: number;
    total_tokens: number;
  }

  type ParsedStreamEvent = 
    | { type: 'StartEvent', data: StartEventData }
    | { type: 'ProgressUpdateEvent', data: ProgressUpdateData }
    | { type: 'ErrorEvent', data: ErrorEventData } // This will be handled by setError directly
    | { type: 'CompleteEvent', data: CompleteData }; // This will be handled by setFinalResult directly

  const [progressMessages, setProgressMessages] = useState<Array<{ type: 'StartEvent', data: StartEventData } | { type: 'ProgressUpdateEvent', data: ProgressUpdateData }>>([]);
  const [finalResult, setFinalResult] = useState<CompleteData | null>(null);
  const [error, setError] = useState<ErrorEventData | string | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleAgentSelect = (agent: string) => {
    setSelectedAgents((prevSelected) =>
      prevSelected.includes(agent)
        ? prevSelected.filter((item) => item !== agent)
        : [...prevSelected, agent]
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!tickers.trim()) {
      newErrors.tickers = "Tickers are required.";
    }
    if (selectedAgents.length === 0) {
      newErrors.selectedAgents = "At least one agent must be selected.";
    }
    if (initialCash <= 0) {
      newErrors.initialCash = "Initial cash must be a positive number.";
    }
    if (!startDate) {
      newErrors.startDate = "Start date is required.";
    }
    if (!endDate) {
      newErrors.endDate = "End date is required.";
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      newErrors.endDate = "End date cannot be before start date.";
    }
    // LLM Model validation could be added if specific values are expected
    // For now, it's a free text field with a default.

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) {
      setIsRunning(false); // Ensure isRunning is false if validation fails early
      return;
    }

    setIsRunning(true);
    setProgressMessages([]);
    setFinalResult(null);
    setError(null); // Clear previous backend errors

    const requestBody = {
      tickers: tickers.split(',').map(t => t.trim()).filter(t => t.length > 0),
      selected_agents: selectedAgents,
      start_date: startDate,
      end_date: endDate,
      // llmModel will be sent, backend has default "gpt-4o" if it's empty or not recognized
      // However, we've initialized llmModel state to "gpt-4o"
      model_name: llmModel,
      // model_provider: "OPENAI", // Backend has default "OPENAI"
      initial_cash: initialCash,
    };

    try {
      const response = await fetch('http://localhost:8000/hedge-fund/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        
        // Process buffer line by line for SSE messages
        let EOL_index;
        while ((EOL_index = buffer.indexOf('\n\n')) !== -1) {
            const message = buffer.slice(0, EOL_index);
            buffer = buffer.slice(EOL_index + 2); // +2 for '\n\n'

            if (message.startsWith('data: ')) {
                const jsonData = message.substring(6); // Remove 'data: ' prefix
                try {
                    const parsedEvent: StreamEventBase & { data: any } = JSON.parse(jsonData);

                    if (parsedEvent.event_type === 'StartEvent') {
                        setProgressMessages((prev) => [...prev, { type: 'StartEvent', data: parsedEvent.data as StartEventData }]);
                    } else if (parsedEvent.event_type === 'ProgressUpdateEvent') {
                        setProgressMessages((prev) => [...prev, { type: 'ProgressUpdateEvent', data: parsedEvent.data as ProgressUpdateData }]);
                    } else if (parsedEvent.event_type === 'CompleteEvent') {
                        setFinalResult(parsedEvent.data as CompleteData);
                    } else if (parsedEvent.event_type === 'ErrorEvent') {
                        setError(parsedEvent.data as ErrorEventData);
                        // Optionally break or stop processing further messages on error
                    }
                } catch (e) {
                    console.error('Failed to parse SSE event JSON:', e);
                    setError({ message: 'Failed to parse event from server.', timestamp: new Date().toISOString(), run_id: '' });
                }
            }
        }
      }
    } catch (err) {
      console.error('Fetch or streaming error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Run AI Hedge Fund Strategy</CardTitle>
          <CardDescription>Configure the parameters below and click 'Run Strategy' to simulate.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="tickers" className="block text-sm font-medium mb-1">
                  Stock Tickers
                </Label>
                <Input
                  id="tickers"
                  type="text"
                  value={tickers}
                  onChange={(e) => setTickers(e.target.value)}
                  placeholder="e.g., AAPL, GOOG"
                  className="mt-1 block w-full"
                />
                {formErrors.tickers && <p className="text-sm text-red-500 mt-1">{formErrors.tickers}</p>}
              </div>

              <div>
                <Label htmlFor="agent" className="block text-sm font-medium mb-1">
                  Agent Selection
                </Label>
                <Popover open={openAgentSelector} onOpenChange={setOpenAgentSelector}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openAgentSelector}
                      className="w-full justify-between mt-1"
                    >
                      {selectedAgents.length > 0
                        ? selectedAgents.length === 1
                          ? selectedAgents[0]
                          : `${selectedAgents.length} agents selected`
                        : "Select Agents..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search agents..." />
                      <CommandList>
                        <CommandEmpty>No agent found.</CommandEmpty>
                        <CommandGroup>
                          {ALL_AGENTS.map((agent) => (
                            <CommandItem
                              key={agent}
                              value={agent}
                              onSelect={() => {
                                handleAgentSelect(agent);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedAgents.includes(agent) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {agent}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {formErrors.selectedAgents && <p className="text-sm text-red-500 mt-1">{formErrors.selectedAgents}</p>}
              </div>

              <div>
                <Label htmlFor="startDate" className="block text-sm font-medium mb-1">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full"
                />
                {formErrors.startDate && <p className="text-sm text-red-500 mt-1">{formErrors.startDate}</p>}
              </div>

              <div>
                <Label htmlFor="endDate" className="block text-sm font-medium mb-1">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full"
                />
                {formErrors.endDate && <p className="text-sm text-red-500 mt-1">{formErrors.endDate}</p>}
              </div>
              
              <div>
                <Label htmlFor="llmModel" className="block text-sm font-medium mb-1">
                  LLM Model
                </Label>
                <Input
                  id="llmModel"
                  type="text"
                  value={llmModel}
                  onChange={(e) => setLlmModel(e.target.value)}
                  placeholder="e.g., gpt-4o"
                  className="mt-1 block w-full"
                />
                {/* No specific validation for LLM Model in this step */}
              </div>

              <div>
                <Label htmlFor="initialCash" className="block text-sm font-medium mb-1">
                  Initial Cash
                </Label>
                <Input
                  id="initialCash"
                  type="number"
                  value={initialCash}
                  onChange={(e) => setInitialCash(Number(e.target.value))}
                  className="mt-1 block w-full"
                />
                {formErrors.initialCash && <p className="text-sm text-red-500 mt-1">{formErrors.initialCash}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isRunning}>
              {isRunning ? 'Running...' : 'Run Strategy'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {(isRunning || error || finalResult || progressMessages.length > 0) && (
        <Card className="w-full mt-6">
          <CardHeader>
            <CardTitle>Simulation Output</CardTitle>
            <CardDescription>View the progress and results of your strategy run below.</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[100px] prose dark:prose-invert max-w-none">
        {isRunning && progressMessages.length === 0 && !finalResult && !error && (
          <p>Loading results...</p>
        )}

        {error && (
          <div className="text-red-500">
            <h4>Error:</h4>
            <p>{typeof error === 'string' ? error : error.message}</p>
            {typeof error !== 'string' && error.details && <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(error.details, null, 2)}</pre>}
          </div>
        )}

        {progressMessages.length > 0 && (
          <div>
            <h4 className="font-semibold">Progress:</h4>
            <ul className="list-disc pl-5 text-sm">
              {progressMessages.map((msg, index) => (
                <li key={index}>
                  {msg.type === 'StartEvent' ? (
                    `[${new Date(msg.data.timestamp).toLocaleTimeString()}] Run started (ID: ${msg.data.run_id})`
                  ) : (
                    <>
                      [{new Date(msg.data.timestamp).toLocaleTimeString()}] <strong>{msg.data.agent}</strong>: {msg.data.status}
                      {msg.data.ticker && ` (${msg.data.ticker})`}
                      {msg.data.analysis && <span className="block text-gray-600 text-xs">Analysis: {msg.data.analysis}</span>}
                      {msg.data.cost !== null && typeof msg.data.cost !== 'undefined' && <span className="block text-blue-500 text-xs">Cost: ${msg.data.cost.toFixed(6)}</span>}
                      {msg.data.tokens !== null && typeof msg.data.tokens !== 'undefined' && <span className="block text-purple-500 text-xs">Tokens: {msg.data.tokens}</span>}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {finalResult && (
          <div className="mt-4">
            <h4 className="font-semibold">Final Result:</h4>
            <p className="text-sm">Run ID: {finalResult.run_id}</p>
            <p className="text-sm">Timestamp: {new Date(finalResult.timestamp).toLocaleString()}</p>
            <p className="text-sm">Total Cost: ${finalResult.total_cost.toFixed(6)}</p>
            <p className="text-sm">Total Tokens: {finalResult.total_tokens}</p>
            
            <h5 className="font-semibold mt-2">Final Analysis:</h5>
            <p className="text-sm whitespace-pre-wrap">{finalResult.final_analysis}</p>

            <h5 className="font-semibold mt-2">Decisions:</h5>
            <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-2 rounded">
              {JSON.stringify(finalResult.decisions, null, 2)}
            </pre>
            
            <h5 className="font-semibold mt-2">Analyst Signals:</h5>
            <pre className="text-xs whitespace-pre-wrap bg-gray-100 p-2 rounded">
              {JSON.stringify(finalResult.analyst_signals, null, 2)}
            </pre>
          </div>
        )}

        {!isRunning && !error && !finalResult && progressMessages.length === 0 && (
           <div>Results and progress placeholder</div>
        )}
      </div>
    </form>
  );
};

export default SimpleRunForm;
