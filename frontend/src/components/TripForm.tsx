import React, { useState } from 'react';
import type { TripRouteResponse } from '../utils/api';

interface TripFormProps {
  onSubmit: (data: {
    current_location: string;
    pickup_location: string;
    dropoff_location: string;
    cycle_hours: number;
  }) => void;
  loading?: boolean;
  result?: TripRouteResponse | null;
  compact?: boolean;
}

const TripForm: React.FC<TripFormProps> = ({ onSubmit, loading = false, result = null, compact = false }) => {
  const [formData, setFormData] = useState({
    current_location: '',
    pickup_location: '',
    dropoff_location: '',
    cycle_hours: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cycle_hours' ? parseFloat(value) || 0 : value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.current_location.trim()) {
      newErrors.current_location = 'Current location is required';
    }
    if (!formData.pickup_location.trim()) {
      newErrors.pickup_location = 'Pickup location is required';
    }
    if (!formData.dropoff_location.trim()) {
      newErrors.dropoff_location = 'Dropoff location is required';
    }
    if (formData.cycle_hours < 0 || formData.cycle_hours > 70) {
      newErrors.cycle_hours = 'Cycle hours must be between 0 and 70';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  if (compact) {
    return (
      <div className="text-center">
        <div className="text-4xl mb-4">🚛</div>
        <p className="text-sm text-gray-500">Trip Form</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
        <span className="text-2xl mr-3">🚛</span>
        Trip Planning
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Enter your current position and trip details to plan a compliant route.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="current_location" className="block text-sm font-medium text-gray-700 mb-2">
              Current Location
            </label>
            <input
              type="text"
              id="current_location"
              name="current_location"
              value={formData.current_location}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border ${errors.current_location ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
              placeholder="e.g., New York, NY"
            />
            {errors.current_location && (
              <p className="mt-1 text-sm text-red-600">{errors.current_location}</p>
            )}
          </div>
          <div>
            <label htmlFor="pickup_location" className="block text-sm font-medium text-gray-700 mb-2">
              Pickup Location
            </label>
            <input
              type="text"
              id="pickup_location"
              name="pickup_location"
              value={formData.pickup_location}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border ${errors.pickup_location ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
              placeholder="e.g., Los Angeles, CA"
            />
            {errors.pickup_location && (
              <p className="mt-1 text-sm text-red-600">{errors.pickup_location}</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="dropoff_location" className="block text-sm font-medium text-gray-700 mb-2">
              Dropoff Location
            </label>
            <button
              type="button"
              onClick={() => setFormData(prev => ({
                ...prev,
                pickup_location: prev.dropoff_location,
                dropoff_location: prev.pickup_location,
              }))}
              className="inline-flex items-center text-xs px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              title="Swap pickup and dropoff"
            >
              ↕ Swap
            </button>
          </div>
          <input
            type="text"
            id="dropoff_location"
            name="dropoff_location"
            value={formData.dropoff_location}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border ${errors.dropoff_location ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
            placeholder="e.g., Chicago, IL"
          />
          {errors.dropoff_location && (
            <p className="mt-1 text-sm text-red-600">{errors.dropoff_location}</p>
          )}
        </div>

        <div>
          <label htmlFor="cycle_hours" className="block text-sm font-medium text-gray-700 mb-2">
            Current Cycle Hours Used
          </label>
          <input
            type="number"
            id="cycle_hours"
            name="cycle_hours"
            value={formData.cycle_hours}
            onChange={handleInputChange}
            min="0"
            max="70"
            step="0.5"
            className={`w-full px-3 py-2 border ${errors.cycle_hours ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
            placeholder="0"
          />
          {errors.cycle_hours && (
            <p className="mt-1 text-sm text-red-600">{errors.cycle_hours}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Hours already used in current 70-hour cycle (0-70)
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && (
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          )}
          {loading ? 'Calculating Route...' : 'Calculate Route'}
        </button>
      </form>

      {result && (
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Route Calculated Successfully!</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Distance:</span> {result.route.total_distance.toFixed(1)} miles
            </div>
            <div>
              <span className="font-medium">Total Time:</span> {result.route.total_time.toFixed(1)} hours
            </div>
            <div>
              <span className="font-medium">Fuel Stops:</span> {result.summary.fuel_stops_count}
            </div>
            <div>
              <span className="font-medium">Violations:</span> {result.summary.has_violations ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripForm;
