import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TripRouteResponse } from '../utils/api';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  routeData?: TripRouteResponse | null;
  height?: string;
}

const MapView: React.FC<MapViewProps> = ({ routeData, height = '400px' }) => {
  const mapRef = useRef<L.Map>(null);

  // Default center (New York)
  const defaultCenter: [number, number] = [40.7128, -74.0060];
  const defaultZoom = 4;


  // Calculate route bounds and center
  const getRouteBounds = () => {
    if (!routeData) return null;

    const allPoints: [number, number][] = [];
    
    // Add fueling stops
    routeData.route.fueling_stops.forEach(stop => {
      allPoints.push([stop.latitude, stop.longitude]);
    });

    // Add duty schedule locations
    routeData.duty_schedule.forEach(point => {
      allPoints.push([point.latitude, point.longitude]);
    });

    if (allPoints.length === 0) return null;

    return L.latLngBounds(allPoints);
  };

  // Fit map to route when routeData changes
  useEffect(() => {
    if (mapRef.current && routeData) {
      const bounds = getRouteBounds();
      if (bounds) {
        mapRef.current.fitBounds(bounds, { padding: [20, 20] });
      }
    }
  }, [routeData]);

  // Create route polyline from duty schedule
  const getRoutePolyline = (): [number, number][] => {
    if (!routeData) return [];
    
    return routeData.duty_schedule.map(point => [point.latitude, point.longitude]);
  };

  // Create custom icons
  const createCustomIcon = (color: string, icon: string) => {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        color: white;
        font-weight: bold;
      ">${icon}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  const startIcon = createCustomIcon('#10b981', 'S');
  const pickupIcon = createCustomIcon('#3b82f6', 'P');
  const dropoffIcon = createCustomIcon('#ef4444', 'D');
  const fuelIcon = createCustomIcon('#f59e0b', 'F');
  const restIcon = createCustomIcon('#8b5cf6', 'R');

  // Get key locations from duty schedule
  const getKeyLocations = () => {
    if (!routeData) return { current: null, pickup: null, dropoff: null };
    
    const current = routeData.duty_schedule.find(point => 
      point.status === 'Off Duty' && point.miles_from_start === 0
    );
    const pickup = routeData.duty_schedule.find(point => 
      point.status === 'On Duty' && point.location.toLowerCase().includes('pickup')
    );
    const dropoff = routeData.duty_schedule.find(point => 
      point.status === 'On Duty' && point.location.toLowerCase().includes('dropoff')
    );
    
    return { current, pickup, dropoff };
  };

  // Get rest stops from duty schedule
  const getRestStops = () => {
    if (!routeData) return [];
    
    return routeData.duty_schedule.filter(point => 
      point.status === 'Off Duty' && point.miles_from_start > 0
    );
  };

  const { current, pickup, dropoff } = getKeyLocations();
  const restStops = getRestStops();

  return (
    <div className="card">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Route Map</h3>
      
      <div style={{ height }} className="rounded-lg overflow-hidden">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {routeData && (
            <>
              {/* Route polyline */}
              <Polyline
                positions={getRoutePolyline()}
                color="#3b82f6"
                weight={4}
                opacity={0.8}
              />
              
              {/* Current location */}
              {current && (
                <Marker position={[current.latitude, current.longitude]} icon={startIcon}>
                  <Popup>
                    <div className="text-center">
                      <h4 className="font-semibold">Current Location</h4>
                      <p className="text-sm text-gray-600">{current.location}</p>
                      <p className="text-xs text-gray-500">
                        Arrival: {new Date(current.arrival_time).toLocaleString()}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {/* Pickup location */}
              {pickup && (
                <Marker position={[pickup.latitude, pickup.longitude]} icon={pickupIcon}>
                  <Popup>
                    <div className="text-center">
                      <h4 className="font-semibold">Pickup Location</h4>
                      <p className="text-sm text-gray-600">{pickup.location}</p>
                      <p className="text-xs text-gray-500">
                        Arrival: {new Date(pickup.arrival_time).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Departure: {new Date(pickup.departure_time).toLocaleString()}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {/* Dropoff location */}
              {dropoff && (
                <Marker position={[dropoff.latitude, dropoff.longitude]} icon={dropoffIcon}>
                  <Popup>
                    <div className="text-center">
                      <h4 className="font-semibold">Dropoff Location</h4>
                      <p className="text-sm text-gray-600">{dropoff.location}</p>
                      <p className="text-xs text-gray-500">
                        Arrival: {new Date(dropoff.arrival_time).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Departure: {new Date(dropoff.departure_time).toLocaleString()}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {/* Fueling stops */}
              {routeData.route.fueling_stops.map((stop, index) => (
                <Marker
                  key={`fuel-${index}`}
                  position={[stop.latitude, stop.longitude]}
                  icon={fuelIcon}
                >
                  <Popup>
                    <div className="text-center">
                      <h4 className="font-semibold">Fuel Stop #{index + 1}</h4>
                      <p className="text-sm text-gray-600">{stop.name}</p>
                      <p className="text-xs text-gray-500">
                        Coordinates: {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
              
              {/* Rest stops */}
              {restStops.map((stop, index) => (
                <Marker
                  key={`rest-${index}`}
                  position={[stop.latitude, stop.longitude]}
                  icon={restIcon}
                >
                  <Popup>
                    <div className="text-center">
                      <h4 className="font-semibold">Rest Stop #{index + 1}</h4>
                      <p className="text-sm text-gray-600">{stop.location}</p>
                      <p className="text-xs text-gray-500">
                        Arrival: {new Date(stop.arrival_time).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Departure: {new Date(stop.departure_time).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Miles from start: {stop.miles_from_start.toFixed(1)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          )}
        </MapContainer>
      </div>
      
      {routeData && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>Current</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>Pickup</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span>Dropoff</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span>Fuel Stop</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
            <span>Rest Stop</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
