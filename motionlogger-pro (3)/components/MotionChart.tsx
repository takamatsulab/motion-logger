
import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { MotionSample } from '../types';

interface MotionChartProps {
  data: MotionSample[];
}

const MotionChart: React.FC<MotionChartProps> = ({ data }) => {
  // We only show the last 50 points to keep the UI smooth
  const displayData = data.slice(-50).map((d, i) => ({
    ...d,
    index: i
  }));

  return (
    <div className="w-full h-64 bg-white rounded-xl shadow-sm border border-slate-200 p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={displayData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="index" hide />
          <YAxis domain={[-20, 20]} fontSize={12} stroke="#64748b" />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
          <Line 
            type="monotone" 
            dataKey="x" 
            stroke="#ef4444" 
            strokeWidth={2} 
            dot={false} 
            isAnimationActive={false} 
            name="X軸"
          />
          <Line 
            type="monotone" 
            dataKey="y" 
            stroke="#22c55e" 
            strokeWidth={2} 
            dot={false} 
            isAnimationActive={false} 
            name="Y軸"
          />
          <Line 
            type="monotone" 
            dataKey="z" 
            stroke="#3b82f6" 
            strokeWidth={2} 
            dot={false} 
            isAnimationActive={false} 
            name="Z軸"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MotionChart;
