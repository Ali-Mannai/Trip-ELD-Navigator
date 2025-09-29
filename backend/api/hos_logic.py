"""
FMCSA Hours of Service (HOS) Logic Module

This module implements FMCSA Hours of Service rules for commercial drivers
including driving limits, rest requirements, and duty status tracking.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
import math
import requests
import time


@dataclass
class Location:
    """Represents a geographical location with coordinates."""
    name: str
    latitude: float
    longitude: float


@dataclass
class RoutePoint:
    """Represents a point along the route with timing information."""
    location: Location
    arrival_time: datetime
    departure_time: datetime
    status: str  # 'Driving', 'On Duty', 'Sleeper', 'Off Duty'
    miles_from_start: float
    cumulative_driving_hours: float
    cumulative_duty_hours: float


@dataclass
class RouteDetails:
    """Contains comprehensive route information."""
    total_distance: float
    total_time: float
    fueling_stops: List[Location]
    duty_schedule: List[RoutePoint]
    violations: List[str]


def geocode_location(location_str: str) -> Tuple[float, float]:
    """
    Geocode a location string to coordinates using OpenStreetMap Nominatim.
    
    Args:
        location_str: Location string to geocode
        
    Returns:
        Tuple of (latitude, longitude)
    """
    try:
        # Use OpenStreetMap Nominatim API for geocoding
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            'q': location_str,
            'format': 'json',
            'limit': 1,
            'addressdetails': 1
        }
        headers = {
            'User-Agent': 'Trip-ELD-Navigator/1.0'
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        if data and len(data) > 0:
            lat = float(data[0]['lat'])
            lon = float(data[0]['lon'])
            return lat, lon
        else:
            # Fallback to default coordinates if geocoding fails
            return 40.7128, -74.0060  # New York as default
            
    except Exception as e:
        print(f"Geocoding failed for '{location_str}': {e}")
        # Fallback to default coordinates
        return 40.7128, -74.0060


class HOSCalculator:
    """
    Main class for calculating Hours of Service compliance and route planning.
    """
    
    # FMCSA Constants
    MAX_DRIVING_HOURS = 11  
    MAX_DUTY_HOURS = 14     
    MIN_OFF_DUTY_HOURS = 10 
    BREAK_THRESHOLD = 8     
    BREAK_DURATION = 0.5    
    FUELING_INTERVAL = 1000 
    PICKUP_TIME = 1         
    DROPOFF_TIME = 1        
    MAX_70_HOUR_WINDOW = 70 
    DAYS_IN_70_HOUR_WINDOW = 8
    
    def __init__(self):
        self.current_cycle_used = 0.0
        self.duty_status_history = []
        self.location_cache = {} 
        
    def calculate_route(self, 
                       current_location: str,
                       pickup_location: str, 
                       dropoff_location: str,
                       current_cycle_used: float) -> RouteDetails:
        """
        Calculate the complete route with HOS compliance.
        
        Args:
            current_location: Current driver location
            pickup_location: Pickup location for cargo
            dropoff_location: Dropoff location for cargo
            current_cycle_used: Hours already used in current cycle
            
        Returns:
            RouteDetails object with complete route information
        """
        self.current_cycle_used = current_cycle_used
        
        # Convert string locations to Location objects
        current_loc = self._parse_location(current_location)
        pickup_loc = self._parse_location(pickup_location)
        dropoff_loc = self._parse_location(dropoff_location)
        
        # Calculate distances and times
        distance_to_pickup = self._calculate_distance(current_loc, pickup_loc)
        distance_pickup_to_dropoff = self._calculate_distance(pickup_loc, dropoff_loc)
        total_distance = distance_to_pickup + distance_pickup_to_dropoff
        
        # Calculate fueling stops
        fueling_stops = self._calculate_fueling_stops(current_loc, pickup_loc, dropoff_loc)
        
        # Generate duty schedule
        duty_schedule = self._generate_duty_schedule(
            current_loc, pickup_loc, dropoff_loc, 
            distance_to_pickup, distance_pickup_to_dropoff,
            fueling_stops
        )
        
        # Check for violations
        violations = self._check_violations(duty_schedule)
        
        # Calculate total time
        total_time = self._calculate_total_time(duty_schedule)
        
        return RouteDetails(
            total_distance=total_distance,
            total_time=total_time,
            fueling_stops=fueling_stops,
            duty_schedule=duty_schedule,
            violations=violations
        )
    
    def _parse_location(self, location_str: str) -> Location:
        """
        Parse location string into Location object using geocoding.
        """
        # Check cache first
        if location_str in self.location_cache:
            return self.location_cache[location_str]
        
        # Geocode the location
        lat, lon = geocode_location(location_str)
        
        # Create location object
        location = Location(name=location_str, latitude=lat, longitude=lon)
        
        # Cache the result
        self.location_cache[location_str] = location
        
        # Add a small delay to respect Nominatim rate limits
        time.sleep(0.1)
        
        return location
    
    def _calculate_distance(self, loc1: Location, loc2: Location) -> float:
        """
        Calculate distance between two locations using Haversine formula.
        Returns distance in miles.
        """
        R = 3959  # Earth's radius in miles
        
        lat1_rad = math.radians(loc1.latitude)
        lat2_rad = math.radians(loc2.latitude)
        delta_lat = math.radians(loc2.latitude - loc1.latitude)
        delta_lon = math.radians(loc2.longitude - loc1.longitude)
        
        a = (math.sin(delta_lat / 2) ** 2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * 
             math.sin(delta_lon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    def _calculate_fueling_stops(self, current: Location, pickup: Location, dropoff: Location) -> List[Location]:
        """
        Calculate fueling stops every 1000 miles along the route.
        """
        stops = []
        
        # Calculate route segments
        distance_to_pickup = self._calculate_distance(current, pickup)
        distance_pickup_to_dropoff = self._calculate_distance(pickup, dropoff)
        
        # Add stops on the way to pickup
        miles_so_far = 0
        while miles_so_far + self.FUELING_INTERVAL < distance_to_pickup:
            miles_so_far += self.FUELING_INTERVAL
            stop_location = self._interpolate_location(current, pickup, miles_so_far / distance_to_pickup)
            stops.append(stop_location)
        
        # Add stops from pickup to dropoff
        miles_so_far = distance_to_pickup
        while miles_so_far + self.FUELING_INTERVAL < distance_to_pickup + distance_pickup_to_dropoff:
            miles_so_far += self.FUELING_INTERVAL
            # Interpolate location
            progress = (miles_so_far - distance_to_pickup) / distance_pickup_to_dropoff
            stop_location = self._interpolate_location(pickup, dropoff, progress)
            stops.append(stop_location)
        
        return stops
    
    def _interpolate_location(self, start: Location, end: Location, progress: float) -> Location:
        """
        Interpolate a location between start and end based on progress (0-1).
        """
        lat = start.latitude + (end.latitude - start.latitude) * progress
        lon = start.longitude + (end.longitude - start.longitude) * progress
        return Location(
            name=f"Fuel Stop at {lat:.2f}, {lon:.2f}",
            latitude=lat,
            longitude=lon
        )
    
    def _generate_duty_schedule(self, 
                               current: Location, 
                               pickup: Location, 
                               dropoff: Location,
                               distance_to_pickup: float,
                               distance_pickup_to_dropoff: float,
                               fueling_stops: List[Location]) -> List[RoutePoint]:
        """
        Generate the complete duty schedule with HOS compliance.
        """
        schedule = []
        current_time = datetime.now()
        current_miles = 0.0
        cumulative_driving = self.current_cycle_used
        cumulative_duty = self.current_cycle_used
        
        # Start at current location
        schedule.append(RoutePoint(
            location=current,
            arrival_time=current_time,
            departure_time=current_time,
            status="Off Duty",
            miles_from_start=0.0,
            cumulative_driving_hours=cumulative_driving,
            cumulative_duty_hours=cumulative_duty
        ))
        
        # Drive to pickup location
        drive_time = self._calculate_drive_time(distance_to_pickup)
        arrival_time = current_time + timedelta(hours=drive_time)
        departure_time = arrival_time + timedelta(hours=self.PICKUP_TIME)
        
        # Check if we need breaks during this drive
        schedule.extend(self._add_driving_segment(
            current, pickup, distance_to_pickup, current_time, 
            cumulative_driving, cumulative_duty, fueling_stops
        ))
        
        # Update cumulative hours
        cumulative_driving += drive_time
        cumulative_duty += drive_time + self.PICKUP_TIME
        
        # Pickup (On Duty Not Driving)
        schedule.append(RoutePoint(
            location=pickup,
            arrival_time=arrival_time,
            departure_time=departure_time,
            status="On Duty",
            miles_from_start=distance_to_pickup,
            cumulative_driving_hours=cumulative_driving,
            cumulative_duty_hours=cumulative_duty
        ))
        
        # Drive to dropoff location
        drive_time = self._calculate_drive_time(distance_pickup_to_dropoff)
        arrival_time = departure_time + timedelta(hours=drive_time)
        departure_time = arrival_time + timedelta(hours=self.DROPOFF_TIME)
        
        # Check if we need breaks during this drive
        schedule.extend(self._add_driving_segment(
            pickup, dropoff, distance_pickup_to_dropoff, departure_time,
            cumulative_driving, cumulative_duty, []
        ))
        
        # Update cumulative hours
        cumulative_driving += drive_time
        cumulative_duty += drive_time + self.DROPOFF_TIME
        
        # Dropoff (On Duty Not Driving)
        schedule.append(RoutePoint(
            location=dropoff,
            arrival_time=arrival_time,
            departure_time=departure_time,
            status="On Duty",
            miles_from_start=distance_to_pickup + distance_pickup_to_dropoff,
            cumulative_driving_hours=cumulative_driving,
            cumulative_duty_hours=cumulative_duty
        ))
        
        # Add required off-duty time if needed
        if cumulative_driving >= self.MAX_DRIVING_HOURS or cumulative_duty >= self.MAX_DUTY_HOURS:
            off_duty_start = departure_time
            off_duty_end = off_duty_start + timedelta(hours=self.MIN_OFF_DUTY_HOURS)
            
            schedule.append(RoutePoint(
                location=dropoff,
                arrival_time=off_duty_start,
                departure_time=off_duty_end,
                status="Off Duty",
                miles_from_start=distance_to_pickup + distance_pickup_to_dropoff,
                cumulative_driving_hours=0.0,  # Reset after off-duty
                cumulative_duty_hours=0.0      # Reset after off-duty
            ))
        
        return schedule
    
    def _add_driving_segment(self, 
                           start: Location, 
                           end: Location, 
                           distance: float,
                           start_time: datetime,
                           cumulative_driving: float,
                           cumulative_duty: float,
                           fueling_stops: List[Location]) -> List[RoutePoint]:
        """
        Add a driving segment with proper breaks and fueling stops.
        """
        segment_points = []
        current_time = start_time
        current_miles = 0.0
        current_driving = cumulative_driving
        current_duty = cumulative_duty
        
        # Calculate driving time for this segment
        drive_time = self._calculate_drive_time(distance)
        
        # Check if we need a break during this segment
        if current_driving >= self.BREAK_THRESHOLD:
            # Add 30-minute break
            break_start = current_time
            break_end = break_start + timedelta(hours=self.BREAK_DURATION)
            
            segment_points.append(RoutePoint(
                location=start,
                arrival_time=break_start,
                departure_time=break_end,
                status="Off Duty",
                miles_from_start=current_miles,
                cumulative_driving_hours=current_driving,
                cumulative_duty_hours=current_duty
            ))
            
            current_time = break_end
            current_driving = 0.0  # Reset driving hours after break
            current_duty += self.BREAK_DURATION
        
        # Add fueling stops along the way
        for stop in fueling_stops:
            if current_miles < distance:
                # Calculate time to reach this stop
                stop_distance = self._calculate_distance(start, stop)
                time_to_stop = self._calculate_drive_time(stop_distance)
                arrival_time = current_time + timedelta(hours=time_to_stop)
                departure_time = arrival_time + timedelta(minutes=30)  # 30-min fueling
                
                segment_points.append(RoutePoint(
                    location=stop,
                    arrival_time=arrival_time,
                    departure_time=departure_time,
                    status="On Duty",
                    miles_from_start=current_miles + stop_distance,
                    cumulative_driving_hours=current_driving + time_to_stop,
                    cumulative_duty_hours=current_duty + time_to_stop + 0.5
                ))
                
                current_time = departure_time
                current_miles += stop_distance
                current_driving += time_to_stop
                current_duty += time_to_stop + 0.5
        
        # Add final arrival at destination
        remaining_distance = distance - current_miles
        remaining_time = self._calculate_drive_time(remaining_distance)
        arrival_time = current_time + timedelta(hours=remaining_time)
        
        segment_points.append(RoutePoint(
            location=end,
            arrival_time=arrival_time,
            departure_time=arrival_time,
            status="Driving",
            miles_from_start=distance,
            cumulative_driving_hours=current_driving + remaining_time,
            cumulative_duty_hours=current_duty + remaining_time
        ))
        
        return segment_points
    
    def _calculate_drive_time(self, distance: float) -> float:
        """
        Calculate driving time based on distance.
        Assumes average speed of 55 mph for commercial vehicles.
        """
        return distance / 55.0  # hours
    
    def _calculate_total_time(self, schedule: List[RoutePoint]) -> float:
        """
        Calculate total time for the route.
        """
        if not schedule:
            return 0.0
        
        start_time = schedule[0].arrival_time
        end_time = schedule[-1].departure_time
        return (end_time - start_time).total_seconds() / 3600.0  # hours
    
    def _check_violations(self, schedule: List[RoutePoint]) -> List[str]:
        """
        Check for HOS violations in the schedule.
        """
        violations = []
        
        for i, point in enumerate(schedule):
            # Check 11-hour driving limit
            if point.cumulative_driving_hours > self.MAX_DRIVING_HOURS:
                violations.append(f"Violation: Exceeded 11-hour driving limit at {point.location.name}")
            
            # Check 14-hour duty limit
            if point.cumulative_duty_hours > self.MAX_DUTY_HOURS:
                violations.append(f"Violation: Exceeded 14-hour duty limit at {point.location.name}")
            
            # Check 70-hour/8-day rule (simplified check)
            if point.cumulative_duty_hours > self.MAX_70_HOUR_WINDOW:
                violations.append(f"Violation: Exceeded 70-hour/8-day limit at {point.location.name}")
        
        return violations
    
    def get_duty_status_summary(self, schedule: List[RoutePoint]) -> Dict[str, float]:
        """
        Get a summary of duty status hours.
        """
        summary = {
            "Driving": 0.0,
            "On Duty": 0.0,
            "Sleeper": 0.0,
            "Off Duty": 0.0
        }
        
        for i in range(len(schedule) - 1):
            current = schedule[i]
            next_point = schedule[i + 1]
            
            duration = (next_point.arrival_time - current.departure_time).total_seconds() / 3600.0
            summary[current.status] += duration
        
        return summary


# Convenience function for easy access
def calculate_hos_route(current_location: str,
                       pickup_location: str,
                       dropoff_location: str,
                       current_cycle_used: float) -> RouteDetails:
    """
    Convenience function to calculate HOS-compliant route.
    
    Args:
        current_location: Current driver location
        pickup_location: Pickup location for cargo
        dropoff_location: Dropoff location for cargo
        current_cycle_used: Hours already used in current cycle
        
    Returns:
        RouteDetails object with complete route information
    """
    calculator = HOSCalculator()
    return calculator.calculate_route(
        current_location, pickup_location, dropoff_location, current_cycle_used
    )
