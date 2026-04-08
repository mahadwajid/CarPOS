import React, { useState, useEffect } from 'react';
import { Search, Barcode } from 'lucide-react';
import ProductGrid from '../components/POS/ProductGrid';
import CartPanel from '../components/POS/CartPanel';
import Input from '../components/ui/Input';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  // Reference for barcode scanner input (focus trapping can be added here)
  const [barcodeInput, setBarcodeInput] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  // Barcode scanner listener (simulated by fast typing)
  useEffect(() => {
    let timeout;
    if (barcodeInput) {
      timeout = setTimeout(() => {
        handleBarcodeSubmit(barcodeInput);
        setBarcodeInput('');
      }, 100); // 100ms indicates scanner input
    }
    return () => clearTimeout(timeout);
  }, [barcodeInput]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignore if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Enter') {
        // If buffered input exists
      } else {
        setBarcodeInput(prev => prev + e.key);
      }
    };
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    const [prodRes, catRes] = await Promise.all([
      window.electronAPI.products.getAll(),
      window.electronAPI.products.getCategories()
    ]);
    if (prodRes.success) setProducts(prodRes.data);
    if (catRes.success) setCategories(catRes.data);
    setLoading(false);
  };

  const handleBarcodeSubmit = async (code) => {
    const res = await window.electronAPI.products.getByBarcode(code.trim());
    if (res.success && res.data) {
      if (res.data.stock > 0) {
        addToCart(res.data);
        toast.success(`Scanned: ${res.data.name}`);
      } else {
        toast.error(`Out of stock: ${res.data.name}`);
      }
    } else {
      toast.error('Product not found for this barcode');
    }
  };

  // Filter products based on search and selected category
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.barcode && p.barcode.includes(searchQuery));
    const matchesCategory = activeCategory === 'all' || p.category_id === parseInt(activeCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-6"> {/* Full viewport minus header, ignoring layout padding */}
      {/* Main product area */}
      <div className="flex-1 flex flex-col min-w-0 bg-dark-950 p-6">
        
        {/* Top Bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
            <input 
              type="text"
              placeholder="Search products by name or barcode..."
              className="input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-dark-800 rounded-lg border border-dark-700 text-sm text-dark-300 pointer-events-none">
            <Barcode size={18} className="text-primary-500" />
            Scanner Ready
          </div>
        </div>

        {/* Categories (Horizontal scrollable) */}
        <div className="flex overflow-x-auto gap-2 pb-4 mb-2 scrollbar-none">
          <CategoryButton 
            active={activeCategory === 'all'} 
            onClick={() => setActiveCategory('all')}
            label="All Categories"
          />
          {categories.map(cat => (
            <CategoryButton 
              key={cat.id} 
              active={activeCategory === String(cat.id)} 
              onClick={() => setActiveCategory(String(cat.id))}
              label={cat.name}
            />
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-2 pb-20">
          <ProductGrid products={filteredProducts} loading={loading} />
        </div>
      </div>

      {/* Right Sidebar (Cart) */}
      <CartPanel />

    </div>
  );
}

function CategoryButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active 
          ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' 
          : 'bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white border border-dark-700'
      }`}
    >
      {label}
    </button>
  );
}
