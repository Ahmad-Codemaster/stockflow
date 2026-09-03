import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Notification, Page, Toast } from '../types';

export interface UIContextValue {
  currentPage: Page;
  selectedId: string | null;
  toasts: Toast[];
  notifications: Notification[];
  showToast: (type: Toast['type'], message: string) => void;
  dismissToast: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  setPageSilent: (page: Page, id?: string) => void;
  navigate: (page: Page, id?: string) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

function getPageFromPath(path: string): { page: Page; id: string | null } {
  if (path === '/login') return { page: 'login', id: null };
  if (path === '/' || path === '/dashboard') return { page: 'dashboard', id: null };
  if (path === '/products') return { page: 'products', id: null };
  if (path === '/products/add') return { page: 'product-add', id: null };
  if (path.startsWith('/products/edit/')) return { page: 'product-edit', id: path.replace('/products/edit/', '') };
  if (path.startsWith('/products/')) return { page: 'product-detail', id: path.replace('/products/', '') };
  if (path === '/categories') return { page: 'categories', id: null };
  if (path === '/suppliers') return { page: 'suppliers', id: null };
  if (path === '/inventory') return { page: 'inventory', id: null };
  if (path.startsWith('/stock-in')) return { page: 'stock-in', id: null };
  if (path.startsWith('/stock-out')) return { page: 'stock-out', id: null };
  if (path.startsWith('/transactions/')) return { page: 'transaction-detail', id: path.replace('/transactions/', '') };
  if (path === '/transactions') return { page: 'transactions', id: null };
  if (path === '/reports') return { page: 'reports', id: null };
  if (path === '/users') return { page: 'users', id: null };
  if (path === '/settings') return { page: 'settings', id: null };
  return { page: 'dashboard', id: null };
}

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const routerNavigate = useNavigate();
  const location = useLocation();

  const { page: currentPage, id: selectedId } = useMemo(
    () => getPageFromPath(location.pathname),
    [location.pathname]
  );

  const showToast = useCallback((type: Toast['type'], message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const setPageSilent = useCallback((_page: Page, _id?: string) => {
    // Derived automatically from current URL pathname
  }, []);

  const navigate = useCallback(
    (page: Page, id?: string) => {
      switch (page) {
        case 'login':
          routerNavigate('/login');
          break;
        case 'dashboard':
          routerNavigate('/dashboard');
          break;
        case 'products':
          routerNavigate('/products');
          break;
        case 'product-detail':
          routerNavigate(id ? `/products/${id}` : '/products');
          break;
        case 'product-add':
          routerNavigate('/products/add');
          break;
        case 'product-edit':
          routerNavigate(id ? `/products/edit/${id}` : '/products');
          break;
        case 'categories':
          routerNavigate('/categories');
          break;
        case 'suppliers':
          routerNavigate('/suppliers');
          break;
        case 'inventory':
          routerNavigate('/inventory');
          break;
        case 'stock-in':
          routerNavigate(id ? `/stock-in?product=${id}` : '/stock-in');
          break;
        case 'stock-out':
          routerNavigate(id ? `/stock-out?product=${id}` : '/stock-out');
          break;
        case 'transactions':
          routerNavigate('/transactions');
          break;
        case 'transaction-detail':
          routerNavigate(id ? `/transactions/${id}` : '/transactions');
          break;
        case 'reports':
          routerNavigate('/reports');
          break;
        case 'users':
          routerNavigate('/users');
          break;
        case 'settings':
          routerNavigate('/settings');
          break;
        default:
          routerNavigate('/dashboard');
      }
    },
    [routerNavigate]
  );

  return (
    <UIContext.Provider
      value={{
        currentPage,
        selectedId,
        toasts,
        notifications,
        showToast,
        dismissToast,
        markNotificationRead,
        markAllNotificationsRead,
        setPageSilent,
        navigate,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
