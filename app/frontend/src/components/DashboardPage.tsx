import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { SEO } from './SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api, RecentAnalysis, TrendingStock } from '@/services/api';
import { 
  TrendingUp, 
  Users, 
  Gem, 
  BarChart3,
  Clock,
  ArrowRight,
  Zap,
  Loader2,
  Flame
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export function DashboardPage() {
  const { t } = useLanguage();
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [trendingStocks, setTrendingStocks] = useState<TrendingStock[]>([]);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(true);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);
  const [analysesError, setAnalysesError] = useState<string | null>(null);
  const [trendingError, setTrendingError] = useState<string | null>(null);

  // Mock data for dashboard stats
  // const stats = {
  //   totalAnalyses: 1247,
  //   activeSignals: 23,
  //   successRate: 78.5,
  //   portfolioValue: 2450000
  // };

  // Get trending icon based on change percentage
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

  // Format volume for display
  const formatVolume = (volume: number): string => {
    if (volume >= 1_000_000) {
      return `${(volume / 1_000_000).toFixed(1)}M`;
    } else if (volume >= 1_000) {
      return `${(volume / 1_000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  // Fetch recent analyses from API
  const fetchRecentAnalyses = async () => {
    try {
      setIsLoadingAnalyses(true);
      setAnalysesError(null);
      
      const analyses = await api.getRecentAnalyses(3);
      setRecentAnalyses(analyses);
      
    } catch (err) {
      console.error('Error fetching recent analyses:', err);
      setAnalysesError(err instanceof Error ? err.message : 'Failed to load recent analyses');
      
      // Fallback to mock data on error
      const mockAnalyses: RecentAnalysis[] = [
        { 
          id: 'mock-1',
          ticker: 'NVDA', 
          signal: 'STRONG BUY', 
          change: '+12.3%', 
          time: '2h ago', 
          confidence: 85,
          timestamp: new Date().toISOString(),
          initial_price: 800,
          agents_used: ['warren_buffett', 'peter_lynch'],
          agent_count: 2,
          bullish_agents: 2,
          bearish_agents: 0,
          analysis_period: '2024-01-01 to 2024-01-31',
          reasoning: 'Strong AI growth prospects',
          change_percent_numeric: 12.3,
          current_price: 898.4
        },
        { 
          id: 'mock-2',
          ticker: 'MSFT', 
          signal: 'BUY', 
          change: '+8.9%', 
          time: '4h ago', 
          confidence: 75,
          timestamp: new Date().toISOString(),
          initial_price: 400,
          agents_used: ['warren_buffett'],
          agent_count: 1,
          bullish_agents: 1,
          bearish_agents: 0,
          analysis_period: '2024-01-01 to 2024-01-31',
          reasoning: 'Solid cloud business fundamentals',
          change_percent_numeric: 8.9,
          current_price: 435.6
        },
        { 
          id: 'mock-3',
          ticker: 'AAPL', 
          signal: 'BUY', 
          change: '+2.1%', 
          time: '6h ago', 
          confidence: 70,
          timestamp: new Date().toISOString(),
          initial_price: 190,
          agents_used: ['warren_buffett', 'peter_lynch'],
          agent_count: 2,
          bullish_agents: 2,
          bearish_agents: 0,
          analysis_period: '2024-01-01 to 2024-01-31',
          reasoning: 'Strong brand and ecosystem',
          change_percent_numeric: 2.1,
          current_price: 194.0
        },
      ];
      setRecentAnalyses(mockAnalyses);
    } finally {
      setIsLoadingAnalyses(false);
    }
  };

  // Fetch trending stocks from API
  const fetchTrendingStocks = async () => {
    try {
      setIsLoadingTrending(true);
      setTrendingError(null);
      
      const trending = await api.getDayGainers(3); // Get top 3 for dashboard
      setTrendingStocks(trending);
      
    } catch (err) {
      console.error('Error fetching trending stocks:', err);
      setTrendingError(err instanceof Error ? err.message : 'Failed to load trending stocks');
      
      // Fallback to mock data on error
      const mockTrending: TrendingStock[] = [
        { 
          symbol: 'TSLA', 
          company_name: 'Tesla Inc',
          price: 248.50,
          change: 13.75,
          change_percent: 5.7, 
          volume: 67100000,
          market_cap: 790000000000,
          market_cap_formatted: '$790.0B',
          sector: 'Consumer Discretionary',
          exchange: 'NASDAQ'
        },
        { 
          symbol: 'AMZN', 
          company_name: 'Amazon.com Inc',
          price: 178.25,
          change: 7.20,
          change_percent: 4.2, 
          volume: 38900000,
          market_cap: 1850000000000,
          market_cap_formatted: '$1.85T',
          sector: 'Consumer Discretionary',
          exchange: 'NASDAQ'
        },
        { 
          symbol: 'GOOGL', 
          company_name: 'Alphabet Inc',
          price: 175.80,
          change: 3.10,
          change_percent: 1.8, 
          volume: 22400000,
          market_cap: 2200000000000,
          market_cap_formatted: '$2.20T',
          sector: 'Technology',
          exchange: 'NASDAQ'
        },
      ];
      setTrendingStocks(mockTrending);
    } finally {
      setIsLoadingTrending(false);
    }
  };

  useEffect(() => {
    fetchRecentAnalyses();
    fetchTrendingStocks();
  }, []);

  return (
    <>
      <SEO
        title="Dashboard"
        description="Overview of AI investment signals and trending stocks."
        url="https://freeaiinvestment.com/"
      />
      <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold">
              {t('dashboard.hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              {t('dashboard.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <Link to="/analysis">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700 px-8 py-4 text-lg font-semibold">
                  <BarChart3 className="w-6 h-6 mr-2" />
{t('dashboard.hero.startAnalysis')}
                </Button>
              </Link>
              <Link to="/explore">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700 px-8 py-4 text-lg font-semibold">
                    <TrendingUp className="w-6 h-6 mr-2" />
                    {t('dashboard.hero.explore')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Quick Stats */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        </div> */}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Analyses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
{t('dashboard.recentAnalyses.title')}
                </span>
                <Link to="/recent-analyses">
                  <Button variant="ghost" size="sm">
{t('dashboard.recentAnalyses.viewAll')} <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAnalyses ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span className="text-muted-foreground">{t('dashboard.recentAnalyses.loading')}</span>
                </div>
              ) : analysesError ? (
                <div className="text-center p-4">
                  <p className="text-red-500 dark:text-red-400 text-sm mb-2">
                    {t('dashboard.recentAnalyses.loadError')}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('dashboard.recentAnalyses.fallbackData')}</p>
                </div>
              ) : null}
              
              <div className="space-y-4">
                {recentAnalyses.map((analysis, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-foreground">{analysis.ticker}</div>
                      <Badge 
                        variant={analysis.signal === 'STRONG BUY' ? 'secondary' : 'outline'}
                        className={analysis.signal === 'STRONG BUY' ? 'bg-green-600 dark:bg-green-500 text-white' : 'bg-blue-600 dark:bg-blue-500 text-white'}
                      >
{t(`signals.${analysis.signal}`)}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${
                        analysis.change.startsWith('+') 
                          ? 'text-green-600 dark:text-green-400' 
                          : analysis.change.startsWith('-')
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-muted-foreground'
                      }`}>
                        {analysis.change}
                      </div>
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
{t('dashboard.trending.title')}
                </span>
                <Link to="/explore">
                  <Button variant="ghost" size="sm">
{t('dashboard.trending.explore')} <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTrending ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span className="text-muted-foreground">{t('dashboard.trending.loading')}</span>
                </div>
              ) : trendingError ? (
                <div className="text-center p-4">
                  <p className="text-red-500 dark:text-red-400 text-sm mb-2">
                    {t('dashboard.trending.loadError')}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('dashboard.trending.fallbackData')}</p>
                </div>
              ) : null}
              
              <div className="space-y-4">
                {trendingStocks.map((stock, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-foreground">{stock.symbol}</div>
                        {getTrendingIcon(stock.change_percent)}
                      </div>
                      <div className="text-sm text-muted-foreground">{t('dashboard.trending.volume')}: {formatVolume(stock.volume)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-600 dark:text-green-400 font-medium">
                        +{stock.change_percent.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">${stock.price.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Link to="/explore" className="group">
            <Card className="h-full hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 dark:border-l-green-400">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <TrendingUp className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold text-lg text-foreground">{t('dashboard.features.explore.title')}</h3>
                  <p className="text-muted-foreground text-sm">{t('dashboard.features.explore.description')}</p>
                  <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                    {t('dashboard.features.explore.action')} <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/recent-analyses" className="group">
            <Card className="h-full hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Clock className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold text-lg text-foreground">{t('dashboard.features.recentAnalysis.title')}</h3>
                  <p className="text-muted-foreground text-sm">{t('dashboard.features.recentAnalysis.description')}</p>
                  <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                    {t('dashboard.features.recentAnalysis.action')} <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/value-picks" className="group">
            <Card className="h-full hover:shadow-lg transition-all duration-300 border-l-4 border-l-yellow-500">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Gem className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold text-lg text-foreground">{t('dashboard.features.valuePicks.title')}</h3>
                  <p className="text-muted-foreground text-sm">{t('dashboard.features.valuePicks.description')}</p>
                  <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                    {t('dashboard.features.valuePicks.action')} <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/agents" className="group">
            <Card className="h-full hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Users className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold text-lg text-foreground">{t('dashboard.features.aiAgents.title')}</h3>
                  <p className="text-muted-foreground text-sm">{t('dashboard.features.aiAgents.description')}</p>
                  <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                    {t('dashboard.features.aiAgents.action')} <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/analysis" className="group">
            <Card className="h-full hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500 dark:border-l-orange-400">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <BarChart3 className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold text-lg text-foreground">{t('dashboard.features.analysisNow.title')}</h3>
                  <p className="text-muted-foreground text-sm">{t('dashboard.features.analysisNow.description')}</p>
                  <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                    {t('dashboard.features.analysisNow.action')} <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">{t('dashboard.cta.title')}</h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              {t('dashboard.cta.subtitle')}
            </p>
            <Link to="/analysis">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700 px-8 py-4 text-lg font-semibold">
                <BarChart3 className="w-6 h-6 mr-2" />
{t('dashboard.cta.action')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
