import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Bar,
  ComposedChart
} from 'recharts';
import { HistoricalTrendPoint } from '../types';

interface PriceTrendChartProps {
  data: HistoricalTrendPoint[];
  commodityName: string;
  marketName?: string;
}

export const PriceTrendChart: React.FC<PriceTrendChartProps> = ({
  data,
  commodityName,
  marketName
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800">
        No price trend data available for selected duration.
      </div>
    );
  }

  // Format date labels e.g. "24 Oct"
  const formattedData = data.map(item => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  }));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-200">
            {commodityName} Daily Modal Price & Arrival Trend
          </h4>
          <p className="text-xs text-slate-400">
            {marketName ? `Market: ${marketName}` : 'All APMC Mandis Aggregated'} • 30 Days Trend
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
            <span className="text-slate-300">Modal (₹/Q)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-500/30 border border-amber-500"></span>
            <span className="text-slate-300">Min/Max Range</span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="modalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="formattedDate" stroke="#64748b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={['auto', 'auto']} tickFormatter={(v) => `₹${v}`} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                fontSize: '12px',
                color: '#f8fafc',
              }}
              formatter={(value: any, name: any) => {
                if (name === 'modal_price') return [`₹${value}`, 'Modal Price'];
                if (name === 'max_price') return [`₹${value}`, 'Max Price'];
                if (name === 'min_price') return [`₹${value}`, 'Min Price'];
                if (name === 'arrival_volume') return [`${value} Q`, 'Arrivals'];
                return [value, name];
              }}
            />
            <Area
              type="monotone"
              dataKey="modal_price"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#modalGradient)"
              name="modal_price"
            />
            <Area
              type="monotone"
              dataKey="max_price"
              stroke="#f59e0b"
              strokeWidth={1}
              strokeDasharray="4 4"
              fill="none"
              name="max_price"
            />
            <Area
              type="monotone"
              dataKey="min_price"
              stroke="#f59e0b"
              strokeWidth={1}
              strokeDasharray="4 4"
              fill="none"
              name="min_price"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
