import type React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full overflow-hidden ambient-mesh-bg font-sans relative">
      {/* Soft Ethereal Ambient Orbs */}
      <div className="fixed top-12 left-64 w-96 h-96 bg-blue-400/8 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="fixed bottom-10 right-20 w-[30rem] h-[30rem] bg-indigo-400/6 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="fixed top-1/2 right-1/3 w-80 h-80 bg-teal-400/5 rounded-full blur-3xl pointer-events-none" />

      {/* Sidebar with Frosted Glass */}
      <Sidebar />

      {/* Content Main Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative z-10">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
