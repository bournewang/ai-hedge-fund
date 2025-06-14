import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Flame,
  Zap,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Plus,
  Minus,
  Trash2,
  BarChart
} from 'lucide-react';
import { api, TrendingStock } from '@/services/api';

// Map sector names that might come from the API
const normalizeSecctor = (sector: string | null): string => {
  if (!sector) return 'Other';
  // Add more sector mappings as needed
  return sector;
};

const sectors = ['All', 'Technology', 'Healthcare', 'Finance', 'Consumer Discretionary', 'Energy', 'Other'];

export function ExplorePage() {
  const navigate = useNavigate();
  const [selectedSector, setSelectedSector] = useState('All');
  const [trendingStocks, setTrendingStocks] = useState<TrendingStock[]>([]);
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTrendingData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDayGainers(15); // Get top 15 gainers
      setTrendingStocks(data);
      // setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to fetch trending stocks. Please try again.');
      console.error('Error fetching trending data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingData();
  }, []);

  const filteredStocks = useMemo(() => {
    return trendingStocks.filter(stock => {
      const stockSector = normalizeSecctor(stock.sector);
      const matchesSector = selectedSector === 'All' || stockSector === selectedSector;
      return matchesSector;
    });
  }, [trendingStocks, selectedSector]);

  const selectedStockDetails = useMemo(() => {
    return selectedTickers.map(ticker => 
      trendingStocks.find(stock => stock.symbol === ticker)
    ).filter(Boolean) as TrendingStock[];
  }, [selectedTickers, trendingStocks]);

  const toggleTickerSelection = (ticker: string) => {
    setSelectedTickers(prev => 
      prev.includes(ticker) 
        ? prev.filter(t => t !== ticker)
        : [...prev, ticker]
    );
  };

  const clearAllSelections = () => {
    setSelectedTickers([]);
  };

  const handleStartAnalysis = () => {
    if (selectedTickers.length === 0) return;
    
    // Navigate to analysis page with selected tickers as URL params
    const tickersParam = selectedTickers.join(',');
    navigate(`/analysis?tickers=${encodeURIComponent(tickersParam)}`);
  };

  const getTrendingIcon = (changePercent: number) => {
    if (changePercent >= 15) {
      return <Flame className="w-4 h-4 text-red-500 dark:text-red-400" />;
    } else if (changePercent >= 8) {
      return <Zap className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />;
    } else if (changePercent >= 3) {
      return <BarChart3 className="w-4 h-4 text-green-500 dark:text-green-400" />;
    } else {
      return <TrendingUp className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading trending stocks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-red-600 mb-4">{error}</p>
          <Button onClick={fetchTrendingData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-600 to-blue-700 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              🔍 Explore Trending Stocks
            </h1>
            <p className="text-xl md:text-2xl text-green-100">
              Discover today's top gainers and build your analysis portfolio
            </p>
            <div className="flex items-center justify-center gap-4 mt-8">
              <Badge variant="secondary" className="px-4 py-2 text-lg">
                <TrendingUp className="w-5 h-5 mr-2" />
                Real-time Data
              </Badge>
              {/* <Badge variant="secondary" className="px-4 py-2 text-lg">
                <Clock className="w-5 h-5 mr-2" />
                {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Live'}
              </Badge> */}
              {/* {selectedTickers.length > 0 && (
                <Badge variant="secondary" className="px-4 py-2 text-lg bg-white/20">
                  <BarChart className="w-5 h-5 mr-2" />
                  {selectedTickers.length} Selected
                </Badge>
              )}
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={fetchTrendingData}
                disabled={loading}
                className="bg-white/20 hover:bg-white/30"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button> */}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with 4/5 + 1/5 Layout */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Stock Cards Grid - 4/5 width */}
          <div className="lg:col-span-4">
            {/* Search and Filters */}
            <div className="mb-8 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  Top {trendingStocks.length} Day Gainers
                </h2>
                <span className="text-sm text-muted-foreground">
                  Market data from Yahoo Finance
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sectors.map((sector) => (
                  <Button
                    key={sector}
                    variant={selectedSector === sector ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSector(sector)}
                  >
                    {sector}
                  </Button>
                ))}
              </div>
            </div>

            {/* Stock Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredStocks.map((stock) => {
                const isSelected = selectedTickers.includes(stock.symbol);
                
                return (
                  <Card
                    key={stock.symbol}
                    className={`group hover:shadow-lg transition-all duration-300 overflow-hidden border-l-4 cursor-pointer ${
                      isSelected 
                        ? 'border-l-blue-500 dark:border-l-blue-400 bg-blue-50 dark:bg-blue-950/50 ring-2 ring-blue-200 dark:ring-blue-800' 
                        : 'border-l-green-500 dark:border-l-green-400 hover:border-l-blue-500 dark:hover:border-l-blue-400'
                    }`}
                    onClick={() => toggleTickerSelection(stock.symbol)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl flex items-center gap-2">
                            {stock.symbol}
                            {getTrendingIcon(stock.change_percent)}
                            {0 && (
                              <div className="ml-auto">
                                <div className="w-6 h-6 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center">
                                  <Plus className="w-4 h-4 text-white rotate-45" />
                                </div>
                              </div>
                            )}
                          </CardTitle>
                          <CardDescription className="text-muted-foreground font-medium">
                            {stock.company_name}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-foreground">${stock.price.toFixed(2)}</div>
                          <div className={`text-sm font-medium ${
                            stock.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.change_percent.toFixed(2)}%)
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* BUY Signal */}
                      {/* <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={signal.className}>
                            {signal.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {stock.exchange}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Vol: {formatVolume(stock.volume)}
                        </div>
                      </div> */}

                      {/* Key Metrics */}
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Market Cap:</span>
                          <span className="font-medium">{stock.market_cap_formatted}</span>
                        </div>
                        {stock.pe_ratio && (
                          <div className="flex justify-between">
                            <span>P/E Ratio:</span>
                            <span className="font-medium">{stock.pe_ratio.toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      {/* Selection Indicator */}
                      <div className="text-xs text-center pt-2 border-t">
                        {isSelected ? (
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            ✓ Added to Analysis
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Click to add to analysis
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredStocks.length === 0 && !loading && (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No trending stocks found</h3>
                <p className="text-muted-foreground">Try adjusting your sector filter or refresh the data</p>
              </div>
            )}
          </div>

          {/* Selection Sidebar - 1/5 width */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card className="h-fit max-h-[calc(100vh-6rem)] flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="w-5 h-5" />
                    Selected Stocks
                  </CardTitle>
                  <CardDescription>
                    {selectedTickers.length === 0 
                      ? 'Select stocks to analyze'
                      : `${selectedTickers.length} stock${selectedTickers.length > 1 ? 's' : ''} selected`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 space-y-4 min-h-0">
                  {selectedTickers.length === 0 ? (
                    <div className="text-center py-8">
                      <BarChart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">
                        Click on stock cards to add them to your analysis portfolio
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Selected Stocks List - Expandable scrollable area */}
                      <div className="flex-1 min-h-0">
                        <div className="space-y-3 h-full max-h-[calc(100vh-24rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent pr-2">
                          {selectedStockDetails.map((stock) => (
                            <div 
                              key={stock.symbol}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg transition-colors hover:bg-muted/70"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm truncate">{stock.symbol}</span>
                                  {getTrendingIcon(stock.change_percent)}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  +{stock.change_percent.toFixed(2)}% • ${stock.price.toFixed(2)}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTickerSelection(stock.symbol);
                                }}
                                className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900 flex-shrink-0 ml-2"
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Analysis Button - Fixed at bottom */}
                      <div className="flex-shrink-0 space-y-2 pt-4 border-t">
                        <Button 
                          className="w-full"
                          onClick={handleStartAnalysis}
                          disabled={selectedTickers.length === 0}
                        >
                          <BarChart className="w-4 h-4 mr-2" />
                          Analyze ({selectedTickers.length})
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full"
                          onClick={clearAllSelections}
                          disabled={selectedTickers.length === 0}
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          Clear All
                        </Button>
                      </div>

                      {/* Summary - Fixed at bottom */}
                      <div className="flex-shrink-0 text-xs text-muted-foreground text-center pt-2 border-t">
                        Ready to analyze {selectedTickers.length} trending stock{selectedTickers.length > 1 ? 's' : ''} with AI
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 