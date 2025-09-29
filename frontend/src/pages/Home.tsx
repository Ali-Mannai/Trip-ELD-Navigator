import React, { useState } from 'react';
import TripForm from '../components/TripForm';
import MapView from '../components/MapView';
import LogSheet from '../components/LogSheet';
import Summary from '../components/Summary';
import { apiService } from '../utils/api';
import type { TripRouteResponse, LogSheetResponse } from '../utils/api';

const Home: React.FC = () => {
  const [routeData, setRouteData] = useState<TripRouteResponse | null>(null);
  const [logData, setLogData] = useState<LogSheetResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'logs' | 'summary'>('map');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleTripSubmit = async (data: {
    current_location: string;
    pickup_location: string;
    dropoff_location: string;
    cycle_hours: number;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      // Calculate trip route
      const tripResult = await apiService.calculateTripRoute(data);
      setRouteData(tripResult);
      
      // Fetch log sheet data
      const logResult = await apiService.getLogSheet();
      setLogData(logResult);
      
      // Set active tab to map by default
      setActiveTab('map');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate route');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'map', name: 'Route Map', icon: '🗺️', description: 'Interactive route visualization' },
    { id: 'logs', name: 'Log Sheet', icon: '📋', description: 'FMCSA duty logs' },
    { id: 'summary', name: 'Summary', icon: '📊', description: 'Trip overview & analytics' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-16'} bg-white shadow-xl transition-all duration-300 flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Trip ELD Navigator
                </h1>
                <p className="text-sm text-gray-500 mt-1">FMCSA HOS Compliant</p>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Trip Form */}
        <div className="flex-1 p-6">
          <TripForm
            onSubmit={handleTripSubmit}
            loading={loading}
            result={routeData}
            compact={!sidebarOpen}
          />
        </div>

        {/* Navigation */}
        {routeData && (
          <div className="p-6 border-t border-gray-200">
            {sidebarOpen && (
              <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wider">
                Navigation
              </h3>
            )}
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  {sidebarOpen && (
                    <div className="ml-3 text-left">
                      <div className="font-medium">{tab.name}</div>
                      <div className={`text-xs ${activeTab === tab.id ? 'text-blue-100' : 'text-gray-500'}`}>
                        {tab.description}
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {activeTab === 'map' && 'Route Map'}
                {activeTab === 'logs' && 'Duty Log Sheet'}
                {activeTab === 'summary' && 'Trip Summary'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {activeTab === 'map' && 'Interactive map with route visualization and stops'}
                {activeTab === 'logs' && 'FMCSA-compliant duty schedule and log entries'}
                {activeTab === 'summary' && 'Complete trip analysis and compliance overview'}
              </p>
            </div>
            {routeData && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total Distance</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {routeData.route.total_distance.toFixed(1)} mi
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Duration</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {Math.ceil(routeData.route.total_time / 24)} days
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  routeData.summary.has_violations 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {routeData.summary.has_violations ? '⚠️ Violations' : '✅ Compliant'}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400 text-xl">⚠️</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error calculating route
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {routeData && (
            <>
              {activeTab === 'map' && (
                <MapView routeData={routeData} height="600px" />
              )}

              {activeTab === 'logs' && logData && (
                <LogSheet
                  entries={logData.log_sheet.entries}
                  startDate={logData.log_sheet.start_date}
                  endDate={logData.log_sheet.end_date}
                />
              )}

              {activeTab === 'summary' && (
                <Summary routeData={routeData} />
              )}
            </>
          )}

          {!routeData && !loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-8xl mb-6">🚛</div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Ready to Plan Your Trip?
                </h3>
                <p className="text-gray-500 text-lg max-w-md mx-auto">
                  Enter your trip details in the sidebar to get started with HOS-compliant route planning.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Home;
