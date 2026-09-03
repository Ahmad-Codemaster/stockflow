import {
  ArrowLeftRight,
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Tag,
  Truck,
  Users,
  Warehouse,
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
  const { currentUser, currentPage, navigate, logout } = useApp();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <aside className="w-64 shrink-0 glass-sidebar flex flex-col h-full z-20 select-none">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-white/8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 border border-blue-400/30">
            <Warehouse size={16} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-[15px] tracking-tight flex items-center gap-1.5">
              StockFlow
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-400/20">PRO</span>
            </span>
            <p className="text-[11px] text-slate-400 leading-tight">Operations System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        <p className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Core Operations
        </p>
        <div className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.page, currentPage);
            const Icon = item.icon;
            return (
              <button
                key={item.page}
                onClick={() => navigate(item.page)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-blue-600/35 via-blue-600/15 to-transparent text-white border-l-3 border-blue-500 shadow-sm'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <Icon
                  size={16}
                  className={`transition-colors ${active ? 'text-blue-400' : 'text-slate-400'}`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Admin-only Section */}
        {currentUser?.role === 'ADMIN' && (
          <div className="pt-5 mt-4 border-t border-white/6">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Administration
              </span>
              <Shield size={12} className="text-blue-400" />
            </div>
            <button
              onClick={() => navigate('users')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                currentPage === 'users'
                  ? 'bg-gradient-to-r from-blue-600/35 via-blue-600/15 to-transparent text-white border-l-3 border-blue-500 shadow-sm'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <Users
                size={16}
                className={`transition-colors ${currentPage === 'users' ? 'text-blue-400' : 'text-slate-400'}`}
              />
              <span>User Management</span>
            </button>
          </div>
        )}
      </nav>

      {/* User Mini Profile & Footer */}
      <div className="p-3 border-t border-white/8 space-y-1">
        <button
          onClick={() => navigate('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
            currentPage === 'settings'
              ? 'bg-white/10 text-white'
              : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
          }`}
        >
          <Settings size={15} className="text-slate-400" />
          <span>System Settings</span>
        </button>

        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all duration-200 cursor-pointer"
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>

      {showLogoutConfirm && (
        <Confirm
          title="Sign Out of StockFlow"
          message="Are you sure you want to sign out? Your active session will be securely ended, and you will need to re-enter your credentials to sign in."
          confirmLabel="Sign Out"
          variant="danger"
          onConfirm={() => {
            setShowLogoutConfirm(false);
            logout();
          }}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </aside>
  );
}
