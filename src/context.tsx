import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from './api/client';
import type { Category, InventoryRecord, Notification, Page, Product, Supplier, Toast, Transaction, User } from './types';

interface AppState {
  currentUser: User | null;
  currentPage: Page;
  selectedId: string | null;
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  inventory: InventoryRecord[];
  transactions: Transaction[];
  users: User[];
  toasts: Toast[];
  notifications: Notification[];
}

export interface LoginResult {
  ok: boolean;
  code?: string;
  message?: string;
}

export interface AppContextValue extends AppState {
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  navigate: (page: Page, id?: string) => void;
  setPageSilent: (page: Page, id?: string) => void;
  addProduct: (data: Omit<Product, 'id' | 'createdAt'> & { initialStock?: number }) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<boolean>;
  updateCategory: (id: string, name: string) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<void>;
  addSupplier: (data: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (id: string, data: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  stockIn: (productId: string, quantity: number, supplierId: string | null, reference: string, notes: string) => Promise<void>;
  stockOut: (productId: string, quantity: number, reference: string, notes: string) => Promise<boolean>;
  addUser: (data: { name: string; email: string; role: User['role']; status: User['status']; password?: string }) => Promise<boolean>;
  updateUser: (id: string, data: Partial<User> & { password?: string }) => Promise<boolean>;
  deleteUser: (id: string) => Promise<void>;
  showToast: (type: Toast['type'], message: string) => void;
  dismissToast: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  getStockStatus: (productId: string) => 'In Stock' | 'Low Stock' | 'Out of Stock';
  getInventory: (productId: string) => number;
  skuExists: (sku: string, excludeId?: string) => boolean;
  refreshData: () => Promise<void>;
  resetDatabase: () => Promise<void>;
  wipeStoreData: () => Promise<void>;
  seedDemoData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentUser: null,
    currentPage: 'login',
    selectedId: null,
    products: [],
    categories: [],
    suppliers: [],
    inventory: [],
    transactions: [],
    users: [],
    toasts: [],
    notifications: [],
  });

  const routerNavigate = useNavigate();

  const showToast = useCallback((type: Toast['type'], message: string) => {
    const id = `toast-${Date.now()}`;
    setState(s => ({ ...s, toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => {
      setState(s => ({ ...s, toasts: s.toasts.filter(t => t.id !== id) }));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setState(s => ({ ...s, toasts: s.toasts.filter(t => t.id !== id) }));
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const [productsData, categoriesData, suppliersData, inventoryData, transactionsData] =
        await Promise.all([
          api.products.list().catch(() => null),
          api.categories.list().catch(() => null),
          api.suppliers.list().catch(() => null),
          api.inventory.list().catch(() => null),
          api.inventory.listTransactions().catch(() => null),
        ]);

      setState(s => {
        const next = { ...s };
        if (productsData) {
          next.products = productsData.map((p: any) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            categoryId: p.categoryId,
            supplierId: p.supplierId,
            price: p.price,
            reorderLevel: p.reorderLevel,
            description: p.description || '',
            createdAt: typeof p.createdAt === 'string' ? p.createdAt.split('T')[0] : new Date(p.createdAt).toISOString().split('T')[0],
          }));
        }
        if (categoriesData) {
          next.categories = categoriesData.map((c: any) => ({
            id: c.id,
            name: c.name,
            createdAt: typeof c.createdAt === 'string' ? c.createdAt.split('T')[0] : new Date(c.createdAt).toISOString().split('T')[0],
          }));
        }
        if (suppliersData) {
          next.suppliers = suppliersData.map((sup: any) => ({
            id: sup.id,
            name: sup.name,
            email: sup.email,
            phone: sup.phone,
            address: sup.address,
          }));
        }
        if (inventoryData) {
          next.inventory = inventoryData.map((inv: any) => ({
            productId: inv.productId,
            currentStock: inv.currentStock,
          }));
        }
        if (transactionsData) {
          next.transactions = transactionsData.map((t: any) => ({
            id: t.id,
            productId: t.productId,
            type: t.type as any,
            quantity: t.quantity,
            previousStock: t.previousStock,
            newStock: t.newStock,
            performedBy: t.performedBy,
            reference: t.reference || '',
            notes: t.notes || '',
            createdAt: typeof t.createdAt === 'string' ? t.createdAt.replace('T', ' ').slice(0, 16) : new Date(t.createdAt).toISOString().replace('T', ' ').slice(0, 16),
            supplierId: t.supplierId,
          }));
        }
        return next;
      });

      // Try fetching users if user is admin
      api.users.list().then(usersData => {
        if (usersData) {
          setState(s => ({
            ...s,
            users: usersData.map((u: any) => ({
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              status: u.status,
              createdAt: typeof u.createdAt === 'string' ? u.createdAt.split('T')[0] : new Date(u.createdAt).toISOString().split('T')[0],
              lastActivity: new Date().toISOString().split('T')[0],
            })),
          }));
        }
      }).catch(() => {});
    } catch {
      // Fallback gracefully
    }
  }, []);

  // Check current session on mount
  useEffect(() => {
    api.auth.me()
      .then(res => {
        if (res.user) {
          setState(s => ({ ...s, currentUser: res.user }));
          refreshData();
        }
      })
      .catch(() => {
        // No active session -> remain on login
      });
  }, [refreshData]);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      const res = await api.auth.login(email, password);
      setState(s => ({ ...s, currentUser: res.user, currentPage: 'dashboard' }));
      await refreshData();
      routerNavigate('/dashboard');
      showToast('success', `Welcome back, ${res.user.name}!`);
      return { ok: true };
    } catch (err: any) {
      if (err instanceof ApiError) {
        return {
          ok: false,
          code: err.code,
          message: err.message,
        };
      }
      return {
        ok: false,
        code: 'NETWORK_ERROR',
        message: err.message || 'Unable to connect to the authentication server.',
      };
    }
  }, [refreshData, routerNavigate, showToast]);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignore network failures on logout
    } finally {
      setState(s => ({ ...s, currentUser: null, currentPage: 'login', selectedId: null }));
      routerNavigate('/login');
      showToast('info', 'You have been logged out.');
    }
  }, [routerNavigate, showToast]);

  const setPageSilent = useCallback((page: Page, id?: string) => {
    setState(s => {
      if (s.currentPage === page && s.selectedId === (id ?? null)) return s;
      return { ...s, currentPage: page, selectedId: id ?? null };
    });
  }, []);

  const navigate = useCallback((page: Page, id?: string) => {
    setState(s => ({ ...s, currentPage: page, selectedId: id ?? null }));
    switch (page) {
      case 'login': routerNavigate('/login'); break;
      case 'dashboard': routerNavigate('/dashboard'); break;
      case 'products': routerNavigate('/products'); break;
      case 'product-detail': routerNavigate(id ? `/products/${id}` : '/products'); break;
      case 'product-add': routerNavigate('/products/add'); break;
      case 'product-edit': routerNavigate(id ? `/products/edit/${id}` : '/products'); break;
      case 'categories': routerNavigate('/categories'); break;
      case 'suppliers': routerNavigate('/suppliers'); break;
      case 'inventory': routerNavigate('/inventory'); break;
      case 'stock-in': routerNavigate(id ? `/stock-in?product=${id}` : '/stock-in'); break;
      case 'stock-out': routerNavigate(id ? `/stock-out?product=${id}` : '/stock-out'); break;
      case 'transactions': routerNavigate('/transactions'); break;
      case 'transaction-detail': routerNavigate(id ? `/transactions/${id}` : '/transactions'); break;
      case 'reports': routerNavigate('/reports'); break;
      case 'users': routerNavigate('/users'); break;
      case 'settings': routerNavigate('/settings'); break;
      default: routerNavigate('/dashboard');
    }
  }, [routerNavigate]);

  const getInventory = useCallback((productId: string): number => {
    return state.inventory.find(i => i.productId === productId)?.currentStock ?? 0;
  }, [state.inventory]);

  const getStockStatus = useCallback((productId: string): 'In Stock' | 'Low Stock' | 'Out of Stock' => {
    const product = state.products.find(p => p.id === productId);
    if (!product) return 'Out of Stock';
    const stock = state.inventory.find(i => i.productId === productId)?.currentStock ?? 0;
    if (stock <= 0) return 'Out of Stock';
    if (stock <= product.reorderLevel) return 'Low Stock';
    return 'In Stock';
  }, [state.products, state.inventory]);

  const skuExists = useCallback((sku: string, excludeId?: string): boolean => {
    return state.products.some(p => p.sku.toLowerCase() === sku.toLowerCase() && p.id !== excludeId);
  }, [state.products]);

  const addProduct = useCallback(async (data: Omit<Product, 'id' | 'createdAt'> & { initialStock?: number }) => {
    try {
      await api.products.create({
        name: data.name,
        sku: data.sku,
        categoryId: data.categoryId,
        supplierId: data.supplierId,
        price: data.price,
        reorderLevel: data.reorderLevel,
        description: data.description,
        initialStock: data.initialStock,
      });
      await refreshData();
      showToast('success', `Product "${data.name}" added successfully.`);
      navigate('products');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to create product.');
    }
  }, [navigate, refreshData, showToast]);

  const updateProduct = useCallback(async (id: string, data: Partial<Product>) => {
    try {
      await api.products.update(id, data);
      await refreshData();
      showToast('success', 'Product updated successfully.');
      navigate('product-detail', id);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update product.');
    }
  }, [navigate, refreshData, showToast]);

  const deleteProduct = useCallback(async (id: string) => {
    try {
      await api.products.delete(id);
      await refreshData();
      showToast('success', 'Product archived successfully.');
      navigate('products');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete product.');
    }
  }, [navigate, refreshData, showToast]);

  const addCategory = useCallback(async (name: string): Promise<boolean> => {
    try {
      await api.categories.create({ name });
      await refreshData();
      showToast('success', `Category "${name}" added.`);
      return true;
    } catch (err: any) {
      showToast('error', err.message || 'Failed to add category.');
      return false;
    }
  }, [refreshData, showToast]);

  const updateCategory = useCallback(async (id: string, name: string): Promise<boolean> => {
    try {
      await api.categories.update(id, { name });
      await refreshData();
      showToast('success', 'Category updated.');
      return true;
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update category.');
      return false;
    }
  }, [refreshData, showToast]);

  const deleteCategory = useCallback(async (id: string) => {
    try {
      await api.categories.delete(id);
      await refreshData();
      showToast('success', 'Category deleted.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete category.');
    }
  }, [refreshData, showToast]);

  const addSupplier = useCallback(async (data: Omit<Supplier, 'id'>) => {
    try {
      await api.suppliers.create(data);
      await refreshData();
      showToast('success', `Supplier "${data.name}" added.`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to add supplier.');
    }
  }, [refreshData, showToast]);

  const updateSupplier = useCallback(async (id: string, data: Partial<Supplier>) => {
    try {
      await api.suppliers.update(id, data);
      await refreshData();
      showToast('success', 'Supplier updated.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update supplier.');
    }
  }, [refreshData, showToast]);

  const deleteSupplier = useCallback(async (id: string) => {
    try {
      await api.suppliers.delete(id);
      await refreshData();
      showToast('success', 'Supplier deleted.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete supplier.');
    }
  }, [refreshData, showToast]);

  const stockIn = useCallback(async (productId: string, quantity: number, supplierId: string | null, reference: string, notes: string) => {
    try {
      const result = await api.inventory.stockIn({
        productId,
        quantity,
        supplierId,
        reference,
        notes,
      });
      await refreshData();
      showToast('success', `Stock In complete: +${quantity} units added (${result.productName}).`);
      navigate('transactions');
    } catch (err: any) {
      showToast('error', err.message || 'Stock In operation failed.');
    }
  }, [navigate, refreshData, showToast]);

  const stockOut = useCallback(async (productId: string, quantity: number, reference: string, notes: string): Promise<boolean> => {
    try {
      const result = await api.inventory.stockOut({
        productId,
        quantity,
        reference,
        notes,
      });
      await refreshData();
      showToast('success', `Stock Out complete: -${quantity} units deducted (${result.productName}).`);
      navigate('transactions');
      return true;
    } catch (err: any) {
      showToast('error', err.message || 'Stock Out operation failed.');
      return false;
    }
  }, [navigate, refreshData, showToast]);

  const addUser = useCallback(async (data: { name: string; email: string; role: User['role']; status: User['status']; password?: string }): Promise<boolean> => {
    try {
      await api.users.create(data);
      await refreshData();
      showToast('success', `User "${data.name}" added successfully.`);
      return true;
    } catch (err: any) {
      showToast('error', err.message || 'Failed to add user.');
      return false;
    }
  }, [refreshData, showToast]);

  const updateUser = useCallback(async (id: string, data: Partial<User> & { password?: string }): Promise<boolean> => {
    try {
      await api.users.update(id, data);
      await refreshData();
      showToast('success', 'User updated successfully.');
      return true;
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update user.');
      return false;
    }
  }, [refreshData, showToast]);

  const deleteUser = useCallback(async (id: string) => {
    try {
      await api.users.delete(id);
      await refreshData();
      showToast('success', 'User removed from system.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete user.');
    }
  }, [refreshData, showToast]);

  const markNotificationRead = useCallback((id: string) => {
    setState(s => ({
      ...s,
      notifications: s.notifications.map(n => (n.id === id ? { ...n, read: true } : n)),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState(s => ({
      ...s,
      notifications: s.notifications.map(n => ({ ...n, read: true })),
    }));
  }, []);

  const wipeStoreData = useCallback(async () => {
    try {
      await api.system.wipe();
      setState(s => ({
        ...s,
        products: [],
        categories: [],
        suppliers: [],
        inventory: [],
        transactions: [],
      }));
      await refreshData();
      showToast('success', 'Store wiped clean. 0 products, inventory, and transactions.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to wipe store data.');
    }
  }, [refreshData, showToast]);

  const seedDemoData = useCallback(async () => {
    try {
      await api.system.seed();
      await refreshData();
      showToast('success', 'Factory demo fixtures loaded successfully.');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to seed demo data.');
    }
  }, [refreshData, showToast]);

  const resetDatabase = useCallback(async () => {
    await seedDemoData();
  }, [seedDemoData]);

  return (
    <AppContext.Provider
      value={{
        ...state,
        login,
        logout,
        navigate,
        setPageSilent,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        stockIn,
        stockOut,
        addUser,
        updateUser,
        deleteUser,
        showToast,
        dismissToast,
        markNotificationRead,
        markAllNotificationsRead,
        getStockStatus,
        getInventory,
        skuExists,
        refreshData,
        resetDatabase,
        wipeStoreData,
        seedDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
