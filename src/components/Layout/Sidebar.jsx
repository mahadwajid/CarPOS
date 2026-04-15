import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, 
  Archive, FileText, BarChart3, Users, Settings, ArrowLeftRight, Wallet, Handshake
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();
  
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/pos', label: 'POS Terminal', icon: ShoppingCart },
    { to: '/products', label: 'Products', icon: Package },
    { to: '/inventory', label: 'Inventory', icon: Archive },
    { to: '/sales', label: 'Sales History', icon: FileText },
    { to: '/customers', label: 'Customers', icon: Users },
  ];

  const adminItems = [
    { to: '/exchange', label: 'Exchange / Return', icon: ArrowLeftRight },
    { to: '/expenses', label: 'Expenses', icon: Wallet },
    { to: '/borrowed-sales', label: 'Borrowed Sales', icon: Handshake },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-dark-900 border-r border-dark-700 flex flex-col h-full transform transition-transform duration-300 z-20">
      <div className="h-14 flex items-center px-6 border-b border-dark-700 drag-region">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
          CarPOS
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="text-xs font-semibold text-dark-500 px-3 mb-2 uppercase tracking-wider">Main</div>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
        
        {user?.role === 'admin' && (
          <>
            <div className="text-xs font-semibold text-dark-500 px-3 mt-6 mb-2 uppercase tracking-wider">Admin</div>
            {adminItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </div>

      <div className="p-4 border-t border-dark-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-900/50 flex items-center justify-center text-primary-400 font-bold border border-primary-800">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-dark-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
