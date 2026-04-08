import React from 'react';
import { Minus, Square, X, LogOut, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const winControls = [
    { icon: Minus, action: window.electronAPI?.window?.minimize },
    { icon: Square, action: window.electronAPI?.window?.maximize },
    { icon: X, action: window.electronAPI?.window?.close, hover: 'hover:bg-danger-600' },
  ];

  return (
    <header className="h-14 bg-dark-900 border-b border-dark-700 flex items-center justify-between drag-region relative z-30">
      <div className="pl-6 no-drag">
        {/* Placeholder for breadcrumbs or title */}
      </div>

      <div className="flex items-center no-drag h-full">
        {/* Actions */}
        <div className="flex items-center gap-4 px-4 border-r border-dark-700 h-full">
          <button className="text-dark-400 hover:text-white transition-colors relative">
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
          </button>
          <button 
            onClick={handleLogout}
            className="text-dark-400 hover:text-danger-400 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        {/* Window Controls */}
        <div className="flex h-full">
          {winControls.map((Control, i) => (
            <button
              key={i}
              onClick={Control.action}
              className={`h-full px-4 text-dark-400 hover:text-white transition-colors flex items-center justify-center ${Control.hover || 'hover:bg-dark-700'}`}
            >
              <Control.icon size={14} />
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
