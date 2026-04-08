import React from 'react';
import { formatCurrency } from '../../utils/formatters';

export default function TopProducts({ products }) {
  if (!products || products.length === 0) {
    return <div className="text-center py-4 text-dark-400 text-sm">No top products</div>;
  }

  const maxSold = Math.max(...products.map(p => p.total_sold));

  return (
    <div className="space-y-4">
      {products.map((product, idx) => (
        <div key={idx} className="flex items-center gap-4 group">
          <div className="w-8 h-8 rounded bg-dark-700 flex items-center justify-center font-bold text-dark-300 text-xs">
            #{idx + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline mb-1">
              <h4 className="text-sm font-medium text-white truncate">{product.name}</h4>
              <span className="text-xs font-semibold text-primary-400 ml-2">
                {product.total_sold} units
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 w-full bg-dark-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-500 rounded-full transition-all duration-500 group-hover:bg-primary-400"
                style={{ width: `${(product.total_sold / maxSold) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
