import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface GriftometerProps {
  score: number;
}

export const Griftometer: React.FC<GriftometerProps> = ({ score }) => {
  // Gauge Data: 100 - score (clean), score (risk)
  // We want a semi-circle, so we need a dummy bottom half or start/end angles.
  // Using startAngle 180, endAngle 0 for top half.
  
  const data = [
    { name: 'Risk', value: score },
    { name: 'Clean', value: 100 - score },
  ];

  // Color interpolation based on score
  const getColor = (s: number) => {
    if (s < 30) return '#00ff41'; // Green
    if (s < 60) return '#ff9900'; // Orange
    return '#ff3b30'; // Red
  };

  const activeColor = getColor(score);

  return (
    <div className="bg-terminal-dark border border-terminal-border rounded-lg p-6 relative h-full flex flex-col">
      <h3 className="text-lg font-mono font-bold text-gray-300 mb-4 border-b border-gray-800 pb-2 flex justify-between">
        GRIFTOMETER
        <span className="text-xs text-gray-500 self-center">CORRUPTION RISK INDEX</span>
      </h3>
      
      <div className="flex-1 flex flex-col items-center justify-center relative min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="80%" // Move down to make it look like a gauge on the bottom
              startAngle={180}
              endAngle={0}
              innerRadius={80}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              <Cell key="risk" fill={activeColor} />
              <Cell key="clean" fill="#333" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text overlay */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
            <div className="text-4xl font-mono font-bold" style={{ color: activeColor }}>
                {score}/100
            </div>
            <div className="text-xs text-gray-400 font-mono mt-1">RISK LEVEL</div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-xs font-mono text-gray-500">
            <span>LOW RISK</span>
            <span>HIGH RISK</span>
        </div>
        <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
            <div 
                className="h-full transition-all duration-1000 ease-out" 
                style={{ width: `${score}%`, backgroundColor: activeColor }}
            />
        </div>
      </div>
    </div>
  );
};
