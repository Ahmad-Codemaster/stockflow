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

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useApp();

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
  const { currentUser } = useApp();

  return (
    <Routes>
        <Route
          path="/login"
          element={
            currentUser ? (
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
