import React, { useState, useEffect } from 'react';
import { Banknote, CreditCard, Wallet, Calculator } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import InvoiceModal from '../Invoice/InvoiceModal';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function CheckoutModal({ isOpen, onClose }) {
  const { cart, total, subtotal, discountAmount, discountType, taxAmount, taxRate, customer, clearCart } = useCart();
  const { user } = useAuth();
  
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setPaidAmount(total.toFixed(2));
      setPaymentMethod('cash');
      setCompletedSale(null);
    }
  }, [isOpen, total]);

  const numPaid = parseFloat(paidAmount) || 0;
  const change = Math.max(0, numPaid - total);
  const isValid = numPaid >= total;

  const quickAmounts = [
    5, 10, 20, 50, 100, Math.ceil(total)
  ].filter((v, i, a) => a.indexOf(v) === i && v >= total);

  const handleCheckout = async () => {
    if (!isValid) return;
    setIsProcessing(true);

    try {
      const saleData = {
        items: cart.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          price: item.price,
          cost: item.cost,
          quantity: item.quantity,
          discount: item.itemDiscount || 0,
          subtotal: item.price * item.quantity
        })),
        customer_id: customer?.id || null,
        subtotal,
        discount: discountAmount,
        discount_type: discountType,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        paid_amount: numPaid,
        change_amount: change,
        payment_method: paymentMethod,
        cashier_id: user?.id
      };

      const res = await window.electronAPI.sales.create(saleData);
      
      if (res.success) {
        toast.success('Sale completed successfully!');
        setCompletedSale({ id: res.saleId, invoiceNumber: res.invoiceNumber });
        clearCart();
      } else {
        toast.error(res.message || 'Failed to complete sale');
      }
    } catch (error) {
      toast.error('Error processing checkout');
    } finally {
      setIsProcessing(false);
    }
  };

  if (completedSale) {
    return (
      <InvoiceModal 
        isOpen={isOpen} 
        onClose={onClose} 
        saleId={completedSale.id} 
      />
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Checkout" size="lg">
      <div className="grid grid-cols-2 gap-6">
        
        {/* Left Side: Summary & Payment Method */}
        <div className="space-y-6">
          <div className="bg-dark-800 p-4 rounded-xl border border-dark-700 shadow-inner">
            <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-3">Order Summary</h3>
            <div className="flex justify-between items-center bg-dark-900 border border-dark-600 rounded-lg p-4">
              <span className="text-lg font-medium text-white">Total Amount</span>
              <span className="text-3xl font-bold text-primary-400 tracking-tight">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-3">Payment Method</h3>
            <div className="grid grid-cols-2 gap-3">
              <MethodButton 
                active={paymentMethod === 'cash'} 
                onClick={() => setPaymentMethod('cash')} 
                icon={Banknote} label="Cash" 
              />
              <MethodButton 
                active={paymentMethod === 'card'} 
                onClick={() => setPaymentMethod('card')} 
                icon={CreditCard} label="Card" 
              />
              <MethodButton 
                active={paymentMethod === 'wallet'} 
                onClick={() => setPaymentMethod('wallet')} 
                icon={Wallet} label="Wallet" 
              />
            </div>
          </div>
        </div>

        {/* Right Side: Amount received */}
        <div className="space-y-6 flex flex-col">
          <div>
            <label className="label flex items-center justify-between mb-2">
              Amount Received
              <Calculator size={14} className="text-dark-400"/>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-dark-400 font-bold">$</span>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                autoFocus
                className="w-full bg-dark-800 border-2 border-dark-600 rounded-xl pl-10 pr-4 py-4 text-3xl font-bold text-white focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 transition-all"
              />
            </div>
            
            <div className="flex flex-wrap gap-2 mt-3">
              {quickAmounts.map(amt => (
                <button
                  key={amt}
                  onClick={() => setPaidAmount(amt.toString())}
                  className="px-3 py-1.5 bg-dark-800 border border-dark-600 hover:bg-primary-900/30 hover:border-primary-700 hover:text-primary-400 rounded-lg text-sm font-medium transition-colors"
                >
                  {formatCurrency(amt)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 mt-4">
            <div className={`p-4 rounded-xl border ${change > 0 ? 'bg-success-900/20 border-success-700/50' : 'bg-dark-800 border-dark-700'}`}>
              <div className="flex justify-between items-center">
                <span className="text-dark-300 font-medium">Change Required</span>
                <span className={`text-2xl font-bold ${change > 0 ? 'text-success-400' : 'text-dark-400'}`}>
                  {formatCurrency(change)}
                </span>
              </div>
            </div>
          </div>

          <Button 
            className="w-full py-4 text-lg mt-auto" 
            variant="primary"
            disabled={!isValid || isProcessing}
            onClick={handleCheckout}
          >
            {isProcessing ? 'Processing...' : 'Complete Payment'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function MethodButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
        active 
          ? 'bg-primary-600/10 border-primary-500 text-primary-400 shadow-lg shadow-primary-500/20' 
          : 'bg-dark-800 border-dark-600 text-dark-300 hover:bg-dark-700 hover:border-dark-500'
      }`}
    >
      <Icon size={24} className="mb-2" />
      <span className="font-medium">{label}</span>
    </button>
  );
}
