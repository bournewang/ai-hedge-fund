import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Users,
  ChevronRight,
  Flame,
  Zap,
  BarChart3
} from 'lucide-react';

// Mock data for trending stocks
const mockTrendingStocks = [
  {
    ticker: 'NVDA',
    company: 'NVIDIA Corporation',
    price: 875.40,
    change: 12.35,
    changePercent: 1.43,
    signalStrength: 5,
    volume: '52.3M',
    pe: 68.2,
    marketCap: '2.16T',
    sector: 'Technology',
    signals: ['warren_buffett', 'cathie_wood', 'peter_lynch'],
    catalysts: ['Strong Q4 earnings', 'AI data center demand', 'New chip architecture'],
    timeframe: '1h',
    trending: 'hot'
  },
  {
    ticker: 'MSFT',
    company: 'Microsoft Corporation',
    price: 420.55,
    change: 8.92,
    changePercent: 2.17,
    signalStrength: 4,
    volume: '28.7M',
    pe: 35.8,
    marketCap: '3.12T',
    sector: 'Technology',
    signals: ['warren_buffett', 'charlie_munger'],
    catalysts: ['Cloud growth acceleration', 'AI integration'],
    timeframe: '2h',
    trending: 'strong'
  },
  {
    ticker: 'TSLA',
    company: 'Tesla Inc',
    price: 248.87,
    change: -3.42,
    changePercent: -1.35,
    signalStrength: 3,
    volume: '67.1M',
    pe: 45.2,
    marketCap: '791B',
    sector: 'Consumer Discretionary',
    signals: ['cathie_wood', 'michael_burry'],
    catalysts: ['Production update', 'Autonomous driving'],
    timeframe: '4h',
    trending: 'rising'
  },
  {
    ticker: 'AAPL',
    company: 'Apple Inc',
    price: 189.98,
    change: 2.15,
    changePercent: 1.15,
    signalStrength: 4,
    volume: '45.2M',
    pe: 28.9,
    marketCap: '2.98T',
    sector: 'Technology',
    signals: ['warren_buffett', 'peter_lynch'],
    catalysts: ['iPhone sales recovery', 'Services growth'],
    timeframe: '1h',
    trending: 'strong'
  },
  {
    ticker: 'AMZN',
    company: 'Amazon.com Inc',
    price: 155.32,
    change: 4.87,
    changePercent: 3.24,
    signalStrength: 4,
    volume: '38.9M',
    pe: 52.1,
    marketCap: '1.62T',
    sector: 'Consumer Discretionary',
    signals: ['cathie_wood', 'peter_lynch'],
    catalysts: ['AWS growth', 'Holiday sales strength'],
    timeframe: '30m',
    trending: 'hot'
  },
  {
    ticker: 'GOOGL',
    company: 'Alphabet Inc',
    price: 142.87,
    change: 1.92,
    changePercent: 1.36,
    signalStrength: 3,
    volume: '22.4M',
    pe: 25.4,
    marketCap: '1.78T',
    sector: 'Technology',
    signals: ['warren_buffett'],
    catalysts: ['Search revenue growth', 'Cloud competition'],
    timeframe: '2h',
    trending: 'rising'
  }
];

const sectors = ['All', 'Technology', 'Healthcare', 'Finance', 'Consumer Discretionary', 'Energy'];

export function ExplorePage() {
  const [selectedSector, setSelectedSector] = useState('All');

  const filteredStocks = useMemo(() => {
    return mockTrendingStocks.filter(stock => {
      const matchesSector = selectedSector === 'All' || stock.sector === selectedSector;
      return matchesSector;
    });
  }, [selectedSector]);

  const getTrendingIcon = (trending: string) => {
    switch (trending) {
      case 'hot':
        return <Flame className="w-4 h-4 text-red-500 dark:text-red-400" />;
      case 'strong':
        return <Zap className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />;
      case 'rising':
        return <BarChart3 className="w-4 h-4 text-green-500 dark:text-green-400" />;
      default:
        return <TrendingUp className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
    }
  };

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
              Discover stocks with recent buy signals from our AI analysts
            </p>
            <div className="flex items-center justify-center gap-4 mt-8">
              <Badge variant="secondary" className="px-4 py-2 text-lg">
                <TrendingUp className="w-5 h-5 mr-2" />
                Live Signals
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-lg">
                <Users className="w-5 h-5 mr-2" />
                AI Analysis
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-lg">
                <Clock className="w-5 h-5 mr-2" />
                Real-time Data
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
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

        {/* Stock Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStocks.map((stock) => (
            <Card
              key={stock.ticker}
              className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-l-4 border-l-green-500 dark:border-l-green-400"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      {stock.ticker}
                      {getTrendingIcon(stock.trending)}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground font-medium">
                      {stock.company}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-foreground">${stock.price}</div>
                    <div className={`text-sm font-medium ${
                      stock.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {stock.change >= 0 ? '+' : ''}{stock.change} ({stock.changePercent}%)
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* BUY Signal */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {stock.signalStrength >= 4 ? (
                      <Badge className="bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600 text-white font-semibold">
                        STRONG BUY
                      </Badge>
                    ) : stock.signalStrength >= 3 ? (
                      <Badge className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold">
                        BUY
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-semibold">
                        WATCH
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {stock.signals.length} analyst{stock.signals.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stock.timeframe} ago
                  </div>
                </div>

                {/* Top Catalyst */}
                <div className="text-xs text-muted-foreground flex items-start gap-1">
                  <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{stock.catalysts[0]}</span>
                </div>

                {/* Action Button */}
                <Button size="sm" className="w-full">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Start Analysis
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredStocks.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No trending stocks found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria or filters</p>
          </div>
        )}
      </div>
    </div>
  );
} 