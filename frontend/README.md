# Trip ELD Navigator - Frontend

A React TypeScript frontend application for the Trip ELD Navigator, providing HOS-compliant route planning and duty log management for commercial drivers.

## Features

- **Trip Planning**: Input form for current location, pickup, dropoff, and cycle hours
- **Interactive Map**: Leaflet-powered map showing route, stops, and fueling locations
- **Duty Log Sheets**: SVG-rendered log sheets with time blocks and status tracking
- **Trip Summary**: Comprehensive overview of route details and HOS compliance
- **Real-time Updates**: Live communication with Django backend API

## Tech Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **TailwindCSS** for styling
- **Leaflet** for interactive maps
- **Axios** for API communication

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── TripForm.tsx     # Trip input form
│   │   ├── MapView.tsx      # Interactive map component
│   │   ├── LogSheet.tsx     # Duty log sheet renderer
│   │   └── Summary.tsx      # Trip summary display
│   ├── pages/               # Page components
│   │   └── Home.tsx         # Main application page
│   ├── utils/               # Utility functions
│   │   └── api.ts           # Backend API communication
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles with TailwindCSS
├── public/                  # Static assets
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # TailwindCSS configuration
├── postcss.config.js        # PostCSS configuration
└── vite.config.ts           # Vite configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on http://127.0.0.1:8000

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   Navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Components

### TripForm
- Input validation for trip details
- Real-time form validation
- Loading states and error handling
- Success feedback with route summary

### MapView
- Interactive Leaflet map
- Route visualization with polylines
- Custom markers for different location types
- Responsive design with legend

### LogSheet
- SVG-rendered duty log sheets
- Time block visualization
- Status color coding
- Daily totals table
- ELD-compliant format

### Summary
- Route overview with key metrics
- HOS compliance status
- Fueling stops list
- Detailed duty schedule
- Violation alerts

## API Integration

The frontend communicates with the Django backend through the `utils/api.ts` service:

- **Health Check**: `GET /api/health/`
- **Trip Route**: `POST /api/route/`
- **Log Sheets**: `GET /api/logs/`

## Styling

The application uses TailwindCSS with custom design system:

- **Primary Colors**: Blue theme for main actions
- **Secondary Colors**: Gray theme for neutral elements
- **Status Colors**: 
  - Driving: Blue
  - On Duty: Green
  - Sleeper: Purple
  - Off Duty: Gray

## Development

### Adding New Components

1. Create component in `src/components/`
2. Export from component file
3. Import and use in parent components
4. Add TypeScript interfaces for props

### API Integration

1. Add new API functions to `utils/api.ts`
2. Define TypeScript interfaces for request/response
3. Use in components with proper error handling

### Styling

1. Use TailwindCSS utility classes
2. Add custom styles in `index.css` if needed
3. Follow design system color scheme
4. Ensure responsive design

## Production Build

```bash
npm run build
```

The build output will be in the `dist/` directory, ready for deployment to any static hosting service.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

This project is part of the Trip ELD Navigator application.