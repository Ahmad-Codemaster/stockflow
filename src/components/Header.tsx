import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Bell,
  Boxes,
  Check,
  ChevronRight,
  Command,
  CornerDownLeft,
  FileText,
  FolderTree,
  LayoutDashboard,
  Menu,
  Package,
  PlusCircle,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Tag,
  Truck,
  User as UserIcon,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context';
import type { Page } from '../types';
import { InstallAppButton } from './InstallAppPrompt';
import { Badge } from './ui';

const pageLabels: Record<string, string[]> = {
  dashboard: ['Dashboard'],
  products: ['Products'],
  'product-detail': ['Products', 'Product Details'],
  'product-add': ['Products', 'Add Product'],
  'product-edit': ['Products', 'Edit Product'],
  categories: ['Categories'],
  suppliers: ['Suppliers'],
  inventory: ['Inventory'],
  'stock-in': ['Inventory', 'Stock In'],
  'stock-out': ['Inventory', 'Stock Out'],
  transactions: ['Transactions'],
  'transaction-detail': ['Transactions', 'Transaction Details'],
  reports: ['Reports'],
  users: ['Users'],
  settings: ['Settings'],
};

interface AppPageItem {
  id: string;
  page: Page;
  title: string;
  subtitle: string;
  keywords: string[];
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge: string;
  adminOnly?: boolean;
}

const APP_PAGES: AppPageItem[] = [
  {
    id: 'page-dashboard',
    page: 'dashboard',
    title: 'Dashboard Overview',
    subtitle: 'System KPIs, stock status distribution, and quick actions',
    keywords: ['dashboard', 'overview', 'kpi', 'metrics', 'stats', 'analytics', 'home', 'summary'],
    icon: LayoutDashboard,
    badge: 'Page',
  },
  {
    id: 'page-products',
    page: 'products',
    title: 'Products Catalog',
    subtitle: 'Master product directory, prices, reorder limits, and SKUs',
    keywords: ['products', 'catalog', 'items', 'master', 'skus', 'inventory items'],
    icon: Package,
    badge: 'Page',
  },
  {
    id: 'page-product-add',
    page: 'product-add',
    title: 'Add New Product',
    subtitle: 'Create a new master SKU and configure initial stock threshold',
    keywords: ['add product', 'new product', 'create product', 'create sku', 'add item'],
    icon: PlusCircle,
    badge: 'Admin',
    adminOnly: true,
  },
  {
    id: 'page-inventory',
    page: 'inventory',
    title: 'Inventory Monitor',
    subtitle: 'Live stock levels, warehouse health, and threshold triggers',
    keywords: ['inventory', 'stock levels', 'stock monitor', 'reorder', 'warehouse', 'quantities', 'low stock'],
    icon: Boxes,
    badge: 'Page',
  },
  {
    id: 'page-stock-in',
    page: 'stock-in',
    title: 'Stock In / Receiving',
    subtitle: 'Receive inbound inventory shipments from vendors and suppliers',
    keywords: ['stock in', 'receive', 'receiving', 'purchase order', 'inbound', 'restock', 'goods receipt'],
    icon: ArrowDownLeft,
    badge: 'Action',
  },
  {
    id: 'page-stock-out',
    page: 'stock-out',
    title: 'Stock Out / Dispatch',
    subtitle: 'Fulfill outbound orders, customer dispatches, and sales',
    keywords: ['stock out', 'dispatch', 'fulfillment', 'ship', 'outbound', 'orders', 'sales order', 'delivery'],
    icon: ArrowUpRight,
    badge: 'Action',
  },
  {
    id: 'page-transactions',
    page: 'transactions',
    title: 'Transaction Ledger',
    subtitle: 'Immutable audit log of all stock movements and adjustments',
    keywords: ['transactions', 'ledger', 'audit log', 'movements', 'history', 'audit trail'],
    icon: ArrowLeftRight,
    badge: 'Page',
  },
  {
    id: 'page-categories',
    page: 'categories',
    title: 'Product Categories',
    subtitle: 'Manage catalog classifications and product grouping taxonomy',
    keywords: ['categories', 'category', 'taxonomy', 'groups', 'classification'],
    icon: FolderTree,
    badge: 'Admin',
    adminOnly: true,
  },
  {
    id: 'page-suppliers',
    page: 'suppliers',
    title: 'Supplier Directory',
    subtitle: 'Vendor contact information, phone numbers, and addresses',
    keywords: ['suppliers', 'vendors', 'distributors', 'directory', 'contacts'],
    icon: Truck,
    badge: 'Admin',
    adminOnly: true,
  },
  {
    id: 'page-reports',
    page: 'reports',
    title: 'Operational Reports',
    subtitle: 'Stock valuation, low stock alerts, and movement reports',
    keywords: ['reports', 'analytics', 'valuation', 'stock summary', 'export', 'financials'],
    icon: FileText,
    badge: 'Page',
  },
  {
    id: 'page-users',
    page: 'users',
    title: 'User Management',
    subtitle: 'Provision accounts, assign Staff/Admin roles, and security',
    keywords: ['users', 'team', 'staff', 'members', 'roles', 'permissions', 'accounts'],
    icon: ShieldCheck,
    badge: 'Admin',
    adminOnly: true,
  },
  {
    id: 'page-settings',
    page: 'settings',
    title: 'System Settings',
    subtitle: 'Profile settings, password update, and preferences',
    keywords: ['settings', 'profile', 'password', 'security', 'preferences', 'configuration'],
    icon: Settings,
    badge: 'Page',
  },
];

type SearchTab = 'all' | 'products' | 'transactions' | 'categories' | 'suppliers' | 'pages' | 'users';

interface FlatResultItem {
  id: string;
  type: 'product' | 'transaction' | 'category' | 'supplier' | 'page' | 'user';
  section: string;
  title: string;
  subtitle: string;
  badge?: {
    text: string;
    variant: 'default' | 'success' | 'warning' | 'danger' | 'purple' | 'info';
  };
  extra?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
  onSelect: () => void;
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || !text) return <>{text}</>;
  const trimmed = query.trim();
  if (!trimmed) return <>{text}</>;

  const index = text.toLowerCase().indexOf(trimmed.toLowerCase());
  if (index === -1) return <>{text}</>;

  const before = text.substring(0, index);
  const match = text.substring(index, index + trimmed.length);
  const after = text.substring(index + trimmed.length);

  return (
    <>
      {before}
      <mark className="bg-indigo-100 text-indigo-900 font-semibold rounded-xs px-0.5">{match}</mark>
      {after}
    </>
  );
}

export default function Header() {
  const {
    currentUser,
    currentPage,
    products,
    categories,
    suppliers,
    inventory,
    transactions,
    users,
    navigate,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    toggleSidebar,
    isSidebarCollapsed,
  } = useApp();

  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [showNotif, setShowNotif] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser?.role === 'ADMIN';
  const unreadCount = notifications.filter((n) => !n.read).length;
  const crumbs = pageLabels[currentPage] ?? ['Dashboard'];

  function getStockForProduct(productId: string) {
    return inventory.find((i) => i.productId === productId)?.currentStock ?? 0;
  }

  // Keyboard shortcut listener: Cmd+K / Ctrl+K or "/"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearch(true);
        inputRef.current?.focus();
        return;
      }
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setShowSearch(true);
        inputRef.current?.focus();
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const closeSearch = () => {
    setShowSearch(false);
    setSearch('');
    setActiveTab('all');
    setSelectedIndex(0);
    inputRef.current?.blur();
  };

  // Perform search across all entities
  const q = search.trim().toLowerCase();

  const matchedProducts = useMemo(() => {
    if (!q) return [];
    return products.filter((p) => {
      const catName = categories.find((c) => c.id === p.categoryId)?.name.toLowerCase() ?? '';
      const supName = suppliers.find((s) => s.id === p.supplierId)?.name.toLowerCase() ?? '';
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        catName.includes(q) ||
        supName.includes(q)
      );
    });
  }, [products, categories, suppliers, q]);

  const matchedTransactions = useMemo(() => {
    if (!q) return [];
    return transactions.filter((t) => {
      const prod = products.find((p) => p.id === t.productId);
      const prodName = prod ? prod.name.toLowerCase() : '';
      const prodSku = prod ? prod.sku.toLowerCase() : '';
      return (
        t.reference.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q)) ||
        (t.performedBy && t.performedBy.toLowerCase().includes(q)) ||
        prodName.includes(q) ||
        prodSku.includes(q)
      );
    });
  }, [transactions, products, q]);

  const matchedCategories = useMemo(() => {
    if (!q) return [];
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, q]);

  const matchedSuppliers = useMemo(() => {
    if (!q) return [];
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
    );
  }, [suppliers, q]);

  const matchedPages = useMemo(() => {
    if (!q) return [];
    return APP_PAGES.filter((item) => {
      if (item.adminOnly && !isAdmin) return false;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q))
      );
    });
  }, [isAdmin, q]);

  const matchedUsers = useMemo(() => {
    if (!q || !isAdmin) return [];
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.status.toLowerCase().includes(q)
    );
  }, [users, isAdmin, q]);

  const totalMatches =
    matchedProducts.length +
    matchedTransactions.length +
    matchedCategories.length +
    matchedSuppliers.length +
    matchedPages.length +
    matchedUsers.length;

  // Flatten active items for display & arrow key navigation
  const flatItems: FlatResultItem[] = useMemo(() => {
    if (!q) return [];

    const items: FlatResultItem[] = [];

    // 1. Products
    if (activeTab === 'all' || activeTab === 'products') {
      const sliceLimit = activeTab === 'all' ? 4 : matchedProducts.length;
      matchedProducts.slice(0, sliceLimit).forEach((p) => {
        const stock = getStockForProduct(p.id);
        const cat = categories.find((c) => c.id === p.categoryId);
        const stockVariant =
          stock === 0 ? 'danger' : stock <= p.reorderLevel ? 'warning' : 'success';
        const stockLabel =
          stock === 0 ? 'Out of stock' : stock <= p.reorderLevel ? `Low: ${stock}` : `${stock} in stock`;

        items.push({
          id: `prod-${p.id}`,
          type: 'product',
          section: 'Products',
          title: p.name,
          subtitle: `SKU: ${p.sku}${cat ? ` • ${cat.name}` : ''}`,
          badge: { text: stockLabel, variant: stockVariant },
          extra: `$${p.price.toFixed(2)}`,
          icon: Package,
          iconBg: 'bg-indigo-50 text-indigo-600',
          iconColor: 'text-indigo-600',
          onSelect: () => {
            navigate('product-detail', p.id);
            closeSearch();
          },
        });
      });
    }

    // 2. Transactions
    if (activeTab === 'all' || activeTab === 'transactions') {
      const sliceLimit = activeTab === 'all' ? 4 : matchedTransactions.length;
      matchedTransactions.slice(0, sliceLimit).forEach((t) => {
        const prod = products.find((p) => p.id === t.productId);
        const isStockIn = t.type === 'Stock In';
        const isStockOut = t.type === 'Stock Out';
        const qtyPrefix = isStockIn ? '+' : isStockOut ? '-' : t.quantity > 0 ? '+' : '';
        const variant = isStockIn ? 'success' : isStockOut ? 'danger' : 'warning';

        items.push({
          id: `txn-${t.id}`,
          type: 'transaction',
          section: 'Transactions',
          title: `${t.type}: ${prod?.name ?? 'Inventory Movement'}`,
          subtitle: `Ref: ${t.reference} • By ${t.performedBy} • ${t.createdAt}`,
          badge: { text: `${qtyPrefix}${t.quantity} units`, variant },
          extra: `${t.previousStock} → ${t.newStock}`,
          icon: ArrowLeftRight,
          iconBg: isStockIn ? 'bg-emerald-50 text-emerald-600' : isStockOut ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600',
          iconColor: isStockIn ? 'text-emerald-600' : isStockOut ? 'text-rose-600' : 'text-amber-600',
          onSelect: () => {
            navigate('transaction-detail', t.id);
            closeSearch();
          },
        });
      });
    }

    // 3. Navigation / Pages
    if (activeTab === 'all' || activeTab === 'pages') {
      const sliceLimit = activeTab === 'all' ? 3 : matchedPages.length;
      matchedPages.slice(0, sliceLimit).forEach((pageItem) => {
        items.push({
          id: pageItem.id,
          type: 'page',
          section: 'Navigation',
          title: pageItem.title,
          subtitle: pageItem.subtitle,
          badge: { text: pageItem.badge, variant: pageItem.badge === 'Admin' ? 'purple' : 'info' },
          icon: pageItem.icon,
          iconBg: 'bg-sky-50 text-sky-600',
          iconColor: 'text-sky-600',
          onSelect: () => {
            navigate(pageItem.page);
            closeSearch();
          },
        });
      });
    }

    // 4. Categories
    if (activeTab === 'all' || activeTab === 'categories') {
      const sliceLimit = activeTab === 'all' ? 3 : matchedCategories.length;
      matchedCategories.slice(0, sliceLimit).forEach((cat) => {
        const prodCount = products.filter((p) => p.categoryId === cat.id).length;
        items.push({
          id: `cat-${cat.id}`,
          type: 'category',
          section: 'Categories',
          title: cat.name,
          subtitle: 'Product category classification',
          badge: { text: `${prodCount} products`, variant: 'purple' },
          icon: FolderTree,
          iconBg: 'bg-purple-50 text-purple-600',
          iconColor: 'text-purple-600',
          onSelect: () => {
            navigate('categories');
            closeSearch();
          },
        });
      });
    }

    // 5. Suppliers
    if (activeTab === 'all' || activeTab === 'suppliers') {
      const sliceLimit = activeTab === 'all' ? 3 : matchedSuppliers.length;
      matchedSuppliers.slice(0, sliceLimit).forEach((sup) => {
        const details = [sup.email, sup.phone, sup.address].filter(Boolean).join(' • ');
        items.push({
          id: `sup-${sup.id}`,
          type: 'supplier',
          section: 'Suppliers',
          title: sup.name,
          subtitle: details || 'Authorized catalog supplier',
          badge: { text: 'Supplier', variant: 'info' },
          icon: Truck,
          iconBg: 'bg-amber-50 text-amber-600',
          iconColor: 'text-amber-600',
          onSelect: () => {
            navigate('suppliers');
            closeSearch();
          },
        });
      });
    }

    // 6. Users (Admin Only)
    if (isAdmin && (activeTab === 'all' || activeTab === 'users')) {
      const sliceLimit = activeTab === 'all' ? 3 : matchedUsers.length;
      matchedUsers.slice(0, sliceLimit).forEach((u) => {
        items.push({
          id: `user-${u.id}`,
          type: 'user',
          section: 'Users',
          title: u.name,
          subtitle: `${u.email} • Status: ${u.status}`,
          badge: { text: u.role, variant: u.role === 'ADMIN' ? 'purple' : 'default' },
          icon: UserIcon,
          iconBg: 'bg-slate-100 text-slate-700',
          iconColor: 'text-slate-700',
          onSelect: () => {
            navigate('users');
            closeSearch();
          },
        });
      });
    }

    return items;
  }, [
    q,
    activeTab,
    matchedProducts,
    matchedTransactions,
    matchedPages,
    matchedCategories,
    matchedSuppliers,
    matchedUsers,
    isAdmin,
    categories,
    inventory,
    products,
    navigate,
  ]);

  // Reset selected index when query or tab changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [q, activeTab]);

  // Handle keyboard navigation in search input
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeSearch();
      return;
    }

    if (flatItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatItems.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        flatItems[selectedIndex].onSelect();
      }
      return;
    }

    // Tab key switches category tabs
    if (e.key === 'Tab') {
      e.preventDefault();
      const tabs: SearchTab[] = ['all', 'products', 'transactions', 'pages', 'categories', 'suppliers'];
      if (isAdmin) tabs.push('users');
      const curIdx = tabs.indexOf(activeTab);
      const nextTab = tabs[(curIdx + (e.shiftKey ? -1 + tabs.length : 1)) % tabs.length];
      setActiveTab(nextTab);
      return;
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsContainerRef.current) {
      const activeEl = resultsContainerRef.current.querySelector(
        `[data-result-index="${selectedIndex}"]`
      );
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <header className="h-16 shrink-0 glass-header rounded-[17px] border border-white/50 flex items-center justify-between px-3 sm:px-6 md:px-7 z-30">
      {/* Left Area: Mobile Drawer / Desktop Toggle + Breadcrumb Navigation */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={() => toggleSidebar?.()}
          className="p-2 -ml-1 sm:ml-0 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white/70 transition-all cursor-pointer flex items-center justify-center shrink-0 border border-transparent hover:border-white/60"
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Toggle sidebar'}
          aria-label="Toggle sidebar menu"
        >
          <Menu size={18} />
        </button>

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 sm:gap-2 text-xs font-medium min-w-0" aria-label="Breadcrumb">
          <span className="hidden sm:inline text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
            StockFlow
          </span>
          <ChevronRight size={13} className="hidden sm:inline text-slate-300 shrink-0" />
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <span
                key={i}
                className={`items-center gap-1.5 sm:gap-2 ${isLast ? 'flex' : 'hidden md:flex'}`}
              >
                {i > 0 && <ChevronRight size={13} className="text-slate-300 shrink-0" />}
                <span
                  className={
                    isLast
                      ? 'font-bold text-slate-900 bg-white/70 px-2.5 py-0.5 rounded-full border border-white/80 shadow-2xs truncate max-w-[130px] sm:max-w-[200px]'
                      : 'text-slate-500 hover:text-slate-800 transition-colors truncate max-w-[100px]'
                  }
                >
                  {crumb}
                </span>
              </span>
            );
          })}
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Omnisearch Command Bar */}
        <div ref={searchRef} className="relative">
          <div className="flex items-center gap-2 glass-input rounded-full px-3 sm:px-3.5 py-1.5 w-28 xs:w-36 sm:w-56 md:w-64 focus-within:w-48 sm:focus-within:w-80 md:focus-within:w-96 shadow-xs focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSearch(true);
              }}
              onFocus={() => setShowSearch(true)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search products, SKUs, transactions, pages..."
              className="bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none w-full font-medium"
            />
            {search ? (
              <button
                type="button"
                onClick={closeSearch}
                className="cursor-pointer"
                aria-label="Clear search"
              >
                <X size={13} className="text-slate-400 hover:text-slate-700 shrink-0" />
              </button>
            ) : (
              <kbd className="hidden md:inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-400 bg-white/80 px-1.5 py-0.5 rounded-md border border-white/90 shrink-0">
                <Command size={10} />K
              </kbd>
            )}
          </div>

          {/* Omnisearch Dropdown Command Palette */}
          {showSearch && search.trim().length > 0 && (
            <div className="absolute top-full right-0 mt-2.5 w-[calc(100vw-2rem)] sm:w-[540px] md:w-[620px] max-w-2xl bg-white border border-slate-200/90 shadow-2xl rounded-2xl z-50 overflow-hidden animate-fade-slide">
              {/* Header with Search Scope Tabs */}
              <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-indigo-600" />
                    <span>Search Results</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                    {totalMatches} {totalMatches === 1 ? 'match' : 'matches'} found
                  </span>
                </div>

                {/* Filter Pills */}
                {totalMatches > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 scrollbar-none text-[11px]">
                    <button
                      type="button"
                      onClick={() => setActiveTab('all')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer shrink-0 ${
                        activeTab === 'all'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      All ({totalMatches})
                    </button>

                    {matchedProducts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('products')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                          activeTab === 'products'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <Package size={12} /> Products ({matchedProducts.length})
                      </button>
                    )}

                    {matchedTransactions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('transactions')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                          activeTab === 'transactions'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <ArrowLeftRight size={12} /> Ledger ({matchedTransactions.length})
                      </button>
                    )}

                    {matchedPages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('pages')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                          activeTab === 'pages'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <LayoutDashboard size={12} /> Pages ({matchedPages.length})
                      </button>
                    )}

                    {matchedCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('categories')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                          activeTab === 'categories'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <FolderTree size={12} /> Categories ({matchedCategories.length})
                      </button>
                    )}

                    {matchedSuppliers.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('suppliers')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                          activeTab === 'suppliers'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <Truck size={12} /> Suppliers ({matchedSuppliers.length})
                      </button>
                    )}

                    {isAdmin && matchedUsers.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('users')}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                          activeTab === 'users'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <UserIcon size={12} /> Users ({matchedUsers.length})
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Results List */}
              <div
                ref={resultsContainerRef}
                className="max-h-[360px] overflow-y-auto divide-y divide-slate-100"
              >
                {flatItems.length === 0 ? (
                  <div className="py-10 px-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                      <Search size={18} />
                    </div>
                    <p className="text-xs font-semibold text-slate-800">No matching records found</p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                      Could not find any products, transactions, categories, suppliers, or pages matching &quot;{search}&quot;.
                    </p>
                  </div>
                ) : (
                  flatItems.map((item, idx) => {
                    const isSelected = idx === selectedIndex;
                    const IconComponent = item.icon;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-result-index={idx}
                        onClick={item.onSelect}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 transition-all text-left cursor-pointer group ${
                          isSelected
                            ? 'bg-indigo-50/80 border-l-4 border-indigo-600 pl-3'
                            : 'hover:bg-slate-50 border-l-4 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}
                          >
                            <IconComponent size={16} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p
                                className={`text-xs font-semibold truncate ${
                                  isSelected ? 'text-indigo-950' : 'text-slate-900 group-hover:text-indigo-600'
                                }`}
                              >
                                <HighlightMatch text={item.title} query={search} />
                              </p>
                              {activeTab === 'all' && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded shrink-0">
                                  {item.section}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              <HighlightMatch text={item.subtitle} query={search} />
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.extra && (
                            <span className="text-xs font-bold text-slate-700 font-mono">
                              {item.extra}
                            </span>
                          )}

                          {item.badge && (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                item.badge.variant === 'success'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : item.badge.variant === 'danger'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : item.badge.variant === 'warning'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : item.badge.variant === 'purple'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : item.badge.variant === 'info'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {item.badge.text}
                            </span>
                          )}

                          {isSelected && (
                            <span className="hidden sm:inline-flex items-center text-[10px] text-indigo-600 font-mono">
                              <CornerDownLeft size={11} className="mr-0.5" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Keyboard Shortcuts Footer Legend */}
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 shadow-2xs text-[9px]">↑</kbd>
                    <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 shadow-2xs text-[9px]">↓</kbd>
                    <span>navigate</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 shadow-2xs text-[9px]">↵</kbd>
                    <span>select</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 shadow-2xs text-[9px]">tab</kbd>
                    <span>filter tab</span>
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 shadow-2xs text-[9px]">esc</kbd>
                  <span>close</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Mobile / PWA App Install Button */}
        <InstallAppButton />

        {/* Notifications Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setShowNotif((v) => !v)}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl glass-input text-slate-600 hover:text-slate-900 hover:bg-white/80 transition-all shadow-2xs"
            aria-label="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {showNotif && (
            <div className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] sm:w-84 max-w-sm glass-modal rounded-[17px] shadow-[0_16px_40px_rgba(0,0,0,0.08)] z-50 overflow-hidden border border-white/70 animate-fade-slide">
              <div className="flex items-center justify-between px-4 py-3 bg-white/40 border-b border-white/60">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900">System Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-rose-500/10 text-rose-700 font-bold px-1.5 py-0.5 rounded-full border border-rose-200/50">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>
              <ul className="max-h-80 overflow-y-auto divide-y divide-white/50">
                {notifications.length === 0 ? (
                  <li className="px-4 py-6 text-xs text-slate-400 text-center">No notifications at this time</li>
                ) : (
                  notifications.map((n) => (
                    <li
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`px-4 py-3 cursor-pointer transition-colors ${
                        n.read ? 'bg-white/40 hover:bg-white/70' : 'bg-indigo-50/40 hover:bg-indigo-50/70'
                      }`}
                    >
                      <p className={`text-xs leading-relaxed ${n.read ? 'text-slate-600' : 'text-slate-900 font-medium'}`}>
                        {n.message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">{n.createdAt}</p>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        {/* User Identity Pill */}
        <div className="flex items-center gap-2.5 pl-2.5 border-l border-white/60">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm ${
              isAdmin
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 ring-2 ring-indigo-500/20'
                : 'bg-gradient-to-br from-emerald-500 to-teal-600 ring-2 ring-emerald-500/20'
            }`}
          >
            {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-slate-900 leading-tight flex items-center gap-1.5">
              {currentUser?.name}
              {isAdmin && <Sparkles size={11} className="text-amber-500" />}
            </p>
            <div className="mt-0.5">
              <Badge variant={isAdmin ? 'Admin' : 'Staff'} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

