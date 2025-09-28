import React from 'react';
import type { LogEntry, TimeBlock } from '../utils/api';

interface LogSheetProps {
  entries: LogEntry[];
  startDate: string;
  endDate: string;
}

const LogSheet: React.FC<LogSheetProps> = ({ entries, startDate, endDate }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Driving':
        return '#3b82f6'; // Blue
      case 'On Duty':
        return '#10b981'; // Green
      case 'Sleeper':
        return '#8b5cf6'; // Purple
      case 'Off Duty':
        return '#6b7280'; // Gray
      default:
        return '#d1d5db'; // Light gray
    }
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM format
  };

  const calculateBlockWidth = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // hours
    return (duration / 24) * 100; // percentage of day
  };

  const calculateBlockX = (startTime: string) => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const hours = start.getHours() + start.getMinutes() / 60;
    return (hours / 24) * 100; // percentage of day
  };

  const renderTimeBlock = (block: TimeBlock, dayIndex: number, blockIndex: number) => {
    const width = calculateBlockWidth(block.start_time, block.end_time);
    const x = calculateBlockX(block.start_time);
    const color = getStatusColor(block.status);

    return (
      <g key={`${dayIndex}-${blockIndex}`}>
        <rect
          x={`${x}%`}
          y={dayIndex * 60 + 10}
          width={`${width}%`}
          height="40"
          fill={color}
          stroke="#ffffff"
          strokeWidth="1"
          rx="2"
        />
        <text
          x={`${x + width / 2}%`}
          y={dayIndex * 60 + 30}
          textAnchor="middle"
          fontSize="10"
          fill="white"
          fontWeight="bold"
        >
          {block.status}
        </text>
        <text
          x={`${x + width / 2}%`}
          y={dayIndex * 60 + 45}
          textAnchor="middle"
          fontSize="8"
          fill="white"
        >
          {formatTime(block.start_time)}-{formatTime(block.end_time)}
        </text>
      </g>
    );
  };

  const renderTimeAxis = () => {
    const hours = Array.from({ length: 25 }, (_, i) => i);
    return (
      <g>
        {hours.map(hour => (
          <g key={hour}>
            <line
              x1={`${(hour / 24) * 100}%`}
              y1="0"
              x2={`${(hour / 24) * 100}%`}
              y2={entries.length * 60}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            <text
              x={`${(hour / 24) * 100}%`}
              y="-5"
              textAnchor="middle"
              fontSize="10"
              fill="#6b7280"
            >
              {hour % 24 === 0 ? '12AM' : hour < 12 ? `${hour}AM` : hour === 12 ? '12PM' : `${hour - 12}PM`}
            </text>
          </g>
        ))}
      </g>
    );
  };

  const renderDayLabels = () => {
    return (
      <g>
        {entries.map((entry, index) => (
          <g key={index}>
            <rect
              x="0"
              y={index * 60}
              width="100"
              height="60"
              fill="#f9fafb"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            <text
              x="10"
              y={index * 60 + 20}
              fontSize="12"
              fontWeight="bold"
              fill="#374151"
            >
              {new Date(entry.date).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </text>
            <text
              x="10"
              y={index * 60 + 35}
              fontSize="10"
              fill="#6b7280"
            >
              {entry.daily_totals.driving_hours}h driving
            </text>
            <text
              x="10"
              y={index * 60 + 50}
              fontSize="10"
              fill="#6b7280"
            >
              {entry.daily_totals.total_miles}mi
            </text>
          </g>
        ))}
      </g>
    );
  };

  const renderLegend = () => {
    const statuses = [
      { name: 'Driving', color: '#3b82f6' },
      { name: 'On Duty', color: '#10b981' },
      { name: 'Sleeper', color: '#8b5cf6' },
      { name: 'Off Duty', color: '#6b7280' },
    ];

    return (
      <div className="flex flex-wrap gap-4 mt-4">
        {statuses.map(status => (
          <div key={status.name} className="flex items-center space-x-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: status.color }}
            ></div>
            <span className="text-sm text-gray-700">{status.name}</span>
          </div>
        ))}
      </div>
    );
  };

  if (entries.length === 0) {
    return (
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Duty Log Sheet</h3>
        <div className="text-center py-8 text-gray-500">
          No log entries available. Calculate a route to see the duty schedule.
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Duty Log Sheet ({startDate} - {endDate})
      </h3>
      
      <div className="overflow-x-auto">
        <svg
          width="100%"
          height={entries.length * 60 + 50}
          viewBox={`0 0 1000 ${entries.length * 60 + 50}`}
          className="border border-gray-200 rounded-lg"
        >
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="41.67" height="60" patternUnits="userSpaceOnUse">
              <path d="M 41.67 0 L 0 0 0 60" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Time axis */}
          {renderTimeAxis()}
          
          {/* Day labels */}
          {renderDayLabels()}
          
          {/* Time blocks */}
          {entries.map((entry, dayIndex) =>
            entry.time_blocks.map((block, blockIndex) =>
              renderTimeBlock(block, dayIndex, blockIndex)
            )
          )}
        </svg>
      </div>
      
      {renderLegend()}
      
      {/* Summary table */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Driving Hours
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                On Duty Hours
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Off Duty Hours
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Miles
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.map((entry, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {new Date(entry.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.daily_totals.driving_hours}h
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.daily_totals.on_duty_hours}h
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.daily_totals.off_duty_hours}h
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.daily_totals.total_miles}mi
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LogSheet;
