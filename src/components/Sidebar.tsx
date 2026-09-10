import {
  ArrowLeftRight,
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  Settings,
  Shield,
  Tag,
  Truck,
  Users,
  Warehouse,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../context';
import type { Page } from '../types';
import { Confirm } from './ui';

const navItems: { icon: React.ElementType; label: string; page: Page }[] = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
  { icon: Boxes, label: 'Products', page: 'products' },
  { icon: Tag, label: 'Categories', page: 'categories' },
  { icon: Truck, label: 'Suppliers', page: 'suppliers' },
  { icon: Warehouse, label: 'Inventory', page: 'inventory' },
  { icon: ArrowLeftRight, label: 'Transactions', page: 'transactions' },
  { icon: BarChart3, label: 'Reports', page: 'reports' },
];

const productPages: Page[] = ['products', 'product-detail', 'product-add', 'product-edit'];
const transactionPages: Page[] = ['transactions', 'transaction-detail', 'stock-in', 'stock-out'];

function isActive(page: Page, current: Page): boolean {
  if (page === 'products') return productPages.includes(current);
  if (page === 'transactions') return transactionPages.includes(current);
  if (page === 'inventory') return current === 'inventory';
  return page === current;
}

export default function Sidebar() {
  const {
    currentUser,
    currentPage,
    navigate,
    logout,
    isMobileSidebarOpen = false,
    isSidebarCollapsed = false,
    closeMobileSidebar,
    toggleDesktopSidebar,
  } = useApp();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleNavigate = (page: Page) => {
    navigate(page);
    closeMobileSidebar?.();
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          role="presentation"
          aria-hidden="true"
          onClick={() => closeMobileSidebar?.()}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      <aside
        className={`shrink-0 glass-sidebar z-50 lg:z-20 select-none transition-all duration-300 ease-in-out fixed inset-y-0 left-0 lg:static lg:h-full overflow-hidden ${
          isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        } ${
          isSidebarCollapsed
            ? 'lg:w-0 lg:-translate-x-full lg:opacity-0 lg:overflow-hidden lg:pointer-events-none lg:border-r-0'
            : 'lg:w-64 lg:opacity-100'
        }`}
      >
        <div className="w-64 sm:w-72 lg:w-64 flex flex-col h-full">
          {/* Brand Header */}
          <div className="px-5 py-4.5 border-b border-white/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl flex items-center justify-center shadow-md shadow-indigo-500/20 border border-white/40">
                <Warehouse size={18} className="text-white" />
              </div>
              <div>
                <span className="text-slate-900 font-extrabold text-[15px] tracking-tight flex items-center gap-1.5">
                  StockFlow
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-indigo-700 border border-indigo-500/20">PRO</span>
                </span>
                <p className="text-[11px] text-slate-500 font-medium leading-tight">Operations System</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => closeMobileSidebar?.()}
              className="lg:hidden p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white/50 transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>

            {/* Desktop Collapse Button */}
            <button
              type="button"
              onClick={() => toggleDesktopSidebar?.()}
              className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-white/50 transition-colors cursor-pointer"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
            <p className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Core Operations
            </p>
            <div className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.page, currentPage);
                const Icon = item.icon;
                return (
                  <button
                    key={item.page}
                    onClick={() => handleNavigate(item.page)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      active
                        ? 'bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-transparent text-indigo-700 font-bold border border-indigo-200/60 shadow-xs'
                        : 'text-slate-600 hover:bg-white/45 hover:text-slate-900'
                    }`}
                  >
                    <Icon
                      size={16}
                      className={`transition-colors ${active ? 'text-indigo-600' : 'text-slate-400'}`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Admin Section */}
            {currentUser?.role === 'ADMIN' && (
              <div className="pt-4 mt-4 border-t border-white/60">
                <div className="flex items-center justify-between px-3 mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Administration
                  </span>
                  <Shield size={12} className="text-indigo-500" />
                </div>
                <button
                  onClick={() => handleNavigate('users')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    currentPage === 'users'
                      ? 'bg-gradient-to-r from-indigo-500/15 via-purple-500/10 to-transparent text-indigo-700 font-bold border border-indigo-200/60 shadow-xs'
                      : 'text-slate-600 hover:bg-white/45 hover:text-slate-900'
                  }`}
                >
                  <Users
                    size={16}
                    className={`transition-colors ${currentPage === 'users' ? 'text-indigo-600' : 'text-slate-400'}`}
                  />
                  <span>User Management</span>
                </button>
              </div>
            )}
          </nav>

          {/* User Profile Card & Footer */}
          <div className="p-3 border-t border-white/60 space-y-2">
            <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-white/40 border border-white/60 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-extrabold flex items-center justify-center text-xs shadow-xs shrink-0">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                  {currentUser?.name || 'User'}
                </p>
                <p className="text-[10px] text-slate-500 font-medium truncate capitalize">
                  {currentUser?.role?.toLowerCase() || 'Staff'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleNavigate('settings')}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-colors cursor-pointer"
                title="Settings"
              >
                <Settings size={14} />
              </button>
            </div>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 transition-all duration-200 cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {showLogoutConfirm && (
        <Confirm
          title="Sign Out of StockFlow"
          message="Are you sure you want to sign out? Your active session will be securely ended, and you will need to re-enter your credentials to sign in."
          confirmLabel="Sign Out"
          variant="danger"
          onConfirm={() => {
            setShowLogoutConfirm(false);
            closeMobileSidebar?.();
            logout();
          }}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </>
  );
}
