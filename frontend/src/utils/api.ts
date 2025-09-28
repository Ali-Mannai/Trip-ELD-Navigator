import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types for API responses
export interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

export interface FuelingStop {
  name: string;
  latitude: number;
  longitude: number;
}

export interface DutySchedulePoint {
  location: string;
  latitude: number;
  longitude: number;
  arrival_time: string;
  departure_time: string;
  status: 'Driving' | 'On Duty' | 'Sleeper' | 'Off Duty';
  miles_from_start: number;
  cumulative_driving_hours: number;
  cumulative_duty_hours: number;
}

export interface RouteDetails {
  total_distance: number;
  total_time: number;
  fueling_stops: FuelingStop[];
  duty_schedule: DutySchedulePoint[];
  violations: string[];
}

export interface TripRouteResponse {
  route: {
    total_distance: number;
    total_time: number;
    fueling_stops: FuelingStop[];
  };
  duty_schedule: DutySchedulePoint[];
  violations: string[];
  summary: {
    total_driving_hours: number;
    total_duty_hours: number;
    fuel_stops_count: number;
    has_violations: boolean;
  };
}

export interface TimeBlock {
  start_time: string;
  end_time: string;
  status: 'Driving' | 'On Duty' | 'Sleeper' | 'Off Duty';
  location: string;
  odometer_start: number;
  odometer_end: number;
  notes: string;
}

export interface DailyTotals {
  driving_hours: number;
  on_duty_hours: number;
  off_duty_hours: number;
  total_miles: number;
}

export interface LogEntry {
  date: string;
  time_blocks: TimeBlock[];
  daily_totals: DailyTotals;
}

export interface LogSheetResponse {
  log_sheet: {
    start_date: string;
    end_date: string;
    entries: LogEntry[];
  };
}

// API functions
export const apiService = {
  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response = await api.get('/health/');
    return response.data;
  },

  // Calculate route with HOS logic
  async calculateRoute(data: {
    current_location: string;
    pickup_location: string;
    dropoff_location: string;
    current_cycle_used: number;
  }): Promise<RouteDetails> {
    const response = await api.post('/calculate-route/', data);
    return response.data;
  },

  // Calculate trip route
  async calculateTripRoute(data: {
    current_location: string;
    pickup_location: string;
    dropoff_location: string;
    cycle_hours: number;
  }): Promise<TripRouteResponse> {
    const response = await api.post('/route/', data);
    return response.data;
  },

  // Get log sheet
  async getLogSheet(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<LogSheetResponse> {
    const response = await api.get('/logs/', { params });
    return response.data;
  },
};

export default api;
