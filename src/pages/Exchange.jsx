import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeftRight, Search, Plus, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

/* ─── Inline small helper components ───────────────────────────── */

function ItemSearchBox({ label, color, selectedItems, onAdd, onRemove, onQtyChange }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounce = useRef(null);

  const handleSearch = (val) => {
    setQuery(val);
    clearTimeout(debounce.current);
    if (!val.trim()) { setResults([]); return; }
    debounce.current = setTimeout(async () => {
      setSearching(true);
      const res = await window.electronAPI.products.search(val);
      setResults(res.success ? res.data : []);
      setSearching(false);
    }, 300);
  };

  const addItem = (product) => {
    setQuery('');
    setResults([]);
    onAdd(product);
  };

  const borderColor  = color === 'red'   ? 'border-danger-500/40'   : 'border-success-500/40';
  const headerBg     = color === 'red'   ? 'bg-danger-900/30'        : 'bg-success-900/30';
  const headerText   = color === 'red'   ? 'text-danger-400'         : 'text-success-400';
  const addBtnColor  = color === 'red'   ? 'bg-danger-600 hover:bg-danger-500'  : 'bg-success-600 hover:bg-success-500';
  const totalColor   = color === 'red'   ? 'text-danger-400'         : 'text-success-400';

  const panelTotal = selectedItems.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div className={`rounded-xl border ${borderColor} bg-dark-800 flex flex-col`}>
      {/* Header */}
      <div className={`${headerBg} rounded-t-xl px-5 py-3 flex items-center gap-2`}>
        <span className={`text-sm font-bold uppercase tracking-wider ${headerText}`}>{label}</span>
      </div>

      {/* Search */}
      <div className="px-4 pt-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or barcode…"
            className="input pl-9 w-full text-sm"
          />
        </div>
        {results.length > 0 && (
          <div className="mt-1 bg-dark-700 border border-dark-600 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10 relative">
            {results.map(p => (
              <button
                key={p.id}
                onClick={() => addItem(p)}
                className="w-full text-left px-4 py-2 hover:bg-dark-600 transition-colors flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-medium text-white">{p.name}</p>
                  <p className="text-xs text-dark-400">{p.barcode || 'No barcode'} · Stock: {p.stock}</p>
                </div>
                <p className="text-sm font-bold text-white ml-4">{formatCurrency(p.price)}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-2 space-y-2 min-h-[120px]">
        {selectedItems.length === 0 && (
          <p className="text-sm text-dark-500 text-center mt-6">No items added yet.</p>
        )}
        {selectedItems.map((item, i) => (
          <div key={i} className="flex items-center gap-3 bg-dark-700/60 rounded-lg px-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{item.name}</p>
              <p className="text-xs text-dark-400">{formatCurrency(item.price)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onQtyChange(item.id, item.quantity - 1)}
                className="w-6 h-6 rounded bg-dark-600 hover:bg-dark-500 text-white text-sm flex items-center justify-center"
              >−</button>
              <span className="w-6 text-center text-sm font-bold text-white">{item.quantity}</span>
              <button
                onClick={() => onQtyChange(item.id, item.quantity + 1)}
                className="w-6 h-6 rounded bg-dark-600 hover:bg-dark-500 text-white text-sm flex items-center justify-center"
              >+</button>
            </div>
            <p className={`text-sm font-bold w-20 text-right ${totalColor}`}>
              {formatCurrency(item.price * item.quantity)}
            </p>
            <button onClick={() => onRemove(item.id)} className="text-dark-500 hover:text-danger-400 transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {/* Panel Total */}
      <div className={`px-5 py-3 border-t border-dark-700 flex justify-between items-center rounded-b-xl`}>
        <span className="text-xs text-dark-400 uppercase tracking-wider font-semibold">{label} Total</span>
        <span className={`text-lg font-bold ${totalColor}`}>{formatCurrency(panelTotal)}</span>
      </div>
    </div>
  );
}

/* ─── Settlement Badge ──────────────────────────────────────────── */
function SettlementBadge({ net }) {
  if (net === 0) return (
    <div className="flex items-center gap-2 bg-dark-700 rounded-xl px-6 py-4 text-center">
      <CheckCircle2 size={20} className="text-success-400" />
      <span className="text-success-400 font-bold text-lg">Even Exchange — No Payment Needed</span>
    </div>
  );
  if (net > 0) return (
    <div className="flex flex-col items-center bg-primary-900/30 border border-primary-500/40 rounded-xl px-6 py-4 text-center">
      <span className="text-xs text-primary-400 uppercase font-semibold tracking-wider mb-1">Customer Pays Difference</span>
      <span className="text-3xl font-bold text-white">{formatCurrency(net)}</span>
    </div>
  );
  return (
    <div className="flex flex-col items-center bg-warning-900/20 border border-warning-500/40 rounded-xl px-6 py-4 text-center">
      <span className="text-xs text-warning-400 uppercase font-semibold tracking-wider mb-1">Store Refunds Customer</span>
      <span className="text-3xl font-bold text-white">{formatCurrency(Math.abs(net))}</span>
    </div>
  );
}

/* ─── Main Exchange Page ────────────────────────────────────────── */
export default function Exchange() {
  const { user } = useAuth();

  const [returnItems, setReturnItems]     = useState([]); // items coming back in
  const [outgoingItems, setOutgoingItems] = useState([]); // items going out
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes]                 = useState('');
  const [processing, setProcessing]       = useState(false);
  const [lastExchange, setLastExchange]   = useState(null);

  /* ── Helpers ── */
  const addReturn   = (p) => addToList(setReturnItems, p);
  const addOutgoing = (p) => addToList(setOutgoingItems, p);

  function addToList(setter, product) {
    setter(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) {
        if (exists.quantity >= product.stock && setter === setOutgoingItems) {
          toast.error(`Only ${product.stock} in stock`);
          return prev;
        }
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }

  function removeReturn(id)   { setReturnItems(prev => prev.filter(i => i.id !== id)); }
  function removeOutgoing(id) { setOutgoingItems(prev => prev.filter(i => i.id !== id)); }

  function changeReturnQty(id, qty) {
    if (qty < 1) { removeReturn(id); return; }
    setReturnItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  }

  function changeOutgoingQty(id, qty) {
    if (qty < 1) { removeOutgoing(id); return; }
    setOutgoingItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      if (qty > i.stock) { toast.error(`Only ${i.stock} in stock`); return i; }
      return { ...i, quantity: qty };
    }));
  }

  const returnTotal   = returnItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const outgoingTotal = outgoingItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const netDifference = outgoingTotal - returnTotal;

  function reset() {
    setReturnItems([]);
    setOutgoingItems([]);
    setNotes('');
    setPaymentMethod('cash');
    setLastExchange(null);
  }

  async function handleSubmit() {
    if (!returnItems.length && !outgoingItems.length) {
      toast.error('Add at least one item to process an exchange.');
      return;
    }

    setProcessing(true);

    const payload = {
      returnItems: returnItems.map(i => ({
        product_id: i.id, product_name: i.name,
        price: i.price, cost: i.cost, quantity: i.quantity,
        subtotal: i.price * i.quantity,
      })),
      outgoingItems: outgoingItems.map(i => ({
        product_id: i.id, product_name: i.name,
        price: i.price, cost: i.cost, quantity: i.quantity,
        subtotal: i.price * i.quantity,
      })),
      settlement: {
        type: netDifference > 0 ? 'charge' : netDifference < 0 ? 'refund' : 'even',
        amount: Math.abs(netDifference),
        payment_method: paymentMethod,
      },
      cashier_id: user?.id,
      notes,
    };

    const res = await window.electronAPI.sales.exchange(payload);
    setProcessing(false);

    if (res.success) {
      setLastExchange({ ref: res.exchangeRef, net: res.netTotal });
      toast.success(`Exchange ${res.exchangeRef} processed!`);
      setReturnItems([]);
      setOutgoingItems([]);
      setNotes('');
    } else {
      toast.error(res.message || 'Exchange failed.');
    }
  }

  /* ─── Success Screen ─── */
  if (lastExchange) {
    return (
      <div className="h-full flex items-center justify-center animate-fade-in">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 rounded-full bg-success-500/20 border-2 border-success-500 flex items-center justify-center mx-auto">
            <CheckCircle2 size={40} className="text-success-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Exchange Complete!</h2>
            <p className="text-dark-400 mt-1">Reference: <span className="text-primary-400 font-mono font-semibold">{lastExchange.ref}</span></p>
          </div>
          <SettlementBadge net={lastExchange.net} />
          <button onClick={reset} className="btn-primary flex items-center gap-2 mx-auto px-8">
            <RefreshCw size={16} /> Process Another Exchange
          </button>
        </div>
      </div>
    );
  }

  /* ─── Main Screen ─── */
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary-900/50 border border-primary-700">
          <ArrowLeftRight size={22} className="text-primary-400" />
        </div>
        <div>
          <h1 className="page-title">Product Exchange</h1>
          <p className="text-dark-400 mt-0.5 text-sm">Admin-only · Swap products and settle the difference.</p>
        </div>
      </div>

      {/* Two-Panel Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ItemSearchBox
          label="🔴  Items Being Returned"
          color="red"
          selectedItems={returnItems}
          onAdd={addReturn}
          onRemove={removeReturn}
          onQtyChange={changeReturnQty}
        />
        <ItemSearchBox
          label="🟢  Replacement Items"
          color="green"
          selectedItems={outgoingItems}
          onAdd={addOutgoing}
          onRemove={removeOutgoing}
          onQtyChange={changeOutgoingQty}
        />
      </div>

      {/* Settlement & Confirm */}
      <div className="card space-y-5">
        <h3 className="text-md font-semibold text-white border-b border-dark-700 pb-3">Settlement Summary</h3>

        {/* Totals row */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-danger-900/20 border border-danger-500/30 rounded-xl py-3 px-4">
            <p className="text-xs text-danger-400 uppercase font-semibold mb-1">Returned Value</p>
            <p className="text-xl font-bold text-white">{formatCurrency(returnTotal)}</p>
          </div>
          <div className="flex items-center justify-center">
            <ArrowLeftRight size={22} className="text-dark-500" />
          </div>
          <div className="bg-success-900/20 border border-success-500/30 rounded-xl py-3 px-4">
            <p className="text-xs text-success-400 uppercase font-semibold mb-1">Replacement Value</p>
            <p className="text-xl font-bold text-white">{formatCurrency(outgoingTotal)}</p>
          </div>
        </div>

        {/* Net settlement */}
        <SettlementBadge net={netDifference} />

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-dark-400 mb-1.5">Payment Method</label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="input w-full">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="wallet">Wallet</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1.5">Notes (optional)</label>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Reason for exchange…"
              className="input w-full"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={reset} className="btn-secondary">Clear All</button>
          <button
            onClick={handleSubmit}
            disabled={processing || (!returnItems.length && !outgoingItems.length)}
            className="btn-primary flex items-center gap-2 px-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing
              ? <><RefreshCw size={16} className="animate-spin" /> Processing…</>
              : <><ArrowLeftRight size={16} /> Confirm Exchange</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
