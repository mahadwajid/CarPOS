import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

export default function InvoicePrint({ sale }) {
  const { settings } = useSettings();

  if (!sale) return null;

  return (
    <div id="invoice-print-area" className="w-[80mm] mx-auto text-[12px] leading-tight font-mono p-4 print-only:w-full print-only:p-0">
      
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold uppercase">{settings?.shop_name || 'CarPOS Store'}</h2>
        <p>{settings?.shop_address}</p>
        <p>Tel: {settings?.shop_phone}</p>
        {settings?.shop_email && <p>Email: {settings?.shop_email}</p>}
      </div>

      <div className="border-t border-dashed border-gray-400 my-2"></div>
      
      {/* Sale Info */}
      <div className="mb-2">
        <p>Invoice: <span className="font-bold">{sale.invoice_number}</span></p>
        <p>Date: {formatDate(sale.created_at, true)}</p>
        {sale.customer_name && <p>Customer: {sale.customer_name}</p>}
        {sale.cashier_id && <p>Cashier ID: {sale.cashier_id}</p>}
      </div>

      <div className="border-t border-dashed border-gray-400 my-2"></div>
      
      {/* Items */}
      <table className="w-full text-left mb-2">
        <thead>
          <tr className="border-b border-gray-400 border-dashed">
            <th className="py-1 w-1/2">Item</th>
            <th className="py-1 w-1/5 text-center">Qty</th>
            <th className="py-1 text-right">Amt</th>
          </tr>
        </thead>
        <tbody>
          {sale.items?.map((item, idx) => (
            <tr key={idx}>
              <td className="py-1 opacity-90 truncate">{item.product_name}</td>
              <td className="py-1 text-center">{item.quantity}</td>
              <td className="py-1 text-right">{formatCurrency(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-gray-400 my-2"></div>
      
      {/* Totals */}
      <div className="space-y-1 text-right">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(sale.subtotal)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-{formatCurrency(sale.discount)}</span>
          </div>
        )}
        {sale.tax_amount > 0 && (
          <div className="flex justify-between">
            <span>Tax ({sale.tax_rate}%):</span>
            <span>{formatCurrency(sale.tax_amount)}</span>
          </div>
        )}
        
        <div className="border-t border-gray-400 my-2"></div>
        
        <div className="flex justify-between text-base font-bold">
          <span>Total:</span>
          <span>{formatCurrency(sale.total)}</span>
        </div>
        
        <div className="border-t border-dashed border-gray-400 my-2"></div>
        
        <div className="flex justify-between">
          <span>Paid ({sale.payment_method}):</span>
          <span>{formatCurrency(sale.paid_amount)}</span>
        </div>
        <div className="flex justify-between">
          <span>Change:</span>
          <span>{formatCurrency(sale.change_amount)}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-gray-400 my-2"></div>
      
      {/* Footer */}
      <div className="text-center mt-4 opacity-80">
        <p>{settings?.receipt_footer || 'Thank you for your purchase!'}</p>
        <p className="mt-2 text-[10px]">Powered by CarPOS</p>
      </div>

    </div>
  );
}
