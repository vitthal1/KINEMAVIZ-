import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '../types';

interface AnalysisChartsProps {
  data: ChartDataPoint[];
  label: string;
  color: string;
}

const AnalysisCharts: React.FC<AnalysisChartsProps> = ({ data, label, color }) => {
  return (
    <div className="h-48 w-full bg-slate-800/50 rounded-lg p-2 border border-slate-700">
      <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase ml-2">{label} vs Angle</h4>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="angle" 
            stroke="#94a3b8" 
            fontSize={10} 
            tickFormatter={(val) => Math.round(val * 180 / Math.PI) + '°'}
            type="number"
            domain={[0, Math.PI * 2]}
            allowDataOverflow
          />
          <YAxis stroke="#94a3b8" fontSize={10} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }}
            itemStyle={{ color: color }}
            labelFormatter={(val) => `Angle: ${(val * 180 / Math.PI).toFixed(0)}°`}
            formatter={(val: number) => [val.toFixed(1), label]}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2} 
            dot={false} 
            isAnimationActive={false} // Performance optimization for rapid updates
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalysisCharts;
