import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Download,
  BarChart3,
  Eye,
  Loader2
} from 'lucide-react';
import { useNodeContext } from '@/contexts/node-context';
import { agents, type AgentItem } from '@/data/agents';

interface AnalysisResultsProps {
  selectedAgents: string[];
  tickers: string[];
  isAnalyzing: boolean;
}

export function AnalysisResults({ selectedAgents, tickers, isAnalyzing }: AnalysisResultsProps) {
  const { agentNodeData, outputNodeData } = useNodeContext();

  // 计算分析进度
  const getAnalysisProgress = () => {
    if (selectedAgents.length === 0) return 0;
    
    const totalTasks = selectedAgents.length * tickers.length;
    let completedTasks = 0;
    
    selectedAgents.forEach(agentKey => {
      const agentData = agentNodeData[agentKey];
      if (agentData?.status === 'COMPLETE') {
        completedTasks += tickers.length;
      } else if (agentData?.status === 'IN_PROGRESS' && agentData?.ticker) {
        // 计算该代理已完成的股票数量
        const completedTickersCount = tickers.indexOf(agentData.ticker) + 1;
        completedTasks += completedTickersCount;
      }
    });
    
    return Math.min(100, Math.round((completedTasks / totalTasks) * 100));
  };

  const progress = getAnalysisProgress();
  const isComplete = progress === 100 && outputNodeData !== null;
  const isProcessingResults = progress === 100 && outputNodeData === null;

  // 获取代理状态统计
  const getAgentStats = () => {
    const stats = {
      total: selectedAgents.length,
      completed: 0,
      inProgress: 0,
      error: 0,
      idle: 0
    };

    selectedAgents.forEach(agentKey => {
      const status = agentNodeData[agentKey]?.status || 'IDLE';
      switch (status) {
        case 'COMPLETE':
          stats.completed++;
          break;
        case 'IN_PROGRESS':
          stats.inProgress++;
          break;
        case 'ERROR':
          stats.error++;
          break;
        default:
          stats.idle++;
      }
    });

    return stats;
  };

  const stats = getAgentStats();

  // 获取代理信息
  const getAgentInfo = (agentKey: string): AgentItem | null => {
    return agents.find(agent => agent.key === agentKey) || null;
  };

  // 获取状态颜色和图标
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'COMPLETE':
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50 border-green-200',
          label: '已完成'
        };
      case 'IN_PROGRESS':
        return {
          icon: <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 border-blue-200',
          label: '分析中'
        };
      case 'ERROR':
        return {
          icon: <AlertCircle className="h-4 w-4 text-red-600" />,
          color: 'text-red-600',
          bgColor: 'bg-red-50 border-red-200',
          label: '错误'
        };
      default:
        return {
          icon: <Clock className="h-4 w-4 text-gray-400" />,
          color: 'text-gray-400',
          bgColor: 'bg-gray-50 border-gray-200',
          label: '等待中'
        };
    }
  };

  // 获取投资建议图标
  const getActionIcon = (action: string) => {
    switch (action?.toLowerCase()) {
      case 'buy':
      case 'long':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'sell':
      case 'short':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'hold':
        return <Minus className="h-4 w-4 text-yellow-600" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-400" />;
    }
  };

  // 导出结果
  const handleExportResults = () => {
    if (!outputNodeData) return;
    
    const dataStr = JSON.stringify(outputNodeData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis-results-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 如果还没开始分析，不显示任何内容
  if (!isAnalyzing && !isComplete && !isProcessingResults) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-6">
      {/* 总体进度卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                分析进度
              </CardTitle>
              <CardDescription>
                {isComplete ? '分析已完成' : 
                 isProcessingResults ? '正在处理分析结果...' :
                 `正在分析 ${tickers.length} 只股票，使用 ${selectedAgents.length} 位投资大师`}
              </CardDescription>
            </div>
            {isComplete && outputNodeData && (
              <Button variant="outline" size="sm" onClick={handleExportResults}>
                <Download className="h-4 w-4 mr-2" />
                导出结果
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 进度条 */}
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* 进度统计 */}
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>总进度: {progress}%</span>
              <div className="flex gap-4">
                <span>完成: {stats.completed}</span>
                <span>进行中: {stats.inProgress}</span>
                <span>等待中: {stats.idle}</span>
                {stats.error > 0 && <span className="text-red-600">错误: {stats.error}</span>}
              </div>
            </div>

            {/* Processing results hint */}
            {isProcessingResults && (
              <div className="flex items-center justify-center gap-3 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <div className="text-center">
                  <div className="font-medium text-blue-800">正在处理分析结果</div>
                  <div className="text-sm text-blue-600">所有投资大师已完成分析，正在汇总投资建议...</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 代理状态卡片 */}
      {isAnalyzing && !isComplete && (
        <Card>
          <CardHeader>
            <CardTitle>实时进度</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedAgents.map(agentKey => {
              const agentInfo = getAgentInfo(agentKey);
              if (!agentInfo) return null;

              const agentData = agentNodeData[agentKey];
              const status = agentData?.status || 'IDLE';
              const statusDisplay = getStatusDisplay(status);

              return (
                <div key={agentKey} className={`${statusDisplay.bgColor} border rounded-lg p-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`${statusDisplay.color}`}>
                        {statusDisplay.icon}
                      </div>
                      <div>
                        <div className="font-medium">{agentInfo.display_name}</div>
                        <div className="text-sm text-gray-600">
                          {agentData?.message || statusDisplay.label}
                          {agentData?.ticker && ` - ${agentData.ticker}`}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusDisplay.color}>
                      {statusDisplay.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* 分析结果卡片 */}
      {outputNodeData && (
        <Card>
          <CardHeader>
            <CardTitle>分析结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {tickers.map(ticker => {
                const agentSignals = outputNodeData.analyst_signals || {};
                const decision = outputNodeData.decisions?.[ticker];
                
                // Check for any valid results including risk management
                const hasResults = selectedAgents.some(agent => 
                  agentSignals[agent + '_agent']?.[ticker]?.signal ||
                  (agent === 'risk_management' && agentSignals['risk_management_agent']?.[ticker]?.remaining_position_limit !== undefined)
                );

                if (!hasResults) return null;

                return (
                  <Card key={ticker}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Eye className="h-5 w-5 text-blue-600" />
                          {ticker} 分析结果
                        </div>
                        {decision && (
                          <Badge 
                            variant={
                              decision.action === 'buy' ? 'success' :
                              decision.action === 'sell' ? 'destructive' :
                              'outline'
                            } 
                            className="flex items-center gap-1"
                          >
                            {getActionIcon(decision.action)}
                            {decision.action.toUpperCase()}
                            {decision.confidence && ` (${decision.confidence}%)`}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedAgents.map(agentKey => {
                          const agentInfo = getAgentInfo(agentKey);
                          if (!agentInfo) return null;

                          const fullAgentKey = agentKey + '_agent';
                          const agentResults = agentSignals[fullAgentKey]?.[ticker];
                          
                          // Special handling for risk management agent
                          if (agentKey === 'risk_management' && agentResults) {
                            return (
                              <div key={agentKey} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="font-medium">{agentInfo.display_name}</div>
                                    <Badge variant="secondary" className="text-xs">
                                      {agentInfo.category_name}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div>可用仓位: {agentResults.remaining_position_limit?.toLocaleString()} USD</div>
                                  <div>当前价格: {agentResults.current_price?.toLocaleString()} USD</div>
                                  {agentResults.reasoning && (
                                    <>
                                      <div>可用现金: {agentResults.reasoning.available_cash?.toLocaleString()} USD</div>
                                      <div>当前持仓: {agentResults.reasoning.current_position_value?.toLocaleString()} USD</div>
                                      <div>仓位限制: {agentResults.reasoning.position_limit?.toLocaleString()} USD</div>
                                    </>
                                  )}
                                </div>
                                <Separator />
                              </div>
                            );
                          }

                          // Regular agent handling
                          if (!agentResults?.signal) return null;

                          return (
                            <div key={agentKey} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="font-medium">{agentInfo.display_name}</div>
                                  <Badge variant="secondary" className="text-xs">
                                    {agentInfo.category_name}
                                  </Badge>
                                </div>
                                <Badge 
                                  variant={
                                    agentResults.signal.toLowerCase() === 'buy' ? 'success' :
                                    agentResults.signal.toLowerCase() === 'sell' ? 'destructive' :
                                    'outline'
                                  } 
                                  className="flex items-center gap-1"
                                >
                                  {getActionIcon(agentResults.signal)}
                                  {agentResults.signal.toUpperCase()}
                                </Badge>
                              </div>
                              {agentResults.confidence && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <span>置信度:</span>
                                  <Badge variant="outline">
                                    {Math.round(agentResults.confidence)}%
                                  </Badge>
                                </div>
                              )}
                              <p className="text-sm text-gray-600">{agentResults.reasoning}</p>
                              <Separator />
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 