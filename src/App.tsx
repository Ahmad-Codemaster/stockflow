import { lazy, Suspense } from 'react';
import { Warehouse } from 'lucide-react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ToastContainer from './components/Toast';
import { AppProvider, useApp } from './context';

// Lazy-loaded page components for optimal bundle splitting and fast mobile boot
const Categories = lazy(() => import('./pages/Categories'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Login = lazy(() => import('./pages/Login'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const ProductForm = lazy(() => import('./pages/ProductForm'));
const Products = lazy(() => import('./pages/Products'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const StockIn = lazy(() => import('./pages/StockIn'));
const StockOut = lazy(() => import('./pages/StockOut'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const TransactionDetail = lazy(() => import('./pages/TransactionDetail'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Users = lazy(() => import('./pages/Users'));

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
      <Layout>
        <Suspense fallback={<SessionLoadingScreen message="Loading page..." />}>
          {children}
        </Suspense>
      </Layout>
      <ToastContainer />
    </>
  );
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, isAuthLoading } = useApp();

  if (isAuthLoading) {
    return <SessionLoadingScreen />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
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
              <Suspense fallback={<SessionLoadingScreen message="Loading login..." />}>
                <Login />
                <ToastContainer />
              </Suspense>
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
              <AdminRoute>
                <ProductForm mode="add" />
              </AdminRoute>
            </ProtectedLayout>
          }
        />
        <Route
          path="/products/edit/:id"
          element={
            <ProtectedLayout>
              <AdminRoute>
                <ProductForm mode="edit" />
              </AdminRoute>
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
              <AdminRoute>
                <Users />
              </AdminRoute>
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
