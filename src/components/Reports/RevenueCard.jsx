import React from 'react';
import { formatCurrency } from '../../utils/formatters';

export default function RevenueCard({ title, amount, profit, subtitle, icon: Icon, color = 'primary' }) {
  const colorMap = {
    primary: 'from-primary-600 to-primary-800',
    success: 'from-success-600 to-success-800',
    warning: 'from-warning-500 to-warning-700',
  };

  return (
    <div className={`rounded-xl p-6 bg-gradient-to-br ${colorMap[color]} text-white shadow-lg relative overflow-hidden`}>
      <div className="absolute right-0 top-0 p-6 opacity-20">
        <Icon size={80} />
      </div>
      
      <div className="relative z-10">
        <p className="text-sm font-medium text-white/80 uppercase tracking-wider">{title}</p>
        <p className="text-4xl font-bold mt-2 tracking-tight">{formatCurrency(amount)}</p>
        {(subtitle || profit !== undefined) && (
          <div className="mt-3 flex flex-col gap-1 text-sm text-white/70">
            {subtitle && <span>{subtitle}</span>}
            {profit !== undefined && <span className="font-semibold text-white">Profit: {formatCurrency(profit)}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
