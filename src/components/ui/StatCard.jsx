import React from 'react';

export default function StatCard({ title, value, icon: Icon, trend, trendValue, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-primary-500/20 text-primary-400',
    success: 'bg-success-500/20 text-success-400',
    warning: 'bg-warning-500/20 text-warning-400',
    danger:  'bg-danger-500/20 text-danger-400',
  };

  return (
    <div className="stat-card">
      <div className={`p-3 rounded-lg ${colorMap[color]}`}>
        {Icon && <Icon size={24} />}
      </div>
      <div>
        <p className="text-sm font-medium text-dark-400">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {trend && (
          <p className={`text-xs mt-1 font-medium ${trend === 'up' ? 'text-success-400' : 'text-danger-400'}`}>
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </p>
        )}
      </div>
    </div>
  );
}
