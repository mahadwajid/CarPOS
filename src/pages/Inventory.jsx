import React, { useState, useEffect } from 'react';
import { PackagePlus, PackageMinus, History, Search } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function Inventory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('restock'); // 'restock' or 'adjust'
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [formData, setFormData] = useState({ barcode: '', quantity: '', notes: '' });
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    const res = await window.electronAPI.inventory.getLogs({ limit: 100 });
    if (res.success) setLogs(res.data);
    setLoading(false);
  };

  const handleBarcodeSearch = async () => {
    if (!formData.barcode) return;
    const res = await window.electronAPI.products.getByBarcode(formData.barcode);
    if (res.success && res.data) {
      setSelectedProduct(res.data);
    } else {
      toast.error('Product not found');
      setSelectedProduct(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return toast.error('Please select a product first');
    
    const qty = parseInt(formData.quantity);
    if (!qty) return toast.error('Enter valid quantity');

    const payload = {
      product_id: selectedProduct.id,
      quantity: modalType === 'restock' ? qty : qty, // adjustment can be negative if we allow it in input
      notes: formData.notes
    };

    const action = modalType === 'restock' ? window.electronAPI.inventory.restock : window.electronAPI.inventory.adjust;
    const res = await action(payload);

    if (res.success) {
      toast.success(modalType === 'restock' ? 'Restock successful' : 'Stock adjusted');
      setIsModalOpen(false);
      loadLogs();
      setFormData({ barcode: '', quantity: '', notes: '' });
      setSelectedProduct(null);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">Inventory Control</h1>
          <p className="text-dark-400 mt-1">Manage stock levels and view movement history.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => { setModalType('adjust'); setIsModalOpen(true); }} className="gap-2">
            <PackageMinus size={16} /> Adjust Stock
          </Button>
          <Button variant="primary" onClick={() => { setModalType('restock'); setIsModalOpen(true); }} className="gap-2">
            <PackagePlus size={16} /> Receive Stock
          </Button>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <History size={20} className="text-primary-500"/> Movement Logs
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-dark-700 bg-dark-900">
                <th className="th">Date</th>
                <th className="th">Type</th>
                <th className="th">Product</th>
                <th className="th text-right">Change</th>
                <th className="th text-center">Resulting Stock</th>
                <th className="th">Notes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="table-row">
                  <td className="td whitespace-nowrap">{formatDate(log.created_at, true)}</td>
                  <td className="td capitalize">
                    <Badge variant={
                      log.type === 'restock' ? 'success' : 
                      log.type === 'sale' ? 'primary' : 
                      log.type === 'initial' ? 'gray' : 'warning'
                    }>
                      {log.type}
                    </Badge>
                  </td>
                  <td className="td font-medium text-white">{log.product_name}</td>
                  <td className={`td text-right font-bold ${log.quantity > 0 && log.type === 'restock' ? 'text-success-400' : 'text-danger-400'}`}>
                    {log.type === 'sale' ? '-' : log.type === 'restock' ? '+' : ''}{Math.abs(log.quantity)}
                  </td>
                  <td className="td text-center text-dark-300">{log.after_qty}</td>
                  <td className="td text-dark-400 text-sm max-w-[200px] truncate">{log.notes}</td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr><td colSpan="6" className="td text-center">No inventory logs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalType === 'restock' ? 'Receive Stock' : 'Adjust Stock'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input 
                label="Scan/Enter Barcode" 
                value={formData.barcode} 
                onChange={e => setFormData({...formData, barcode: e.target.value})}
                placeholder="Product barcode..."
              />
            </div>
            <Button type="button" onClick={handleBarcodeSearch} className="mb-4 bg-dark-700"><Search size={16}/></Button>
          </div>

          {selectedProduct && (
            <div className="p-3 bg-primary-900/20 border border-primary-500/30 rounded-lg mb-4">
              <p className="text-sm font-bold text-white">{selectedProduct.name}</p>
              <p className="text-xs text-dark-300 mt-1">Current Stock: <span className="text-primary-400 font-bold">{selectedProduct.stock}</span></p>
            </div>
          )}

          <Input 
            label={modalType === 'restock' ? 'Quantity to Add' : 'Amount to Adjust (Negative to deduct)'} 
            type="number" 
            required 
            value={formData.quantity}
            onChange={e => setFormData({...formData, quantity: e.target.value})}
          />
          <Input 
            label="Notes / Reason" 
            value={formData.notes}
            onChange={e => setFormData({...formData, notes: e.target.value})}
            placeholder="e.g. Purchase order #123"
          />

          <Button type="submit" variant="primary" className="w-full mt-4">Confirm Action</Button>
        </form>
      </Modal>
    </div>
  );
}
