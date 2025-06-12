import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, BookOpen, TrendingUp, Users, BarChart3, Info } from 'lucide-react';
import { agents, investmentStyles } from '@/data/agents';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AgentsDescription() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // Filter agents based on search query and selected style
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const matchesSearch = 
        searchQuery === '' ||
        agent.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.investment_style.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStyle = selectedStyle === 'all' || agent.category === selectedStyle;

      return matchesSearch && matchesStyle;
    });
  }, [searchQuery, selectedStyle]);

  // Get the currently selected agent's details
  const currentAgent = useMemo(() => {
    return agents.find(agent => agent.key === selectedAgent);
  }, [selectedAgent]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              AI Investment Masters
            </h1>
            <p className="text-xl md:text-2xl text-blue-100">
              17 World-Class Investment Experts at Your Service
            </p>
            <div className="flex items-center justify-center gap-4 mt-8">
              <Badge variant="secondary" className="px-4 py-2 text-lg">
                <Users className="w-5 h-5 mr-2" />
                17 Experts
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-lg">
                <TrendingUp className="w-5 h-5 mr-2" />
                6 Investment Styles
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-lg">
                <BarChart3 className="w-5 h-5 mr-2" />
                Multiple Strategies
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search and Filter Section */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10 py-6 text-lg"
              placeholder="Search by name, style, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Investment Style Tabs */}
        <Tabs defaultValue="all" className="mb-8" onValueChange={setSelectedStyle}>
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              All Styles
            </TabsTrigger>
            {Object.entries(investmentStyles).map(([key, style]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="mr-2">{style.icon}</span>
                {style.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {filteredAgents.map((agent) => (
              <Card
                key={agent.key}
                className="group hover:shadow-lg transition-shadow duration-300 overflow-hidden"
              >
                <CardHeader className="bg-muted border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl text-foreground">{agent.display_name}</CardTitle>
                      <CardDescription className="text-primary font-medium mt-1">
                        {agent.investment_style}
                      </CardDescription>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`${
                        investmentStyles[agent.category as keyof typeof investmentStyles]?.color
                      }`}
                    >
                      {investmentStyles[agent.category as keyof typeof investmentStyles]?.name}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {agent.description}
                    </p>
                    <Button 
                      variant="ghost" 
                      className="flex items-center gap-2 text-primary hover:text-primary/90"
                      onClick={() => setSelectedAgent(agent.key)}
                    >
                      <BookOpen className="w-4 h-4" />
                      View Full Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Tabs>
      </div>

      {/* Footer Section */}
      <div className="bg-muted py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              <span>Educational Purpose Only</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              <span>Based on Real Investment Principles</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span>AI-Powered Analysis</span>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Details Modal */}
      <Dialog open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {currentAgent && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-start gap-4">
                  <div>
                    <DialogTitle className="text-2xl font-bold text-foreground">{currentAgent.display_name}</DialogTitle>
                    <DialogDescription className="text-primary font-medium mt-1">
                      {currentAgent.investment_style}
                    </DialogDescription>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`${
                      investmentStyles[currentAgent.category as keyof typeof investmentStyles]?.color
                    }`}
                  >
                    {investmentStyles[currentAgent.category as keyof typeof investmentStyles]?.name}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="mt-6 space-y-8">
                {/* Biography Section */}
                {currentAgent.biography && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">Biography</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {currentAgent.biography}
                    </p>
                  </div>
                )}

                {/* Overview Section */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Overview</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {currentAgent.description}
                  </p>
                </div>

                {/* Investment Philosophy */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Investment Philosophy</h3>
                  <div className="bg-muted rounded-lg p-4">
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                      {investmentStyles[currentAgent.category as keyof typeof investmentStyles]?.philosophy.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Historical Performance */}
                {currentAgent.historical_performance && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">Track Record</h3>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-muted-foreground mb-4">{currentAgent.historical_performance.description}</p>
                      <div className="space-y-4">
                        {currentAgent.historical_performance.notable_calls.map((call, i) => (
                          <div key={i} className="border-l-4 border-primary pl-4">
                            <div className="font-medium text-foreground">{call.year}</div>
                            <div className="text-muted-foreground">{call.description}</div>
                            <div className="text-sm text-primary mt-1">{call.outcome}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Example Analyses */}
                {currentAgent.example_analyses && currentAgent.example_analyses.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">Example Analyses</h3>
                    <div className="grid gap-4">
                      {currentAgent.example_analyses.map((example, i) => (
                        <div key={i} className="bg-muted rounded-lg p-4">
                          <h4 className="font-medium text-foreground">{example.title}</h4>
                          <div className="text-sm text-muted-foreground">{example.company} ({example.year})</div>
                          <div className="mt-2 space-y-2">
                            <p className="text-muted-foreground">{example.analysis}</p>
                            <div className="text-sm text-primary">{example.outcome}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Focus Areas */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Key Focus Areas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted rounded-lg p-4">
                      <h4 className="font-medium text-foreground mb-2">Primary Metrics</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                        {investmentStyles[currentAgent.category as keyof typeof investmentStyles]?.metrics.map((metric, i) => (
                          <li key={i}>{metric}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <h4 className="font-medium text-foreground mb-2">Analysis Methods</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                        {investmentStyles[currentAgent.category as keyof typeof investmentStyles]?.methods.map((method, i) => (
                          <li key={i}>{method}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Strengths and Limitations */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Specialties/Strengths */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">Strengths</h3>
                    <div className="bg-muted rounded-lg p-4">
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                        {currentAgent.specialties ? 
                          currentAgent.specialties.map((specialty, i) => (
                            <li key={i}>{specialty}</li>
                          ))
                          :
                          investmentStyles[currentAgent.category as keyof typeof investmentStyles]?.strengths.map((strength, i) => (
                            <li key={i}>{strength}</li>
                          ))
                        }
                      </ul>
                    </div>
                  </div>

                  {/* Limitations */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">Limitations</h3>
                    <div className="bg-muted rounded-lg p-4">
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                        {currentAgent.limitations ? 
                          currentAgent.limitations.map((limitation, i) => (
                            <li key={i}>{limitation}</li>
                          ))
                          :
                          investmentStyles[currentAgent.category as keyof typeof investmentStyles]?.limitations.map((limitation, i) => (
                            <li key={i}>{limitation}</li>
                          ))
                        }
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 