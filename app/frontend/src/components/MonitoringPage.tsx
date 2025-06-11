import { Eye } from 'lucide-react';

export function MonitoringPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-purple-600 to-blue-700 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">
              👀 Monitoring Dashboard
            </h1>
            <p className="text-xl md:text-2xl text-purple-100">
              Track volatile stocks and your watchlist
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center">
          <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Coming Soon</h3>
          <p className="text-gray-500">Monitoring dashboard will be available soon</p>
        </div>
      </div>
    </div>
  );
} 