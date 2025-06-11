import { useState, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, PlayCircle, TrendingUp, Users, BarChart3, RotateCcw, AlertCircle, X } from 'lucide-react';
import { agents, investmentStyles, getAgentsByCategory, type AgentItem } from '@/data/agents';
import { useNodeContext } from '@/contexts/node-context';
import { api } from '@/services/api';
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

// 股票代码验证函数
const validateTicker = (ticker: string): boolean => {
  // 基本的股票代码格式验证：1-5个字母，可能包含点
  return /^[A-Z]{1,5}(\.[A-Z])?$/.test(ticker.trim().toUpperCase());
};

export function AnalysisForm({ onAnalysisStart }: AnalysisFormProps) {
  const [tickers, setTickers] = useState<string>('AAPL,MSFT,NVDA');
  const [selectedStyle, setSelectedStyle] = useState<InvestmentStyle | 'all'>('all');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const nodeContext = useNodeContext();

  // 验证股票代码
  const tickerValidation = useMemo(() => {
    const tickerList = tickers.split(',').map(t => t.trim()).filter(Boolean);
    const validTickers: string[] = [];
    const invalidTickers: string[] = [];
    
    tickerList.forEach(ticker => {
      if (validateTicker(ticker)) {
        validTickers.push(ticker.toUpperCase());
      } else {
        invalidTickers.push(ticker);
      }
    });

    return {
      valid: validTickers,
      invalid: invalidTickers,
      isValid: invalidTickers.length === 0 && validTickers.length > 0,
      isEmpty: tickerList.length === 0
    };
  }, [tickers]);

  // 根据投资风格获取推荐的代理
  const getRecommendedAgents = useCallback((style: InvestmentStyle | 'all'): AgentItem[] => {
    if (style === 'all') {
      return agents.filter(agent => 
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
    setTickers('AAPL,MSFT,NVDA');
    setSelectedAgents([]);
    setSelectedStyle('all');
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
    <div className="w-full bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* 页面标题和重置按钮 */}
        <div className="flex justify-between items-center">
          <div className="text-center space-y-2">
            {/* <h1 className="text-2xl md:text-3xl font-bold text-gray-900">AI投资分析平台</h1> */}
            <p className="text-gray-600">17位世界顶级投资大师为您提供专业的股票分析</p>
          </div>
          {isAnalyzing && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4" />
              重新开始
            </Button>
          )}
        </div>

        {/* 只在未开始分析时显示表单 */}
        {!isAnalyzing && (
          <div className="space-y-6">
            {/* 步骤1: 股票输入 - 增强版 */}
            <Card className="hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  步骤1: 选择要分析的股票
                </CardTitle>
                <CardDescription>
                  输入股票代码，用逗号分隔。支持美股代码如 AAPL, MSFT, NVDA 等
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="请输入股票代码，如: AAPL,MSFT,NVDA..."
                    value={tickers}
                    onChange={(e) => setTickers(e.target.value)}
                    className={`text-lg ${
                      !tickerValidation.isEmpty && !tickerValidation.isValid 
                        ? 'border-red-300 focus:border-red-500' 
                        : tickerValidation.isValid 
                        ? 'border-green-300 focus:border-green-500'
                        : ''
                    }`}
                  />
                  
                  {/* 验证提示 */}
                  {!tickerValidation.isEmpty && !tickerValidation.isValid && (
                    <div className="flex items-center gap-2 p-3 border border-red-200 bg-red-50 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <div className="text-sm text-red-700">
                        无效的股票代码: {tickerValidation.invalid.join(', ')}。
                        请输入正确的美股代码 (如: AAPL, MSFT)
                      </div>
                    </div>
                  )}

                  {tickerValidation.isValid && (
                    <div className="text-sm text-green-600">
                      ✓ 已选择 {tickerValidation.valid.length} 只股票: {tickerValidation.valid.join(', ')}
                    </div>
                  )}
                </div>

                {/* 已选择的股票标签 */}
                {tickerValidation.valid.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">已选择的股票:</div>
                    <div className="flex flex-wrap gap-2">
                      {tickerValidation.valid.map(ticker => (
                        <Badge 
                          key={ticker}
                          variant="secondary" 
                          className="cursor-pointer hover:bg-red-100 group"
                          onClick={() => handleRemoveStock(ticker)}
                        >
                          {ticker}
                          <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 热门股票建议 */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">热门股票推荐:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {POPULAR_STOCKS.map(stock => {
                      const isSelected = tickerValidation.valid.includes(stock.symbol);
                      return (
                        <Button
                          key={stock.symbol}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className={`h-auto p-2 text-left justify-start ${
                            isSelected ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50'
                          }`}
                          onClick={() => handleAddStock(stock.symbol)}
                          disabled={isSelected}
                        >
                          <div>
                            <div className="font-medium text-xs">{stock.symbol}</div>
                            <div className="text-xs opacity-75 truncate">{stock.name}</div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 步骤2: 投资风格选择 */}
            <Card className="hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  步骤2: 选择投资风格
                </CardTitle>
                <CardDescription>
                  选择您偏好的投资策略，系统将推荐相应的投资大师
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                  {/* 全面分析选项 */}
                  {/* <div
                    className={`p-3 md:p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedStyle === 'all' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleStyleChange('all')}
                  >
                    <div className="flex items-center gap-2 md:gap-3">
                      <span className="text-xl md:text-2xl">🎯</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm md:text-base">全面分析</div>
                        <div className="text-xs md:text-sm text-gray-600 truncate">多维度综合分析</div>
                      </div>
                    </div>
                  </div> */}

                  {/* 各种投资风格 */}
                  {Object.entries(investmentStyles).map(([key, style]) => (
                    <div
                      key={key}
                      className={`p-3 md:p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedStyle === key 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleStyleChange(key as InvestmentStyle)}
                    >
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className="text-xl md:text-2xl">{style.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm md:text-base">{style.name}</div>
                          <div className="text-xs md:text-sm text-gray-600 truncate">{style.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 步骤3: AI代理选择 - 始终显示 */}
            <Card className="hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  步骤3: 选择AI投资大师
                </CardTitle>
                <CardDescription>
                  根据您的投资风格，我们推荐以下投资大师进行分析 (已选择 {selectedAgents.length} 位)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {/* 推荐代理 */}
                  {recommendedAgents.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="h-6 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded"></div>
                        <h4 className="font-semibold text-gray-900">💡 推荐选择</h4>
                        <Badge variant="secondary" className="text-xs">
                          {selectedStyle === 'all' ? '全面分析' : investmentStyles[selectedStyle as InvestmentStyle]?.name}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recommendedAgents.map(agent => (
                          <div
                            key={agent.key}
                            className={`group p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-md ${
                              selectedAgents.includes(agent.key)
                                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                            onClick={() => handleAgentToggle(agent.key)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="font-semibold text-gray-900 truncate">{agent.display_name}</div>
                                  {selectedAgents.includes(agent.key) && (
                                    <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                  )}
                                </div>
                                <div className="text-sm text-blue-600 font-medium mb-2">{agent.investment_style}</div>
                                {agent.description && (
                                  <div className="text-xs text-gray-600 leading-relaxed max-h-8 overflow-hidden">
                                    {agent.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 其他可选代理 */}
                  {selectedStyle === 'all' && (
                    <>
                      <Separator />
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="h-6 w-1 bg-gradient-to-b from-gray-400 to-gray-600 rounded"></div>
                          <h4 className="font-semibold text-gray-900">🔧 其他投资大师</h4>
                          <Badge variant="outline" className="text-xs">可选</Badge>
                        </div>
                        
                        {/* 按类别分组显示其他代理 */}
                        {Object.entries(investmentStyles).map(([styleKey, style]) => {
                          const categoryAgents = agents.filter(agent => 
                            agent.category === styleKey && 
                            !recommendedAgents.find(rec => rec.key === agent.key)
                          );
                          
                          if (categoryAgents.length === 0) return null;
                          
                          return (
                            <div key={styleKey} className="mb-6">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-lg">{style.icon}</span>
                                <h5 className="font-medium text-gray-800">{style.name}</h5>
                                <Badge variant="outline" className="text-xs">{categoryAgents.length}位</Badge>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {categoryAgents.map(agent => (
                                  <div
                                    key={agent.key}
                                    className={`group p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                                      selectedAgents.includes(agent.key)
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                                    }`}
                                    onClick={() => handleAgentToggle(agent.key)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">{agent.display_name}</div>
                                        <div className="text-xs text-gray-600 truncate">{agent.investment_style}</div>
                                      </div>
                                      {selectedAgents.includes(agent.key) && (
                                        <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 步骤4: 开始分析 - 增强版 */}
            {selectedAgents.length > 0 && (
              <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardContent className="pt-6">
                  <div className="text-center space-y-6">
                    <div className="space-y-2">
                      <div className="text-xl font-bold text-gray-900">
                        🚀 准备开始分析
                      </div>
                      <div className="text-lg text-gray-700">
                        {tickerValidation.valid.length} 只股票 × {selectedAgents.length} 位投资大师
                      </div>
                    </div>
                    
                    {/* 分析概要 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="bg-white/60 rounded-lg p-3">
                        <div className="font-medium text-gray-700 mb-1">分析股票</div>
                        <div className="text-blue-600">{tickerValidation.valid.join(', ')}</div>
                      </div>
                      <div className="bg-white/60 rounded-lg p-3">
                        <div className="font-medium text-gray-700 mb-1">投资大师</div>
                        <div className="text-purple-600">
                            {selectedAgents.map(agent => agents.find(a => a.key === agent)?.display_name).join(', ')} </div>
                      </div>
                    </div>

                    {/* 验证提示 */}
                    {!tickerValidation.isValid && (
                      <div className="flex items-center gap-2 p-3 border border-amber-200 bg-amber-50 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <div className="text-sm text-amber-800">
                          请输入有效的股票代码后再开始分析
                        </div>
                      </div>
                    )}
                    
                    <Button
                      size="lg"
                      onClick={handleStartAnalysis}
                      disabled={isAnalyzing || !tickerValidation.isValid || selectedAgents.length === 0}
                      className="px-12 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="animate-spin h-5 w-5 mr-3 border-2 border-white border-t-transparent rounded-full" />
                          正在分析...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-6 w-6 mr-3" />
                          开始AI分析
                        </>
                      )}
                    </Button>

                    {/* 预计时间提示 */}
                    {!isAnalyzing && (
                      <div className="text-xs text-gray-500">
                        预计分析时间：{Math.ceil(tickerValidation.valid.length * selectedAgents.length * 0.5)} - {Math.ceil(tickerValidation.valid.length * selectedAgents.length * 1)} 分钟
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