import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import toast from 'react-hot-toast';

export default function ProductForm({ isOpen, onClose, product = null, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    price: '',
    cost: '',
    stock: '',
    low_stock_threshold: '10',
    category_id: '',
    unit: 'pcs',
    description: '',
    is_active: true
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setFormData({ ...product, is_active: Boolean(product.is_active) });
      } else {
        setFormData({
          name: '', barcode: '', price: '', cost: '', stock: '', 
          low_stock_threshold: '10', category_id: '', unit: 'pcs', 
          description: '', is_active: true
        });
      }
    }
  }, [isOpen, product]);

  const loadCategories = async () => {
    const res = await window.electronAPI.products.getCategories();
    if (res.success) setCategories(res.data);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Parse numbers
    const payload = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      cost: parseFloat(formData.cost) || 0,
      stock: parseInt(formData.stock) || 0,
      low_stock_threshold: parseInt(formData.low_stock_threshold) || 0,
      category_id: formData.category_id ? parseInt(formData.category_id) : null,
      is_active: formData.is_active ? 1 : 0
    };

    const action = product ? window.electronAPI.products.update : window.electronAPI.products.create;
    const res = await action(payload);

    if (res.success) {
      toast.success(product ? 'Product updated' : 'Product created');
      onSuccess();
      onClose();
    } else {
      toast.error(res.message);
    }
    setIsLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product ? 'Edit Product' : 'Add New Product'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="grid grid-cols-2 gap-4">
          <Input label="Product Name *" name="name" value={formData.name} onChange={handleChange} required />
          <Input label="Barcode" name="barcode" value={formData.barcode} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Selling Price *" name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} required />
          <Input label="Cost Price" name="cost" type="number" step="0.01" value={formData.cost} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input 
            label="Initial Stock" name="stock" type="number" value={formData.stock} onChange={handleChange} 
            disabled={!!product} // Disable changing stock directly if editing
          />
          <Input label="Low Stock Alert" name="low_stock_threshold" type="number" value={formData.low_stock_threshold} onChange={handleChange} />
          <Input label="Unit (e.g. pcs, kg)" name="unit" value={formData.unit} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category</label>
            <select 
              name="category_id" 
              value={formData.category_id || ''} 
              onChange={handleChange}
              className="input"
            >
              <option value="">-- None --</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center mt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" name="is_active" 
                checked={formData.is_active} onChange={handleChange}
                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 bg-dark-700 border-dark-600"
              />
              <span className="text-sm font-medium text-white">Product is Active</span>
            </label>
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea 
            name="description" 
            value={formData.description} 
            onChange={handleChange}
            className="input h-20 resize-none"
          ></textarea>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-dark-700">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
