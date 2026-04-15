import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

export default function SalesChart({ data, showExpenses = false }) {
  if (!data || data.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-dark-400">No data available</div>;
  }

  const hasExpenses = showExpenses && data.some(d => d.expenses > 0);

  const formatXAxis = (tickItem) => {
    // Format date as 'MMM DD'
    const d = new Date(tickItem);
    return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            fontSize={12}
            tickFormatter={formatXAxis}
            tickMargin={10}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tickFormatter={(val) => `${val}`}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
            itemStyle={{ fontWeight: 'bold' }}
            formatter={(value, name) => [formatCurrency(value), name.charAt(0).toUpperCase() + name.slice(1)]}
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
          />
          {hasExpenses && <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />}
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#6366f1"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
          <Area
            type="monotone"
            dataKey="profit"
            stroke="#10b981"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorProfit)"
          />
          {hasExpenses && (
            <Area
              type="monotone"
              dataKey="expenses"
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#colorExpenses)"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
