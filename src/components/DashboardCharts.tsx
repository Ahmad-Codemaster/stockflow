import React, { useState } from 'react';
import type { Category, Product, Transaction } from '../types';

/**
 * Mini Sparkline SVG for KPI Cards
 */
export function KPISparkline({
  data,
  color = '#2563eb',
  height = 32,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 80;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${color.replace('#', '')})`} />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

/**
 * 7-Day Inbound vs Outbound Movement Activity Chart
 */
export function StockMovementActivityChart({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Group last 7 days of movement activity
  const days: { dateStr: string; label: string; stockIn: number; stockOut: number }[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    days.push({ dateStr, label, stockIn: 0, stockOut: 0 });
  }

  // Aggregate quantities
  for (const t of transactions) {
    const tDate = t.createdAt.split(' ')[0] || t.createdAt.split('T')[0];
    const day = days.find((d) => d.dateStr === tDate);
    if (day) {
      if (t.type === 'Stock In') day.stockIn += t.quantity;
      if (t.type === 'Stock Out') day.stockOut += t.quantity;
    }
  }

  // Fallback demo distribution if transactions are on different simulated dates
  const totalIn = days.reduce((s, d) => s + d.stockIn, 0);
  const totalOut = days.reduce((s, d) => s + d.stockOut, 0);

  // If no transactions happened in the last 7 calendar days, distribute latest transactions across the 7 slots
  if (totalIn === 0 && totalOut === 0 && transactions.length > 0) {
    transactions.slice(0, 14).forEach((t, idx) => {
      const slot = days[idx % 7];
      if (t.type === 'Stock In') slot.stockIn += t.quantity;
      if (t.type === 'Stock Out') slot.stockOut += t.quantity;
    });
  }

  const maxVal = Math.max(...days.map((d) => Math.max(d.stockIn, d.stockOut)), 10);
  const chartHeight = 120;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-tr from-emerald-500 to-teal-400" />
            <span className="text-slate-600 font-medium text-[11px]">Inbound Stock In</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-tr from-rose-500 to-pink-500" />
            <span className="text-slate-600 font-medium text-[11px]">Outbound Dispatch</span>
          </div>
        </div>
        <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">7-Day Activity</span>
      </div>

      {/* Modern Dual Column Bar Chart */}
      <div className="h-[140px] flex items-end justify-between gap-2 pt-4 px-1 pb-1 relative border-b border-slate-100">
        {days.map((d, idx) => {
          const inHeight = Math.max((d.stockIn / maxVal) * chartHeight, 4);
          const outHeight = Math.max((d.stockOut / maxVal) * chartHeight, 4);
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={d.label + idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer relative"
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute -top-10 z-20 bg-slate-900 text-white text-[10px] rounded-lg py-1 px-2 shadow-lg whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                  <span className="font-bold">{d.label}</span>: +{d.stockIn} in / -{d.stockOut} out
                </div>
              )}

              {/* Bars */}
              <div className="flex items-end gap-1 w-full justify-center">
                {/* Stock In Bar */}
                <div
                  style={{ height: `${inHeight}px` }}
                  className={`w-2.5 sm:w-3.5 rounded-t-md transition-all duration-300 ${
                    isHovered
                      ? 'bg-emerald-500 shadow-sm shadow-emerald-500/40 scale-y-105'
                      : 'bg-emerald-400/80 group-hover:bg-emerald-500'
                  }`}
                />
                {/* Stock Out Bar */}
                <div
                  style={{ height: `${outHeight}px` }}
                  className={`w-2.5 sm:w-3.5 rounded-t-md transition-all duration-300 ${
                    isHovered
                      ? 'bg-rose-500 shadow-sm shadow-rose-500/40 scale-y-105'
                      : 'bg-rose-400/80 group-hover:bg-rose-500'
                  }`}
                />
              </div>

              {/* X Axis Label */}
              <span className={`text-[10px] font-semibold transition-colors ${isHovered ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Category Asset Valuation Donut Chart
 */
export function CategoryValuationDonutChart({
  categories,
  products,
  inventory,
}: {
  categories: Category[];
  products: Product[];
  inventory: { productId: string; currentStock: number }[];
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const colors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#8b5cf6', // violet
    '#f59e0b', // amber
    '#ec4899', // pink
    '#06b6d4', // cyan
  ];

  const categoryStats = categories.map((cat, idx) => {
    const catProducts = products.filter((p) => p.categoryId === cat.id);
    const totalUnits = catProducts.reduce((sum, p) => {
      const stock = inventory.find((i) => i.productId === p.id)?.currentStock ?? 0;
      return sum + stock;
    }, 0);
    const totalValue = catProducts.reduce((sum, p) => {
      const stock = inventory.find((i) => i.productId === p.id)?.currentStock ?? 0;
      return sum + stock * p.price;
    }, 0);

    return {
      id: cat.id,
      name: cat.name,
      skuCount: catProducts.length,
      totalUnits,
      totalValue,
      color: colors[idx % colors.length],
    };
  });

  const grandTotalValue = categoryStats.reduce((sum, c) => sum + c.totalValue, 0);

  // Calculate SVG stroke dashes for donut segments
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  const slices = categoryStats.map((cat) => {
    const percent = grandTotalValue > 0 ? cat.totalValue / grandTotalValue : 1 / (categoryStats.length || 1);
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativePercent * circumference;
    cumulativePercent += percent;

    return {
      ...cat,
      percent: Math.round(percent * 100),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const highlighted = activeCategory ? slices.find((s) => s.id === activeCategory) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
        {/* SVG Donut Circle */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
            {/* Slices */}
            {slices.map((slice) => (
              <circle
                key={slice.id}
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={activeCategory === slice.id ? '15' : '12'}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer hover:opacity-90"
                onMouseEnter={() => setActiveCategory(slice.id)}
                onMouseLeave={() => setActiveCategory(null)}
              />
            ))}
          </svg>

          {/* Central Donut Value */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              {highlighted ? highlighted.name.split(' ')[0] : 'Total'}
            </span>
            <span className="text-xs font-extrabold text-slate-900">
              ${(highlighted ? highlighted.totalValue : grandTotalValue).toLocaleString('en-US', {
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
        </div>

        {/* Category Legend & Proportions */}
        <div className="flex-1 w-full space-y-2 text-xs">
          {slices.slice(0, 4).map((cat) => (
            <div
              key={cat.id}
              onMouseEnter={() => setActiveCategory(cat.id)}
              onMouseLeave={() => setActiveCategory(null)}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                activeCategory === cat.id
                  ? 'bg-blue-50/70 border-blue-200/80 shadow-xs translate-x-1'
                  : 'bg-slate-50/50 border-slate-200/50 hover:bg-slate-100/60'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="font-bold text-slate-800 truncate text-[11px]">{cat.name}</span>
              </div>
              <div className="text-right shrink-0 font-mono text-[11px]">
                <span className="font-extrabold text-slate-900">${cat.totalValue.toLocaleString()}</span>
                <span className="text-slate-400 ml-1.5 font-sans">({cat.percent}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
