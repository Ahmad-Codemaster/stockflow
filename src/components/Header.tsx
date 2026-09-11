import { Bell, Check, ChevronRight, Command, Menu, Search, Sparkles, X } from 'lucide-react';
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
    toggleSidebar,
    isSidebarCollapsed,
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
        {/* Quick Search */}
        <div ref={searchRef} className="relative">
          <div className="flex items-center gap-2 glass-input rounded-full px-3 sm:px-3.5 py-1.5 w-28 xs:w-36 sm:w-52 md:w-60 focus-within:w-44 sm:focus-within:w-64 shadow-xs focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowSearch(true);
              }}
              onFocus={() => setShowSearch(true)}
              placeholder="Search..."
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
                <X size={13} className="text-slate-400 hover:text-slate-700 shrink-0" />
              </button>
            ) : (
              <kbd className="hidden md:inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-400 bg-white/80 px-1.5 py-0.5 rounded-md border border-white/90 shrink-0">
                <Command size={10} />K
              </kbd>
            )}
          </div>

          {/* Search Dropdown Panel */}
          {showSearch && search.length > 1 && (
            <div className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] sm:w-84 max-w-sm glass-modal rounded-[17px] shadow-[0_16px_40px_rgba(0,0,0,0.08)] z-50 overflow-hidden border border-white/70 animate-fade-slide">
              <div className="px-4 py-3 bg-white/40 border-b border-white/60 flex items-center justify-between text-[11px] font-bold text-slate-600">
                <span>Matching Products</span>
                <span className="bg-white/80 px-2 py-0.5 rounded-full border border-white/80 text-[10px]">{searchResults.length} found</span>
              </div>
              {searchResults.length === 0 ? (
                <p className="px-4 py-4 text-xs text-slate-500 text-center">No matching products found.</p>
              ) : (
                <ul className="divide-y divide-white/50 max-h-72 overflow-y-auto">
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
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/60 transition-colors text-left group"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-indigo-600">
                              {p.name}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">{p.sku}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                stock === 0
                                  ? 'bg-rose-500/10 text-rose-700 border border-rose-200/60'
                                  : stock <= p.reorderLevel
                                  ? 'bg-amber-500/10 text-amber-700 border border-amber-200/60'
                                  : 'bg-emerald-500/10 text-emerald-700 border border-emerald-200/60'
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
