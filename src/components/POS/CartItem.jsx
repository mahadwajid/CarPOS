import React from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatters';

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="group flex items-start gap-3 bg-dark-800 p-3 rounded-lg border border-dark-700 hover:border-dark-600 transition-colors relative">
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white truncate pr-6">{item.product_name}</h4>
        <div className="text-xs text-dark-400 mt-1 flex items-center justify-between">
          <span>{formatCurrency(item.price)} each</span>
          <span className="font-semibold text-white">
            {formatCurrency(item.price * item.quantity)}
          </span>
        </div>
        
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center bg-dark-900 rounded-md border border-dark-600 overflow-hidden">
            <button 
              onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
              className="px-2 py-1 hover:bg-dark-700 text-dark-300 hover:text-white transition-colors"
            >
              <Minus size={14} />
            </button>
            <div className="w-8 text-center text-sm font-medium text-white">
              {item.quantity}
            </div>
            <button 
              onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
              className="px-2 py-1 hover:bg-dark-700 text-dark-300 hover:text-white transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>

      <button 
        onClick={() => removeFromCart(item.product_id)}
        className="absolute top-2 right-2 p-1.5 text-dark-500 hover:text-danger-500 hover:bg-danger-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  );
}
