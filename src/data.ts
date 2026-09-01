import type { Category, InventoryRecord, Notification, Product, Supplier, Transaction, User } from './types';

export const initialUsers: User[] = [
  { id: 'u1', name: 'Ahmad Khan', email: 'ahmad@stockflow.com', role: 'ADMIN', status: 'Active', createdAt: '2024-01-15', lastActivity: '2026-08-30' },
  { id: 'u2', name: 'Ali Raza', email: 'ali@stockflow.com', role: 'STAFF', status: 'Active', createdAt: '2024-02-01', lastActivity: '2026-08-29' },
  { id: 'u3', name: 'Sara Ahmed', email: 'sara@stockflow.com', role: 'STAFF', status: 'Active', createdAt: '2024-03-10', lastActivity: '2026-08-28' },
  { id: 'u4', name: 'Omar Sheikh', email: 'omar@stockflow.com', role: 'STAFF', status: 'Inactive', createdAt: '2024-04-05', lastActivity: '2026-07-15' },
];

export const initialCategories: Category[] = [
  { id: 'c1', name: 'Computer Accessories', createdAt: '2024-01-15' },
  { id: 'c2', name: 'Cables', createdAt: '2024-01-15' },
  { id: 'c3', name: 'Office Equipment', createdAt: '2024-01-15' },
  { id: 'c4', name: 'Audio', createdAt: '2024-01-16' },
];

export const initialSuppliers: Supplier[] = [
  { id: 's1', name: 'TechSource Ltd', email: 'orders@techsource.com', phone: '+1-555-0101', address: '123 Tech Park, San Jose, CA 94105' },
  { id: 's2', name: 'Global Electronics', email: 'supply@globalelec.com', phone: '+1-555-0202', address: '456 Industrial Ave, Austin, TX 73301' },
  { id: 's3', name: 'OfficePro Supplies', email: 'sales@officepro.com', phone: '+1-555-0303', address: '789 Business Blvd, Chicago, IL 60601' },
];

export const initialProducts: Product[] = [
  { id: 'p1', name: 'Wireless Mouse', sku: 'WM-001', categoryId: 'c1', supplierId: 's1', price: 25.99, reorderLevel: 10, description: 'Ergonomic wireless mouse with USB receiver, 2.4GHz connection, 18-month battery life.', createdAt: '2024-01-20' },
  { id: 'p2', name: 'Mechanical Keyboard', sku: 'MK-002', categoryId: 'c1', supplierId: 's1', price: 89.99, reorderLevel: 5, description: 'Compact TKL mechanical keyboard with blue switches, white backlight.', createdAt: '2024-01-20' },
  { id: 'p3', name: 'USB-C Cable', sku: 'UC-003', categoryId: 'c2', supplierId: 's2', price: 12.99, reorderLevel: 20, description: '1.8m braided USB-C to USB-C cable, 100W fast charging, 10Gbps data.', createdAt: '2024-01-21' },
  { id: 'p4', name: 'Laptop Stand', sku: 'LS-004', categoryId: 'c3', supplierId: 's3', price: 49.99, reorderLevel: 5, description: 'Adjustable aluminum laptop stand, compatible with 10–17 inch laptops.', createdAt: '2024-01-21' },
  { id: 'p5', name: 'Webcam', sku: 'WC-005', categoryId: 'c1', supplierId: 's1', price: 79.99, reorderLevel: 10, description: '1080p Full HD webcam with built-in noise-cancelling microphone, auto-focus.', createdAt: '2024-02-01' },
  { id: 'p6', name: 'HDMI Cable', sku: 'HC-006', categoryId: 'c2', supplierId: 's2', price: 14.99, reorderLevel: 15, description: '2m HDMI 2.1 cable, supports 4K@120Hz and 8K@60Hz.', createdAt: '2024-02-01' },
  { id: 'p7', name: 'Office Headset', sku: 'OH-007', categoryId: 'c4', supplierId: 's3', price: 59.99, reorderLevel: 8, description: 'Over-ear USB headset with active noise-cancelling microphone, Teams certified.', createdAt: '2024-02-10' },
  { id: 'p8', name: 'Bluetooth Speaker', sku: 'BS-008', categoryId: 'c4', supplierId: 's2', price: 129.99, reorderLevel: 5, description: 'Portable Bluetooth 5.0 speaker, 24-hour battery life, IPX5 water resistant.', createdAt: '2024-02-10' },
];

export const initialInventory: InventoryRecord[] = [
  { productId: 'p1', currentStock: 4 },
  { productId: 'p2', currentStock: 23 },
  { productId: 'p3', currentStock: 0 },
  { productId: 'p4', currentStock: 15 },
  { productId: 'p5', currentStock: 8 },
  { productId: 'p6', currentStock: 35 },
  { productId: 'p7', currentStock: 3 },
  { productId: 'p8', currentStock: 12 },
];

export const initialTransactions: Transaction[] = [
  { id: 't1', productId: 'p2', type: 'Stock In', quantity: 10, previousStock: 13, newStock: 23, performedBy: 'Ahmad Khan', reference: 'PO-2026-001', notes: 'Regular stock replenishment from TechSource', createdAt: '2026-08-28 09:15', supplierId: 's1' },
  { id: 't2', productId: 'p6', type: 'Stock In', quantity: 20, previousStock: 15, newStock: 35, performedBy: 'Ali Raza', reference: 'PO-2026-002', notes: '', createdAt: '2026-08-28 11:30', supplierId: 's2' },
  { id: 't3', productId: 'p3', type: 'Stock Out', quantity: 5, previousStock: 5, newStock: 0, performedBy: 'Sara Ahmed', reference: 'SO-2026-015', notes: 'Office supply request — IT team', createdAt: '2026-08-29 08:45', supplierId: null },
  { id: 't4', productId: 'p1', type: 'Stock Out', quantity: 6, previousStock: 10, newStock: 4, performedBy: 'Ali Raza', reference: 'SO-2026-016', notes: 'IT department mouse replacement batch', createdAt: '2026-08-29 14:20', supplierId: null },
  { id: 't5', productId: 'p7', type: 'Stock Out', quantity: 5, previousStock: 8, newStock: 3, performedBy: 'Sara Ahmed', reference: 'SO-2026-017', notes: 'Customer order fulfillment — batch 3', createdAt: '2026-08-30 10:00', supplierId: null },
  { id: 't6', productId: 'p4', type: 'Stock In', quantity: 5, previousStock: 10, newStock: 15, performedBy: 'Ahmad Khan', reference: 'PO-2026-003', notes: 'Restocking from OfficePro Supplies', createdAt: '2026-08-30 11:15', supplierId: 's3' },
  { id: 't7', productId: 'p5', type: 'Adjustment', quantity: 2, previousStock: 6, newStock: 8, performedBy: 'Ahmad Khan', reference: 'ADJ-2026-001', notes: 'Inventory count correction after audit', createdAt: '2026-08-27 16:00', supplierId: null },
  { id: 't8', productId: 'p8', type: 'Stock In', quantity: 8, previousStock: 4, newStock: 12, performedBy: 'Ali Raza', reference: 'PO-2026-004', notes: '', createdAt: '2026-08-26 13:45', supplierId: 's2' },
];

export const initialNotifications: Notification[] = [
  { id: 'n1', message: 'Wireless Mouse is low on stock (4 units remaining).', type: 'warning', read: false, createdAt: '2026-08-30 10:30' },
  { id: 'n2', message: 'USB-C Cable is out of stock.', type: 'error', read: false, createdAt: '2026-08-29 08:45' },
  { id: 'n3', message: 'Office Headset stock is critically low (3 units).', type: 'warning', read: false, createdAt: '2026-08-30 10:00' },
  { id: 'n4', message: 'Stock-in completed: Mechanical Keyboard +10 units.', type: 'success', read: true, createdAt: '2026-08-28 09:15' },
  { id: 'n5', message: 'Stock-in completed: HDMI Cable +20 units.', type: 'success', read: true, createdAt: '2026-08-28 11:30' },
];
