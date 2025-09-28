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

    // Add duty schedule locations (simplified - in production, you'd geocode these)
    const mockLocations = [
      [40.7128, -74.0060], // New York
      [34.0522, -118.2437], // Los Angeles
      [41.8781, -87.6298], // Chicago
    ];
    allPoints.push(...(mockLocations as [number, number][]));

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

  // Create route polyline (simplified - in production, use actual route coordinates)
  const getRoutePolyline = (): [number, number][] => {
    if (!routeData) return [];
    
    // Simplified route between major cities
    return [
      [40.7128, -74.0060], // New York
      [34.0522, -118.2437], // Los Angeles
      [41.8781, -87.6298], // Chicago
    ];
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
              
              {/* Start location */}
              <Marker position={[40.7128, -74.0060]} icon={startIcon}>
                <Popup>
                  <div className="text-center">
                    <h4 className="font-semibold">Start Location</h4>
                    <p className="text-sm text-gray-600">Current Position</p>
                  </div>
                </Popup>
              </Marker>
              
              {/* Pickup location */}
              <Marker position={[34.0522, -118.2437]} icon={pickupIcon}>
                <Popup>
                  <div className="text-center">
                    <h4 className="font-semibold">Pickup Location</h4>
                    <p className="text-sm text-gray-600">Los Angeles, CA</p>
                  </div>
                </Popup>
              </Marker>
              
              {/* Dropoff location */}
              <Marker position={[41.8781, -87.6298]} icon={dropoffIcon}>
                <Popup>
                  <div className="text-center">
                    <h4 className="font-semibold">Dropoff Location</h4>
                    <p className="text-sm text-gray-600">Chicago, IL</p>
                  </div>
                </Popup>
              </Marker>
              
              {/* Fueling stops */}
              {routeData.route.fueling_stops.map((stop, index) => (
                <Marker
                  key={index}
                  position={[stop.latitude, stop.longitude]}
                  icon={fuelIcon}
                >
                  <Popup>
                    <div className="text-center">
                      <h4 className="font-semibold">Fuel Stop #{index + 1}</h4>
                      <p className="text-sm text-gray-600">{stop.name}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          )}
        </MapContainer>
      </div>
      
      {routeData && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>Start</span>
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
        </div>
      )}
    </div>
  );
};

export default MapView;
