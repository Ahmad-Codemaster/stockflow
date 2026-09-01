export type Role = 'ADMIN' | 'STAFF';
export type UserStatus = 'Active' | 'Inactive';
export type TransactionType = 'Stock In' | 'Stock Out' | 'Adjustment';
export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type Page =
  | 'login'
  | 'dashboard'
  | 'products'
  | 'product-detail'
  | 'product-add'
  | 'product-edit'
  | 'categories'
  | 'suppliers'
  | 'inventory'
  | 'stock-in'
  | 'stock-out'
  | 'transactions'
  | 'transaction-detail'
  | 'reports'
  | 'users'
  | 'settings';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  lastActivity: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  supplierId: string | null;
  price: number;
  reorderLevel: number;
  description: string;
  createdAt: string;
}

export interface InventoryRecord {
  productId: string;
  currentStock: number;
}

export interface Transaction {
  id: string;
  productId: string;
  type: TransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  performedBy: string;
  reference: string;
  notes: string;
  createdAt: string;
  supplierId?: string | null;
}

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'warning' | 'success' | 'error' | 'info';
  read: boolean;
  createdAt: string;
}
