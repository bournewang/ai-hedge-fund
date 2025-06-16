import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { DashboardPage } from './components/DashboardPage';
import { AnalysisForm } from './components/AnalysisForm';
import { AgentsDescription } from './components/AgentsDescription';
import { ExplorePage } from './components/ExplorePage';
import { RecentAnalysesPage } from './components/RecentAnalysesPage';
// import { MonitoringPage } from './components/MonitoringPage';
// import { ValuePicksPage } from './components/ValuePicksPage';
import { Layout } from './components/Layout';
import { Button } from './components/ui/button';
import { Users, TrendingUp, Home, BarChart3, Clock } from 'lucide-react';
import { ThemeToggle } from './components/ui/theme-toggle';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { useLanguage } from './hooks/useLanguage';

function Navigation() {
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { path: '/', label: t('navigation.home'), icon: Home },
    { path: '/analysis', label: t('navigation.analysis'), icon: BarChart3 },
    { path: '/explore', label: t('navigation.explore'), icon: TrendingUp },
    { path: '/recent-analyses', label: t('navigation.recentAnalyses'), icon: Clock },
    // { path: '/monitoring', label: t('navigation.monitoring'), icon: Eye },
    // { path: '/value-picks', label: t('navigation.valuePicks'), icon: Gem },
    { path: '/agents', label: t('navigation.aiMasters'), icon: Users },
  ];

  return (
    <div className="bg-background border-b">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary">{t('navigation.brandTitle')}</Link>
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

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
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
          <Route path="/recent-analyses" element={<RecentAnalysesPage />} />
          {/* <Route path="/monitoring" element={<MonitoringPage />} /> */}
          {/* <Route path="/value-picks" element={<ValuePicksPage />} /> */}
          <Route path="/agents" element={<AgentsDescription />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
