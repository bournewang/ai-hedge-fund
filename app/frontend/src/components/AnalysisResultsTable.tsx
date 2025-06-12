import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Download,
  Eye,
  BarChart3,
  TableIcon
} from 'lucide-react';
import { agents, type AgentItem } from '@/data/agents';

interface AnalysisResultsTableProps {
  selectedAgents: string[];
  tickers: string[];
  outputNodeData: {
    analyst_signals?: Record<string, Record<string, {
      signal?: string;
      confidence?: number;
      reasoning?: string;
      remaining_position_limit?: number;
      current_price?: number;
      risk_reasoning?: {
        available_cash?: number;
        current_position_value?: number;
        position_limit?: number;
      };
    }>>;
    decisions?: Record<string, {
      action: string;
      confidence?: number;
      reasoning?: string;
    }>;
  };
}

export function AnalysisResultsTable({ 
  selectedAgents, 
  tickers, 
  outputNodeData 
}: AnalysisResultsTableProps) {
  const [activeTab, setActiveTab] = useState('summary');

  // Get agent info
  const getAgentInfo = (agentKey: string): AgentItem | null => {
    return agents.find(agent => agent.key === agentKey) || null;
  };

  // Get action icon
  const getActionIcon = (action: string) => {
    switch (action?.toLowerCase()) {
      case 'buy':
      case 'long':
        return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'sell':
      case 'short':
        return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'hold':
        return <Minus className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-400 dark:text-gray-500" />;
    }
  };

  // Get signal badge variant
  const getSignalVariant = (signal: string) => {
    switch (signal?.toLowerCase()) {
      case 'buy':
      case 'long':
        return 'success';
      case 'sell':
      case 'short':
        return 'destructive';
      case 'hold':
        return 'warning';
      default:
        return 'outline';
    }
  };

  // Export results
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

  // Export CSV
  const handleExportCSV = () => {
    if (!outputNodeData?.analyst_signals) return;

    const csvData = [];
    const headers = ['Ticker', 'Final Decision', 'Confidence', ...selectedAgents.map(agent => {
      const agentInfo = getAgentInfo(agent);
      return agentInfo?.display_name || agent;
    })];
    csvData.push(headers);

    tickers.forEach(ticker => {
      const decision = outputNodeData.decisions?.[ticker];
      const row = [
        ticker,
        decision?.action || 'N/A',
        decision?.confidence ? `${decision.confidence}%` : 'N/A'
      ];

      selectedAgents.forEach(agentKey => {
        const fullAgentKey = agentKey + '_agent';
        const agentResults = outputNodeData.analyst_signals?.[fullAgentKey]?.[ticker];
        row.push(agentResults?.signal || 'N/A');
      });

      csvData.push(row);
    });

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis-summary-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-l-4 border-l-green-500 dark:border-l-green-400">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
            分析结果
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <TableIcon className="h-4 w-4 mr-2" />
              导出CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportResults}>
              <Download className="h-4 w-4 mr-2" />
              导出JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">汇总表格</TabsTrigger>
            <TabsTrigger value="detailed">详细视图</TabsTrigger>
            <TabsTrigger value="export">导出视图</TabsTrigger>
          </TabsList>

          {/* Summary Table */}
          <TabsContent value="summary" className="mt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">股票</TableHead>
                    <TableHead className="w-32">最终决策</TableHead>
                    {selectedAgents.map(agentKey => {
                      const agentInfo = getAgentInfo(agentKey);
                      return (
                        <TableHead key={agentKey} className="text-center min-w-24">
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-semibold">{agentInfo?.display_name}</span>
                            <span className="text-xs text-muted-foreground">{agentInfo?.category_name}</span>
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickers.map(ticker => {
                    const decision = outputNodeData.decisions?.[ticker];
                    const agentSignals = outputNodeData.analyst_signals || {};

                    return (
                      <TableRow key={ticker}>
                        <TableCell className="font-mono font-semibold">
                          <Badge variant="outline">{ticker}</Badge>
                        </TableCell>
                        <TableCell>
                          {decision ? (
                            <div className="flex flex-col gap-1">
                              <Badge 
                                variant={getSignalVariant(decision.action)}
                                className="flex items-center gap-1 w-fit"
                              >
                                {getActionIcon(decision.action)}
                                {decision.action.toUpperCase()}
                              </Badge>
                              {decision.confidence && (
                                <span className="text-xs text-muted-foreground">
                                  置信度: {decision.confidence}%
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        {selectedAgents.map(agentKey => {
                          const fullAgentKey = agentKey + '_agent';
                          const agentResults = agentSignals[fullAgentKey]?.[ticker];

                          return (
                            <TableCell key={agentKey} className="text-center">
                              {agentResults?.signal ? (
                                <div className="flex flex-col items-center gap-1">
                                  <Badge 
                                    variant={getSignalVariant(agentResults.signal)}
                                    className="flex items-center gap-1"
                                  >
                                    {getActionIcon(agentResults.signal)}
                                    {agentResults.signal.toUpperCase()}
                                  </Badge>
                                  {agentResults.confidence && (
                                    <span className="text-xs text-muted-foreground">
                                      {Math.round(agentResults.confidence)}%
                                    </span>
                                  )}
                                </div>
                              ) : agentKey === 'risk_management' && agentResults?.remaining_position_limit !== undefined ? (
                                <div className="text-xs text-muted-foreground">
                                  <div>仓位: ${agentResults.remaining_position_limit?.toLocaleString()}</div>
                                  <div>价格: ${agentResults.current_price?.toLocaleString()}</div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Detailed View */}
          <TabsContent value="detailed" className="mt-6">
            <div className="space-y-6">
              {tickers.map(ticker => {
                const agentSignals = outputNodeData.analyst_signals || {};
                const decision = outputNodeData.decisions?.[ticker];
                
                const hasResults = selectedAgents.some(agent => 
                  agentSignals[agent + '_agent']?.[ticker]?.signal ||
                  (agent === 'risk_management' && agentSignals['risk_management_agent']?.[ticker]?.remaining_position_limit !== undefined)
                );

                if (!hasResults) return null;

                return (
                  <Card key={ticker} className="border-l-4 border-l-blue-500 dark:border-l-blue-400">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Eye className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                          {ticker} 分析结果
                        </div>
                        {decision && (
                          <Badge 
                            variant={getSignalVariant(decision.action)}
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
                          
                          if (agentKey === 'risk_management' && agentResults) {
                            return (
                              <div key={agentKey} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="font-medium text-gray-900 dark:text-gray-50">{agentInfo.display_name}</div>
                                    <Badge variant="secondary" className="text-xs">
                                      {agentInfo.category_name}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                  <div>可用仓位: {agentResults.remaining_position_limit?.toLocaleString()} USD</div>
                                  <div>当前价格: {agentResults.current_price?.toLocaleString()} USD</div>
                                  {agentResults.risk_reasoning && (
                                    <>
                                      <div>可用现金: {agentResults.risk_reasoning.available_cash?.toLocaleString()} USD</div>
                                      <div>当前持仓: {agentResults.risk_reasoning.current_position_value?.toLocaleString()} USD</div>
                                      <div>仓位限制: {agentResults.risk_reasoning.position_limit?.toLocaleString()} USD</div>
                                    </>
                                  )}
                                </div>
                                <Separator />
                              </div>
                            );
                          }

                          if (!agentResults?.signal) return null;

                          return (
                            <div key={agentKey} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="font-medium text-gray-900 dark:text-gray-50">{agentInfo.display_name}</div>
                                  <Badge variant="secondary" className="text-xs">
                                    {agentInfo.category_name}
                                  </Badge>
                                </div>
                                <Badge 
                                  variant={getSignalVariant(agentResults.signal)}
                                  className="flex items-center gap-1"
                                >
                                  {getActionIcon(agentResults.signal)}
                                  {agentResults.signal.toUpperCase()}
                                </Badge>
                              </div>
                              {agentResults.confidence && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <span>置信度:</span>
                                  <Badge variant="outline">
                                    {Math.round(agentResults.confidence)}%
                                  </Badge>
                                </div>
                              )}
                              <p className="text-sm text-gray-600 dark:text-gray-400">{agentResults.reasoning}</p>
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
          </TabsContent>

          {/* Export View */}
          <TabsContent value="export" className="mt-6">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                此视图专为导出设计，包含所有关键数据的简洁表格格式。
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>股票代码</TableHead>
                      <TableHead>最终决策</TableHead>
                      <TableHead>置信度</TableHead>
                      <TableHead>决策理由</TableHead>
                      {selectedAgents.map(agentKey => {
                        const agentInfo = getAgentInfo(agentKey);
                        return (
                          <TableHead key={agentKey}>
                            {agentInfo?.display_name}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickers.map(ticker => {
                      const decision = outputNodeData.decisions?.[ticker];
                      const agentSignals = outputNodeData.analyst_signals || {};

                      return (
                        <TableRow key={ticker}>
                          <TableCell className="font-mono">{ticker}</TableCell>
                          <TableCell>{decision?.action || 'N/A'}</TableCell>
                          <TableCell>{decision?.confidence ? `${decision.confidence}%` : 'N/A'}</TableCell>
                          <TableCell className="max-w-xs truncate">{decision?.reasoning || 'N/A'}</TableCell>
                          {selectedAgents.map(agentKey => {
                            const fullAgentKey = agentKey + '_agent';
                            const agentResults = agentSignals[fullAgentKey]?.[ticker];
                            return (
                              <TableCell key={agentKey}>
                                {agentResults?.signal || 'N/A'}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 