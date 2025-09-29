import React from 'react';
import type { TripRouteResponse } from '../utils/api';

interface SummaryProps {
  routeData?: TripRouteResponse | null;
}

const Summary: React.FC<SummaryProps> = ({ routeData }) => {
  if (!routeData) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Trip Summary</h3>
          <p className="text-gray-500">No trip data available. Calculate a route to see the summary.</p>
        </div>
      </div>
    );
  }

  const { route, duty_schedule, violations, summary } = routeData;


  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  return (
    <div className="space-y-8">
      {/* Hero Route Overview Card */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl shadow-2xl text-white overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">🚛 Trip Overview</h2>
              <p className="text-blue-100">Complete route analysis and compliance status</p>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
              summary.has_violations 
                ? 'bg-red-500 text-white' 
                : 'bg-green-500 text-white'
            }`}>
              {summary.has_violations ? '⚠️ Violations Detected' : '✅ HOS Compliant'}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center mb-3">
                <div className="text-2xl mr-3">📏</div>
                <div className="text-blue-100 text-sm font-medium">Distance</div>
              </div>
              <div className="text-3xl font-bold text-white">
                {route.total_distance.toFixed(1)}
              </div>
              <div className="text-blue-200 text-sm">miles</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center mb-3">
                <div className="text-2xl mr-3">⏱️</div>
                <div className="text-blue-100 text-sm font-medium">Duration</div>
              </div>
              <div className="text-3xl font-bold text-white">
                {formatDuration(route.total_time)}
              </div>
              <div className="text-blue-200 text-sm">total time</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center mb-3">
                <div className="text-2xl mr-3">⛽</div>
                <div className="text-blue-100 text-sm font-medium">Fuel Stops</div>
              </div>
              <div className="text-3xl font-bold text-white">
                {summary.fuel_stops_count}
              </div>
              <div className="text-blue-200 text-sm">planned stops</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center mb-3">
                <div className="text-2xl mr-3">🛣️</div>
                <div className="text-blue-100 text-sm font-medium">Route Days</div>
              </div>
              <div className="text-3xl font-bold text-white">
                {Math.ceil(route.total_time / 24)}
              </div>
              <div className="text-blue-200 text-sm">days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Fueling Stops Card */}
      {route.fueling_stops.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center">
              <span className="text-2xl mr-3">⛽</span>
              Fueling Stops
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {route.fueling_stops.map((stop, index) => (
                <div key={index} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-lg font-bold text-orange-600">#{index + 1}</div>
                    <div className="text-2xl">⛽</div>
                  </div>
                  <div className="font-medium text-gray-900 mb-1">{stop.name}</div>
                  <div className="text-sm text-gray-600">
                    📍 {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HOS Summary Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <span className="text-2xl mr-3">⏰</span>
            Hours of Service Summary
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center mb-4">
                <div className="text-3xl mr-3">🚛</div>
                <div>
                  <div className="text-sm font-medium text-blue-700">Driving Hours</div>
                  <div className="text-xs text-blue-600">Max: 11h (14h window)</div>
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-800">
                {summary.total_driving_hours.toFixed(1)}h
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-3">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((summary.total_driving_hours / 11) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center mb-4">
                <div className="text-3xl mr-3">📋</div>
                <div>
                  <div className="text-sm font-medium text-green-700">Duty Hours</div>
                  <div className="text-xs text-green-600">Max: 14h (14h window)</div>
                </div>
              </div>
              <div className="text-3xl font-bold text-green-800">
                {summary.total_duty_hours.toFixed(1)}h
              </div>
              <div className="w-full bg-green-200 rounded-full h-2 mt-3">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((summary.total_duty_hours / 14) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center mb-4">
                <div className="text-3xl mr-3">🔄</div>
                <div>
                  <div className="text-sm font-medium text-purple-700">70h/8d Cycle</div>
                  <div className="text-xs text-purple-600">Remaining hours</div>
                </div>
              </div>
              <div className="text-3xl font-bold text-purple-800">
                {summary.total_duty_hours > 0 ? (70 - summary.total_duty_hours).toFixed(1) : '70.0'}h
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2 mt-3">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(((70 - summary.total_duty_hours) / 70) * 100, 0)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Violations */}
          {violations.length > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <div className="text-3xl mr-3">⚠️</div>
                <h4 className="text-xl font-bold text-red-800">HOS Violations Detected</h4>
              </div>
              <div className="space-y-3">
                {violations.map((violation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-red-200">
                    <div className="text-red-500 mt-1">•</div>
                    <div className="text-sm text-red-700 font-medium">{violation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Duty Schedule Cards */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
          <h3 className="text-xl font-bold text-white flex items-center">
            <span className="text-2xl mr-3">📅</span>
            Duty Schedule
          </h3>
          <p className="text-indigo-100 text-sm mt-1">Complete duty timeline with stops and compliance metrics</p>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {duty_schedule.map((point, index) => {
              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'Driving':
                    return {
                      bg: 'bg-blue-50',
                      border: 'border-blue-200',
                      accent: 'bg-blue-500',
                      text: 'text-blue-700',
                      icon: '🚛'
                    };
                  case 'On Duty':
                    return {
                      bg: 'bg-green-50',
                      border: 'border-green-200',
                      accent: 'bg-green-500',
                      text: 'text-green-700',
                      icon: '📋'
                    };
                  case 'Sleeper':
                    return {
                      bg: 'bg-purple-50',
                      border: 'border-purple-200',
                      accent: 'bg-purple-500',
                      text: 'text-purple-700',
                      icon: '😴'
                    };
                  case 'Off Duty':
                    return {
                      bg: 'bg-gray-50',
                      border: 'border-gray-200',
                      accent: 'bg-gray-500',
                      text: 'text-gray-700',
                      icon: '🏠'
                    };
                  default:
                    return {
                      bg: 'bg-gray-50',
                      border: 'border-gray-200',
                      accent: 'bg-gray-500',
                      text: 'text-gray-700',
                      icon: '❓'
                    };
                }
              };

              const colors = getStatusColor(point.status);

              return (
                <div key={index} className="uiverse-card">
                  <div className="uiverse-first-content uiverse-face">
                    <div className={`w-full h-full ${colors.bg} ${colors.border} border-2 rounded-xl p-6 relative overflow-hidden`}>
                      <div className={`${colors.accent} absolute top-0 left-0 right-0 h-1`}></div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{colors.icon}</div>
                          <div>
                            <div className="text-xs text-gray-500 font-medium">STOP #{index + 1}</div>
                            <div className={`text-sm font-bold ${colors.text}`}>{point.status}</div>
                          </div>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="text-base font-bold text-gray-900 truncate" title={point.location}>
                          {point.location}
                        </div>
                        <div className="text-xs text-gray-600 flex items-center">
                          <span className="mr-1">🕐</span>
                          {formatTime(point.arrival_time)}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center">
                          <div className="text-[10px] text-gray-500 font-medium">Driving</div>
                          <div className={`text-sm font-bold ${colors.text}`}>
                            {point.cumulative_driving_hours.toFixed(1)}h
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] text-gray-500 font-medium">Duty</div>
                          <div className={`text-sm font-bold ${colors.text}`}>
                            {point.cumulative_duty_hours.toFixed(1)}h
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-[10px] text-gray-500 font-medium">Miles</div>
                          <div className={`text-sm font-bold ${colors.text}`}>
                            {point.miles_from_start.toFixed(0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="uiverse-second-content uiverse-face">
                    <div className={`w-full h-full ${colors.bg} ${colors.border} border-2 rounded-xl p-6 relative overflow-hidden flex flex-col items-center justify-center`}>
                      <div className="text-4xl mb-2">{colors.icon}</div>
                      <div className="text-lg font-bold text-gray-900 mb-1">{point.status}</div>
                      <div className="text-sm text-gray-700 mb-3 text-center px-4 truncate" title={point.location}>{point.location}</div>
                      <span className={`${colors.accent} text-white px-4 py-2 rounded-full text-xs font-semibold shadow-sm`}>
                        Arrives {formatTime(point.arrival_time)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary;
