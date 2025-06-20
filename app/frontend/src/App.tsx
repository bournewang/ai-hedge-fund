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
import {
  Users,
  TrendingUp,
  Home,
  BarChart3,
  Clock,
  Menu,
} from 'lucide-react';
import { Sheet, SheetTrigger, SheetContent } from './components/ui/sheet';
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
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-lg font-bold text-primary sm:text-xl">
              {t('navigation.brandTitle')}
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="sm:hidden">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sm:hidden">
                <nav className="mt-6 flex flex-col gap-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link key={item.path} to={item.path}>
                        <Button
                          variant={isActive ? 'secondary' : 'ghost'}
                          className="w-full justify-start gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Button>
                      </Link>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          <div className="hidden sm:flex flex-wrap items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className="flex items-center gap-1 h-9 px-4 text-sm text-foreground hover:text-foreground"
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
  const handleAnalysisStart = () => {
    console.log('Analysis started');
  };

  return (
    <BrowserRouter>
      <Layout>
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
