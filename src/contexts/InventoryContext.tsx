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
      if (inventoryData) {
        setInventory(
          inventoryData.map((inv: any) => ({
            productId: inv.productId,
            currentStock: inv.currentStock,
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
    },
    [navigate, refreshData, showToast]
  );

  const updateProduct = useCallback(
    async (id: string, data: Partial<Product>) => {
      try {
        await api.products.update(id, data);
        await refreshData();
        showToast('success', 'Product updated successfully.');
        navigate('product-detail', id);
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
        await refreshData();
        showToast('success', 'Product archived successfully.');
        navigate('products');
      } catch (err: any) {
        showToast('error', err.message || 'Failed to delete product.');
      }
    },
    [navigate, refreshData, showToast]
  );

  const addCategory = useCallback(
    async (name: string): Promise<boolean> => {
      try {
        await api.categories.create({ name });
        await refreshData();
        showToast('success', `Category "${name}" added.`);
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
        await refreshData();
        showToast('success', 'Category updated.');
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
        await refreshData();
        showToast('success', 'Category deleted.');
      } catch (err: any) {
        showToast('error', err.message || 'Failed to delete category.');
      }
    },
    [refreshData, showToast]
  );

  const addSupplier = useCallback(
    async (data: Omit<Supplier, 'id'>) => {
      try {
        await api.suppliers.create(data);
        await refreshData();
        showToast('success', `Supplier "${data.name}" added.`);
      } catch (err: any) {
        showToast('error', err.message || 'Failed to add supplier.');
      }
    },
    [refreshData, showToast]
  );

  const updateSupplier = useCallback(
    async (id: string, data: Partial<Supplier>) => {
      try {
        await api.suppliers.update(id, data);
        await refreshData();
        showToast('success', 'Supplier updated.');
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
        await refreshData();
        showToast('success', 'Supplier deleted.');
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
        await refreshData();
        showToast(
          'success',
          `Stock In complete: +${quantity} units added (${result.productName}).`
        );
        navigate('transactions');
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
        await refreshData();
        showToast(
          'success',
          `Stock Out complete: -${quantity} units deducted (${result.productName}).`
        );
        navigate('transactions');
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
      setProducts([]);
      setCategories([]);
      setSuppliers([]);
      setInventory([]);
      setTransactions([]);
      await refreshData();
      showToast(
        'success',
        'Store wiped clean. 0 products, inventory, and transactions.'
      );
    } catch (err: any) {
      showToast('error', err.message || 'Failed to wipe store data.');
    }
  }, [refreshData, showToast]);

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
