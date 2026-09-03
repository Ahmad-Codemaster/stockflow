import { Warehouse } from 'lucide-react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';
import { AppProvider, useApp } from './context';
import Categories from './pages/Categories';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Login from './pages/Login';
import ProductDetail from './pages/ProductDetail';
import ProductForm from './pages/ProductForm';
import Products from './pages/Products';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import StockIn from './pages/StockIn';
import StockOut from './pages/StockOut';
import Suppliers from './pages/Suppliers';
import TransactionDetail from './pages/TransactionDetail';
import Transactions from './pages/Transactions';
import Users from './pages/Users';

function SessionLoadingScreen({ message = 'Restoring secure session...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-4 animate-pulse">
        <Warehouse className="text-blue-400" size={24} />
      </div>
      <div className="flex items-center gap-2.5 text-slate-400 text-xs font-medium">
        <div className="w-3.5 h-3.5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <span>{message}</span>
      </div>
    </div>
  );
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isAuthLoading } = useApp();

  if (isAuthLoading) {
    return <SessionLoadingScreen />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Layout>{children}</Layout>
      <ToastContainer />
    </>
  );
}

function AppRoutes() {
  const { currentUser, isAuthLoading } = useApp();

  return (
    <Routes>
        <Route
          path="/login"
          element={
            isAuthLoading ? (
              <SessionLoadingScreen message="Verifying session..." />
            ) : currentUser ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <>
                <Login />
                <ToastContainer />
              </>
            )
          }
        />
        <Route
          path="/"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedLayout>
              <Products />
            </ProtectedLayout>
          }
        />
        <Route
          path="/products/add"
          element={
            <ProtectedLayout>
              <ProductForm mode="add" />
            </ProtectedLayout>
          }
        />
        <Route
          path="/products/edit/:id"
          element={
            <ProtectedLayout>
              <ProductForm mode="edit" />
            </ProtectedLayout>
          }
        />
        <Route
          path="/products/:id"
          element={
            <ProtectedLayout>
              <ProductDetail />
            </ProtectedLayout>
          }
        />
        <Route
          path="/categories"
          element={
            <ProtectedLayout>
              <Categories />
            </ProtectedLayout>
          }
        />
        <Route
          path="/suppliers"
          element={
            <ProtectedLayout>
              <Suppliers />
            </ProtectedLayout>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedLayout>
              <Inventory />
            </ProtectedLayout>
          }
        />
        <Route
          path="/stock-in"
          element={
            <ProtectedLayout>
              <StockIn />
            </ProtectedLayout>
          }
        />
        <Route
          path="/stock-out"
          element={
            <ProtectedLayout>
              <StockOut />
            </ProtectedLayout>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedLayout>
              <Transactions />
            </ProtectedLayout>
          }
        />
        <Route
          path="/transactions/:id"
          element={
            <ProtectedLayout>
              <TransactionDetail />
            </ProtectedLayout>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedLayout>
              <Reports />
            </ProtectedLayout>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedLayout>
              <Users />
            </ProtectedLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedLayout>
              <Settings />
            </ProtectedLayout>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
