import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  Wallet, Plus, Search, Filter, Trash2, Edit3, X, Calendar,
  TrendingDown, Receipt, Hash, CreditCard, RefreshCw, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { value: 'cash',   label: 'Cash' },
  { value: 'bank',   label: 'Bank Transfer' },
  { value: 'online', label: 'Online' },
];

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────
function ExpenseModal({ isOpen, onClose, onSave, expense, categories }) {
  const [form, setForm] = useState({
    title: '', amount: '', expense_category_id: '', description: '',
    payment_method: 'cash', reference: '', is_recurring: false,
    recurring_period: '', expense_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (expense) {
      setForm({
        title: expense.title || '',
        amount: expense.amount || '',
        expense_category_id: expense.expense_category_id || '',
        description: expense.description || '',
        payment_method: expense.payment_method || 'cash',
        reference: expense.reference || '',
        is_recurring: !!expense.is_recurring,
        recurring_period: expense.recurring_period || '',
        expense_date: expense.expense_date || new Date().toISOString().split('T')[0],
      });
    } else {
      setForm({
        title: '', amount: '', expense_category_id: '', description: '',
        payment_method: 'cash', reference: '', is_recurring: false,
        recurring_period: '', expense_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [expense, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount) {
      toast.error('Title and amount are required');
      return;
    }
    onSave({ ...form, amount: parseFloat(form.amount), id: expense?.id });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-lg mx-4 shadow-2xl animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700 bg-dark-900/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary-600/20">
              <Wallet size={18} className="text-primary-400" />
            </div>
            {expense ? 'Edit Expense' : 'Add New Expense'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Title *</label>
              <input className="input" placeholder="e.g. Electricity Bill"
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Amount (Rs) *</label>
              <input type="number" step="0.01" min="0" className="input" placeholder="0.00"
                value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.expense_category_id}
                onChange={e => setForm({ ...form, expense_category_id: e.target.value })}>
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.expense_date}
                onChange={e => setForm({ ...form, expense_date: e.target.value })} />
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select className="input" value={form.payment_method}
                onChange={e => setForm({ ...form, payment_method: e.target.value })}>
                {PAYMENT_METHODS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Reference / Receipt #</label>
              <input className="input" placeholder="Optional"
                value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={form.is_recurring}
                  onChange={e => setForm({ ...form, is_recurring: e.target.checked, recurring_period: e.target.checked ? 'monthly' : '' })} />
                <div className="w-10 h-5 bg-dark-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
              <span className="text-sm text-dark-300">Recurring</span>
            </div>
            {form.is_recurring && (
              <div>
                <label className="label">Repeat Every</label>
                <select className="input" value={form.recurring_period}
                  onChange={e => setForm({ ...form, recurring_period: e.target.value })}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea className="input min-h-[70px] resize-none" placeholder="Optional notes..."
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">
              {expense ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteModal({ isOpen, onClose, onConfirm, expense }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl animate-slide-up">
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-danger-500/20 flex items-center justify-center mb-4">
            <Trash2 size={24} className="text-danger-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Delete Expense</h3>
          <p className="text-sm text-dark-400 mb-1">Are you sure you want to delete</p>
          <p className="text-sm font-semibold text-white mb-4">"{expense?.title}"?</p>
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

// ─── Main Expenses Page ───────────────────────────────────────────────────────
export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => { loadAll(); }, [dateRange, filterCategory, filterPayment, searchQuery]);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - parseInt(dateRange));
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const loadAll = async () => {
    setLoading(true);
    const { startDate, endDate } = getDateRange();
    const [expRes, catRes, sumRes, trendRes] = await Promise.all([
      window.electronAPI.expenses.getAll({
        startDate, endDate,
        categoryId: filterCategory || undefined,
        paymentMethod: filterPayment || undefined,
        search: searchQuery || undefined,
      }),
      window.electronAPI.expenses.getCategories(),
      window.electronAPI.expenses.getSummary({ startDate, endDate }),
      window.electronAPI.expenses.getMonthlyTrend(),
    ]);
    if (expRes.success) setExpenses(expRes.data);
    if (catRes.success) setCategories(catRes.data);
    if (sumRes.success) setSummary(sumRes);
    if (trendRes.success) setMonthlyTrend(trendRes.data);
    setLoading(false);
  };

  const handleSave = async (data) => {
    let res;
    if (data.id) {
      res = await window.electronAPI.expenses.update(data);
    } else {
      res = await window.electronAPI.expenses.create(data);
    }
    if (res.success) {
      toast.success(res.message);
      setShowModal(false);
      setEditingExpense(null);
      loadAll();
    } else {
      toast.error(res.message);
    }
  };

  const handleDelete = async () => {
    if (!deletingExpense) return;
    const res = await window.electronAPI.expenses.delete(deletingExpense.id);
    if (res.success) {
      toast.success(res.message);
      setShowDelete(false);
      setDeletingExpense(null);
      loadAll();
    } else {
      toast.error(res.message);
    }
  };

  const todayExpenses = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return expenses.filter(e => e.expense_date === today).reduce((s, e) => s + e.amount, 0);
  }, [expenses]);

  const topCategory = useMemo(() => {
    if (!summary?.data?.length) return null;
    return summary.data[0];
  }, [summary]);

  // Chart month formatter
  const formatMonth = (period) => {
    if (!period) return '';
    const [y, m] = period.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[parseInt(m) - 1] || period;
  };

  if (loading && !expenses.length) {
    return <div className="h-full flex items-center justify-center"><LoadingSpinner size={40} /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20">
              <Wallet size={22} className="text-red-400" />
            </div>
            Expenses
          </h1>
          <p className="text-dark-400 mt-1">Track and manage all your business expenses.</p>
        </div>
        <button onClick={() => { setEditingExpense(null); setShowModal(true); }} className="btn-primary btn-lg gap-2">
          <Plus size={18} /> Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expenses */}
        <div className="card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-red-500/10 to-transparent rounded-bl-full" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-danger-500/20">
                <TrendingDown size={20} className="text-danger-400" />
              </div>
              <span className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Total Expenses</span>
            </div>
            <p className="text-3xl font-bold text-white">{formatCurrency(summary?.grandTotal || 0)}</p>
            <p className="text-xs text-dark-500 mt-1">Last {dateRange} days</p>
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-full" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-warning-500/20">
                <Calendar size={20} className="text-warning-400" />
              </div>
              <span className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Today</span>
            </div>
            <p className="text-3xl font-bold text-white">{formatCurrency(todayExpenses)}</p>
            <p className="text-xs text-dark-500 mt-1">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Top Category */}
        <div className="card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-primary-500/20">
                <Receipt size={20} className="text-primary-400" />
              </div>
              <span className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Top Category</span>
            </div>
            <p className="text-3xl font-bold text-white">{topCategory?.category_name || '—'}</p>
            <p className="text-xs text-dark-500 mt-1">{topCategory ? formatCurrency(topCategory.total) : 'No data'}</p>
          </div>
        </div>

        {/* Expense Count */}
        <div className="card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-lg bg-blue-500/20">
                <Hash size={20} className="text-blue-400" />
              </div>
              <span className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Total Entries</span>
            </div>
            <p className="text-3xl font-bold text-white">{expenses.length}</p>
            <p className="text-xs text-dark-500 mt-1">In selected period</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-semibold text-white mb-4">Monthly Expense Trend</h3>
          {monthlyTrend.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-dark-400">No data available</div>
          ) : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="period" stroke="#94a3b8" fontSize={12} tickFormatter={formatMonth} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                    formatter={(value) => [formatCurrency(value), 'Expenses']}
                    labelFormatter={formatMonth}
                  />
                  <Area type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">By Category</h3>
          {!summary?.data?.length ? (
            <div className="h-[280px] flex items-center justify-center text-dark-400">No data</div>
          ) : (
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {summary.data.map((cat, i) => {
                const pct = summary.grandTotal > 0 ? (cat.total / summary.grandTotal * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.category_color || '#6b7280' }} />
                        <span className="text-sm text-white truncate">{cat.category_name}</span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <span className="text-sm font-bold text-white">{formatCurrency(cat.total)}</span>
                        <span className="text-xs text-dark-400 ml-1.5">({pct.toFixed(0)}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-dark-700 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: cat.category_color || '#6b7280' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input className="input pl-9" placeholder="Search expenses..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <select className="input w-auto" value={dateRange} onChange={e => setDateRange(e.target.value)}>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">This Year</option>
          </select>
          <select className="input w-auto" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input w-auto" value={filterPayment} onChange={e => setFilterPayment(e.target.value)}>
            <option value="">All Methods</option>
            {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Expense Records</h3>
          <span className="text-sm text-dark-400">{expenses.length} entries</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="th">Date</th>
                <th className="th">Title</th>
                <th className="th">Category</th>
                <th className="th">Payment</th>
                <th className="th text-right">Amount</th>
                <th className="th text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="td text-center text-dark-400 py-12">
                    <Wallet size={36} className="mx-auto mb-3 text-dark-600" />
                    <p className="font-medium">No expenses found</p>
                    <p className="text-xs mt-1">Add your first expense to start tracking.</p>
                  </td>
                </tr>
              ) : (
                expenses.map(exp => (
                  <tr key={exp.id} className="table-row group">
                    <td className="td whitespace-nowrap">
                      <span className="text-sm text-dark-300">{formatDate(exp.expense_date)}</span>
                    </td>
                    <td className="td">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate max-w-[200px]">{exp.title}</p>
                        {exp.description && <p className="text-xs text-dark-500 truncate max-w-[200px]">{exp.description}</p>}
                        {exp.is_recurring ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-primary-400 mt-0.5">
                            <RefreshCw size={10} /> {exp.recurring_period}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="td">
                      {exp.category_name ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                          style={{ backgroundColor: `${exp.category_color}15`, color: exp.category_color, borderColor: `${exp.category_color}30` }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: exp.category_color }} />
                          {exp.category_name}
                        </span>
                      ) : (
                        <span className="badge-gray">Uncategorized</span>
                      )}
                    </td>
                    <td className="td">
                      <span className="text-sm capitalize text-dark-300">{exp.payment_method}</span>
                      {exp.reference && <p className="text-[10px] text-dark-500">Ref: {exp.reference}</p>}
                    </td>
                    <td className="td text-right">
                      <span className="text-sm font-bold text-danger-400">{formatCurrency(exp.amount)}</span>
                    </td>
                    <td className="td text-center">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingExpense(exp); setShowModal(true); }}
                          className="p-1.5 rounded-lg hover:bg-dark-600 text-dark-400 hover:text-primary-400 transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => { setDeletingExpense(exp); setShowDelete(true); }}
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
      <ExpenseModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingExpense(null); }}
        onSave={handleSave}
        expense={editingExpense}
        categories={categories}
      />
      <DeleteModal
        isOpen={showDelete}
        onClose={() => { setShowDelete(false); setDeletingExpense(null); }}
        onConfirm={handleDelete}
        expense={deletingExpense}
      />
    </div>
  );
}
