import React from 'react';
import type { LogEntry } from '../utils/api';

interface LogSheetProps {
  entries: LogEntry[];
  startDate: string;
  endDate: string;
}

const LogSheet: React.FC<LogSheetProps> = ({ entries, startDate, endDate }) => {
  // FMCSA duty status colors
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

  // FMCSA duty status order (top to bottom)
  const dutyStatuses = ['Off Duty', 'Sleeper', 'Driving', 'On Duty'];
  
  // Grid dimensions
  const GRID_WIDTH = 1200;
  const GRID_HEIGHT = 200;
  const HOUR_WIDTH = GRID_WIDTH / 24;
  const STATUS_HEIGHT = GRID_HEIGHT / 4;
  const DAY_HEIGHT = GRID_HEIGHT + 100; // Extra space for day labels and totals

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM format
  };

  const parseTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours + minutes / 60;
  };

  const getStatusRowIndex = (status: string) => {
    return dutyStatuses.indexOf(status);
  };

  const calculateXPosition = (timeString: string) => {
    const hours = parseTime(timeString);
    return (hours / 24) * GRID_WIDTH;
  };

  const calculateWidth = (startTime: string, endTime: string) => {
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    const rawDuration = end - start;
    const duration = rawDuration >= 0 ? rawDuration : (24 - start) + end; // handle wrap past midnight
    return (duration / 24) * GRID_WIDTH;
  };

  const getRemarkType = (notes: string) => {
    const note = notes.toLowerCase();
    if (note.includes('pickup')) return 'pickup';
    if (note.includes('fuel')) return 'fueling';
    if (note.includes('rest')) return 'rest';
    if (note.includes('dropoff')) return 'dropoff';
    return 'other';
  };

  // Render the 24-hour time grid (midnight to midnight)
  const renderTimeGrid = () => {
    const hours = Array.from({ length: 25 }, (_, i) => i);

    return (
      <g>
        {/* Hour vertical grid lines */}
        {hours.map(hour => (
          <line
            key={hour}
            x1={hour * HOUR_WIDTH}
            y1={0}
            x2={hour * HOUR_WIDTH}
            y2={GRID_HEIGHT}
            stroke={hour % 6 === 0 ? '#cbd5e1' : '#e5e7eb'}
            strokeWidth={hour % 6 === 0 ? 1.5 : 1}
          />
        ))}

        {/* Baseline at top and bottom */}
        <line x1={0} y1={0} x2={GRID_WIDTH} y2={0} stroke="#d1d5db" strokeWidth="1" />
        <line x1={0} y1={GRID_HEIGHT} x2={GRID_WIDTH} y2={GRID_HEIGHT} stroke="#d1d5db" strokeWidth="1" />

        {/* Hour labels at bottom to prevent overlap */}
        {hours.map(hour => (
          <text
            key={`label-${hour}`}
            x={hour * HOUR_WIDTH}
            y={GRID_HEIGHT + 12}
            textAnchor="middle"
            fontSize="10"
            fill="#6b7280"
          >
            {hour === 0 ? '12AM' :
             hour < 12 ? `${hour}AM` :
             hour === 12 ? '12PM' :
             `${hour - 12}PM`}
          </text>
        ))}
      </g>
    );
  };

  // Render duty status rows
  const renderStatusRows = () => {
    return (
      <g>
        {dutyStatuses.map((status, index) => (
          <g key={status}>
            {/* Status row background */}
            <rect
              x={0}
              y={index * STATUS_HEIGHT}
              width={GRID_WIDTH}
              height={STATUS_HEIGHT}
              fill={index % 2 === 0 ? '#f9fafb' : '#ffffff'}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            
            {/* Status label */}
            <text
              x={-10}
              y={index * STATUS_HEIGHT + STATUS_HEIGHT / 2 + 4}
              textAnchor="end"
              fontSize="12"
              fontWeight="bold"
              fill="#374151"
            >
              {status}
            </text>
          </g>
        ))}
      </g>
    );
  };

  // Render duty period line segments
  const renderDutyPeriods = (entry: LogEntry, dayIndex: number) => {
    return (
      <g key={`periods-${dayIndex}`}>
        {entry.time_blocks.map((block, blockIndex) => {
          const start = parseTime(block.start_time);
          const end = parseTime(block.end_time);
          const statusIndex = getStatusRowIndex(block.status);
          const y = statusIndex * STATUS_HEIGHT;
          const color = getStatusColor(block.status);
          const remarkType = getRemarkType(block.notes);

          const segments: Array<{ x: number; width: number }> = [];
          if (end >= start) {
            // Same-day segment
            const x = calculateXPosition(block.start_time);
            const width = calculateWidth(block.start_time, block.end_time);
            segments.push({ x, width });
          } else {
            // Wraps past midnight: split into two segments
            const firstX = calculateXPosition(block.start_time);
            const firstWidth = (24 - start) / 24 * GRID_WIDTH;
            const secondX = calculateXPosition('00:00');
            const secondWidth = end / 24 * GRID_WIDTH;
            segments.push({ x: firstX, width: firstWidth });
            segments.push({ x: secondX, width: secondWidth });
          }

          return (
            <g key={`${dayIndex}-${blockIndex}`}>
              {segments.map((seg, i) => (
                <g key={i}>
                  <rect
                    x={seg.x}
                    y={y + 2}
                    width={Math.max(seg.width, 2)}
                    height={STATUS_HEIGHT - 4}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth="1"
                    rx="1"
                  />
                  {seg.width > 40 && (
                    <text
                      x={seg.x + seg.width / 2}
                      y={y + STATUS_HEIGHT / 2 + 4}
                      textAnchor="middle"
                      fontSize="9"
                      fill="white"
                      fontWeight="bold"
                    >
                      {formatTime(block.start_time)}-{formatTime(block.end_time)}
                    </text>
                  )}
                </g>
              ))}

              {remarkType !== 'other' && (
                <circle
                  cx={calculateXPosition(block.start_time) + Math.max(calculateWidth(block.start_time, block.end_time), 2) / 2}
                  cy={y + STATUS_HEIGHT - 8}
                  r="3"
                  fill="#fbbf24"
                  stroke="#ffffff"
                  strokeWidth="1"
                />
              )}
            </g>
          );
        })}
      </g>
    );
  };

  // Render day header with date and totals
  const renderDayHeader = (entry: LogEntry, dayIndex: number) => {
    const dayY = dayIndex * DAY_HEIGHT;
    
    return (
      <g key={`header-${dayIndex}`}>
        {/* Day background */}
        <rect
          x={-120}
          y={dayY}
          width={120}
          height={GRID_HEIGHT}
          fill="#f3f4f6"
          stroke="#e5e7eb"
          strokeWidth="1"
        />
        
        {/* Date */}
        <text
          x={-60}
          y={dayY + 25}
          textAnchor="middle"
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
        
        {/* Daily totals */}
        <text
          x={-60}
          y={dayY + 45}
          textAnchor="middle"
          fontSize="10"
          fill="#6b7280"
        >
          {entry.daily_totals.driving_hours}h driving
        </text>
        <text
          x={-60}
          y={dayY + 60}
          textAnchor="middle"
          fontSize="10"
          fill="#6b7280"
        >
          {entry.daily_totals.on_duty_hours}h on duty
        </text>
        <text
          x={-60}
          y={dayY + 75}
          textAnchor="middle"
          fontSize="10"
          fill="#6b7280"
        >
          {entry.daily_totals.total_miles}mi
        </text>
        
        {/* Odometer readings */}
        <text
          x={-60}
          y={dayY + 95}
          textAnchor="middle"
          fontSize="9"
          fill="#9ca3af"
        >
          Start: {entry.time_blocks[0]?.odometer_start || 0}
        </text>
        <text
          x={-60}
          y={dayY + 110}
          textAnchor="middle"
          fontSize="9"
          fill="#9ca3af"
        >
          End: {entry.time_blocks[entry.time_blocks.length - 1]?.odometer_end || 0}
        </text>
      </g>
    );
  };

  // Render remarks section
  const renderRemarks = (entry: LogEntry, dayIndex: number) => {
    const dayY = dayIndex * DAY_HEIGHT;
    const baseY = dayY + GRID_HEIGHT; // bottom of grid

    const remarks = entry.time_blocks
      .filter(block => getRemarkType(block.notes) !== 'other')
      .map(block => ({
        time: block.start_time,
        type: getRemarkType(block.notes),
        location: block.location,
        notes: block.notes,
      }));

    return (
      <g key={`remarks-${dayIndex}`}>
        {/* Label */}
        <text x={0} y={baseY + 10} fontSize="10" fontWeight="bold" fill="#374151">Remarks:</text>

        {remarks.map((remark, index) => {
          const x = calculateXPosition(remark.time);
          const vY1 = baseY;           // start at grid bottom
          const vY2 = baseY + 18;      // vertical drop
          const dir = -1; // always orient to left
          const hX = x + dir * 60;
          const hY = vY2 + 18;
          const anchor = 'end';
          const label = `${remark.type.toUpperCase()}: ${remark.location}`;

          return (
            <g key={index}>
              {/* Leader lines */}
              <line x1={x} y1={vY1} x2={x} y2={vY2} stroke="#9ca3af" strokeWidth="1" />
              <line x1={x} y1={vY2} x2={hX} y2={hY} stroke="#9ca3af" strokeWidth="1" />
              {/* Dot marker */}
              <circle cx={x} cy={vY1 - 2} r="2" fill="#fbbf24" />
              {/* Text */}
              <text x={hX} y={hY + 10} textAnchor={anchor} fontSize="9" fill="#6b7280">
                {label}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  // Render legend with remark indicators
  const renderLegend = () => {
    const statuses = [
      { name: 'Driving', color: '#3b82f6' },
      { name: 'On Duty', color: '#10b981' },
      { name: 'Sleeper', color: '#8b5cf6' },
      { name: 'Off Duty', color: '#6b7280' },
    ];

    const remarks = [
      { name: 'Pickup', color: '#fbbf24' },
      { name: 'Fueling', color: '#fbbf24' },
      { name: 'Rest', color: '#fbbf24' },
      { name: 'Dropoff', color: '#fbbf24' },
    ];

    return (
      <div className="mt-6 space-y-4">
        {/* Duty Status Legend */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Duty Status</h4>
          <div className="flex flex-wrap gap-4">
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
        </div>
        
        {/* Remarks Legend */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Remarks</h4>
          <div className="flex flex-wrap gap-4">
            {remarks.map(remark => (
              <div key={remark.name} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: remark.color }}
                ></div>
                <span className="text-sm text-gray-700">{remark.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (entries.length === 0) {
    return (
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">FMCSA Duty Log Sheet</h3>
        <div className="text-center py-8 text-gray-500">
          No log entries available. Calculate a route to see the duty schedule.
        </div>
      </div>
    );
  }

  const totalHeight = entries.length * DAY_HEIGHT + 50;

  return (
    <div className="card">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        FMCSA Duty Log Sheet ({startDate} - {endDate})
      </h3>
      
      <div className="overflow-x-auto">
        <svg
          width="100%"
          height={totalHeight}
          viewBox={`-130 0 ${GRID_WIDTH + 20} ${totalHeight}`}
          className="border border-gray-200 rounded-lg bg-white"
        >
          {/* Render each day */}
          {entries.map((entry, dayIndex) => (
            <g key={dayIndex}>
              {/* Day header with date and totals */}
              {renderDayHeader(entry, dayIndex)}
              
              {/* Time grid for this day */}
              <g transform={`translate(0, ${dayIndex * DAY_HEIGHT})`}>
                {renderTimeGrid()}
                {renderStatusRows()}
                {renderDutyPeriods(entry, dayIndex)}
              </g>
              
              {/* Remarks for this day */}
              {renderRemarks(entry, dayIndex)}
            </g>
          ))}
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
