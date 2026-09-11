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
            : 'lg:w-56 lg:opacity-100'
        }`}
      >
        <div className="w-56 sm:w-56 lg:w-56 flex flex-col h-full">
          {/* Brand Header */}
          <div className="px-3 py-2.5 border-b border-white/55 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7.5 h-7.5 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-500/20 border border-white/40 shrink-0">
                <Warehouse size={15} className="text-white" />
              </div>
              <div>
                <span className="text-slate-900 font-extrabold text-[13px] tracking-tight flex items-center gap-1">
                  StockFlow
                  <span className="text-[8px] font-extrabold px-1.5 py-0.2 rounded-full bg-orange-500/15 text-orange-700 border border-orange-500/25">PRO</span>
                </span>
                <p className="text-[9.5px] text-slate-400 font-medium leading-tight">Operations System</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => closeMobileSidebar?.()}
              className="lg:hidden p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white/50 transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <X size={15} />
            </button>

            {/* Desktop Collapse Button */}
            <button
              type="button"
              onClick={() => toggleDesktopSidebar?.()}
              className="hidden lg:flex p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-white/50 transition-colors cursor-pointer"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose size={14} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-2 overflow-y-auto space-y-0.5">
            <p className="px-2 mb-1 text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">
              Core Operations
            </p>
            <div className="space-y-0.5">
              {navItems.map((item) => {
                const active = isActive(item.page, currentPage);
                const Icon = item.icon;
                return (
                  <button
                    key={item.page}
                    onClick={() => handleNavigate(item.page)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      active
                        ? 'bg-gradient-to-r from-orange-500/15 via-purple-500/10 to-transparent text-slate-900 font-bold border border-orange-300/40 shadow-2xs'
                        : 'text-slate-600 hover:bg-white/45 hover:text-slate-900'
                    }`}
                  >
                    <Icon
                      size={14.5}
                      className={`transition-colors shrink-0 ${active ? 'text-orange-600' : 'text-slate-400'}`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Admin Section */}
            {currentUser?.role === 'ADMIN' && (
              <div className="pt-2.5 mt-2.5 border-t border-white/55">
                <div className="flex items-center justify-between px-2 mb-1.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Administration
                  </span>
                  <Shield size={11} className="text-purple-500" />
                </div>
                <button
                  onClick={() => handleNavigate('users')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    currentPage === 'users'
                      ? 'bg-gradient-to-r from-purple-500/15 via-orange-500/10 to-transparent text-slate-900 font-bold border border-purple-300/40 shadow-2xs'
                      : 'text-slate-600 hover:bg-white/45 hover:text-slate-900'
                  }`}
                >
                  <Users
                    size={15}
                    className={`transition-colors shrink-0 ${currentPage === 'users' ? 'text-purple-600' : 'text-slate-400'}`}
                  />
                  <span>User Management</span>
                </button>
              </div>
            )}
          </nav>

          {/* User Profile Card & Footer */}
          <div className="p-2.5 border-t border-white/55 space-y-1.5">
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/35 border border-white/55 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 via-rose-500 to-purple-600 text-white font-extrabold flex items-center justify-center text-[11px] shadow-xs shrink-0">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                  {currentUser?.name || 'User'}
                </p>
                <p className="text-[9px] text-slate-400 font-medium truncate capitalize">
                  {currentUser?.role?.toLowerCase() || 'Staff'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleNavigate('settings')}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-colors cursor-pointer"
                title="Settings"
              >
                <Settings size={13} />
              </button>
            </div>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 transition-all duration-200 cursor-pointer"
            >
              <LogOut size={13} />
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
