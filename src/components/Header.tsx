import { Bell, Check, ChevronRight, Command, Search, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context';
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

export default function Header() {
  const {
    currentUser,
    currentPage,
    products,
    inventory,
    navigate,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useApp();
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const crumbs = pageLabels[currentPage] ?? ['Dashboard'];

  const searchResults =
    search.length > 1
      ? products
          .filter(
            (p) =>
              p.name.toLowerCase().includes(search.toLowerCase()) ||
              p.sku.toLowerCase().includes(search.toLowerCase())
          )
          .slice(0, 6)
      : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function getStockForProduct(productId: string) {
    return inventory.find((i) => i.productId === productId)?.currentStock ?? 0;
  }

  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <header className="h-16 shrink-0 glass-header flex items-center justify-between px-6 md:px-8 z-30 sticky top-0">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs font-medium" aria-label="Breadcrumb">
        <span className="text-slate-400 font-semibold tracking-wider uppercase text-[10px]">StockFlow</span>
        <ChevronRight size={13} className="text-slate-300" />
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <ChevronRight size={13} className="text-slate-300" />}
            <span
              className={
                i === crumbs.length - 1
                  ? 'font-bold text-slate-900 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800 transition-colors'
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Search */}
        <div ref={searchRef} className="relative">
          <div className="flex items-center gap-2.5 glass-input rounded-xl px-3 py-1.5 w-60 shadow-xs focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSearch(true);
              }}
              onFocus={() => setShowSearch(true)}
              placeholder="Search catalog or SKU..."
              className="bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none w-full font-medium"
            />
            {search ? (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setShowSearch(false);
                }}
              >
                <X size={13} className="text-slate-400 hover:text-slate-700" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                <Command size={10} />K
              </kbd>
            )}
          </div>

          {/* Search Dropdown Panel */}
          {showSearch && search.length > 1 && (
            <div className="absolute top-full right-0 mt-2 w-80 glass-modal rounded-2xl shadow-2xl z-50 overflow-hidden border border-slate-200/90 animate-fade-slide">
              <div className="px-3.5 py-2.5 bg-slate-50/70 border-b border-slate-200/70 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>Matching Products</span>
                <span>{searchResults.length} found</span>
              </div>
              {searchResults.length === 0 ? (
                <p className="px-4 py-4 text-xs text-slate-500 text-center">No matching products found.</p>
              ) : (
                <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {searchResults.map((p) => {
                    const stock = getStockForProduct(p.id);
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => {
                            navigate('product-detail', p.id);
                            setSearch('');
                            setShowSearch(false);
                          }}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-blue-50/60 transition-colors text-left group"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-blue-600">
                              {p.name}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">{p.sku}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                stock === 0
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : stock <= p.reorderLevel
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {stock} in stock
                            </span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setShowNotif((v) => !v)}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl glass-input text-slate-600 hover:text-slate-900 hover:bg-white transition-all shadow-xs"
            aria-label="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {showNotif && (
            <div className="absolute top-full right-0 mt-2 w-84 glass-modal rounded-2xl shadow-2xl z-50 overflow-hidden border border-slate-200/90 animate-fade-slide">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900">System Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Check size={12} /> Mark all read
                  </button>
                )}
              </div>
              <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <li className="px-4 py-6 text-xs text-slate-400 text-center">No notifications at this time</li>
                ) : (
                  notifications.map((n) => (
                    <li
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={`px-4 py-3 cursor-pointer transition-colors ${
                        n.read ? 'bg-white hover:bg-slate-50/60' : 'bg-blue-50/30 hover:bg-blue-50/60'
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
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200/80">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm ${
              isAdmin
                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 ring-2 ring-blue-500/20'
                : 'bg-gradient-to-br from-emerald-600 to-teal-600 ring-2 ring-emerald-500/20'
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
