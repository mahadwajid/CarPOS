import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if there's a user session in localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('carpos_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user from local storage', e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const res = await window.electronAPI.auth.login({ username, password });
      if (res.success) {
        setUser(res.user);
        localStorage.setItem('carpos_user', JSON.stringify(res.user));
        toast.success(`Welcome back, ${res.user.name}`);
        return true;
      } else {
        toast.error(res.message || 'Login failed');
        return false;
      }
    } catch (err) {
      toast.error('Connection error');
      return false;
    }
  };

  const logout = async () => {
    await window.electronAPI.auth.logout();
    setUser(null);
    localStorage.removeItem('carpos_user');
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-dark-900 text-white">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
