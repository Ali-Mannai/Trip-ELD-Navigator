# Trip-ELD-Navigator

A Django REST Framework API backend for the Trip ELD Navigator application.

## Project Structure

```
Trip-ELD-Navigator/
├── backend/                 # Django project
│   ├── backend/            # Django settings and configuration
│   │   ├── __init__.py
│   │   ├── settings.py     # Django settings with DRF and CORS
│   │   ├── urls.py         # Main URL configuration
│   │   ├── wsgi.py         # WSGI configuration for deployment
│   │   └── asgi.py         # ASGI configuration
│   ├── api/                # Django REST Framework API app
│   │   ├── __init__.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── views.py        # API views
│   │   ├── urls.py         # API URL patterns
│   │   ├── serializers.py  # DRF serializers
│   │   ├── admin.py
│   │   └── tests.py
│   └── manage.py           # Django management script
├── requirements.txt        # Python dependencies
├── Procfile               # Render deployment configuration
└── .gitignore            # Git ignore file
```

## Setup Instructions

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)

### Installation

1. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

4. **Run database migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Create a superuser (optional):**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start the development server:**
   ```bash
   python manage.py runserver
   ```

The API will be available at `http://127.0.0.1:8000/`

## API Endpoints

### Health Check
- **GET** `/api/health/`
- **Response:** `{"status": "ok"}`

### HOS Route Calculation
- **POST** `/api/calculate-route/`
- **Request Body:**
  ```json
  {
    "current_location": "New York, NY",
    "pickup_location": "Los Angeles, CA", 
    "dropoff_location": "Chicago, IL",
    "current_cycle_used": 2.5
  }
  ```
- **Response:**
  ```json
  {
    "total_distance": 2500.0,
    "total_time": 45.5,
    "fueling_stops": [
      {
        "name": "Fuel Stop at 37.25, -95.50",
        "latitude": 37.25,
        "longitude": -95.50
      }
    ],
    "duty_schedule": [
      {
        "location": "New York, NY",
        "arrival_time": "2024-01-01T08:00:00",
        "departure_time": "2024-01-01T08:00:00",
        "status": "Off Duty",
        "miles_from_start": 0.0,
        "cumulative_driving_hours": 2.5,
        "cumulative_duty_hours": 2.5
      }
    ],
    "violations": []
  }
  ```

### Trip Route Planning
- **POST** `/api/route/`
- **Request Body:**
  ```json
  {
    "current_location": "New York, NY",
    "pickup_location": "Los Angeles, CA", 
    "dropoff_location": "Chicago, IL",
    "cycle_hours": 2.5
  }
  ```
- **Response:**
  ```json
  {
    "route": {
      "total_distance": 2500.0,
      "total_time": 45.5,
      "fueling_stops": [
        {
          "name": "Fuel Stop at 37.25, -95.50",
          "latitude": 37.25,
          "longitude": -95.50
        }
      ]
    },
    "duty_schedule": [
      {
        "location": "New York, NY",
        "arrival_time": "2024-01-01T08:00:00",
        "departure_time": "2024-01-01T08:00:00",
        "status": "Off Duty",
        "miles_from_start": 0.0,
        "cumulative_driving_hours": 2.5,
        "cumulative_duty_hours": 2.5
      }
    ],
    "violations": [],
    "summary": {
      "total_driving_hours": 8.0,
      "total_duty_hours": 10.0,
      "fuel_stops_count": 2,
      "has_violations": false
    }
  }
  ```

### Duty Log Sheets
- **GET** `/api/logs/`
- **Query Parameters:**
  - `start_date`: Start date for log sheet (optional, defaults to today)
  - `end_date`: End date for log sheet (optional, defaults to 7 days from start)
- **Example:** `GET /api/logs/?start_date=2024-01-01&end_date=2024-01-07`
- **Response:**
  ```json
  {
    "log_sheet": {
      "start_date": "2024-01-01T00:00:00",
      "end_date": "2024-01-07T00:00:00",
      "entries": [
        {
          "date": "2024-01-01",
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
    }
  }
  ```

## Deployment on Render

This project is configured for deployment on Render with the following files:

- `Procfile`: Specifies the command to run the application
- `requirements.txt`: Lists all Python dependencies
- `backend/settings.py`: Configured with production-ready settings

### Deploy to Render

1. Push your code to a Git repository
2. Connect the repository to Render
3. Render will automatically detect the Django project and use the Procfile
4. The application will be deployed and accessible via the provided URL

## HOS Logic Features

The `hos_logic.py` module implements comprehensive FMCSA Hours of Service rules:

### FMCSA Rules Implemented
- **11-Hour Driving Limit**: Maximum 11 hours driving in a 14-hour work window
- **14-Hour Duty Limit**: Maximum 14 hours on duty in a 14-hour window
- **30-Minute Break**: Required after 8 hours of driving
- **10-Hour Off-Duty**: Required after 11 hours driving or 14 hours duty
- **70-Hour/8-Day Rule**: Maximum 70 hours on duty in any 8-day period
- **Fueling Stops**: Automatic stops every 1000 miles for refueling
- **Pickup/Drop-off Time**: 1 hour each for loading/unloading operations

### Route Calculation Features
- **Distance Calculation**: Uses Haversine formula for accurate distance between coordinates
- **Time Estimation**: Calculates driving time based on 55 mph average speed
- **Duty Status Tracking**: Tracks Driving, On Duty, Sleeper, and Off Duty statuses
- **Violation Detection**: Identifies HOS violations and provides detailed error messages
- **Schedule Generation**: Creates detailed duty schedule with timestamps and locations

### Data Models
- **Location**: Represents geographical coordinates with name, latitude, longitude
- **RoutePoint**: Individual points along the route with timing and status information
- **RouteDetails**: Complete route information including distance, time, stops, and violations

## Configuration

### CORS Settings
The project is configured to allow cross-origin requests from:
- `http://localhost:3000` (React development server)
- `http://127.0.0.1:3000`
- Any other origins specified in `CORS_ALLOWED_ORIGINS`

### Security Notes
- Change the `SECRET_KEY` in production
- Set `DEBUG = False` in production
- Configure proper `ALLOWED_HOSTS` for production
- Use environment variables for sensitive settings

## Development

### Adding New API Endpoints

1. Create views in `backend/api/views.py`
2. Add URL patterns in `backend/api/urls.py`
3. Create serializers in `backend/api/serializers.py` if needed
4. Add models in `backend/api/models.py` if needed

### Running Tests
```bash
python manage.py test
```

### Database Management
```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Access Django admin
python manage.py runserver
# Then visit http://127.0.0.1:8000/admin/
```
A full-stack Django-React app that takes truck trip inputs (locations, hours used) and generates optimized routes with maps, rest stops, and automated ELD daily log sheets for HOS compliance.
