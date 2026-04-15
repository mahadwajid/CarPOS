import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  Handshake, Plus, Search, Trash2, Edit3, X, CheckCircle, Circle,
  TrendingUp, DollarSign, AlertTriangle, Users, Phone
} from 'lucide-react';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { value: 'cash',   label: 'Cash' },
  { value: 'bank',   label: 'Bank Transfer' },
  { value: 'online', label: 'Online' },
];

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────
function BorrowedSaleModal({ isOpen, onClose, onSave, record }) {
  const [form, setForm] = useState({
    supplier_name: '', supplier_phone: '', product_name: '', product_desc: '',
    cost_price: '', sell_price: '', quantity: '1', buyer_name: '',
    payment_method: 'cash', notes: '', sale_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (record) {
      const qty = record.quantity || 1;
      setForm({
        supplier_name: record.supplier_name || '',
        supplier_phone: record.supplier_phone || '',
        product_name: record.product_name || '',
        product_desc: record.product_desc || '',
        cost_price: qty > 0 ? (record.cost_price / qty).toString() : '',
        sell_price: qty > 0 ? (record.sell_price / qty).toString() : '',
        quantity: String(qty),
        buyer_name: record.buyer_name || '',
        payment_method: record.payment_method || 'cash',
        notes: record.notes || '',
        sale_date: record.sale_date || new Date().toISOString().split('T')[0],
      });
    } else {
      setForm({
        supplier_name: '', supplier_phone: '', product_name: '', product_desc: '',
        cost_price: '', sell_price: '', quantity: '1', buyer_name: '',
        payment_method: 'cash', notes: '', sale_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [record, isOpen]);

  if (!isOpen) return null;

  const costNum = parseFloat(form.cost_price) || 0;
  const sellNum = parseFloat(form.sell_price) || 0;
  const qtyNum = parseInt(form.quantity) || 1;
  const liveProfit = (sellNum - costNum) * qtyNum;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.supplier_name.trim()) { toast.error('Supplier name is required'); return; }
    if (!form.product_name.trim()) { toast.error('Product name is required'); return; }
    if (!form.cost_price || !form.sell_price) { toast.error('Cost and sell prices are required'); return; }
    if (sellNum <= costNum) { toast.error('Sell price should be higher than cost price'); return; }
    onSave({ ...form, id: record?.id, status: record?.status });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-2xl mx-4 shadow-2xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700 bg-dark-900/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-600/20">
              <Handshake size={18} className="text-amber-400" />
            </div>
            {record ? 'Edit Borrowed Sale' : 'Record Borrowed Sale'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Supplier Section */}
          <div>
            <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users size={14} /> Borrowed From
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Supplier / Person Name *</label>
                <input className="input" placeholder="e.g. Ali Khan"
                  value={form.supplier_name} onChange={e => setForm({ ...form, supplier_name: e.target.value })} />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input className="input" placeholder="Optional"
                  value={form.supplier_phone} onChange={e => setForm({ ...form, supplier_phone: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Product Section */}
          <div>
            <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3">Product Details</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Product Name *</label>
                <input className="input" placeholder="e.g. Toyota Corolla Headlight"
                  value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} />
              </div>
              <div>
                <label className="label">Description</label>
                <input className="input" placeholder="Optional details"
                  value={form.product_desc} onChange={e => setForm({ ...form, product_desc: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div>
            <p className="text-xs font-semibold text-dark-400 uppercase tracking-wider mb-3">
              <DollarSign size={14} className="inline mr-1" /> Pricing
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Cost Price (per unit) *</label>
                <input type="number" step="0.01" min="0" className="input" placeholder="e.g. 80000"
                  value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })} />
              </div>
              <div>
                <label className="label">Sell Price (per unit) *</label>
                <input type="number" step="0.01" min="0" className="input" placeholder="e.g. 95000"
                  value={form.sell_price} onChange={e => setForm({ ...form, sell_price: e.target.value })} />
              </div>
              <div>
                <label className="label">Quantity</label>
                <input type="number" min="1" className="input"
                  value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
              </div>
            </div>

            {/* Live Profit Display */}
            {(costNum > 0 && sellNum > 0) && (
              <div className={`mt-3 p-3 rounded-lg border ${liveProfit > 0 ? 'bg-success-500/10 border-success-500/30' : 'bg-danger-500/10 border-danger-500/30'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-dark-300">Your Profit:</span>
                  <span className={`text-xl font-bold ${liveProfit > 0 ? 'text-success-400' : 'text-danger-400'}`}>
                    {formatCurrency(liveProfit)}
                  </span>
                </div>
                <p className="text-xs text-dark-500 mt-1">
                  Cost: {formatCurrency(costNum * qtyNum)} → Sell: {formatCurrency(sellNum * qtyNum)}
                </p>
              </div>
            )}
          </div>

          {/* Sale Details */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Buyer Name</label>
              <input className="input" placeholder="Who bought it?"
                value={form.buyer_name} onChange={e => setForm({ ...form, buyer_name: e.target.value })} />
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select className="input" value={form.payment_method}
                onChange={e => setForm({ ...form, payment_method: e.target.value })}>
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Sale Date</label>
              <input type="date" className="input" value={form.sale_date}
                onChange={e => setForm({ ...form, sale_date: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input min-h-[60px] resize-none" placeholder="Optional notes..."
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">
              {record ? 'Update Record' : 'Add Borrowed Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirmation ──────────────────────────────────────────────────────
function DeleteModal({ isOpen, onClose, onConfirm, record }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl animate-slide-up">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-danger-500/20 flex items-center justify-center mb-4">
            <Trash2 size={24} className="text-danger-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Delete Record</h3>
          <p className="text-sm text-dark-400 mb-1">Are you sure you want to delete</p>
          <p className="text-sm font-semibold text-white mb-4">"{record?.product_name}" from {record?.supplier_name}?</p>
          <p className="text-xs text-dark-500 mb-6">This action cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button onClick={onConfirm} className="btn-danger flex-1">Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Borrowed Sales Page ─────────────────────────────────────────────────
export default function BorrowedSales() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('90');

  useEffect(() => { loadAll(); }, [dateRange, filterStatus, searchQuery]);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - parseInt(dateRange));
    return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0] };
  };

  const loadAll = async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange();
    const [listRes, sumRes] = await Promise.all([
      window.electronAPI.borrowedSales.getAll({
        startDate, endDate,
        status: filterStatus || undefined,
        search: searchQuery || undefined,
      }),
      window.electronAPI.borrowedSales.getSummary({ startDate, endDate }),
    ]);
    if (listRes.success) setRecords(listRes.data);
    if (sumRes.success) setSummary(sumRes);
    setLoading(false);
  };

  const handleSave = async (data) => {
    let res;
    if (data.id) {
      res = await window.electronAPI.borrowedSales.update(data);
    } else {
      res = await window.electronAPI.borrowedSales.create(data);
    }
    if (res.success) {
      toast.success(res.message);
      setShowModal(false);
      setEditingRecord(null);
      loadAll();
    } else {
      toast.error(res.message);
    }
  };

  const handleDelete = async () => {
    if (!deletingRecord) return;
    const res = await window.electronAPI.borrowedSales.delete(deletingRecord.id);
    if (res.success) {
      toast.success(res.message);
      setShowDelete(false);
      setDeletingRecord(null);
      loadAll();
    } else {
      toast.error(res.message);
    }
  };

  const handleToggleSettled = async (id) => {
    const res = await window.electronAPI.borrowedSales.markSettled(id);
    if (res.success) {
      toast.success(res.message);
      loadAll();
    } else {
      toast.error(res.message);
    }
  };

  if (loading && !records.length) {
    return <div className="h-full flex items-center justify-center"><LoadingSpinner size={40} /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/20">
              <Handshake size={22} className="text-amber-400" />
            </div>
            Borrowed Sales
          </h1>
          <p className="text-dark-400 mt-1">Track products borrowed from suppliers and sold for profit.</p>
        </div>
        <button onClick={() => { setEditingRecord(null); setShowModal(true); }} className="btn-primary btn-lg gap-2">
          <Plus size={18} /> Record Sale
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Profit */}
        <div className="card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-success-500/20">
                <TrendingUp size={20} className="text-success-400" />
              </div>
              <span className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Total Profit</span>
            </div>
            <p className="text-3xl font-bold text-success-400">{formatCurrency(summary?.data?.total_profit || 0)}</p>
            <p className="text-xs text-dark-500 mt-1">From {summary?.data?.count || 0} transactions</p>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-primary-500/20">
                <DollarSign size={20} className="text-primary-400" />
              </div>
              <span className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Total Sales</span>
            </div>
            <p className="text-3xl font-bold text-white">{formatCurrency(summary?.data?.total_revenue || 0)}</p>
            <p className="text-xs text-dark-500 mt-1">Cost: {formatCurrency(summary?.data?.total_cost || 0)}</p>
          </div>
        </div>

        {/* Unsettled */}
        <div className="card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-red-500/10 to-transparent rounded-bl-full" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-danger-500/20">
                <AlertTriangle size={20} className="text-danger-400" />
              </div>
              <span className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Unsettled</span>
            </div>
            <p className="text-3xl font-bold text-danger-400">{formatCurrency(summary?.data?.unsettled_amount || 0)}</p>
            <p className="text-xs text-dark-500 mt-1">Amount you owe suppliers</p>
          </div>
        </div>

        {/* Settled */}
        <div className="card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-500/10 to-transparent rounded-bl-full" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-success-500/20">
                <CheckCircle size={20} className="text-success-400" />
              </div>
              <span className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Settled</span>
            </div>
            <p className="text-3xl font-bold text-white">{formatCurrency(summary?.data?.settled_amount || 0)}</p>
            <p className="text-xs text-dark-500 mt-1">Already paid back</p>
          </div>
        </div>
      </div>

      {/* Supplier Breakdown */}
      {summary?.bySupplier?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">By Supplier</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {summary.bySupplier.map((s, i) => (
              <div key={i} className="bg-dark-700/50 rounded-lg p-4 border border-dark-600/50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{s.supplier_name}</p>
                  <p className="text-xs text-dark-400">{s.count} transactions</p>
                  {s.unsettled > 0 && (
                    <p className="text-xs text-danger-400 mt-0.5">Unsettled: {formatCurrency(s.unsettled)}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-success-400">{formatCurrency(s.total_profit)}</p>
                  <p className="text-[10px] text-dark-500">Profit</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input className="input pl-9" placeholder="Search supplier, product, buyer..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <select className="input w-auto" value={dateRange} onChange={e => setDateRange(e.target.value)}>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">This Year</option>
            <option value="9999">All Time</option>
          </select>
          <select className="input w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="settled">Settled</option>
            <option value="unsettled">Unsettled</option>
          </select>
        </div>
      </div>

      {/* Records Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Transaction Records</h3>
          <span className="text-sm text-dark-400">{records.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="th">Date</th>
                <th className="th">Supplier</th>
                <th className="th">Product</th>
                <th className="th">Buyer</th>
                <th className="th text-right">Cost</th>
                <th className="th text-right">Sold</th>
                <th className="th text-right">Profit</th>
                <th className="th text-center">Status</th>
                <th className="th text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="9" className="td text-center text-dark-400 py-12">
                    <Handshake size={36} className="mx-auto mb-3 text-dark-600" />
                    <p className="font-medium">No borrowed sales found</p>
                    <p className="text-xs mt-1">Record your first borrowed sale to start tracking profit.</p>
                  </td>
                </tr>
              ) : (
                records.map(rec => (
                  <tr key={rec.id} className="table-row group">
                    <td className="td whitespace-nowrap text-sm text-dark-300">{formatDate(rec.sale_date)}</td>
                    <td className="td">
                      <div>
                        <p className="text-sm font-medium text-white">{rec.supplier_name}</p>
                        {rec.supplier_phone && (
                          <p className="text-[10px] text-dark-500 flex items-center gap-1">
                            <Phone size={9} /> {rec.supplier_phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="td">
                      <div className="max-w-[160px]">
                        <p className="text-sm font-medium text-white truncate">{rec.product_name}</p>
                        {rec.quantity > 1 && <p className="text-[10px] text-dark-500">×{rec.quantity} units</p>}
                        {rec.product_desc && <p className="text-[10px] text-dark-500 truncate">{rec.product_desc}</p>}
                      </div>
                    </td>
                    <td className="td text-sm text-dark-300">{rec.buyer_name || '—'}</td>
                    <td className="td text-right text-sm text-dark-300">{formatCurrency(rec.cost_price)}</td>
                    <td className="td text-right text-sm text-white font-medium">{formatCurrency(rec.sell_price)}</td>
                    <td className="td text-right">
                      <span className={`text-sm font-bold ${rec.profit >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                        {formatCurrency(rec.profit)}
                      </span>
                    </td>
                    <td className="td text-center">
                      <button
                        onClick={() => handleToggleSettled(rec.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer transition-all hover:scale-105 ${
                          rec.status === 'settled'
                            ? 'bg-success-500/15 text-success-400 border-success-500/30 hover:bg-success-500/25'
                            : 'bg-warning-500/15 text-warning-400 border-warning-500/30 hover:bg-warning-500/25'
                        }`}
                        title={rec.status === 'settled' ? 'Click to mark as unsettled' : 'Click to mark as settled'}
                      >
                        {rec.status === 'settled'
                          ? <><CheckCircle size={12} /> Settled</>
                          : <><Circle size={12} /> Unsettled</>}
                      </button>
                    </td>
                    <td className="td text-center">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingRecord(rec); setShowModal(true); }}
                          className="p-1.5 rounded-lg hover:bg-dark-600 text-dark-400 hover:text-primary-400 transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => { setDeletingRecord(rec); setShowDelete(true); }}
                          className="p-1.5 rounded-lg hover:bg-dark-600 text-dark-400 hover:text-danger-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <BorrowedSaleModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingRecord(null); }}
        onSave={handleSave}
        record={editingRecord}
      />
      <DeleteModal
        isOpen={showDelete}
        onClose={() => { setShowDelete(false); setDeletingRecord(null); }}
        onConfirm={handleDelete}
        record={deletingRecord}
      />
    </div>
  );
}
