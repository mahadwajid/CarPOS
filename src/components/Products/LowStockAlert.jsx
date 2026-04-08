import React, { useEffect, useState } from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LowStockAlert() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadLowStock();
  }, []);

  const loadLowStock = async () => {
    const res = await window.electronAPI.products.getLowStock();
    if (res.success) setItems(res.data);
  };

  if (items.length === 0) return null;

  return (
    <div className="bg-warning-500/10 border border-warning-500/30 rounded-xl p-4 flex items-start gap-4 animate-fade-in mb-6">
      <div className="p-2 bg-warning-500/20 text-warning-500 rounded-lg">
        <AlertTriangle size={24} />
      </div>
      <div className="flex-1">
        <h3 className="text-warning-400 font-medium">Low Stock Alert</h3>
        <p className="text-sm text-dark-300 mt-1">
          {items.length} product(s) are running low on stock and need attention.
        </p>
      </div>
      <button 
        onClick={() => navigate('/inventory')}
        className="flex items-center gap-1 text-sm font-medium text-warning-400 hover:text-warning-300 transition-colors"
      >
        Manage Inventory <ChevronRight size={16} />
      </button>
    </div>
  );
}
