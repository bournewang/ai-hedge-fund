import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, PlayCircle, TrendingUp, Users, BarChart3, RotateCcw, AlertCircle, X, Search } from 'lucide-react';
import { getAgents, getAgentByKey, investmentStyles, getAgentsByCategory, type AgentItem } from '@/data/agents';
import { useNodeContext } from '@/contexts/node-context';
import { api } from '@/services/api';
import { tickerSymbolsService } from '@/services/tickerSymbols';
import { useLanguage } from '@/hooks/useLanguage';
import { AnalysisResults } from './AnalysisResults';

type InvestmentStyle = keyof typeof investmentStyles;

interface AnalysisFormProps {
  onAnalysisStart?: () => void;
}

// 扩展的热门股票列表，包含更多选项
const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'META', name: 'Meta Platforms' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway' },
  { symbol: 'JPM', name: 'JPMorgan Chase' },
  { symbol: 'V', name: 'Visa' },
];



export function AnalysisForm({ onAnalysisStart }: AnalysisFormProps) {
  const [searchParams] = useSearchParams();
  const [tickers, setTickers] = useState<string>('AAPL,MSFT,NVDA');
  const [selectedStyle, setSelectedStyle] = useState<InvestmentStyle | 'all'>('all');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // New state for ticker autocomplete
  const [tickerInput, setTickerInput] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const [isLoadingSymbols, setIsLoadingSymbols] = useState(false);
  
  // Add new state for ticker limit warning
  const [tickerLimitWarning, setTickerLimitWarning] = useState(false);
  
  const nodeContext = useNodeContext();
  const { t } = useLanguage();

  // Preload ticker symbols on component mount
  useEffect(() => {
    const preloadSymbols = async () => {
      setIsLoadingSymbols(true);
      try {
        await tickerSymbolsService.preloadSymbols();
        console.log('✅ Ticker symbols preloaded');
      } catch (error) {
        console.error('⚠️  Failed to preload ticker symbols:', error);
      } finally {
        setIsLoadingSymbols(false);
      }
    };
    
    preloadSymbols();
  }, []);

  // Parse tickers from URL parameters on component mount
  useEffect(() => {
    const urlTickers = searchParams.get('tickers');
    if (urlTickers) {
      // Decode and clean up the tickers
      const decodedTickers = decodeURIComponent(urlTickers);
      const cleanedTickers = decodedTickers
        .split(',')
        .map(ticker => ticker.trim().toUpperCase())
        .filter(ticker => ticker.length > 0)
        .join(',');
      
      if (cleanedTickers) {
        setTickers(cleanedTickers);
        console.log('✅ Loaded tickers from URL:', cleanedTickers);
      }
    }
  }, [searchParams]);

  // Enhanced ticker validation using real symbols
  const tickerValidation = useMemo(() => {
    const tickerList = tickers.split(',').map(t => t.trim()).filter(Boolean);
    const validTickers: string[] = [];
    const invalidTickers: string[] = [];
    
    tickerList.forEach(ticker => {
      const upperTicker = ticker.toUpperCase();
      // Basic format validation first
      if (/^[A-Z]{1,5}(\.[A-Z])?$/.test(upperTicker)) {
        validTickers.push(upperTicker);
      } else {
        invalidTickers.push(ticker);
      }
    });

    // Reset warning if under limit
    if (validTickers.length <= 5 && tickerLimitWarning) setTickerLimitWarning(false);

    return {
      valid: validTickers,
      invalid: invalidTickers,
      isValid: invalidTickers.length === 0 && validTickers.length > 0 && validTickers.length <= 5,
      isEmpty: tickerList.length === 0
    };
  }, [tickers, tickerLimitWarning]);

  // Handle ticker input changes and search suggestions
  const handleTickerInputChange = useCallback(async (value: string) => {
    setTickerInput(value);
    setSelectedSuggestionIndex(-1); // Reset selection when typing
    
    if (value.length >= 1) {
      try {
        const searchResults = await tickerSymbolsService.searchTickers(value, 8);
        setSuggestions(searchResults);
        setShowSuggestions(searchResults.length > 0);
      } catch (error) {
        console.error('Error searching tickers:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  // Add ticker from suggestion or input
  const handleAddTicker = useCallback((symbol: string) => {
    const upperSymbol = symbol.toUpperCase();
    const currentTickers = tickers.split(',').map(t => t.trim().toUpperCase()).filter(Boolean);
    if (currentTickers.length >= 5) {
      setTickerLimitWarning(true);
      return;
    }
    if (!currentTickers.includes(upperSymbol)) {
      setTickers(prev => prev ? `${prev},${upperSymbol}` : upperSymbol);
    }
    setTickerInput('');
    setShowSuggestions(false);
  }, [tickers]);

  // Handle keyboard navigation in ticker input
  const handleTickerInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      // No suggestions showing, handle normal Enter
      if (e.key === 'Enter' && tickerInput.trim()) {
        e.preventDefault();
        handleAddTicker(tickerInput.trim());
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
          // Select highlighted suggestion
          handleAddTicker(suggestions[selectedSuggestionIndex]);
        } else if (tickerInput.trim()) {
          // No selection, add typed text
          handleAddTicker(tickerInput.trim());
        }
        break;
      
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  }, [showSuggestions, suggestions, selectedSuggestionIndex, tickerInput, handleAddTicker]);

  // 根据投资风格获取推荐的代理
  const getRecommendedAgents = useCallback((style: InvestmentStyle | 'all'): AgentItem[] => {
    if (style === 'all') {
      return getAgents().filter((agent: AgentItem) => 
        ['warren_buffett', 'cathie_wood', 'technical_analyst', 'risk_manager'].includes(agent.key)
      );
    }
    return getAgentsByCategory(style);
  }, []);

  // 初始化时设置默认的推荐代理
  useEffect(() => {
    // const recommended = getRecommendedAgents('all');
    setSelectedAgents([]);
  }, [getRecommendedAgents]);

  // 处理投资风格选择
  const handleStyleChange = useCallback((style: InvestmentStyle | 'all') => {
    setSelectedStyle(style);
    const recommended = getRecommendedAgents(style);
    setSelectedAgents([recommended[0].key]);
  }, [getRecommendedAgents]);

  // 处理代理选择
  const handleAgentToggle = useCallback((agentKey: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentKey) 
        ? prev.filter(key => key !== agentKey)
        : [...prev, agentKey]
    );
  }, []);

  // 添加股票到输入框
  const handleAddStock = useCallback((symbol: string) => {
    const currentTickers = tickers.split(',').map(t => t.trim().toUpperCase()).filter(Boolean);
    if (currentTickers.length >= 5) {
      setTickerLimitWarning(true);
      return;
    }
    if (!currentTickers.includes(symbol)) {
      setTickers(prev => prev ? `${prev},${symbol}` : symbol);
    }
  }, [tickers]);

  // 从输入框移除股票
  const handleRemoveStock = useCallback((symbol: string) => {
    const currentTickers = tickers.split(',').map(t => t.trim()).filter(Boolean);
    const newTickers = currentTickers.filter(t => t.toUpperCase() !== symbol.toUpperCase());
    setTickers(newTickers.join(','));
  }, [tickers]);

  // 重置所有状态
  const handleReset = useCallback(() => {
    // 重置表单状态
    // setTickers('AAPL,MSFT,NVDA');
    // setSelectedAgents([]);
    // setSelectedStyle('all');
    // setTickerInput('');
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    // 重置为默认推荐的代理
    const recommended = getRecommendedAgents('all');
    setSelectedAgents(recommended.map(agent => agent.key));
    // 重置分析状态
    setIsAnalyzing(false);
    // 重置节点状态
    nodeContext.resetAllNodes();
  }, [nodeContext, getRecommendedAgents]);

  // 开始分析
  const handleStartAnalysis = useCallback(() => {
    if (!tickerValidation.isValid || selectedAgents.length === 0) {
      return;
    }

    setIsAnalyzing(true);
    onAnalysisStart?.();

    // 设置日期范围：当前日期作为结束日期，3个月前作为开始日期
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 3);

    // 格式化日期为YYYY-MM-DD
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    api.runHedgeFund({
      tickers: tickerValidation.valid,
      selected_agents: selectedAgents,
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
    }, nodeContext);
  }, [tickerValidation.valid, tickerValidation.isValid, selectedAgents, nodeContext, onAnalysisStart]);

  // 获取推荐的代理列表
  const recommendedAgents = getRecommendedAgents(selectedStyle);

  return (
    <div className="w-full bg-background">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* 页面标题和重置按钮 */}
        <div className="flex justify-between items-center">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">{t('header.subtitle')}</p>
          </div>
          {isAnalyzing && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4" />
              {t('common.reset')}
            </Button>
          )}
        </div>

        {/* 只在未开始分析时显示表单 */}
        {!isAnalyzing && (
          <div className="space-y-6">
            {/* 步骤1: 股票输入 - 增强版 */}
            <Card className="hover:shadow-md transition-shadow duration-300 border-l-4 border-l-green-500 dark:border-l-green-400">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  {t('analysisForm.step1.title')}
                  {isLoadingSymbols && (
                    <span className="text-xs text-muted-foreground">({t('analysisForm.step1.loadingSymbols')})</span>
                  )}
                </CardTitle>
                <CardDescription>
                  {t('analysisForm.step1.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Enhanced ticker input with autocomplete */}
                <div className="space-y-2">
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={t('analysisForm.step1.searchPlaceholder')}
                          value={tickerInput}
                          onChange={(e) => handleTickerInputChange(e.target.value)}
                          onKeyDown={handleTickerInputKeyDown}
                          onFocus={() => {
                            if (tickerInput.length >= 1 && suggestions.length > 0) {
                              setShowSuggestions(true);
                              setSelectedSuggestionIndex(-1);
                            }
                          }}
                          onBlur={() => setTimeout(() => {
                            setShowSuggestions(false);
                            setSelectedSuggestionIndex(-1);
                          }, 200)}
                          className="pl-10"
                        />
                        
                        {/* Autocomplete suggestions */}
                        {showSuggestions && suggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {suggestions.map((symbol, index) => (
                              <div
                                key={symbol}
                                className={`px-3 py-2 cursor-pointer text-sm transition-colors ${
                                  index === selectedSuggestionIndex
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted'
                                }`}
                                onClick={() => handleAddTicker(symbol)}
                                onMouseEnter={() => setSelectedSuggestionIndex(index)}
                              >
                                <span className="font-medium">{symbol}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {tickerInput.trim() && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleAddTicker(tickerInput.trim())}
                          className="px-3"
                        >
{t('common.add')}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Original bulk input for backward compatibility */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      {t('analysisForm.step1.bulkInputLabel')}
                    </label>
                    <Input
                      placeholder={t('analysisForm.step1.bulkInputPlaceholder')}
                      value={tickers}
                      onChange={(e) => setTickers(e.target.value)}
                      className={`text-lg ${
                        !tickerValidation.isEmpty && !tickerValidation.isValid 
                          ? 'border-red-300 focus:border-red-500 dark:border-red-600 dark:focus:border-red-400' 
                          : tickerValidation.isValid 
                          ? 'border-green-300 focus:border-green-500 dark:border-green-600 dark:focus:border-green-400'
                          : ''
                      }`}
                    />
                  </div>
                  
                  {/* URL Tickers Loaded Indicator */}
                  {searchParams.get('tickers') && (
                    <div className="flex items-center gap-2 p-3 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <div className="text-sm text-blue-700 dark:text-blue-300">
<span className="font-medium">{t('analysisForm.step1.loadedFromTrends').split(':')[0]}:</span> {t('analysisForm.step1.loadedFromTrends').split(':')[1]}
                      </div>
                    </div>
                  )}

                  {/* 验证提示 */}
                  {!tickerValidation.isEmpty && !tickerValidation.isValid && (
                    <div className="flex items-center gap-2 p-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <div className="text-sm text-red-700 dark:text-red-300">
{t('analysisForm.step1.invalidSymbols', { symbols: tickerValidation.invalid.join(', ') })}
                      </div>
                    </div>
                  )}

                  {tickerValidation.isValid && (
                    <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-2 rounded-lg border border-green-200 dark:border-green-800">
{t('analysisForm.step1.validSymbols', { count: tickerValidation.valid.length, symbols: tickerValidation.valid.join(', ') })}
                    </div>
                  )}
                </div>

                {/* 已选择的股票标签 */}
                {tickerValidation.valid.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-foreground">{t('analysisForm.step1.selectedStocks')}</div>
                    <div className="flex flex-wrap gap-2">
                      {tickerValidation.valid.map(ticker => (
                        <Badge 
                          key={ticker}
                          className="cursor-pointer bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/50 group border border-blue-300 dark:border-blue-700"
                          onClick={() => handleRemoveStock(ticker)}
                        >
                          {ticker}
                          <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ticker limit warning */}
                {tickerLimitWarning && (
                  <div className="flex items-center gap-2 p-3 border border-amber-300 dark:border-amber-700 bg-amber-100 dark:bg-amber-950/40 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-300 flex-shrink-0" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      {t('analysisForm.step1.tickerLimitWarning', { max: 5 })}
                    </div>
                  </div>
                )}                

                {/* 热门股票推荐 */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">{t('analysisForm.step1.popularRecommendations')}</div>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_STOCKS.map(stock => (
                      <Badge
                        key={stock.symbol}
                        variant="outline"
                        className="cursor-pointer hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 dark:hover:bg-purple-950/30 dark:hover:border-purple-700 dark:hover:text-purple-300 transition-colors"
                        onClick={() => handleAddStock(stock.symbol)}
                      >
                        {stock.symbol}
                        <span className="text-muted-foreground ml-1">({stock.name})</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 步骤2: 选择投资风格 */}
            <Card className="hover:shadow-md transition-shadow duration-300 border-l-4 border-l-blue-500 dark:border-l-blue-400">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  {t('analysisForm.step2.title')}
                </CardTitle>
                <CardDescription>
                  {t('analysisForm.step2.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(investmentStyles).map(([key]) => (
                    <div
                      key={key}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedStyle === key
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-400'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25 dark:border-gray-700 dark:hover:border-blue-600 dark:hover:bg-blue-950/20'
                      }`}
                      onClick={() => handleStyleChange(key as InvestmentStyle | 'all')}
                    >
                      <h3 className="font-semibold text-foreground">{t(`investmentStyles.${key}.name`)}</h3>
                      <p className="text-sm text-muted-foreground">{t(`investmentStyles.${key}.description`)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 步骤3: 选择AI投资大师 */}
            <Card className="hover:shadow-md transition-shadow duration-300 border-l-4 border-l-purple-500 dark:border-l-purple-400">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  {t('analysisForm.step3.title')}
                </CardTitle>
                <CardDescription>
                  {t('analysisForm.step3.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendedAgents.map(agent => (
                    <div
                      key={agent.key}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedAgents.includes(agent.key)
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-400'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25 dark:border-gray-700 dark:hover:border-purple-600 dark:hover:bg-purple-950/20'
                      }`}
                      onClick={() => handleAgentToggle(agent.key)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{agent.display_name}</h3>
                          <p className="text-sm text-muted-foreground">{agent.description}</p>
                        </div>
                        {selectedAgents.includes(agent.key) && (
                          <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 步骤4: 开始分析 - 增强版 */}
            {selectedAgents.length > 0 && (
              <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 dark:from-orange-950/30 dark:via-yellow-950/20 dark:to-red-950/30">
                <CardContent className="pt-6">
                  <div className="text-center space-y-6">
                    <div className="space-y-2">
                      <div className="text-xl font-bold text-orange-900 dark:text-orange-100">
                                             {t('analysisForm.step4.title')}
                    </div>
                    <div className="text-lg text-orange-700 dark:text-orange-300">
                      {tickerValidation.valid.length} stocks × {selectedAgents.length} investment masters
                    </div>
                    </div>
                    
                    {/* 分析概要 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="bg-white/80 dark:bg-white/10 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                        <div className="font-medium text-blue-800 dark:text-blue-300 mb-1">{t('analysisForm.step4.stocksLabel')}</div>
                        <div className="text-blue-600 dark:text-blue-400 font-semibold">{tickerValidation.valid.join(', ')}</div>
                      </div>
                      <div className="bg-white/80 dark:bg-white/10 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                        <div className="font-medium text-purple-800 dark:text-purple-300 mb-1">{t('analysisForm.step4.mastersLabel')}</div>
                        <div className="text-purple-600 dark:text-purple-400 font-semibold">
                            {selectedAgents.map(agent => getAgentByKey(agent)?.display_name).join(', ')} </div>
                      </div>
                    </div>

                    {/* 验证提示 */}
                    {!tickerValidation.isValid && (
                      <div className="flex items-center gap-2 p-3 border border-amber-300 dark:border-amber-700 bg-amber-100 dark:bg-amber-950/40 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-300 flex-shrink-0" />
                        <div className="text-sm text-amber-800 dark:text-amber-200">
{t('analysisForm.step4.validationError')}
                        </div>
                      </div>
                    )}
                    
                    <Button
                      size="lg"
                      onClick={handleStartAnalysis}
                      disabled={isAnalyzing || !tickerValidation.isValid || selectedAgents.length === 0}
                      className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 hover:from-emerald-600 hover:via-blue-600 hover:to-purple-700 dark:from-emerald-400 dark:via-blue-400 dark:to-purple-500 dark:hover:from-emerald-500 dark:hover:via-blue-500 dark:hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300 text-white"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="animate-spin h-5 w-5 mr-3 border-2 border-white border-t-transparent rounded-full" />
{t('analysisForm.step4.analyzing')}
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-6 w-6 mr-3" />
{t('analysisForm.step4.startAnalysis')}
                        </>
                      )}
                    </Button>

                    {/* 预计时间提示 */}
                    {!isAnalyzing && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-white/10 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600">
{t('analysisForm.step4.estimatedTime', { 
                          min: Math.ceil(tickerValidation.valid.length * selectedAgents.length * 0.5),
                          max: Math.ceil(tickerValidation.valid.length * selectedAgents.length * 1)
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 分析结果组件 */}
        <AnalysisResults 
          selectedAgents={selectedAgents}
          tickers={tickerValidation.valid}
          isAnalyzing={isAnalyzing}
        />
      </div>
    </div>
  );
} 