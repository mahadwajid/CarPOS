import React from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { CartProvider } from './context/CartContext'
import Layout from './components/Layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import POS from './pages/POS'
import Products from './pages/Products'
import Inventory from './pages/Inventory'
import Sales from './pages/Sales'
import Reports from './pages/Reports'
import Customers from './pages/Customers'
import Settings from './pages/Settings'

function PrivateRoute({ children, adminOnly = false }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  if (!user) return <Routes><Route path="*" element={<Login />} /></Routes>

  return (
    <CartProvider>
      <Layout>
        <Routes>
          <Route path="/"           element={<Dashboard />} />
          <Route path="/pos"        element={<POS />} />
          <Route path="/products"   element={<PrivateRoute><Products /></PrivateRoute>} />
          <Route path="/inventory"  element={<PrivateRoute><Inventory /></PrivateRoute>} />
          <Route path="/sales"      element={<Sales />} />
          <Route path="/reports"    element={<PrivateRoute adminOnly><Reports /></PrivateRoute>} />
          <Route path="/customers"  element={<Customers />} />
          <Route path="/settings"   element={<PrivateRoute adminOnly><Settings /></PrivateRoute>} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </CartProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Router>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
                borderRadius: '10px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#22c55e', secondary: '#0f172a' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#0f172a' } },
            }}
          />
        </Router>
      </SettingsProvider>
    </AuthProvider>
  )
}
