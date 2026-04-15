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

    const [salesRes, topRes, catRes, expRes, borRes] = await Promise.all([
      window.electronAPI.reports.salesByDate({ startDate, endDate }),
      window.electronAPI.reports.topProducts({ startDate, endDate }),
      window.electronAPI.reports.categoryBreakdown(),
      window.electronAPI.expenses.getSummary({ startDate, endDate }),
      window.electronAPI.borrowedSales.getSummary({ startDate, endDate }),
    ]);

    if (salesRes.success) {
      setData({
        sales: salesRes.data,
        topProducts: topRes.data || [],
        categories: catRes.data || [],
        expenseSummary: expRes.success ? expRes : null,
        borrowedSummary: borRes.success ? borRes : null,
      });
    }
    setLoading(false);
  };

  if (loading && !data) {
    return <div className="py-20"><LoadingSpinner size={40} /></div>;
  }

  const totalRevenue = data?.sales?.reduce((sum, item) => sum + item.revenue, 0) || 0;
  const totalTax = data?.sales?.reduce((sum, item) => sum + item.tax, 0) || 0;
  const totalGrossProfit = data?.sales?.reduce((sum, item) => sum + (item.gross_profit || item.profit || 0), 0) || 0;
  const totalExpenses = data?.expenseSummary?.grandTotal || 0;
  const totalBorrowedProfit = data?.borrowedSummary?.data?.total_profit || 0;
  const totalNetProfit = totalGrossProfit - totalExpenses + totalBorrowedProfit;

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card bg-primary-900/20 border-primary-500/30">
          <h3 className="text-sm font-semibold text-primary-400 uppercase tracking-wider">Total Revenue</h3>
          <p className="text-3xl font-bold text-white mt-2">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="card bg-success-900/20 border-success-500/30">
          <h3 className="text-sm font-semibold text-success-400 uppercase tracking-wider">Gross Profit</h3>
          <p className="text-3xl font-bold text-white mt-2">{formatCurrency(totalGrossProfit)}</p>
          <p className="text-xs text-dark-400 mt-1">Before expenses</p>
        </div>
        <div className="card bg-danger-900/20 border-danger-500/30">
          <h3 className="text-sm font-semibold text-danger-400 uppercase tracking-wider">Total Expenses</h3>
          <p className="text-3xl font-bold text-white mt-2">{formatCurrency(totalExpenses)}</p>
          <p className="text-xs text-dark-400 mt-1">{data?.expenseSummary?.data?.length || 0} categories</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card bg-amber-900/20 border-amber-500/30">
          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Borrowed Sales Profit</h3>
          <p className="text-3xl font-bold text-white mt-2">{formatCurrency(totalBorrowedProfit)}</p>
          <p className="text-xs text-dark-400 mt-1">From {data?.borrowedSummary?.data?.count || 0} transactions</p>
        </div>
        <div className={`card ${totalNetProfit >= 0 ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
          <h3 className={`text-sm font-semibold uppercase tracking-wider ${totalNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            Net Profit
          </h3>
          <p className="text-3xl font-bold text-white mt-2">{formatCurrency(totalNetProfit)}</p>
          <p className="text-xs text-dark-400 mt-1">Gross + Borrowed − Expenses</p>
        </div>
        <div className="card bg-dark-800 border-dark-600/30">
          <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider">Tax Collected</h3>
          <p className="text-3xl font-bold text-white mt-2">{formatCurrency(totalTax)}</p>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Revenue & Expenses Trend</h3>
        <SalesChart data={data?.sales || []} showExpenses />
      </div>

      {/* Expense Breakdown (if any) */}
      {data?.expenseSummary?.data?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Expense Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.expenseSummary.data.map((cat, i) => {
              const pct = totalExpenses > 0 ? (cat.total / totalExpenses * 100) : 0;
              return (
                <div key={i} className="bg-dark-700/50 rounded-lg p-4 border border-dark-600/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.category_color || '#6b7280' }} />
                    <span className="text-sm font-medium text-white">{cat.category_name}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{formatCurrency(cat.total)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 bg-dark-600 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.category_color || '#6b7280' }} />
                    </div>
                    <span className="text-xs text-dark-400">{pct.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                  <p className="text-xs font-semibold text-warning-400 mt-0.5">Profit: {formatCurrency(p.profit)}</p>
                  <p className="text-xs text-dark-400 mt-1">{p.total_sold} units</p>
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
