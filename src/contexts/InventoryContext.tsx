import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { Category, InventoryRecord, Product, Supplier, Transaction } from '../types';
import { useUI } from './UIContext';

export interface InventoryContextValue {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  inventory: InventoryRecord[];
  transactions: Transaction[];
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
  getStockStatus: (productId: string) => 'In Stock' | 'Low Stock' | 'Out of Stock';
  getInventory: (productId: string) => number;
  skuExists: (sku: string, excludeId?: string) => boolean;
  refreshData: () => Promise<void>;
  wipeStoreData: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const { showToast, navigate } = useUI();

  const refreshData = useCallback(async (options?: { skipStatic?: boolean }) => {
    try {
      const promises: [Promise<any>, Promise<any>, Promise<any>, Promise<any>] = [
        api.products.list().catch(() => null),
        options?.skipStatic ? Promise.resolve(null) : api.categories.list().catch(() => null),
        options?.skipStatic ? Promise.resolve(null) : api.suppliers.list().catch(() => null),
        api.inventory.listTransactions().catch(() => null),
      ];

      const [productsData, categoriesData, suppliersData, transactionsData] =
        await Promise.all(promises);

      if (productsData) {
        setProducts(
          productsData.map((p: any) => ({
            id: p.id,
            name: p.name,
            sku: p.sku,
            categoryId: p.categoryId,
            supplierId: p.supplierId,
            price: p.price,
            reorderLevel: p.reorderLevel,
            description: p.description || '',
            createdAt:
              typeof p.createdAt === 'string'
                ? p.createdAt.split('T')[0]
                : new Date(p.createdAt).toISOString().split('T')[0],
          }))
        );
        // Automatically derive inventory records directly from products with zero redundant query
        setInventory(
          productsData.map((p: any) => ({
            productId: p.id,
            currentStock: p.quantity ?? 0,
          }))
        );
      }
      if (categoriesData) {
        setCategories(
          categoriesData.map((c: any) => ({
            id: c.id,
            name: c.name,
            createdAt:
              typeof c.createdAt === 'string'
                ? c.createdAt.split('T')[0]
                : new Date(c.createdAt).toISOString().split('T')[0],
          }))
        );
      }
      if (suppliersData) {
        setSuppliers(
          suppliersData.map((sup: any) => ({
            id: sup.id,
            name: sup.name,
            email: sup.email,
            phone: sup.phone,
            address: sup.address,
          }))
        );
      }
      if (transactionsData) {
        setTransactions(
          transactionsData.map((t: any) => ({
            id: t.id,
            productId: t.productId,
            type: t.type as any,
            quantity: t.quantity,
            previousStock: t.previousStock,
            newStock: t.newStock,
            performedBy: t.performedBy,
            reference: t.reference || '',
            notes: t.notes || '',
            createdAt:
              typeof t.createdAt === 'string'
                ? t.createdAt.replace('T', ' ').slice(0, 16)
                : new Date(t.createdAt).toISOString().replace('T', ' ').slice(0, 16),
            supplierId: t.supplierId,
          }))
        );
      }
    } catch {
      // Fallback gracefully
    }
  }, []);

  const getInventory = useCallback(
    (productId: string): number => {
      return inventory.find(i => i.productId === productId)?.currentStock ?? 0;
    },
    [inventory]
  );

  const getStockStatus = useCallback(
    (productId: string): 'In Stock' | 'Low Stock' | 'Out of Stock' => {
      const product = products.find(p => p.id === productId);
      if (!product) return 'Out of Stock';
      const stock = inventory.find(i => i.productId === productId)?.currentStock ?? 0;
      if (stock <= 0) return 'Out of Stock';
      if (stock <= product.reorderLevel) return 'Low Stock';
      return 'In Stock';
    },
    [products, inventory]
  );

  const skuExists = useCallback(
    (sku: string, excludeId?: string): boolean => {
      return products.some(
        p => p.sku.toLowerCase() === sku.toLowerCase() && p.id !== excludeId
      );
    },
    [products]
  );

  const addProduct = useCallback(
    async (
      data: Omit<Product, 'id' | 'createdAt'> & { initialStock?: number }
    ) => {
      try {
        const created = await api.products.create({
          name: data.name,
          sku: data.sku,
          categoryId: data.categoryId,
          supplierId: data.supplierId,
          price: data.price,
          reorderLevel: data.reorderLevel,
          description: data.description,
          initialStock: data.initialStock,
        });

        const initialStock = data.initialStock || 0;
        const newProduct: Product = {
          id: created.id,
          name: created.name,
          sku: created.sku,
          categoryId: created.categoryId,
          supplierId: created.supplierId,
          price: created.price,
          reorderLevel: created.reorderLevel,
          description: created.description || '',
          createdAt: new Date().toISOString().split('T')[0],
        };

        // Instant local state updates
        setProducts((prev) => [newProduct, ...prev]);
        setInventory((prev) => [...prev, { productId: created.id, currentStock: initialStock }]);
        showToast('success', `Product "${data.name}" added successfully.`);
        navigate('products');

        // Silent background sync
        refreshData({ skipStatic: true });
      } catch (err: any) {
        showToast('error', err.message || 'Failed to create product.');
      }
    },
    [navigate, refreshData, showToast]
  );

  const updateProduct = useCallback(
    async (id: string, data: Partial<Product>) => {
      try {
        const updated = await api.products.update(id, data);
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
        );
        showToast('success', 'Product updated successfully.');
        navigate('product-detail', id);
        refreshData({ skipStatic: true });
      } catch (err: any) {
        showToast('error', err.message || 'Failed to update product.');
      }
    },
    [navigate, refreshData, showToast]
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      try {
        await api.products.delete(id);
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setInventory((prev) => prev.filter((i) => i.productId !== id));
        showToast('success', 'Product archived successfully.');
        navigate('products');
        refreshData({ skipStatic: true });
      } catch (err: any) {
        showToast('error', err.message || 'Failed to delete product.');
      }
    },
    [navigate, refreshData, showToast]
  );

  const addCategory = useCallback(
    async (name: string): Promise<boolean> => {
      try {
        const created = await api.categories.create({ name });
        setCategories((prev) => [
          ...prev,
          {
            id: created.id,
            name: created.name,
            createdAt: new Date().toISOString().split('T')[0],
          },
        ]);
        showToast('success', `Category "${name}" added.`);
        refreshData();
        return true;
      } catch (err: any) {
        showToast('error', err.message || 'Failed to add category.');
        return false;
      }
    },
    [refreshData, showToast]
  );

  const updateCategory = useCallback(
    async (id: string, name: string): Promise<boolean> => {
      try {
        await api.categories.update(id, { name });
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, name } : c))
        );
        showToast('success', 'Category updated.');
        refreshData();
        return true;
      } catch (err: any) {
        showToast('error', err.message || 'Failed to update category.');
        return false;
      }
    },
    [refreshData, showToast]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      try {
        await api.categories.delete(id);
        setCategories((prev) => prev.filter((c) => c.id !== id));
        showToast('success', 'Category deleted.');
        refreshData();
      } catch (err: any) {
        showToast('error', err.message || 'Failed to delete category.');
      }
    },
    [refreshData, showToast]
  );

  const addSupplier = useCallback(
    async (data: Omit<Supplier, 'id'>) => {
      try {
        const created = await api.suppliers.create(data);
        setSuppliers((prev) => [...prev, created]);
        showToast('success', `Supplier "${data.name}" added.`);
        refreshData();
      } catch (err: any) {
        showToast('error', err.message || 'Failed to add supplier.');
      }
    },
    [refreshData, showToast]
  );

  const updateSupplier = useCallback(
    async (id: string, data: Partial<Supplier>) => {
      try {
        const updated = await api.suppliers.update(id, data);
        setSuppliers((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
        );
        showToast('success', 'Supplier updated.');
        refreshData();
      } catch (err: any) {
        showToast('error', err.message || 'Failed to update supplier.');
      }
    },
    [refreshData, showToast]
  );

  const deleteSupplier = useCallback(
    async (id: string) => {
      try {
        await api.suppliers.delete(id);
        setSuppliers((prev) => prev.filter((s) => s.id !== id));
        showToast('success', 'Supplier deleted.');
        refreshData();
      } catch (err: any) {
        showToast('error', err.message || 'Failed to delete supplier.');
      }
    },
    [refreshData, showToast]
  );

  const stockIn = useCallback(
    async (
      productId: string,
      quantity: number,
      supplierId: string | null,
      reference: string,
      notes: string
    ) => {
      try {
        const result = await api.inventory.stockIn({
          productId,
          quantity,
          supplierId,
          reference,
          notes,
        });

        // 1. Immediately update inventory in React memory
        setInventory((prev) =>
          prev.map((i) =>
            i.productId === productId ? { ...i, currentStock: result.newStock } : i
          )
        );

        // 2. Immediately prepend new transaction to ledger in React memory
        const newTxn: Transaction = {
          id: result.transactionId || `txn-${Date.now()}`,
          productId,
          type: 'Stock In',
          quantity,
          previousStock: result.previousStock,
          newStock: result.newStock,
          performedBy: 'Current User',
          reference: reference || '',
          notes: notes || '',
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          supplierId,
        };
        setTransactions((prev) => [newTxn, ...prev]);

        // 3. Immediately show feedback and navigate with zero wait
        showToast(
          'success',
          `Stock In complete: +${quantity} units added (${result.productName}).`
        );
        navigate('transactions');

        // 4. Background non-blocking sync (only dynamic data)
        refreshData({ skipStatic: true });
      } catch (err: any) {
        showToast('error', err.message || 'Stock In operation failed.');
      }
    },
    [navigate, refreshData, showToast]
  );

  const stockOut = useCallback(
    async (
      productId: string,
      quantity: number,
      reference: string,
      notes: string
    ): Promise<boolean> => {
      try {
        const result = await api.inventory.stockOut({
          productId,
          quantity,
          reference,
          notes,
        });

        // 1. Immediately update inventory in React memory
        setInventory((prev) =>
          prev.map((i) =>
            i.productId === productId ? { ...i, currentStock: result.newStock } : i
          )
        );

        // 2. Immediately prepend new transaction to ledger in React memory
        const newTxn: Transaction = {
          id: result.transactionId || `txn-${Date.now()}`,
          productId,
          type: 'Stock Out',
          quantity,
          previousStock: result.previousStock,
          newStock: result.newStock,
          performedBy: 'Current User',
          reference: reference || '',
          notes: notes || '',
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
        setTransactions((prev) => [newTxn, ...prev]);

        // 3. Immediately show feedback and navigate with zero wait
        showToast(
          'success',
          `Stock Out complete: -${quantity} units deducted (${result.productName}).`
        );
        navigate('transactions');

        // 4. Background non-blocking sync
        refreshData({ skipStatic: true });
        return true;
      } catch (err: any) {
        showToast('error', err.message || 'Stock Out operation failed.');
        return false;
      }
    },
    [navigate, refreshData, showToast]
  );

  const wipeStoreData = useCallback(async () => {
    try {
      await api.system.wipe();
      // Clear all local state immediately — no competing refreshData() call
      setProducts([]);
      setCategories([]);
      setSuppliers([]);
      setInventory([]);
      setTransactions([]);
      navigate('dashboard');
      showToast(
        'success',
        'Store wiped to a clean slate. All products, inventory, and transactions cleared.'
      );
    } catch (err: any) {
      showToast('error', err.message || 'Failed to wipe store data.');
    }
  }, [navigate, showToast]);

  return (
    <InventoryContext.Provider
      value={{
        products,
        categories,
        suppliers,
        inventory,
        transactions,
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
        getStockStatus,
        getInventory,
        skuExists,
        refreshData,
        wipeStoreData,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory(): InventoryContextValue {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider');
  return ctx;
}
