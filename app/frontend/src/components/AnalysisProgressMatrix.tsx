import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2,
  BarChart3
} from 'lucide-react';
import { agents, type AgentItem } from '@/data/agents';

interface AgentNodeData {
  status?: 'IDLE' | 'IN_PROGRESS' | 'COMPLETE' | 'ERROR';
  ticker?: string;
  message?: string;
}

interface AnalysisProgressMatrixProps {
  selectedAgents: string[];
  tickers: string[];
  agentNodeData: Record<string, AgentNodeData>;
  onCellClick?: (agentKey: string, ticker: string) => void;
}

export function AnalysisProgressMatrix({ 
  selectedAgents, 
  tickers, 
  agentNodeData, 
  onCellClick 
}: AnalysisProgressMatrixProps) {
  const [selectedCell, setSelectedCell] = useState<{agent: string, ticker: string} | null>(null);

  // Get agent info
  const getAgentInfo = (agentKey: string): AgentItem | null => {
    return agents.find(agent => agent.key === agentKey) || null;
  };

  // Get status for specific agent-ticker combination
  const getCellStatus = (agentKey: string, ticker: string) => {
    const agentData = agentNodeData[agentKey];
    if (!agentData) return 'IDLE';
    
    if (agentData.status === 'COMPLETE') return 'COMPLETE';
    if (agentData.status === 'ERROR') return 'ERROR';
    if (agentData.status === 'IN_PROGRESS') {
      // Check if this agent is currently working on this ticker
      if (agentData.ticker === ticker) return 'IN_PROGRESS';
      // Check if this ticker was already processed
      const tickerIndex = tickers.indexOf(ticker);
      const currentTickerIndex = tickers.indexOf(agentData.ticker || '');
      if (tickerIndex < currentTickerIndex) return 'COMPLETE';
      return 'IDLE';
    }
    return 'IDLE';
  };

  // Get status display properties
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'COMPLETE':
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />,
          bgColor: 'bg-green-100 dark:bg-green-950/30 border-green-300 dark:border-green-700',
          label: '完成'
        };
      case 'IN_PROGRESS':
        return {
          icon: <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />,
          bgColor: 'bg-blue-100 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700',
          label: '进行中'
        };
      case 'ERROR':
        return {
          icon: <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />,
          bgColor: 'bg-red-100 dark:bg-red-950/30 border-red-300 dark:border-red-700',
          label: '错误'
        };
      default:
        return {
          icon: <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />,
          bgColor: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600',
          label: '等待'
        };
    }
  };

  const handleCellClick = (agentKey: string, ticker: string) => {
    setSelectedCell({ agent: agentKey, ticker });
    onCellClick?.(agentKey, ticker);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Progress Matrix */}
      <div className="lg:col-span-2">
        <Card className="border-l-4 border-l-blue-500 dark:border-l-blue-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              分析进度矩阵
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">投资大师</TableHead>
                    {tickers.map(ticker => (
                      <TableHead key={ticker} className="text-center min-w-20">
                        <Badge variant="outline" className="font-mono">
                          {ticker}
                        </Badge>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedAgents.map(agentKey => {
                    const agentInfo = getAgentInfo(agentKey);
                    if (!agentInfo) return null;

                    return (
                      <TableRow key={agentKey}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-foreground">
                              {agentInfo.display_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {agentInfo.category_name}
                            </span>
                          </div>
                        </TableCell>
                        {tickers.map(ticker => {
                          const status = getCellStatus(agentKey, ticker);
                          const statusDisplay = getStatusDisplay(status);
                          const isSelected = selectedCell?.agent === agentKey && selectedCell?.ticker === ticker;

                          return (
                            <TableCell key={ticker} className="text-center p-2">
                              <div
                                className={`
                                  w-12 h-12 mx-auto rounded-lg border-2 flex items-center justify-center cursor-pointer
                                  transition-all duration-200 hover:scale-105
                                  ${statusDisplay.bgColor}
                                  ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
                                `}
                                onClick={() => handleCellClick(agentKey, ticker)}
                                title={`${agentInfo.display_name} - ${ticker}: ${statusDisplay.label}`}
                              >
                                {statusDisplay.icon}
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Panel */}
      <div className="lg:col-span-1">
        <Card className="border-l-4 border-l-purple-500 dark:border-l-purple-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              详细信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCell ? (
              <div className="space-y-4">
                {(() => {
                  const agentInfo = getAgentInfo(selectedCell.agent);
                  const agentData = agentNodeData[selectedCell.agent];
                  const status = getCellStatus(selectedCell.agent, selectedCell.ticker);
                  const statusDisplay = getStatusDisplay(status);

                  return (
                    <>
                      <div>
                        <h3 className="font-semibold text-foreground">{agentInfo?.display_name}</h3>
                        <p className="text-sm text-muted-foreground">{agentInfo?.description}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-foreground">股票代码</h4>
                        <Badge variant="outline" className="font-mono">{selectedCell.ticker}</Badge>
                      </div>

                      <div>
                        <h4 className="font-medium text-foreground">状态</h4>
                        <div className="flex items-center gap-2">
                          {statusDisplay.icon}
                          <span className="text-sm">{statusDisplay.label}</span>
                        </div>
                      </div>

                      {agentData?.message && (
                        <div>
                          <h4 className="font-medium text-foreground">消息</h4>
                          <p className="text-sm text-muted-foreground">{agentData.message}</p>
                        </div>
                      )}

                      {status === 'IN_PROGRESS' && agentData?.ticker === selectedCell.ticker && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm font-medium">正在分析 {selectedCell.ticker}</span>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>点击矩阵中的单元格查看详细信息</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 