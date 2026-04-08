import React, { useEffect, useState } from 'react';
import { formatCurrency, formatNumber } from '../utils/formatters';
import StatCard from '../components/ui/StatCard';
import RevenueCard from '../components/Reports/RevenueCard';
import SalesChart from '../components/Reports/SalesChart';
import LowStockAlert from '../components/Products/LowStockAlert';
import { DollarSign, ShoppingBag, Users, Package, TrendingUp } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    const res = await window.electronAPI.reports.dashboard();
    if (res.success) {
      setData(res.data);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center"><LoadingSpinner size={40} /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-dark-400 mt-1">Overview of your store's performance today.</p>
        </div>
      </div>

      <LowStockAlert />

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <RevenueCard 
          title="Today's Revenue" 
          amount={data.todaySales.revenue} 
          subtitle={`${data.todaySales.count} sales today`}
          icon={DollarSign}
          color="primary"
        />
        <StatCard 
          title="Monthly Revenue"
          value={formatCurrency(data.monthSales.revenue)}
          icon={TrendingUp}
          color="success"
        />
        <StatCard 
          title="Total Products"
          value={formatNumber(data.totalProducts)}
          icon={Package}
          color="warning"
        />
        <StatCard 
          title="Registered Customers"
          value={formatNumber(data.totalCustomers)}
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue (Last 7 Days)</h3>
          <SalesChart data={data.last7Days} />
        </div>

        {/* Top Products */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ShoppingBag size={20} className="text-primary-500" />
            Top Selling Products
          </h3>
          <div className="space-y-4">
            {data.topProducts?.length === 0 ? (
              <p className="text-sm text-dark-400">No sales data yet.</p>
            ) : (
              data.topProducts.map((p, i) => (
                <div key={i} className="flex justify-between items-center border-b border-dark-700/50 pb-3 last:border-0">
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="text-sm font-medium text-white truncate">{p.name}</p>
                    <p className="text-xs text-dark-400 mt-0.5">{p.total_sold} units sold</p>
                  </div>
                  <div className="text-sm font-bold text-success-400 text-right whitespace-nowrap">
                    {formatCurrency(p.revenue)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4 border-b border-dark-700 pb-2">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="th">Invoice</th>
                <th className="th">Time</th>
                <th className="th">Customer</th>
                <th className="th">Method</th>
                <th className="th text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSales?.length === 0 ? (
                <tr>
                  <td colSpan="5" className="td text-center text-dark-400 py-4">No recent transactions</td>
                </tr>
              ) : (
                data.recentSales.map(sale => (
                  <tr key={sale.id} className="table-row">
                    <td className="td font-medium text-white">{sale.invoice_number}</td>
                    <td className="td">{new Date(sale.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="td">{sale.customer_name || 'Walk-in'}</td>
                    <td className="td capitalize">{sale.payment_method}</td>
                    <td className="td text-right font-bold text-success-400">{formatCurrency(sale.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
