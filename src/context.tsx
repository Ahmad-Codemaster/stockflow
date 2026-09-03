/**
 * StockFlow — Unified Application Context Adapter
 * 
 * Provides backward-compatible unified AppContext & useApp() hook
 * by composing domain contexts (AuthContext, InventoryContext, UIContext).
 */

import { AppProvider, useAuth, useInventory, useUI } from './contexts';
import type {
  Category,
  InventoryRecord,
  Notification,
  Page,
  Product,
  Supplier,
  Toast,
  Transaction,
  User,
} from './types';

export { AppProvider } from './contexts';
export * from './contexts';

export interface LoginResult {
  ok: boolean;
  code?: string;
  message?: string;
}

export interface AppContextValue {
  currentUser: User | null;
  currentPage: Page;
  selectedId: string | null;
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  inventory: InventoryRecord[];
  transactions: Transaction[];
  users: User[];
  isAuthLoading: boolean;
  toasts: Toast[];
  notifications: Notification[];
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  navigate: (page: Page, id?: string) => void;
  setPageSilent: (page: Page, id?: string) => void;
  addProduct: (
    data: Omit<Product, 'id' | 'createdAt'> & { initialStock?: number }
  ) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCategory: (name: string) => Promise<boolean>;
  updateCategory: (id: string, name: string) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<void>;
  addSupplier: (data: Omit<Supplier, 'id'>) => Promise<void>;
  updateSupplier: (id: string, data: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  stockIn: (
    productId: string,
    quantity: number,
    supplierId: string | null,
    reference: string,
    notes: string
  ) => Promise<void>;
  stockOut: (
    productId: string,
    quantity: number,
    reference: string,
    notes: string
  ) => Promise<boolean>;
  addUser: (data: {
    name: string;
    email: string;
    role: User['role'];
    status: User['status'];
    password?: string;
  }) => Promise<boolean>;
  updateUser: (
    id: string,
    data: Partial<User> & { password?: string }
  ) => Promise<boolean>;
  deleteUser: (id: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
  showToast: (type: Toast['type'], message: string) => void;
  dismissToast: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  getStockStatus: (productId: string) => 'In Stock' | 'Low Stock' | 'Out of Stock';
  getInventory: (productId: string) => number;
  skuExists: (sku: string, excludeId?: string) => boolean;
  refreshData: () => Promise<void>;
  wipeStoreData: () => Promise<void>;
}

export function useApp(): AppContextValue {
  const auth = useAuth();
  const inventory = useInventory();
  const ui = useUI();

  return {
    ...ui,
    ...inventory,
    ...auth,
    // explicitly combine any methods if needed
    refreshData: inventory.refreshData,
  };
}
