import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { formatCurrency, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const res = await window.electronAPI.customers.getAll();
    if (res.success) setCustomers(res.data);
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await window.electronAPI.customers.create(formData);
    if (res.success) {
      toast.success('Customer added');
      setIsModalOpen(false);
      setFormData({ name: '', phone: '', email: '', address: '' });
      loadCustomers();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="text-dark-400 mt-1">Manage your customer database.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus size={18} /> Add Customer
        </Button>
      </div>

      <div className="card">
        <div className="mb-4 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
          <input 
            type="text" placeholder="Search customers..." className="input pl-10"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-dark-700">
              <th className="th">Name</th>
              <th className="th">Contact</th>
              <th className="th text-center">Purchases</th>
              <th className="th text-right">Total Spent</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="table-row">
                <td className="td font-medium text-white">{c.name}</td>
                <td className="td">
                  <p>{c.phone}</p>
                  <p className="text-xs text-dark-400">{c.email}</p>
                </td>
                <td className="td text-center">{c.total_purchases}</td>
                <td className="td text-right font-bold text-success-400">{formatCurrency(c.total_spent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Customer">
        <form onSubmit={handleSubmit}>
          <Input label="Full Name *" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <Input label="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
          <Input label="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <Input label="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
          <Button type="submit" variant="primary" className="w-full mt-4">Save Customer</Button>
        </form>
      </Modal>
    </div>
  );
}
