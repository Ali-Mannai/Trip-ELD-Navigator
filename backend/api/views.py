from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .hos_logic import calculate_hos_route
from .serializers import HealthSerializer, HOSRouteSerializer, TripInputSerializer
from datetime import datetime, timedelta
import json


@api_view(['GET'])
def health_check(request):
    """
    Health check endpoint that returns the status of the API.
    """
    return Response({"status": "ok"}, status=status.HTTP_200_OK)


@api_view(['POST'])
def calculate_route(request):
    """
    Calculate HOS-compliant route with FMCSA rules.
    
    Expected JSON payload:
    {
        "current_location": "string",
        "pickup_location": "string", 
        "dropoff_location": "string",
        "current_cycle_used": float
    }
    """
    serializer = HOSRouteSerializer(data=request.data)
    if serializer.is_valid():
        try:
            route_details = calculate_hos_route(
                current_location=serializer.validated_data['current_location'],
                pickup_location=serializer.validated_data['pickup_location'],
                dropoff_location=serializer.validated_data['dropoff_location'],
                current_cycle_used=serializer.validated_data['current_cycle_used']
            )
            
            # Convert RouteDetails to dictionary for JSON response
            response_data = {
                "total_distance": route_details.total_distance,
                "total_time": route_details.total_time,
                "fueling_stops": [
                    {
                        "name": stop.name,
                        "latitude": stop.latitude,
                        "longitude": stop.longitude
                    } for stop in route_details.fueling_stops
                ],
                "duty_schedule": [
                    {
                        "location": point.location.name,
                        "arrival_time": point.arrival_time.isoformat(),
                        "departure_time": point.departure_time.isoformat(),
                        "status": point.status,
                        "miles_from_start": point.miles_from_start,
                        "cumulative_driving_hours": point.cumulative_driving_hours,
                        "cumulative_duty_hours": point.cumulative_duty_hours
                    } for point in route_details.duty_schedule
                ],
                "violations": route_details.violations
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": f"Route calculation failed: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def route(request):
    """
    Calculate HOS-compliant route with trip input.
    
    Expected JSON payload:
    {
        "current_location": "string",
        "pickup_location": "string", 
        "dropoff_location": "string",
        "cycle_hours": float
    }
    """
    serializer = TripInputSerializer(data=request.data)
    if serializer.is_valid():
        try:
            route_details = calculate_hos_route(
                current_location=serializer.validated_data['current_location'],
                pickup_location=serializer.validated_data['pickup_location'],
                dropoff_location=serializer.validated_data['dropoff_location'],
                current_cycle_used=serializer.validated_data['cycle_hours']
            )
            
            # Format response with route and duty schedule
            response_data = {
                "route": {
                    "total_distance": route_details.total_distance,
                    "total_time": route_details.total_time,
                    "fueling_stops": [
                        {
                            "name": stop.name,
                            "latitude": stop.latitude,
                            "longitude": stop.longitude
                        } for stop in route_details.fueling_stops
                    ]
                },
                "duty_schedule": [
                    {
                        "location": point.location.name,
                        "arrival_time": point.arrival_time.isoformat(),
                        "departure_time": point.departure_time.isoformat(),
                        "status": point.status,
                        "miles_from_start": point.miles_from_start,
                        "cumulative_driving_hours": point.cumulative_driving_hours,
                        "cumulative_duty_hours": point.cumulative_duty_hours
                    } for point in route_details.duty_schedule
                ],
                "violations": route_details.violations,
                "summary": {
                    "total_driving_hours": max([point.cumulative_driving_hours for point in route_details.duty_schedule], default=0),
                    "total_duty_hours": max([point.cumulative_duty_hours for point in route_details.duty_schedule], default=0),
                    "fuel_stops_count": len(route_details.fueling_stops),
                    "has_violations": len(route_details.violations) > 0
                }
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": f"Route calculation failed: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def logs(request):
    """
    Get duty schedule formatted as log sheet entries.
    
    Query parameters:
    - start_date: Start date for log sheet (optional, defaults to today)
    - end_date: End date for log sheet (optional, defaults to 7 days from start)
    """
    try:
        # Get query parameters
        start_date_str = request.GET.get('start_date')
        end_date_str = request.GET.get('end_date')
        
        # Parse dates or use defaults
        if start_date_str:
            start_date = datetime.fromisoformat(start_date_str)
        else:
            start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            
        if end_date_str:
            end_date = datetime.fromisoformat(end_date_str)
        else:
            end_date = start_date + timedelta(days=7)
        
        # Generate sample log sheet entries (in production, this would come from database)
        log_entries = generate_log_sheet_entries(start_date, end_date)
        
        return Response({
            "log_sheet": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "entries": log_entries
            }
        }, status=status.HTTP_200_OK)
        
    except ValueError as e:
        return Response(
            {"error": f"Invalid date format: {str(e)}"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return Response(
            {"error": f"Failed to generate log sheet: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def generate_log_sheet_entries(start_date, end_date):
    """
    Generate sample log sheet entries for demonstration.
    In production, this would query the database for actual duty records.
    """
    entries = []
    current_date = start_date
    
    while current_date <= end_date:
        # Generate sample entries for each day
        day_entries = [
            {
                "date": current_date.strftime("%Y-%m-%d"),
                "time_blocks": [
                    {
                        "start_time": "08:00",
                        "end_time": "12:00",
                        "status": "Driving",
                        "location": "Highway I-95",
                        "odometer_start": 125000,
                        "odometer_end": 125200,
                        "notes": "Route to pickup location"
                    },
                    {
                        "start_time": "12:00",
                        "end_time": "13:00",
                        "status": "On Duty",
                        "location": "Pickup Location",
                        "odometer_start": 125200,
                        "odometer_end": 125200,
                        "notes": "Loading cargo"
                    },
                    {
                        "start_time": "13:00",
                        "end_time": "17:00",
                        "status": "Driving",
                        "location": "Highway I-80",
                        "odometer_start": 125200,
                        "odometer_end": 125400,
                        "notes": "Route to dropoff location"
                    },
                    {
                        "start_time": "17:00",
                        "end_time": "18:00",
                        "status": "On Duty",
                        "location": "Dropoff Location",
                        "odometer_start": 125400,
                        "odometer_end": 125400,
                        "notes": "Unloading cargo"
                    },
                    {
                        "start_time": "18:00",
                        "end_time": "08:00",
                        "status": "Off Duty",
                        "location": "Rest Area",
                        "odometer_start": 125400,
                        "odometer_end": 125400,
                        "notes": "10-hour rest period"
                    }
                ],
                "daily_totals": {
                    "driving_hours": 8.0,
                    "on_duty_hours": 2.0,
                    "off_duty_hours": 14.0,
                    "total_miles": 400
                }
            }
        ]
        
        entries.extend(day_entries)
        current_date += timedelta(days=1)
    
    return entries
