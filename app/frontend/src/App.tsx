import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { DashboardPage } from './components/DashboardPage';
import { AnalysisForm } from './components/AnalysisForm';
import { AgentsDescription } from './components/AgentsDescription';
import { ExplorePage } from './components/ExplorePage';
import { MonitoringPage } from './components/MonitoringPage';
import { ValuePicksPage } from './components/ValuePicksPage';
import { Layout } from './components/Layout';
import { Button } from './components/ui/button';
import { Users, TrendingUp, Eye, Gem, Home, BarChart3 } from 'lucide-react';
import { ThemeToggle } from './components/ui/theme-toggle';

function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/analysis', label: 'Analysis', icon: BarChart3 },
    { path: '/explore', label: 'Explore', icon: TrendingUp },
    // { path: '/monitoring', label: 'Monitoring', icon: Eye },
    // { path: '/value-picks', label: 'Value Picks', icon: Gem },
    { path: '/agents', label: 'AI Masters', icon: Users },
  ];

  return (
    <div className="bg-background border-b">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary">AI Hedge Fund</Link>
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button 
                    variant={isActive ? "secondary" : "ghost"} 
                    className="flex items-center gap-2 text-foreground hover:text-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>

          <ThemeToggle/>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [showLeftSidebar] = useState(false);
  const [showRightSidebar] = useState(false);

  const handleAnalysisStart = () => {
    console.log('Analysis started');
  };

  return (
    <BrowserRouter>
      <Layout
        leftSidebar={showLeftSidebar ? <div className="p-4 text-white">Left Sidebar Content</div> : undefined}
        rightSidebar={showRightSidebar ? <div className="p-4 text-white">Right Sidebar Content</div> : undefined}
      >
        <Navigation />

        {/* Routes */}
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/analysis" element={<AnalysisForm onAnalysisStart={handleAnalysisStart} />} />
          <Route path="/explore" element={<ExplorePage />} />
          {/* <Route path="/monitoring" element={<MonitoringPage />} /> */}
          {/* <Route path="/value-picks" element={<ValuePicksPage />} /> */}
          <Route path="/agents" element={<AgentsDescription />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
