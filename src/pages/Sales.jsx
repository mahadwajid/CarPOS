import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Search, Eye, Trash2 } from 'lucide-react';
import InvoiceModal from '../components/Invoice/InvoiceModal';
import { useAuth } from '../context/AuthContext';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    const res = await window.electronAPI.sales.getAll({ limit: 100 });
    if (res.success) setSales(res.data);
    setLoading(false);
  };

  const handleVoid = async (id) => {
    if (window.confirm('Are you sure you want to void this sale? Stock will be returned.')) {
      const res = await window.electronAPI.sales.delete(id);
      if (res.success) {
        loadSales();
      }
    }
  };

  const filteredSales = sales.filter(s => 
    s.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    (s.customer_name && s.customer_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">Sales History</h1>
          <p className="text-dark-400 mt-1">View past invoices and transactions.</p>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
            <input 
              type="text"
              placeholder="Search invoice or customer..."
              className="input pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-dark-700 bg-dark-900">
                <th className="th">Invoice NO.</th>
                <th className="th">Date</th>
                <th className="th">Customer</th>
                <th className="th">Items</th>
                <th className="th text-right">Total</th>
                <th className="th text-center">Status</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map(sale => (
                <tr key={sale.id} className="table-row group">
                  <td className="td font-mono font-medium text-white">{sale.invoice_number}</td>
                  <td className="td">{formatDate(sale.created_at, true)}</td>
                  <td className="td">{sale.customer_name || 'Walk-in Customer'}</td>
                  <td className="td">{sale.item_count}</td>
                  <td className="td text-right font-bold text-success-400">{formatCurrency(sale.total)}</td>
                  <td className="td text-center">
                    <Badge variant="success">Completed</Badge>
                  </td>
                  <td className="td text-right space-x-2">
                    <button 
                      onClick={() => setSelectedSaleId(sale.id)}
                      className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded transition-colors"
                      title="View Invoice"
                    >
                      <Eye size={16} />
                    </button>
                    {user?.role === 'admin' && (
                      <button 
                        onClick={() => handleVoid(sale.id)}
                        className="p-1.5 text-dark-400 hover:text-danger-400 hover:bg-dark-700 rounded transition-colors"
                        title="Void Sale"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <InvoiceModal 
        isOpen={!!selectedSaleId} 
        onClose={() => setSelectedSaleId(null)}
        saleId={selectedSaleId}
      />
    </div>
  );
}
