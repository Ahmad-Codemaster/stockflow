/**
 * ============================================================================
 * UNIFIED APPLICATION CONTEXT ADAPTER (`src/context.tsx`)
 * ============================================================================
 * What this module does:
 * - Implements the Adapter Pattern for frontend state management.
 * - Composes three dedicated domain contexts:
 *   1. `AuthContext`: Manages user login/logout, session restoration, and role state.
 *   2. `InventoryContext`: Manages catalog entities, stock mutations, and ledger history.
 *   3. `UIContext`: Manages navigation, toast alerts, and modal dialog states.
 * 
 * Why Context Separation Matters (Interview Talking Point):
 * - A monolithic context causes the ENTIRE component tree to re-render whenever
 *   ANY state property changes (e.g. a toast appearing would re-render the product table).
 * - Splitting state into domain slices (`Auth`, `Inventory`, `UI`) minimizes unnecessary re-renders.
 * - `useApp()` is provided as a unified facade hook so existing components can access
 *   all methods with clean, ergonomic ergonomics.
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
  isMobileSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  toggleDesktopSidebar: () => void;
  closeMobileSidebar: () => void;
  openMobileSidebar: () => void;
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
