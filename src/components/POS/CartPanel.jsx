import React, { useState } from 'react';
import { ShoppingCart, Trash2, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import CartItem from './CartItem';
import Button from '../ui/Button';
import CheckoutModal from './CheckoutModal';
import CustomerSelectModal from './CustomerSelectModal';
import { formatCurrency } from '../../utils/formatters';

export default function CartPanel() {
  const { 
    cart, clearCart, subtotal, discountAmount, taxAmount, total, 
    customer, setCustomer 
  } = useCart();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-dark-900 border-l border-dark-700 w-96 flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-dark-700 flex items-center justify-between bg-dark-800/50">
        <div className="flex items-center gap-2">
          <ShoppingCart size={20} className="text-primary-500" />
          <h2 className="text-lg font-bold text-white">Current Order</h2>
        </div>
        <button 
          onClick={clearCart}
          className="text-dark-400 hover:text-danger-500 transition-colors p-1"
          title="Clear Cart"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Customer Selection */}
      <div className="p-3 border-b border-dark-700 bg-dark-800">
        <button 
          onClick={() => setIsCustomerModalOpen(true)}
          className="w-full flex items-center justify-between text-sm text-dark-300 hover:text-white bg-dark-700 hover:bg-dark-600 px-3 py-2 rounded-lg transition-colors border border-dark-600 border-dashed"
        >
          <div className="flex items-center gap-2">
            <User size={16} />
            {customer ? customer.name : 'Select Customer (Optional)'}
          </div>
        </button>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-dark-400 space-y-4">
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-dark-600 flex items-center justify-center">
              <ShoppingCart size={32} className="opacity-50" />
            </div>
            <p className="text-sm">Cart is empty</p>
          </div>
        ) : (
          cart.map(item => (
            <CartItem key={item.product_id} item={item} />
          ))
        )}
      </div>

      {/* Totals */}
      <div className="bg-dark-800 border-t border-dark-700 p-4 space-y-3">
        <div className="flex justify-between text-sm text-dark-300">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-success-500">
          <span>Discount</span>
          <span>-{formatCurrency(discountAmount)}</span>
        </div>
        <div className="flex justify-between text-sm text-dark-300">
          <span>Tax</span>
          <span>{formatCurrency(taxAmount)}</span>
        </div>
        
        <div className="h-px bg-dark-700 border-dashed w-full my-2"></div>
        
        <div className="flex justify-between items-end mb-4">
          <span className="text-lg font-medium text-white">Total</span>
          <span className="text-3xl font-bold tracking-tight text-white">
            {formatCurrency(total)}
          </span>
        </div>

        <Button 
          variant="primary" 
          size="lg" 
          className="w-full h-14 text-lg font-bold shadow-lg shadow-primary-500/20"
          disabled={cart.length === 0}
          onClick={() => setIsCheckoutOpen(true)}
        >
          Checkout
        </Button>
      </div>

      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
      />
      <CustomerSelectModal 
        isOpen={isCustomerModalOpen} 
        onClose={() => setIsCustomerModalOpen(false)} 
      />
    </div>
  );
}
