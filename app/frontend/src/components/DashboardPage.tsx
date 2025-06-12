import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Gem, 
  BarChart3,
  DollarSign,
  Clock,
  ArrowRight,
  Zap,
  Target
} from 'lucide-react';

export function DashboardPage() {
  // Mock data for dashboard
  const stats = {
    totalAnalyses: 1247,
    activeSignals: 23,
    successRate: 78.5,
    portfolioValue: 2450000
  };

  const recentAnalyses = [
    { ticker: 'NVDA', signal: 'STRONG BUY', change: '+12.3%', time: '2h ago' },
    { ticker: 'MSFT', signal: 'BUY', change: '+8.9%', time: '4h ago' },
    { ticker: 'AAPL', signal: 'BUY', change: '+2.1%', time: '6h ago' },
  ];

  const trendingStocks = [
    { ticker: 'TSLA', change: '+5.7%', volume: '67.1M' },
    { ticker: 'AMZN', change: '+4.2%', volume: '38.9M' },
    { ticker: 'GOOGL', change: '+1.8%', volume: '22.4M' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold">
              AI Hedge Fund Platform
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Harness the wisdom of 17 legendary investors powered by artificial intelligence. 
              Make smarter investment decisions with data-driven insights.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <Link to="/analysis">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700 px-8 py-4 text-lg font-semibold">
                  <BarChart3 className="w-6 h-6 mr-2" />
                  Start Analysis
                </Button>
              </Link>
              <Link to="/explore">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700 px-8 py-4 text-lg font-semibold">
                    <TrendingUp className="w-6 h-6 mr-2" />
                    Explore
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-md transition-shadow border dark:border-white/20 border-l-[6px] border-l-blue-500 dark:border-l-blue-300 dark:bg-blue-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Analyses</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalAnalyses.toLocaleString()}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500 dark:text-blue-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border dark:border-white/20 border-l-[6px] border-l-yellow-500 dark:border-l-yellow-300 dark:bg-yellow-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Signals</p>
                  <p className="text-2xl font-bold text-foreground">{stats.activeSignals}</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-500 dark:text-yellow-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border dark:border-white/20 border-l-[6px] border-l-green-500 dark:border-l-green-300 dark:bg-green-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-foreground">{stats.successRate}%</p>
                </div>
                <Target className="h-8 w-8 text-green-500 dark:text-green-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border dark:border-white/20 border-l-[6px] border-l-purple-500 dark:border-l-purple-300 dark:bg-purple-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Portfolio Value</p>
                  <p className="text-2xl font-bold text-foreground">${(stats.portfolioValue / 1000000).toFixed(1)}M</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500 dark:text-purple-300" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Analyses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  Recent Analyses
                </span>
                <Link to="/analysis">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAnalyses.map((analysis, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-foreground">{analysis.ticker}</div>
                      <Badge 
                        variant={analysis.signal === 'STRONG BUY' ? 'secondary' : 'outline'}
                        className={analysis.signal === 'STRONG BUY' ? 'bg-green-600 dark:bg-green-500 text-white' : 'bg-blue-600 dark:bg-blue-500 text-white'}
                      >
                        {analysis.signal}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-green-600 dark:text-green-400 font-medium">{analysis.change}</div>
                      <div className="text-xs text-muted-foreground">{analysis.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trending Stocks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  Trending Now
                </span>
                <Link to="/explore">
                  <Button variant="ghost" size="sm">
                    Explore <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trendingStocks.map((stock, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-foreground">{stock.ticker}</div>
                      <div className="text-sm text-muted-foreground">Vol: {stock.volume}</div>
                    </div>
                    <div className="text-green-600 dark:text-green-400 font-medium">{stock.change}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/explore" className="group">
            <Card className="h-full hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 dark:border-l-green-400">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <TrendingUp className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold text-lg text-foreground">🔍 Explore</h3>
                  <p className="text-muted-foreground text-sm">Discover trending stocks with buy signals from our AI analysts</p>
                  <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                    Start Exploring <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/monitoring" className="group">
            <Card className="h-full hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Eye className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold text-lg text-foreground">👀 Monitoring</h3>
                  <p className="text-muted-foreground text-sm">Track volatile stocks and monitor your watchlist in real-time</p>
                  <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                    Start Monitoring <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/value-picks" className="group">
            <Card className="h-full hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Gem className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold text-lg text-foreground">🏷️ Value Picks</h3>
                  <p className="text-muted-foreground text-sm">Long-term recommendations from value-focused AI investors</p>
                  <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                    Find Value <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/agents" className="group">
            <Card className="h-full hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Users className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold text-lg text-foreground">🧠 AI Masters</h3>
                  <p className="text-muted-foreground text-sm">Meet our 17 legendary AI investment advisors and their strategies</p>
                  <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                    Meet the Masters <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Bottom CTA */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Make Smarter Investments?</h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Join thousands of investors who trust our AI-powered platform for data-driven investment decisions.
            </p>
            <Link to="/analysis">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700 px-8 py-4 text-lg font-semibold">
                <BarChart3 className="w-6 h-6 mr-2" />
                Start Your First Analysis
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 