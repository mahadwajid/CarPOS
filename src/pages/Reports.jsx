import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatters';
import SalesChart from '../components/Reports/SalesChart';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  const loadReports = async () => {
    setLoading(true);
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - parseInt(dateRange));

    const startDate = start.toISOString().split('T')[0];
    const endDate = end.toISOString().split('T')[0];

    const [salesRes, topRes, catRes] = await Promise.all([
      window.electronAPI.reports.salesByDate({ startDate, endDate }),
      window.electronAPI.reports.topProducts({ startDate, endDate }),
      window.electronAPI.reports.categoryBreakdown()
    ]);

    if (salesRes.success) {
      setData({
        sales: salesRes.data,
        topProducts: topRes.data || [],
        categories: catRes.data || []
      });
    }
    setLoading(false);
  };

  if (loading && !data) {
    return <div className="py-20"><LoadingSpinner size={40} /></div>;
  }

  const totalRevenue = data?.sales?.reduce((sum, item) => sum + item.revenue, 0) || 0;
  const totalTax = data?.sales?.reduce((sum, item) => sum + item.tax, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-title">Analytics & Reports</h1>
          <p className="text-dark-400 mt-1">Deep dive into your store's performance.</p>
        </div>
        <select 
          value={dateRange} 
          onChange={(e) => setDateRange(e.target.value)}
          className="input w-auto bg-dark-800"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card bg-primary-900/20 border-primary-500/30">
          <h3 className="text-sm font-semibold text-primary-400 uppercase tracking-wider">Total Revenue</h3>
          <p className="text-4xl font-bold text-white mt-2">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="card bg-dark-800">
          <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider">Total Tax Collected</h3>
          <p className="text-4xl font-bold text-white mt-2">{formatCurrency(totalTax)}</p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
        <SalesChart data={data?.sales || []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Top Performing Products</h3>
          <div className="space-y-4">
            {data?.topProducts.map((p, i) => (
              <div key={i} className="flex justify-between items-center border-b border-dark-700/50 pb-3 last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">{p.name}</p>
                  <p className="text-xs text-dark-400">{p.category_name || 'Uncategorized'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-success-400">{formatCurrency(p.revenue)}</p>
                  <p className="text-xs text-dark-400">{p.total_sold} units</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Sales by Category</h3>
          <div className="space-y-4">
            {data?.categories.map((c, i) => (
              <div key={i} className="flex justify-between items-center border-b border-dark-700/50 pb-3 last:border-0">
                <p className="text-sm font-medium text-white">{c.category || 'Uncategorized'}</p>
                <p className="text-sm font-bold text-white">{formatCurrency(c.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
