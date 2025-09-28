from rest_framework import serializers


class HealthSerializer(serializers.Serializer):
    """
    Serializer for health check response.
    """
    status = serializers.CharField(max_length=10)


class HOSRouteSerializer(serializers.Serializer):
    """
    Serializer for HOS route calculation request.
    """
    current_location = serializers.CharField(max_length=200)
    pickup_location = serializers.CharField(max_length=200)
    dropoff_location = serializers.CharField(max_length=200)
    current_cycle_used = serializers.FloatField(min_value=0.0, max_value=70.0)


class TripInputSerializer(serializers.Serializer):
    """
    Serializer for trip input request.
    """
    current_location = serializers.CharField(max_length=200)
    pickup_location = serializers.CharField(max_length=200)
    dropoff_location = serializers.CharField(max_length=200)
    cycle_hours = serializers.FloatField(min_value=0.0, max_value=70.0)
