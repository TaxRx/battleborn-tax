import React from 'react';

interface BarSegment {
  id: string;
  name: string;
  value: number;
  color: string;
  percentage?: number; // For when you want to display a different percentage than the value
}

interface AppliedPercentageBarProps {
  segments: BarSegment[];
  totalValue?: number; // If provided, used for percentage calculations
  maxValue?: number; // Maximum value for the bar (default: 100)
  showPercentages?: boolean; // Whether to show percentage labels
  showLegend?: boolean; // Whether to show legend below
  height?: string; // CSS height value (default: '2rem')
  title?: string; // Optional title above the bar
  subtitle?: string; // Optional subtitle
  normalizeToWidth?: boolean; // If true, normalize segments to fill full width regardless of total
  showUnused?: boolean; // Whether to show unused portion when total < maxValue
  className?: string; // Additional CSS classes
}

export const AppliedPercentageBar: React.FC<AppliedPercentageBarProps> = ({
  segments,
  totalValue,
  maxValue = 100,
  showPercentages = true,
  showLegend = true,
  height = '2rem',
  title,
  subtitle,
  normalizeToWidth = false,
  showUnused = true,
  className = ''
}) => {
  // Calculate total if not provided
  const calculatedTotal = totalValue ?? segments.reduce((sum, seg) => sum + seg.value, 0);
  
  // Determine if we should normalize the display
  const shouldNormalize = normalizeToWidth || calculatedTotal > maxValue;
  
  // Calculate display segments
  const displaySegments = segments.map(segment => {
    let displayWidth: number;
    let displayPercentage: number;
    
    if (shouldNormalize && calculatedTotal > 0) {
      // Normalize: segments fill the entire bar proportionally
      displayWidth = (segment.value / calculatedTotal) * 100;
      displayPercentage = segment.percentage ?? ((segment.value / maxValue) * 100);
    } else {
      // Absolute: segments show their actual percentage of maxValue
      displayWidth = Math.min((segment.value / maxValue) * 100, 100);
      displayPercentage = segment.percentage ?? ((segment.value / maxValue) * 100);
    }
    
    return {
      ...segment,
      displayWidth,
      displayPercentage
    };
  });
  
  // Calculate unused portion
  const unusedPercentage = Math.max(0, maxValue - calculatedTotal);
  const showUnusedSegment = showUnused && unusedPercentage > 0 && !shouldNormalize;
  const unusedWidth = showUnusedSegment ? (unusedPercentage / maxValue) * 100 : 0;
  
  // Format percentage for display
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className={`applied-percentage-bar-container ${className}`}>
      {/* Title and subtitle */}
      {title && (
        <div className="flex items-center justify-between mb-3">
          <div>
            {title && <h4 className="text-sm font-semibold text-gray-900">{title}</h4>}
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              {formatPercentage(calculatedTotal > maxValue ? maxValue : calculatedTotal)}
            </div>
            <div className="text-xs text-gray-500">
              {calculatedTotal > maxValue && (
                <span className="text-red-600">⚠️ Exceeds {formatPercentage(maxValue)}</span>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Progress bar */}
      <div 
        className="relative w-full bg-gray-200 rounded-lg overflow-hidden"
        style={{ height }}
      >
        {/* Segments */}
        {displaySegments.map((segment, index) => (
          <div
            key={segment.id}
            className="absolute h-full flex items-center justify-center transition-all duration-300 hover:opacity-80"
            style={{
              left: `${displaySegments.slice(0, index).reduce((sum, s) => sum + s.displayWidth, 0)}%`,
              width: `${segment.displayWidth}%`,
              backgroundColor: segment.color
            }}
            title={`${segment.name}: ${formatPercentage(segment.displayPercentage)}`}
          >
            {segment.displayWidth > 8 && showPercentages && (
              <span className="text-xs font-medium text-white px-1 truncate">
                {segment.name} ({formatPercentage(segment.displayPercentage)})
              </span>
            )}
          </div>
        ))}
        
        {/* Unused portion */}
        {showUnusedSegment && (
          <div
            className="absolute h-full bg-gray-300 flex items-center justify-center"
            style={{
              left: `${displaySegments.reduce((sum, s) => sum + s.displayWidth, 0)}%`,
              width: `${unusedWidth}%`
            }}
            title={`Unused: ${formatPercentage(unusedPercentage)}`}
          >
            {unusedWidth > 8 && showPercentages && (
              <span className="text-xs font-medium text-gray-600 px-1">
                Unused ({formatPercentage(unusedPercentage)})
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          {displaySegments.map((segment) => (
            <div key={segment.id} className="flex items-center space-x-2">
              <span 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-sm text-gray-800 font-medium">{segment.name}</span>
              <span className="text-xs text-gray-500">
                ({formatPercentage(segment.displayPercentage)})
              </span>
            </div>
          ))}
          {showUnusedSegment && (
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-gray-300" />
              <span className="text-sm text-gray-800 font-medium">Unused</span>
              <span className="text-xs text-gray-500">
                ({formatPercentage(unusedPercentage)})
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Utility function to generate consistent colors for segments
export const generateSegmentColors = (count: number): string[] => {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green  
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#f97316', // orange
    '#ec4899', // pink
    '#84cc16', // lime
    '#6366f1', // indigo
    '#14b8a6', // teal
    '#f43f5e', // rose
  ];
  
  // Repeat colors if we need more than available
  return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
};

// Default export
export default AppliedPercentageBar; 