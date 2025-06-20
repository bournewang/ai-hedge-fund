import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api, RecentAnalysis } from '@/services/api';
import {
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar,
  BarChart3,
  Loader2,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { SEO } from './SEO';

export function RecentAnalysesPage() {
  const { t } = useLanguage();
  const [analyses, setAnalyses] = useState<RecentAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSignal, setFilterSignal] = useState<string>('all');

  // Fetch recent analyses
  const fetchAnalyses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await api.getRecentAnalyses(50); // Get more analyses for this page
      setAnalyses(result);
      
    } catch (err) {
      console.error('Error fetching recent analyses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recent analyses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, []);

  // Filter analyses based on search and signal filter
  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch = analysis.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         analysis.reasoning.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSignal = filterSignal === 'all' || analysis.signal === filterSignal;
    return matchesSearch && matchesSignal;
  });

  // Get unique signals for filter dropdown
  const uniqueSignals = Array.from(new Set(analyses.map(a => a.signal)));

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'STRONG BUY':
        return 'bg-green-600 dark:bg-green-500 text-white';
      case 'BUY':
        return 'bg-blue-600 dark:bg-blue-500 text-white';
      case 'HOLD':
        return 'bg-yellow-600 dark:bg-yellow-500 text-white';
      case 'SELL':
        return 'bg-orange-600 dark:bg-orange-500 text-white';
      case 'STRONG SELL':
        return 'bg-red-600 dark:bg-red-500 text-white';
      default:
        return 'bg-gray-600 dark:bg-gray-500 text-white';
    }
  };

  const getChangeColor = (change: string) => {
    if (change.startsWith('+')) {
      return 'text-green-600 dark:text-green-400';
    } else if (change.startsWith('-')) {
      return 'text-red-600 dark:text-red-400';
    }
    return 'text-muted-foreground';
  };

  return (
    <>
      <SEO
        title="Recent AI Stock Analyses & Signal Performance History"
        description="View recent AI-generated stock analyses and monitor performance over time with clear signals."
        url="https://freeaiinvestment.com/recent-analyses"
      />
      <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('recentAnalyses.title')}</h1>
              <p className="text-blue-100">
                {t('recentAnalyses.subtitle')}
              </p>
            </div>
            <Button 
              onClick={fetchAnalyses}
              disabled={isLoading}
              className="bg-white text-blue-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {t('recentAnalyses.refresh')}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder={t('recentAnalyses.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterSignal}
              onChange={(e) => setFilterSignal(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">{t('recentAnalyses.allSignals')}</option>
              {uniqueSignals.map(signal => (
                <option key={signal} value={signal}>{signal}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('recentAnalyses.stats.totalAnalyses')}</p>
                  <p className="text-2xl font-bold">{analyses.length}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('recentAnalyses.stats.positiveChanges')}</p>
                  <p className="text-2xl font-bold text-green-600">
                    {analyses.filter(a => a.change.startsWith('+')).length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('recentAnalyses.stats.negativeChanges')}</p>
                  <p className="text-2xl font-bold text-red-600">
                    {analyses.filter(a => a.change.startsWith('-')).length}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('recentAnalyses.stats.avgConfidence')}</p>
                  <p className="text-2xl font-bold">
                    {analyses.length > 0 ? Math.round(analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length) : 0}%
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <span className="text-lg text-muted-foreground">{t('recentAnalyses.loading')}</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-6 text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Button onClick={fetchAnalyses} variant="outline">
                {t('recentAnalyses.tryAgain')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Analyses List */}
        {!isLoading && !error && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {t('recentAnalyses.results.analysisCount', { 
                  count: filteredAnalyses.length, 
                  plural: filteredAnalyses.length !== 1 ? 'es' : '' 
                })}
                {searchTerm && ` ${t('recentAnalyses.results.matching', { term: searchTerm })}`}
                {filterSignal !== 'all' && ` ${t('recentAnalyses.results.withSignal', { signal: filterSignal })}`}
              </h2>
            </div>

            <div className="space-y-4">
              {filteredAnalyses.map((analysis) => (
                <Card key={analysis.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Left Section - Main Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-foreground">{analysis.ticker}</h3>
                          <Badge className={getSignalColor(analysis.signal)}>
                            {analysis.signal}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {t('recentAnalyses.results.confidence')} {analysis.confidence}%
                          </span>
                        </div>
                        
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {analysis.reasoning}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{t('recentAnalyses.results.agents', { 
                              count: analysis.agent_count, 
                              plural: analysis.agent_count !== 1 ? 's' : '' 
                            })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{analysis.analysis_period}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{analysis.time}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Performance */}
                      <div className="lg:text-right">
                        <div className={`text-2xl font-bold ${getChangeColor(analysis.change)}`}>
                          {analysis.change}
                        </div>
                        {analysis.current_price && (
                          <div className="text-sm text-muted-foreground">
                            {t('recentAnalyses.results.current')} ${analysis.current_price.toFixed(2)}
                          </div>
                        )}
                        {/* {analysis.initial_price && (
                          <div className="text-sm text-muted-foreground">
                            {t('recentAnalyses.results.initial')} ${analysis.initial_price.toFixed(2)}
                          </div>
                        )} */}
                        
                        {/* Agent Breakdown */}
                        <div className="flex items-center gap-2 mt-2 lg:justify-end">
                          <div className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                            {analysis.bullish_agents} {t('recentAnalyses.results.bullish')}
                          </div>
                          <div className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                            {analysis.bearish_agents} {t('recentAnalyses.results.bearish')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredAnalyses.length === 0 && analyses.length > 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('recentAnalyses.emptyStates.noResultsTitle')}</h3>
                  <p className="text-muted-foreground">
                    {t('recentAnalyses.emptyStates.noResultsDescription')}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* No Data State */}
            {analyses.length === 0 && !isLoading && (
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('recentAnalyses.emptyStates.noDataTitle')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t('recentAnalyses.emptyStates.noDataDescription')}
                  </p>
                  <Button asChild>
                    <a href="/analysis">{t('recentAnalyses.emptyStates.startAnalysis')}</a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
      </div>
    </>
  );
}