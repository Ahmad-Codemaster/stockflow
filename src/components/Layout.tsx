import type React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="flex h-screen w-screen overflow-hidden ambient-mesh-bg font-sans relative p-2.5 sm:p-3.5 lg:p-4.5 gap-2.5 sm:gap-3.5 lg:gap-4.5">
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

      {/* Main Structural Column (Header + Scrollable Body) */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden relative z-10 gap-2.5 sm:gap-3.5">
        <Header />
        <main className="flex-1 min-h-0 overflow-y-auto pr-0.5 sm:pr-1">
          <div key={location.pathname} className="animate-page-enter min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

