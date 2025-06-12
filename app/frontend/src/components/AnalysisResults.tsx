import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3,
  Download,
  Loader2
} from 'lucide-react';
import { useNodeContext } from '@/contexts/node-context';
import { AnalysisProgressMatrix } from './AnalysisProgressMatrix';
import { AnalysisResultsTable } from './AnalysisResultsTable';

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

  // Convert agentNodeData to match the expected type
  const convertedAgentNodeData = Object.fromEntries(
    Object.entries(agentNodeData).map(([key, value]) => [
      key,
      {
        ...value,
        ticker: value.ticker || undefined
      }
    ])
  );

  // 如果还没开始分析，不显示任何内容
  if (!isAnalyzing && !isComplete && !isProcessingResults) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto mt-8 space-y-6">
      {/* 总体进度卡片 */}
      <Card className="border-l-4 border-l-orange-500 dark:border-l-orange-400">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                分析进度总览
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
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-4 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 dark:from-orange-400 dark:to-red-400 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* 进度统计 */}
            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">总进度: {progress}%</span>
              <div className="flex gap-4">
                <span className="text-green-600 dark:text-green-400">完成: {stats.completed}</span>
                <span className="text-blue-600 dark:text-blue-400">进行中: {stats.inProgress}</span>
                <span className="text-gray-500 dark:text-gray-400">等待中: {stats.idle}</span>
                {stats.error > 0 && <span className="text-red-600 dark:text-red-400">错误: {stats.error}</span>}
              </div>
            </div>

            {/* Processing results hint */}
            {isProcessingResults && (
              <div className="flex items-center justify-center gap-3 p-6 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                <Loader2 className="h-5 w-5 text-orange-600 dark:text-orange-400 animate-spin" />
                <div className="text-center">
                  <div className="font-medium text-orange-800 dark:text-orange-200">正在处理分析结果</div>
                  <div className="text-sm text-orange-600 dark:text-orange-400">所有投资大师已完成分析，正在汇总投资建议...</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress Matrix - Show during analysis */}
      {isAnalyzing && !isComplete && (
        <AnalysisProgressMatrix
          selectedAgents={selectedAgents}
          tickers={tickers}
          agentNodeData={convertedAgentNodeData}
        />
      )}

      {/* Results Table - Show when complete */}
      {outputNodeData && (
        <AnalysisResultsTable
          selectedAgents={selectedAgents}
          tickers={tickers}
          outputNodeData={outputNodeData}
        />
      )}
    </div>
  );
} 