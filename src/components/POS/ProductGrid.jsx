import React from 'react';
import { Package, Plus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatters';

export default function ProductGrid({ products, loading }) {
  const { addToCart } = useCart();

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="card h-32 animate-pulse bg-dark-800" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-dark-400">
        <Package size={48} className="mb-4 opacity-50" />
        <p>No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 auto-rows-max">
      {products.map(product => {
        const outOfStock = product.stock < 1;
        
        return (
          <div 
            key={product.id}
            onClick={() => !outOfStock && addToCart(product)}
            className={`card relative overflow-hidden cursor-pointer group transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary-500/50 flex flex-col justify-between min-h-[120px] ${
              outOfStock ? 'opacity-50 grayscale cursor-not-allowed' : ''
            }`}
          >
            <div>
              <p className="text-sm font-semibold text-white leading-tight mb-1 group-hover:text-primary-400 transition-colors line-clamp-2">
                {product.name}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-dark-400">{product.barcode || 'No barcode'}</span>
              </div>
            </div>
            
            <div className="flex items-end justify-between mt-4">
              <div>
                <p className="text-lg font-bold text-white">
                  {formatCurrency(product.price)}
                </p>
                <p className={`text-xs ${product.stock <= product.low_stock_threshold ? 'text-warning-400' : 'text-success-400'}`}>
                  {product.stock} {product.unit} left
                </p>
              </div>
              
              {!outOfStock && (
                <div className="w-8 h-8 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus size={16} />
                </div>
              )}
            </div>

            {outOfStock && (
              <div className="absolute inset-0 bg-dark-900/80 flex items-center justify-center backdrop-blur-[1px]">
                <span className="text-sm font-bold text-danger-500 border border-danger-500/50 px-2 py-1 rounded bg-danger-500/10 rotate-[-15deg]">
                  OUT OF STOCK
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
