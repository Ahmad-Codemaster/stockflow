import type React from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Boxes, LayoutDashboard, Warehouse } from 'lucide-react';
import { useApp } from '../context';
import type { Page } from '../types';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { currentPage, navigate } = useApp();

  const mobileTabs: { icon: React.ElementType; label: string; page: Page }[] = [
    { icon: LayoutDashboard, label: 'Home', page: 'dashboard' },
    { icon: Boxes, label: 'Products', page: 'products' },
    { icon: ArrowDownLeft, label: 'Stock In', page: 'stock-in' },
    { icon: ArrowUpRight, label: 'Stock Out', page: 'stock-out' },
    { icon: Warehouse, label: 'Inventory', page: 'inventory' },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden ambient-mesh-bg font-sans relative p-2 sm:p-3.5 lg:p-4.5 gap-2 sm:gap-3.5 lg:gap-4.5">
      {/* 4 Large Ambient Background Lighting Orbs - Vibrant Orange + Purple Moving Aurora */}
      <div
        className="fixed -top-16 left-[6%] w-[36rem] h-[36rem] rounded-full pointer-events-none animate-ambient-drift-1"
        style={{
          backgroundColor: '#F97316',
          filter: 'blur(125px)',
          opacity: 0.35,
        }}
      />
      <div
        className="fixed -bottom-20 right-[5%] w-[40rem] h-[40rem] rounded-full pointer-events-none animate-ambient-drift-2"
        style={{
          backgroundColor: '#A855F7',
          filter: 'blur(135px)',
          opacity: 0.35,
        }}
      />
      <div
        className="fixed top-[24%] right-[16%] w-[32rem] h-[32rem] rounded-full pointer-events-none animate-ambient-drift-3"
        style={{
          backgroundColor: '#FB923C',
          filter: 'blur(115px)',
          opacity: 0.28,
        }}
      />
      <div
        className="fixed bottom-[12%] left-[16%] w-[32rem] h-[32rem] rounded-full pointer-events-none animate-ambient-drift-4"
        style={{
          backgroundColor: '#7C3AED',
          filter: 'blur(130px)',
          opacity: 0.32,
        }}
      />

      {/* Floating Apple Glass Sidebar */}
      <Sidebar />

      {/* Main Structural Column (Header + Scrollable Body + Mobile Bottom Dock) */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden relative z-10 gap-2 sm:gap-3.5">
        <Header />
        <main className="flex-1 min-h-0 overflow-y-auto pr-0.5 sm:pr-1">
          <div key={location.pathname} className="animate-page-enter min-h-full">
            {children}
          </div>
        </main>

        {/* Mobile Phone Ergonomic Quick-Action Dock (visible on mobile screens) */}
        <nav
          aria-label="Mobile Navigation"
          className="lg:hidden shrink-0 glass-card rounded-2xl border border-white/65 px-2 py-1.5 shadow-lg shadow-indigo-950/5 flex items-center justify-around z-30"
        >
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentPage === tab.page;
            return (
              <button
                key={tab.page}
                type="button"
                onClick={() => navigate(tab.page)}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer select-none active:scale-95 ${
                  isActive
                    ? 'text-indigo-600 font-bold bg-indigo-50/90 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 font-medium'
                }`}
              >
                <Icon size={17} className={isActive ? 'text-indigo-600' : 'text-slate-500'} />
                <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

