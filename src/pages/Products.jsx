import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import ProductTable from '../components/Products/ProductTable';
import ProductForm from '../components/Products/ProductForm';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const res = await window.electronAPI.products.getAll();
    if (res.success) {
      setProducts(res.data);
    }
    setLoading(false);
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const res = await window.electronAPI.products.delete(id);
      if (res.success) {
        loadProducts();
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-center bg-dark-900 -mx-6 -mt-6 p-6 border-b border-dark-700 sticky top-0 z-10 w-[calc(100%+3rem)]">
        <div>
          <h1 className="page-title">Products Management</h1>
          <p className="text-dark-400 mt-1">Manage your catalog, stock, and pricing.</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus size={18} /> Add Product
        </Button>
      </div>

      <div className="card-sm flex flex-col sm:flex-row gap-4 justify-between bg-dark-800 border-dark-700">
        <div className="relative w-full sm:w-96 text-dark-300 focus-within:text-white">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={18} />
          <input 
            type="text"
            className="input pl-10 bg-dark-900 border-dark-700 w-full"
            placeholder="Search by name, barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {/* Future implementation: Category / Filters */}
          <Button variant="secondary" className="gap-2">
            <Filter size={16} /> Filters
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-20"><LoadingSpinner size={40} /></div>
      ) : (
        <ProductTable 
          products={filteredProducts} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
        />
      )}

      <ProductForm 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        onSuccess={loadProducts}
      />
    </div>
  );
}
