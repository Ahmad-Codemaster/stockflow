import type { Category, Product, Supplier, Transaction, User } from '../types';

export class ApiError extends Error {
  public code: string;
  public details?: any;
  public status: number;

  constructor(message: string, code = 'API_ERROR', status = 400, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const API_BASE = '/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Includes HTTP-only session cookie
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok || json.success === false) {
    const error = json.error || {};
    const message = error.message || response.statusText || 'An unexpected error occurred';
    const code = error.code || `HTTP_${response.status}`;
    throw new ApiError(message, code, response.status, error.details);
  }

  return json.data as T;
}

export const api = {
  // Auth API
  auth: {
    login: (email: string, password: string) =>
      request<{ user: User; sessionId: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    logout: () =>
      request<{ message: string }>('/auth/logout', {
        method: 'POST',
      }),
    me: () =>
      request<{ user: User }>('/auth/me'),
    changePassword: (currentPassword: string, newPassword: string) =>
      request<{ message: string }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
  },

  // Products API
  products: {
    list: (params?: { search?: string; categoryId?: string; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.categoryId && params.categoryId !== 'all') q.set('categoryId', params.categoryId);
      if (params?.status && params.status !== 'All') q.set('status', params.status);
      const query = q.toString() ? `?${q.toString()}` : '';
      return request<Product[]>(`/products${query}`);
    },
    get: (id: string) =>
      request<Product & { transactions?: Transaction[] }>(`/products/${id}`),
    create: (data: Omit<Product, 'id' | 'createdAt'> & { initialStock?: number }) =>
      request<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Product>) =>
      request<Product>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/products/${id}`, {
        method: 'DELETE',
      }),
  },

  // Categories API
  categories: {
    list: () =>
      request<Category[]>('/categories'),
    create: (data: { name: string; description?: string }) =>
      request<Category>('/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: { name?: string; description?: string }) =>
      request<Category>(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/categories/${id}`, {
        method: 'DELETE',
      }),
  },

  // Suppliers API
  suppliers: {
    list: () =>
      request<Supplier[]>('/suppliers'),
    create: (data: Omit<Supplier, 'id'>) =>
      request<Supplier>('/suppliers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Supplier>) =>
      request<Supplier>(`/suppliers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/suppliers/${id}`, {
        method: 'DELETE',
      }),
  },

  // Inventory & Stock Transactions API
  inventory: {
    list: (params?: { search?: string; categoryId?: string; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.categoryId && params.categoryId !== 'all') q.set('categoryId', params.categoryId);
      if (params?.status && params.status !== 'All') q.set('status', params.status);
      const query = q.toString() ? `?${q.toString()}` : '';
      return request<Array<{
        productId: string;
        productName: string;
        sku: string;
        categoryName: string;
        supplierName: string | null;
        currentStock: number;
        reorderLevel: number;
        status: 'In Stock' | 'Low Stock' | 'Out of Stock';
      }>>(`/inventory${query}`);
    },
    stockIn: (data: {
      productId: string;
      quantity: number;
      supplierId?: string | null;
      reference?: string;
      notes?: string;
    }) =>
      request<{
        transactionId: string;
        productId: string;
        productName: string;
        previousStock: number;
        newStock: number;
        status: string;
      }>('/inventory/stock-in', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    stockOut: (data: {
      productId: string;
      quantity: number;
      reference?: string;
      notes?: string;
    }) =>
      request<{
        transactionId: string;
        productId: string;
        productName: string;
        previousStock: number;
        newStock: number;
        status: string;
      }>('/inventory/stock-out', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    listTransactions: (params?: { type?: string; productId?: string; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.type && params.type !== 'all') q.set('type', params.type);
      if (params?.productId) q.set('productId', params.productId);
      if (params?.limit) q.set('limit', String(params.limit));
      const query = q.toString() ? `?${q.toString()}` : '';
      return request<Transaction[]>(`/inventory/transactions${query}`);
    },
    getTransaction: (id: string) =>
      request<Transaction>(`/inventory/transactions/${id}`),
  },

  // Reports API
  reports: {
    summary: () =>
      request<{
        totalProducts: number;
        totalStockUnits: number;
        totalValuation: number;
        inStockCount: number;
        lowStockCount: number;
        outOfStockCount: number;
        categoriesCount: number;
        suppliersCount: number;
        totalTransactions: number;
      }>('/reports/summary'),
    movement: () =>
      request<{
        totalIn: number;
        totalOut: number;
        totalAdjustments: number;
        recentMovements: any[];
      }>('/reports/movement'),
    lowStock: () =>
      request<Array<{
        id: string;
        name: string;
        sku: string;
        categoryName: string;
        supplierName: string;
        currentStock: number;
        reorderLevel: number;
        status: string;
      }>>('/reports/low-stock'),
    valuation: () =>
      request<Array<{
        categoryId: string;
        categoryName: string;
        productCount: number;
        itemCount: number;
        totalValue: number;
      }>>('/reports/valuation'),
  },

  // Users & Audit API
  users: {
    list: () =>
      request<User[]>('/users'),
    get: (id: string) =>
      request<User>(`/users/${id}`),
    create: (data: { name: string; email: string; role: 'ADMIN' | 'STAFF'; status?: 'Active' | 'Inactive'; password?: string }) =>
      request<User>('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<User> & { password?: string }) =>
      request<User>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deactivate: (id: string) =>
      request<User>(`/users/${id}/deactivate`, {
        method: 'PATCH',
      }),
    delete: (id: string) =>
      request<{ message: string }>(`/users/${id}`, {
        method: 'DELETE',
      }),
    auditLogs: (limit = 100) =>
      request<any[]>(`/users/audit-logs?limit=${limit}`),
  },

  // System Maintenance API
  system: {
    wipe: () =>
      request<{ message: string }>('/system/wipe', {
        method: 'POST',
      }),
  },
};

