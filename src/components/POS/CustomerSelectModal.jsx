import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Check } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

export default function CustomerSelectModal({ isOpen, onClose }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const { customer, setCustomer } = useCart();

  // Quick Add State
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
      setIsAdding(false);
      setSearch('');
    }
  }, [isOpen]);

  const loadCustomers = async () => {
    setLoading(true);
    const res = await window.electronAPI.customers.getAll();
    if (res.success) setCustomers(res.data);
    setLoading(false);
  };

  const handleSelect = (selectedUser) => {
    setCustomer(selectedUser);
    onClose();
  };

  const handleClear = () => {
    setCustomer(null);
    onClose();
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    setLoading(true);
    const res = await window.electronAPI.customers.create(formData);
    if (res.success) {
      toast.success('Customer created uniquely');
      const newUser = { id: res.id, name: formData.name, phone: formData.phone };
      setCustomer(newUser);
      onClose();
    } else {
      toast.error(res.message || 'Error creating customer');
    }
    setLoading(false);
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Customer">
      {!isAdding ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
              <input
                type="text"
                placeholder="Search by name or phone..."
                className="input pl-10 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsAdding(true)} variant="secondary" className="gap-2">
              <UserPlus size={18} /> New
            </Button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
            {customer && (
              <button
                onClick={handleClear}
                className="w-full text-left p-3 rounded-lg border border-danger-500/30 bg-danger-500/10 text-danger-400 hover:bg-danger-500/20 transition-colors text-sm font-medium"
              >
                Remove Current Selection: {customer.name}
              </button>
            )}

            {loading ? (
              <p className="text-center text-dark-400 py-4 text-sm">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-center text-dark-400 py-4 text-sm">No customers found.</p>
            ) : (
              filtered.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex justify-between items-center ${customer?.id === c.id
                      ? 'bg-primary-900/30 border-primary-500 text-primary-400'
                      : 'bg-dark-800 border-dark-700 hover:border-dark-500 text-white'
                    }`}
                >
                  <div>
                    <p className="font-medium">{c.name}</p>
                    {c.phone && <p className="text-xs text-dark-400 mt-0.5">{c.phone}</p>}
                  </div>
                  {customer?.id === c.id && <Check size={18} />}
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleQuickAdd} className="space-y-4">
          <Input
            label="Full Name *"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
            autoFocus
          />
          <Input
            label="Phone Number"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={loading || !formData.name}>
              {loading ? 'Saving...' : 'Save & Select'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
