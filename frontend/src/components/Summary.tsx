import React from 'react';
import type { TripRouteResponse } from '../utils/api';

interface SummaryProps {
  routeData?: TripRouteResponse | null;
}

const Summary: React.FC<SummaryProps> = ({ routeData }) => {
  if (!routeData) {
    return (
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Trip Summary</h3>
        <div className="text-center py-8 text-gray-500">
          No trip data available. Calculate a route to see the summary.
        </div>
      </div>
    );
  }

  const { route, duty_schedule, violations, summary } = routeData;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Driving':
        return '🚛';
      case 'On Duty':
        return '📋';
      case 'Sleeper':
        return '😴';
      case 'Off Duty':
        return '🏠';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Driving':
        return 'bg-blue-100 text-blue-800';
      case 'On Duty':
        return 'bg-green-100 text-green-800';
      case 'Sleeper':
        return 'bg-purple-100 text-purple-800';
      case 'Off Duty':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
    <div className="space-y-6">
      {/* Route Overview */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Route Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {route.total_distance.toFixed(1)}
            </div>
            <div className="text-sm text-blue-800">Total Distance (miles)</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {formatDuration(route.total_time)}
            </div>
            <div className="text-sm text-green-800">Total Time</div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {summary.fuel_stops_count}
            </div>
            <div className="text-sm text-yellow-800">Fuel Stops</div>
          </div>
          
          <div className={`p-4 rounded-lg ${summary.has_violations ? 'bg-red-50' : 'bg-green-50'}`}>
            <div className={`text-2xl font-bold ${summary.has_violations ? 'text-red-600' : 'text-green-600'}`}>
              {summary.has_violations ? '⚠️' : '✅'}
            </div>
            <div className={`text-sm ${summary.has_violations ? 'text-red-800' : 'text-green-800'}`}>
              HOS Compliance
            </div>
          </div>
        </div>

        {/* Fueling Stops */}
        {route.fueling_stops.length > 0 && (
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-3">Fueling Stops</h4>
            <div className="space-y-2">
              {route.fueling_stops.map((stop, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{stop.name}</div>
                    <div className="text-sm text-gray-600">
                      {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">Stop #{index + 1}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* HOS Summary */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Hours of Service Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {summary.total_driving_hours.toFixed(1)}h
            </div>
            <div className="text-sm text-blue-800">Total Driving Hours</div>
            <div className="text-xs text-blue-600 mt-1">
              Max: 11h (14h window)
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {summary.total_duty_hours.toFixed(1)}h
            </div>
            <div className="text-sm text-green-800">Total Duty Hours</div>
            <div className="text-xs text-green-600 mt-1">
              Max: 14h (14h window)
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {summary.total_duty_hours > 0 ? (70 - summary.total_duty_hours).toFixed(1) : '70.0'}h
            </div>
            <div className="text-sm text-purple-800">Remaining (70h/8d)</div>
            <div className="text-xs text-purple-600 mt-1">
              Cycle: 8 days
            </div>
          </div>
        </div>

        {/* Violations */}
        {violations.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-lg font-medium text-red-800 mb-2">⚠️ HOS Violations Detected</h4>
            <ul className="space-y-1">
              {violations.map((violation, index) => (
                <li key={index} className="text-sm text-red-700">• {violation}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Duty Schedule */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Duty Schedule</h3>
        
        <div className="space-y-3">
          {duty_schedule.map((point, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getStatusIcon(point.status)}</span>
                <div>
                  <div className="font-medium text-gray-900">{point.location}</div>
                  <div className="text-sm text-gray-600">
                    {formatTime(point.arrival_time)} - {formatTime(point.departure_time)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(point.status)}`}>
                  {point.status}
                </span>
                
                <div className="text-right text-sm text-gray-600">
                  <div>Driving: {point.cumulative_driving_hours.toFixed(1)}h</div>
                  <div>Duty: {point.cumulative_duty_hours.toFixed(1)}h</div>
                  <div>{point.miles_from_start.toFixed(0)} mi</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Summary;
