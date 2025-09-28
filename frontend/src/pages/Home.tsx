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
    { id: 'map', name: 'Route Map', icon: '🗺️' },
    { id: 'logs', name: 'Log Sheet', icon: '📋' },
    { id: 'summary', name: 'Summary', icon: '📊' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">
                Trip ELD Navigator
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">FMCSA HOS Compliant</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Trip Form */}
          <div className="lg:col-span-1">
            <TripForm
              onSubmit={handleTripSubmit}
              loading={loading}
              result={routeData}
            />
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-red-400">⚠️</span>
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
                {/* Tab Navigation */}
                <div className="mb-6">
                  <nav className="flex space-x-8">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab.id
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.name}
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'map' && (
                  <MapView routeData={routeData} height="500px" />
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
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🚛</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Ready to Plan Your Trip?
                </h3>
                <p className="text-gray-500">
                  Enter your trip details to get started with HOS-compliant route planning.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
