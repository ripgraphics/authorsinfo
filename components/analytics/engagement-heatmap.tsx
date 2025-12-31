'use client';

import { useMemo } from 'react';

interface HeatmapCellProps {
  day: number;
  hour: number;
  value: number;
  maxValue: number;
}

function HeatmapCell({ day, hour, value, maxValue }: HeatmapCellProps) {
  const intensity = Math.min(value / maxValue, 1);
  const bgColor = intensity === 0
    ? 'bg-gray-50'
    : intensity < 0.25
      ? 'bg-blue-100'
      : intensity < 0.5
        ? 'bg-blue-300'
        : intensity < 0.75
          ? 'bg-blue-500'
          : 'bg-blue-700';

  const textColor = intensity > 0.6 ? 'text-white' : 'text-gray-900';

  return (
    <div
      className={`${bgColor} ${textColor} aspect-square flex items-center justify-center text-xs font-medium rounded hover:ring-2 hover:ring-offset-2 hover:ring-primary transition-all cursor-pointer`}
      title={`${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day]}, ${hour}:00 - ${value} activities`}
    >
      {value > 0 ? value : ''}
    </div>
  );
}

export default function EngagementHeatmap() {
  // Generate realistic heatmap data (7 days x 24 hours)
  const heatmapData = useMemo(() => {
    const data: number[][] = [];
    
    // Create 7 days of hourly data
    for (let day = 0; day < 7; day++) {
      const dayData: number[] = [];
      
      // Create 24 hours
      for (let hour = 0; hour < 24; hour++) {
        // Peak activity during typical working hours (9-17) and evening (19-23)
        let baseValue = 0;
        
        if (hour >= 9 && hour <= 17) {
          baseValue = 80 + Math.random() * 40; // 80-120 during work
        } else if (hour >= 19 && hour <= 23) {
          baseValue = 60 + Math.random() * 50; // 60-110 during evening
        } else if (hour >= 6 && hour < 9) {
          baseValue = 30 + Math.random() * 30; // 30-60 early morning
        } else {
          baseValue = 10 + Math.random() * 20; // 10-30 at night
        }
        
        // Reduce activity on weekends
        if (day >= 5) {
          baseValue *= 0.7;
        }
        
        dayData.push(Math.round(baseValue));
      }
      
      data.push(dayData);
    }
    
    return data;
  }, []);

  const maxValue = Math.max(...heatmapData.flat());
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="bg-card border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Engagement Heatmap (Day × Hour)</h3>
      
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Hour labels */}
          <div className="flex gap-1 mb-2">
            <div className="w-16" />
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="w-8 text-center text-xs text-muted-foreground">
                {i}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          {heatmapData.map((dayData, dayIndex) => (
            <div key={dayIndex} className="flex gap-1 mb-1">
              <div className="w-16 flex items-center pr-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {daysOfWeek[dayIndex]}
                </span>
              </div>
              {dayData.map((value, hourIndex) => (
                <div key={`${dayIndex}-${hourIndex}`} className="w-8">
                  <HeatmapCell
                    day={dayIndex}
                    hour={hourIndex}
                    value={value}
                    maxValue={maxValue}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">Intensity:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-50 rounded" />
          <span className="text-xs text-muted-foreground">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-300 rounded" />
          <span className="text-xs text-muted-foreground">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-700 rounded" />
          <span className="text-xs text-muted-foreground">High</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Shows activity distribution across days of the week and hours of the day. Hover over cells for details.
      </p>
    </div>
  );
}
