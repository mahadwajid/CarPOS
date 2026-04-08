import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import Badge from '../ui/Badge';
import { Edit, Trash2 } from 'lucide-react';

export default function ProductTable({ products, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-dark-700 bg-dark-800">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-dark-900 border-b border-dark-700">
            <th className="th">Product</th>
            <th className="th">Barcode</th>
            <th className="th">Category</th>
            <th className="th text-right">Price / Cost</th>
            <th className="th text-center">Stock</th>
            <th className="th text-center">Status</th>
            <th className="th text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan="7" className="td text-center py-8 text-dark-400">
                No products found.
              </td>
            </tr>
          ) : (
            products.map((p) => (
              <tr key={p.id} className="table-row group">
                <td className="td font-medium text-white">
                  {p.name}
                  {p.description && <p className="text-xs text-dark-400 truncate max-w-xs">{p.description}</p>}
                </td>
                <td className="td text-dark-300">{p.barcode || '-'}</td>
                <td className="td text-dark-300">{p.category_name || '-'}</td>
                <td className="td text-right">
                  <div className="text-white">{formatCurrency(p.price)}</div>
                  <div className="text-xs text-dark-400">{formatCurrency(p.cost)}</div>
                </td>
                <td className="td text-center">
                  <span className={`font-semibold ${p.stock <= p.low_stock_threshold ? 'text-warning-500' : 'text-success-500'}`}>
                    {p.stock} {p.unit}
                  </span>
                </td>
                <td className="td text-center">
                  <Badge variant={p.is_active ? 'success' : 'danger'}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="td text-right space-x-2">
                  <button 
                    onClick={() => onEdit(p)}
                    className="p-1.5 text-dark-400 hover:text-primary-400 hover:bg-dark-700 rounded transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => onDelete(p.id)}
                    className="p-1.5 text-dark-400 hover:text-danger-400 hover:bg-dark-700 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
