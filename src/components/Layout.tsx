import type React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden ambient-mesh-bg font-sans relative p-2.5 sm:p-3.5 lg:p-4.5 gap-2.5 sm:gap-3.5 lg:gap-4.5">
      {/* 4 Large Ambient Background Lighting Orbs with Extreme Blur and 15%-20% Opacity */}
      <div
        className="fixed -top-16 left-[10%] w-[32rem] h-[32rem] rounded-full pointer-events-none animate-pulse-glow"
        style={{
          backgroundColor: '#818CF8',
          filter: 'blur(140px)',
          opacity: 0.18,
        }}
      />
      <div
        className="fixed -bottom-20 right-[8%] w-[36rem] h-[36rem] rounded-full pointer-events-none animate-pulse-glow"
        style={{
          backgroundColor: '#C084FC',
          filter: 'blur(150px)',
          opacity: 0.18,
          animationDelay: '2.5s',
        }}
      />
      <div
        className="fixed top-[32%] right-[22%] w-[28rem] h-[28rem] rounded-full pointer-events-none"
        style={{
          backgroundColor: '#60A5FA',
          filter: 'blur(130px)',
          opacity: 0.16,
        }}
      />
      <div
        className="fixed bottom-[18%] left-[22%] w-[26rem] h-[26rem] rounded-full pointer-events-none"
        style={{
          backgroundColor: '#818CF8',
          filter: 'blur(140px)',
          opacity: 0.15,
        }}
      />

      {/* Floating Apple Glass Sidebar */}
      <Sidebar />

      {/* Main Structural Column (Header + Scrollable Body) */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden relative z-10 gap-2.5 sm:gap-3.5">
        <Header />
        <main className="flex-1 min-h-0 overflow-y-auto pr-0.5 sm:pr-1">
          {children}
        </main>
      </div>
    </div>
  );
}

