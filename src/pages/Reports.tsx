import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  PieChart,
  Plus,
  RefreshCw,
  Search,
  Send,
  Share2,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Badge, KPICard, PageHeader } from '../components/ui';
import { useApp } from '../context';

type ReportTab = 'overview' | 'summary' | 'movement' | 'lowstock' | 'value';

function SimpleBarChart({ data }: { data: { label: string; inQty: number; outQty: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 text-xs font-medium border border-dashed border-white/60 rounded-2xl bg-white/40">
        No catalog products or movement activity to chart.
      </div>
    );
  }
  const maxVal = Math.max(...data.flatMap((d) => [d.inQty, d.outQty]), 1);
  return (
    <div className="space-y-3.5">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
            <span>{d.label}</span>
            <span className="font-mono text-slate-400 text-[11px]">
              In: <span className="text-emerald-600 font-bold">{d.inQty}</span> / Out:{' '}
              <span className="text-rose-600 font-bold">{d.outQty}</span>
            </span>
          </div>
          <div className="flex gap-1.5 h-3.5 p-0.5 bg-white/50 rounded-full border border-white/60 backdrop-blur-xs">
            <div
              className="bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(d.inQty / maxVal) * 100}%`, minWidth: d.inQty > 0 ? '6px' : '0' }}
            />
            <div
              className="bg-gradient-to-r from-rose-400 to-rose-500 rounded-full transition-all duration-500"
              style={{ width: `${(d.outQty / maxVal) * 100}%`, minWidth: d.outQty > 0 ? '6px' : '0' }}
            />
          </div>
        </div>
      ))}
      <div className="flex gap-5 mt-4 pt-3 border-t border-white/60 text-xs font-semibold text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-xs" />
          Stock-In Replenishment
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-xs" />
          Stock-Out Dispatch
        </span>
      </div>
    </div>
  );
}

export default function Reports() {
  const { products, categories, suppliers, inventory, transactions, navigate, getStockStatus, showToast } = useApp();
  const [tab, setTab] = useState<ReportTab>('overview');
  const [libraryCategory, setLibraryCategory] = useState<string>('All');
  const [promptQuery, setPromptQuery] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({
    'rep-1': true,
    'rep-3': true,
  });

  const [scheduledState, setScheduledState] = useState<Record<string, boolean>>({
    s1: true,
    s2: true,
    s3: false,
    s4: true,
  });

  const [movementType, setMovementType] = useState('');
  const [movementProduct, setMovementProduct] = useState('');

  function getStock(pid: string) {
    return inventory.find((i) => i.productId === pid)?.currentStock ?? 0;
  }
  function getCatName(cid: string) {
    return categories.find((c) => c.id === cid)?.name ?? '—';
  }

  const totalValue = useMemo(() => {
    return products.reduce((sum, p) => sum + getStock(p.id) * p.price, 0);
  }, [products, inventory]);

  const totalStock = useMemo(() => {
    return inventory.reduce((s, i) => s + i.currentStock, 0);
  }, [inventory]);

  const lowCount = useMemo(() => {
    return products.filter((p) => getStockStatus(p.id) === 'Low Stock').length;
  }, [products, getStockStatus]);

  const outCount = useMemo(() => {
    return products.filter((p) => getStockStatus(p.id) === 'Out of Stock').length;
  }, [products, getStockStatus]);

  const inStockCount = useMemo(() => {
    return products.filter((p) => getStockStatus(p.id) === 'In Stock').length;
  }, [products, getStockStatus]);

  const inStockPct = products.length ? Math.round((inStockCount / products.length) * 100) : 0;
  const lowStockPct = products.length ? Math.round((lowCount / products.length) * 100) : 0;
  const outOfStockPct = products.length ? Math.max(0, 100 - inStockPct - lowStockPct) : 0;

  const filteredMovement = transactions.filter((t) => {
    const matchType = !movementType || t.type === movementType;
    const matchProduct = !movementProduct || t.productId === movementProduct;
    return matchType && matchProduct;
  });
  const totalIn = filteredMovement.filter((t) => t.type === 'Stock In').reduce((s, t) => s + t.quantity, 0);
  const totalOut = filteredMovement.filter((t) => t.type === 'Stock Out').reduce((s, t) => s + t.quantity, 0);
  const netMovement = totalIn - totalOut;

  const totalInAll = useMemo(() => transactions.filter((t) => t.type === 'Stock In').reduce((s, t) => s + t.quantity, 0), [transactions]);
  const totalOutAll = useMemo(() => transactions.filter((t) => t.type === 'Stock Out').reduce((s, t) => s + t.quantity, 0), [transactions]);
  const totalUnitsMoved = totalInAll + totalOutAll;

  const txInCount = useMemo(() => transactions.filter((t) => t.type === 'Stock In').length, [transactions]);
  const txOutCount = useMemo(() => transactions.filter((t) => t.type === 'Stock Out').length, [transactions]);
  const txAdjCount = useMemo(() => transactions.filter((t) => t.type === 'Adjustment').length, [transactions]);
  const totalTx = transactions.length || 1;
  const txInPct = Math.round((txInCount / totalTx) * 100);
  const txOutPct = Math.round((txOutCount / totalTx) * 100);
  const txAdjPct = Math.max(0, 100 - txInPct - txOutPct);

  const chartData = products.slice(0, 6).map((p) => ({
    label: p.name.split(' ').slice(0, 2).join(' '),
    inQty: transactions.filter((t) => t.productId === p.id && t.type === 'Stock In').reduce((s, t) => s + t.quantity, 0),
    outQty: transactions.filter((t) => t.productId === p.id && t.type === 'Stock Out').reduce((s, t) => s + t.quantity, 0),
  }));

  const lowStockProducts = products.filter(
    (p) => getStockStatus(p.id) === 'Low Stock' || getStockStatus(p.id) === 'Out of Stock'
  );

  const tabs: { id: ReportTab; label: string }[] = [
    { id: 'overview', label: 'Inventory Intelligence' },
    { id: 'summary', label: 'Catalog Summary' },
    { id: 'movement', label: 'Stock Movement' },
    { id: 'lowstock', label: 'Low Stock Risk' },
    { id: 'value', label: 'Asset Valuation' },
  ];

  const reportLibraryItems = [
    {
      id: 'rep-1',
      title: 'Valuation & Asset Audit',
      description: 'Capitalization analysis, unit pricing distribution, and total inventory value.',
      category: 'Valuation',
      tabTarget: 'value' as ReportTab,
      lastRun: 'Updated live',
      color: 'bg-indigo-600 text-white',
    },
    {
      id: 'rep-2',
      title: 'Stock Velocity & Turn Rate',
      description: 'Analyze inbound replenishment pace vs customer fulfillment throughput.',
      category: 'Stock Movement',
      tabTarget: 'movement' as ReportTab,
      lastRun: 'Updated live',
      color: 'bg-blue-600 text-white',
    },
    {
      id: 'rep-3',
      title: 'Threshold Risk & Reorder Priority',
      description: 'Threshold warnings for SKUs operating at or below critical buffer levels.',
      category: 'Procurement',
      tabTarget: 'lowstock' as ReportTab,
      lastRun: 'Updated live',
      color: 'bg-amber-600 text-white',
    },
    {
      id: 'rep-4',
      title: 'Master Catalog Audit Summary',
      description: 'Cross-category status, SKU counts, and unit health breakdowns.',
      category: 'Valuation',
      tabTarget: 'summary' as ReportTab,
      lastRun: 'Updated live',
      color: 'bg-emerald-600 text-white',
    },
    {
      id: 'rep-5',
      title: 'Supplier Network & Fulfillment',
      description: 'Fulfillment lead-times and active vendor distribution channels.',
      category: 'Procurement',
      tabTarget: 'movement' as ReportTab,
      lastRun: 'Updated live',
      color: 'bg-purple-600 text-white',
    },
    {
      id: 'rep-6',
      title: 'Discrepancy & Shrinkage Audit',
      description: 'Manual stock adjustment ledger, count reconciliations, and shrinkage logs.',
      category: 'Stock Movement',
      tabTarget: 'movement' as ReportTab,
      lastRun: 'Updated live',
      color: 'bg-rose-600 text-white',
    },
  ];

  const filteredLibrary = reportLibraryItems.filter((r) => {
    if (libraryCategory === 'All') return true;
    if (libraryCategory === 'Favorites') return favorites[r.id];
    return r.category === libraryCategory;
  });

  const handleGenerateAIReport = (overrideQuery?: string) => {
    const q = overrideQuery ?? promptQuery;
    if (!q.trim()) return;
    setIsGenerating(true);
    setGeneratedResult(null);

    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedResult(
        `AI Inventory Analysis: "${q}". The catalog tracks ${products.length} active SKUs across ${categories.length} categories with a total valuation of $${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}. Total physical stock is ${totalStock.toLocaleString()} units with ${lowCount} SKU(s) flagged under safety buffers and ${outCount} depleted item(s).`
      );
      showToast('success', 'Operational report synthesized');
    }, 850);
  };

  return (
    <div className="max-w-7xl space-y-6">
      {/* Top Header matching reference layout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-[-0.025em]">
            Reports & Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Synthesize real-time catalog movements, asset valuations, and replenishment schedules.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="px-3.5 py-2 glass-input rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-2 shadow-2xs cursor-pointer border border-white/70"
          >
            <Calendar size={14} className="text-slate-400" />
            <span>Today, Last 30 Days</span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => showToast('info', 'Report builder dialog opened')}
            className="px-4 py-2 gradient-btn-primary text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus size={14} />
            <span>New Report</span>
          </button>
        </div>
      </div>

      {/* Apple Glass Tab Navigator */}
      <div className="flex gap-1.5 bg-white/45 p-1.5 rounded-[17px] border border-white/60 w-full sm:w-fit overflow-x-auto backdrop-blur-[48px] shadow-[0_8px_32px_0_rgba(0,0,0,0.03)]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer ${
              tab === t.id
                ? 'bg-white text-slate-900 shadow-sm border border-white/80'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. EXECUTIVE OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-6 animate-fade-slide">
          {/* Top KPI & Distribution Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Catalog Stock Distribution */}
            <div className="glass-card rounded-[17px] border border-white/60 p-5 flex flex-col justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.03)]">
              <div>
                <h3 className="text-xs font-bold text-slate-900 tracking-[-0.025em] mb-3">Stock Level Health</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2 p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] font-semibold text-indigo-200">In Stock Buffer</span>
                    <span className="text-xl font-black tracking-[-0.025em] mt-1">{inStockPct}%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-2xs flex flex-col justify-between">
                    <span className="text-[9px] font-semibold text-amber-100">Low Stock</span>
                    <span className="text-sm font-black tracking-[-0.025em] mt-0.5">{lowStockPct}%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-500 text-white shadow-2xs flex flex-col justify-between">
                    <span className="text-[9px] font-semibold text-rose-100">Depleted</span>
                    <span className="text-sm font-black tracking-[-0.025em] mt-0.5">{outOfStockPct}%</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                <span>Active Scope</span>
                <span className="text-indigo-600 font-bold">{products.length} SKUs in {categories.length} Categories</span>
              </div>
            </div>

            {/* Card 2: 30D Movement Volume */}
            <div className="glass-card rounded-[17px] border border-white/60 p-5 flex flex-col justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.03)]">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 tracking-[-0.025em]">Stock Movement Volume</h3>
                  <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                    30-Day Activity
                  </span>
                </div>
                <div className="text-3xl font-black tracking-[-0.025em] text-slate-900 mt-2">
                  {totalUnitsMoved.toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Total units transacted</p>
                <div className="flex items-end gap-1 h-8 mt-2">
                  {[35, 60, 45, 80, 70, 90, 85, 100].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-indigo-500 rounded-t-sm opacity-80"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/60 text-[11px] text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Stock-In Intake</span>
                  <span className="font-bold text-emerald-600">+{totalInAll.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stock-Out Fulfillment</span>
                  <span className="font-bold text-rose-600">-{totalOutAll.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Card 3: Asset Capitalization */}
            <div className="glass-card rounded-[17px] border border-white/60 p-5 flex flex-col justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.03)]">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 tracking-[-0.025em]">Total Capitalization</h3>
                  <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Asset Value
                  </span>
                </div>
                <div className="text-3xl font-black tracking-[-0.025em] text-slate-900 mt-2">
                  ${totalValue >= 10000 ? `${(totalValue / 1000).toFixed(1)}k` : totalValue.toFixed(2)}
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} valuation</p>
                <div className="flex items-end gap-1 h-8 mt-2">
                  {[25, 45, 55, 65, 80, 85, 95, 100].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-emerald-500 rounded-t-sm opacity-80"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/60 text-[11px] text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Physical Inventory</span>
                  <span className="font-bold text-slate-800">{totalStock.toLocaleString()} Units</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg SKU Price</span>
                  <span className="font-bold text-slate-800">
                    ${products.length ? (totalValue / (totalStock || 1)).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Supplier Network Status */}
            <div className="glass-card rounded-[17px] border border-white/60 p-5 flex flex-col justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.03)]">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 tracking-[-0.025em]">Supplier Network</h3>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Connected
                  </span>
                </div>
                <div className="text-3xl font-black tracking-[-0.025em] text-slate-900 mt-2">
                  {suppliers.length}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Procurement partners active</p>

                <div className="flex items-center gap-2 mt-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-200/50 shadow-2xs">
                    <Database size={15} />
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center border border-indigo-200/50 shadow-2xs">
                    <Layers size={15} />
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center border border-purple-200/50 shadow-2xs">
                    <BarChart2 size={15} />
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-white/70 text-slate-500 flex items-center justify-center text-[10px] font-bold border border-white/80">
                    {categories.length}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200/50">
                  <CheckCircle2 size={11} /> All supply lines operational
                </span>
              </div>
            </div>
          </div>

          {/* Middle Row: Report Library + Scheduled Reports + AI Report Builder */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 5 Cols: Report Library */}
            <div className="lg:col-span-5 glass-card rounded-[17px] border border-white/60 p-5 flex flex-col justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.03)]">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 tracking-[-0.025em]">Operational Reports</h3>
                  <button
                    type="button"
                    onClick={() => setLibraryCategory('All')}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                  >
                    View all
                  </button>
                </div>

                {/* Categories Pill Nav */}
                <div className="flex gap-1 overflow-x-auto pb-2 mb-3">
                  {['All', 'Favorites', 'Stock Movement', 'Valuation', 'Procurement'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setLibraryCategory(cat)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                        libraryCategory === cat
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-white/60 text-slate-500 hover:bg-white/90'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredLibrary.map((rep) => (
                    <div
                      key={rep.id}
                      onClick={() => setTab(rep.tabTarget)}
                      className="p-3.5 rounded-2xl bg-white/70 border border-white/80 hover:bg-white transition-all shadow-2xs flex flex-col justify-between group cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div
                            className={`w-7 h-7 rounded-lg ${rep.color} flex items-center justify-center font-bold text-xs shadow-2xs`}
                          >
                            <FileText size={14} />
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFavorites((prev) => ({ ...prev, [rep.id]: !prev[rep.id] }));
                            }}
                            className="text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                          >
                            <Star
                              size={14}
                              className={
                                favorites[rep.id]
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300'
                              }
                            />
                          </button>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                          {rep.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {rep.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/80 flex items-center justify-between text-[10px] text-slate-400">
                        <span>{rep.lastRun}</span>
                        <div className="flex gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 font-mono font-bold">
                            VIEW
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle 3 Cols: Scheduled Reports */}
            <div className="lg:col-span-3 glass-card rounded-[17px] border border-white/60 p-5 flex flex-col justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.03)]">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 tracking-[-0.025em]">Automated Digests</h3>
                  <button
                    type="button"
                    onClick={() => showToast('info', 'Schedule manager opened')}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Manage
                  </button>
                </div>

                <div className="space-y-2.5">
                  {[
                    {
                      id: 's1',
                      name: 'Daily Stock Movement Digest',
                      schedule: 'Every day at 08:00 AM',
                      format: 'PDF',
                    },
                    {
                      id: 's2',
                      name: 'Weekly Low-Stock Replenishment',
                      schedule: 'Every Monday at 09:00 AM',
                      format: 'XLSX',
                    },
                    {
                      id: 's3',
                      name: 'Monthly Asset Capitalization',
                      schedule: '1st of every month',
                      format: 'PDF',
                    },
                    {
                      id: 's4',
                      name: 'Quarterly Physical Count Audit',
                      schedule: 'Quarterly review',
                      format: 'XLSX',
                    },
                  ].map((s) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-2xl bg-white/60 border border-white/80 hover:bg-white/90 transition-all flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{s.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{s.schedule}</p>
                        <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-700">
                          {s.format}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setScheduledState((prev) => ({ ...prev, [s.id]: !prev[s.id] }))
                        }
                        className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                          scheduledState[s.id] ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                            scheduledState[s.id] ? 'left-4.5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 4 Cols: AI Report Builder - Vivid Apple Accent Card */}
            <div className="lg:col-span-4 apple-accent-card rounded-[17px] p-5.5 text-white shadow-[0_12px_32px_rgba(99,102,241,0.25)] flex flex-col justify-between border border-white/30">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <Sparkles size={16} className="text-white" />
                    </div>
                    <h3 className="text-sm font-bold tracking-[-0.025em]">Operational Synthesis</h3>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/25 backdrop-blur-xs uppercase tracking-wider">
                    AI Assistant
                  </span>
                </div>

                <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
                  Describe what you need and AI will synthesize an operational report across live catalog movements.
                </p>

                {/* Natural Language Prompt Input */}
                <div className="mt-4">
                  <textarea
                    rows={3}
                    value={promptQuery}
                    onChange={(e) => setPromptQuery(e.target.value)}
                    placeholder="e.g. Show stockout risk analysis and asset valuation for the top categories..."
                    className="w-full bg-white/20 placeholder-indigo-200/80 text-white text-xs rounded-2xl p-3 outline-none border border-white/30 focus:border-white focus:bg-white/25 transition-all resize-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => handleGenerateAIReport()}
                    disabled={isGenerating || !promptQuery.trim()}
                    className="w-full mt-2 py-2.5 bg-white text-indigo-950 hover:bg-slate-50 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Synthesizing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} className="text-indigo-600" />
                        <span>Generate Report</span>
                      </>
                    )}
                  </button>
                </div>

                {generatedResult && (
                  <div className="mt-3 p-3 rounded-xl bg-white/20 border border-white/30 text-[11px] text-white leading-relaxed animate-fade-slide">
                    {generatedResult}
                  </div>
                )}

                {/* Suggested Reports */}
                <div className="mt-4 pt-3 border-t border-white/20">
                  <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">
                    Suggested Reports
                  </span>
                  <ul className="mt-2 space-y-1 text-xs">
                    {[
                      'Valuation breakdown by supplier partner',
                      'Restock priorities for low buffer items',
                      'High velocity SKUs vs dead stock turn',
                    ].map((sugg, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          onClick={() => {
                            setPromptQuery(sugg);
                            handleGenerateAIReport(sugg);
                          }}
                          className="text-left text-white/90 hover:text-white hover:underline flex items-center gap-1.5 py-0.5 text-[11px] transition-colors cursor-pointer"
                        >
                          <span className="text-indigo-300">↗</span>
                          <span>{sugg}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Recent Transaction Ledger Activity + Movement Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Recent Transaction Activity (8 Cols) */}
            <div className="lg:col-span-8 glass-card rounded-[17px] border border-white/60 p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-[-0.025em]">Recent Movement Activity</h3>
                  <p className="text-[11px] text-slate-400">Live transaction movements recorded across the store</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTab('movement')}
                  className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View Full Ledger &rarr;
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/60 bg-white/30 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="px-4 py-2.5 text-left">Reference / Item</th>
                      <th className="px-4 py-2.5 text-left">Type</th>
                      <th className="px-4 py-2.5 text-right">Units</th>
                      <th className="px-4 py-2.5 text-left">Recorded By</th>
                      <th className="px-4 py-2.5 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/50">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                          No stock movement transactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      transactions.slice(0, 5).map((t) => {
                        const prod = products.find((p) => p.id === t.productId);
                        return (
                          <tr key={t.id} className="hover:bg-white/50 transition-colors">
                            <td className="px-4 py-3 font-bold text-slate-900">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] text-indigo-600 bg-indigo-50/80 px-1.5 py-0.5 rounded border border-indigo-200/50">
                                  {t.reference || `REF-${t.id.slice(0, 5)}`}
                                </span>
                                <span className="truncate max-w-[160px]">{prod?.name ?? 'Catalog SKU'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={t.type} />
                            </td>
                            <td className="px-4 py-3 text-right font-black tracking-[-0.025em] text-slate-900">
                              {t.type === 'Stock Out' ? `-${t.quantity}` : `+${t.quantity}`}
                            </td>
                            <td className="px-4 py-3 text-slate-600 font-medium">{t.performedBy}</td>
                            <td className="px-4 py-3 text-right text-slate-400 font-mono text-[11px]">{t.createdAt}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Movement by Transaction Type (4 Cols) */}
            <div className="lg:col-span-4 glass-card rounded-[17px] border border-white/60 p-5 flex flex-col justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.03)]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-[-0.025em] mb-1">
                  Movement Distribution
                </h3>
                <p className="text-[11px] text-slate-400 mb-4">Volume breakdown across transaction types</p>

                <div className="flex items-center justify-center py-2">
                  <div className="relative w-28 h-28 rounded-full border-8 border-indigo-500/20 border-t-emerald-500 border-r-indigo-600 flex items-center justify-center shadow-inner">
                    <div className="text-center">
                      <span className="text-xl font-black tracking-[-0.025em] text-slate-900">{transactions.length}</span>
                      <p className="text-[9px] font-semibold text-slate-400 uppercase">Movements</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-4 text-xs font-semibold text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Stock-In Replenishment
                    </span>
                    <span className="font-bold text-slate-900">{txInPct}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                      Stock-Out Fulfillment
                    </span>
                    <span className="font-bold text-slate-900">{txOutPct}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                      Stock Adjustments
                    </span>
                    <span className="font-bold text-slate-900">{txAdjPct}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. INVENTORY SUMMARY VIEW */}
      {tab === 'summary' && (
        <div className="space-y-5 animate-fade-slide">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
            <KPICard label="Total Catalog SKUs" value={products.length} />
            <KPICard label="Total Physical Units" value={totalStock.toLocaleString()} />
            <KPICard
              label="Asset Valuation"
              value={`$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
            <KPICard label="Low Stock Items" value={lowCount} variant={lowCount > 0 ? 'warning' : 'default'} />
            <KPICard label="Depleted Items" value={outCount} variant={outCount > 0 ? 'danger' : 'default'} />
          </div>

          <div className="glass-card rounded-[17px] border border-white/60 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.03)]">
            <div className="px-5 py-4 bg-white/40 border-b border-white/60 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Master Catalog Overview</h2>
              <span className="text-[11px] text-slate-400">{products.length} Products</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/60 bg-white/30 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    {['Product Name', 'Category', 'Current Units', 'Unit Price', 'Total Valuation', 'Status'].map(
                      (h) => (
                        <th
                          key={h}
                          className={`px-5 py-3 ${
                            ['Current Units', 'Unit Price', 'Total Valuation'].includes(h) ? 'text-right' : 'text-left'
                          }`}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/50">
                  {products.map((p) => {
                    const stock = getStock(p.id);
                    const val = stock * p.price;
                    return (
                      <tr key={p.id} className="hover:bg-white/50 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          <button
                            type="button"
                            onClick={() => navigate('product-detail', p.id)}
                            className="hover:text-indigo-600 transition-colors text-left cursor-pointer"
                          >
                            {p.name}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 font-medium">{getCatName(p.categoryId)}</td>
                        <td className="px-5 py-3.5 text-right font-black tracking-[-0.025em] text-slate-900">{stock}</td>
                        <td className="px-5 py-3.5 text-right text-slate-500 font-mono">${p.price.toFixed(2)}</td>
                        <td className="px-5 py-3.5 text-right font-black tracking-[-0.025em] text-indigo-700">
                          ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={getStockStatus(p.id)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. MOVEMENT FLOW VIEW */}
      {tab === 'movement' && (
        <div className="space-y-5 animate-fade-slide">
          <div className="glass-card rounded-[17px] border border-white/60 p-3 md:p-4 flex gap-3 flex-wrap items-center shadow-[0_8px_32px_0_rgba(0,0,0,0.03)]">
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              className="glass-input px-3 py-2 text-xs rounded-xl text-slate-700 cursor-pointer font-medium"
            >
              <option value="">All Movement Types</option>
              <option value="Stock In">Stock In</option>
              <option value="Stock Out">Stock Out</option>
              <option value="Adjustment">Adjustment</option>
            </select>
            <select
              value={movementProduct}
              onChange={(e) => setMovementProduct(e.target.value)}
              className="glass-input px-3 py-2 text-xs rounded-xl text-slate-700 cursor-pointer font-medium"
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <KPICard label="Total Inbound Stock" value={totalIn} variant="success" />
            <KPICard label="Total Outbound Dispatched" value={totalOut} variant="danger" />
            <KPICard
              label="Net Inventory Delta"
              value={netMovement >= 0 ? `+${netMovement}` : String(netMovement)}
              variant={netMovement >= 0 ? 'success' : 'danger'}
            />
          </div>

          <div className="grid xl:grid-cols-2 gap-5">
            <div className="glass-card rounded-[17px] border border-white/60 p-5 md:p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.03)]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
                Velocity Comparison by SKU
              </h3>
              <SimpleBarChart data={chartData} />
            </div>

            <div className="glass-card rounded-[17px] border border-white/60 overflow-hidden flex flex-col justify-between shadow-[0_8px_32px_0_rgba(0,0,0,0.03)]">
              <div className="px-5 py-4 bg-white/40 border-b border-white/60">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Movement Activity</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/60 bg-white/30 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      {['Timestamp', 'Product Name', 'Type', 'Qty', 'Operator'].map((h) => (
                        <th key={h} className={`px-4 py-2.5 ${h === 'Qty' ? 'text-right' : 'text-left'}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/50">
                    {filteredMovement.slice(0, 10).map((t) => (
                      <tr key={t.id} className="hover:bg-white/50 transition-colors">
                        <td className="px-4 py-3 text-[11px] font-mono text-slate-400">{t.createdAt}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{products.find((p) => p.id === t.productId)?.name ?? 'Unknown'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={t.type} />
                        </td>
                        <td className="px-4 py-3 text-right font-black tracking-[-0.025em] text-slate-900">{t.quantity}</td>
                        <td className="px-4 py-3 text-slate-600 font-medium">{t.performedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. LOW STOCK VIEW */}
      {tab === 'lowstock' && (
        <div className="space-y-5 animate-fade-slide">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <KPICard
              label="Low Stock Risk Count"
              value={lowCount}
              variant={lowCount > 0 ? 'warning' : 'default'}
              sub="Operating at or below reorder buffer"
            />
            <KPICard
              label="Zero Stock Outages"
              value={outCount}
              variant={outCount > 0 ? 'danger' : 'default'}
              sub="Zero units in physical inventory"
            />
          </div>

          <div className="glass-card rounded-[17px] border border-white/60 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.03)]">
            <div className="px-5 py-4 bg-amber-500/10 border-b border-amber-200/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Products Requiring Restock Orders
              </h3>
            </div>
            {lowStockProducts.length === 0 ? (
              <p className="px-5 py-12 text-center text-xs text-slate-500 font-medium">
                ✨ All products in the catalog are stocked above their reorder thresholds.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/60 bg-white/30 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      {['Product Name', 'SKU', 'Category', 'Current Units', 'Reorder Level', 'Status'].map((h) => (
                        <th
                          key={h}
                          className={`px-5 py-3 ${
                            ['Current Units', 'Reorder Level'].includes(h) ? 'text-right' : 'text-left'
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/50">
                    {lowStockProducts.map((p) => {
                      const stock = getStock(p.id);
                      return (
                        <tr key={p.id} className="hover:bg-white/50 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-900">
                            <button
                              type="button"
                              onClick={() => navigate('product-detail', p.id)}
                              className="hover:text-indigo-600 transition-colors text-left cursor-pointer"
                            >
                              {p.name}
                            </button>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-400">{p.sku}</td>
                          <td className="px-5 py-3.5 text-slate-600 font-medium">{getCatName(p.categoryId)}</td>
                          <td className="px-5 py-3.5 text-right font-black tracking-[-0.025em] text-slate-900">{stock}</td>
                          <td className="px-5 py-3.5 text-right font-mono text-slate-400">{p.reorderLevel}</td>
                          <td className="px-5 py-3.5">
                            <Badge variant={getStockStatus(p.id)} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. VALUATION BREAKDOWN VIEW */}
      {tab === 'value' && (
        <div className="space-y-5 animate-fade-slide">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <KPICard
              label="Total Capital Valuation"
              value={`$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              variant="success"
            />
            <KPICard
              label="Average SKU Valuation"
              value={`$${
                products.length
                  ? (totalValue / products.length).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : '0.00'
              }`}
            />
            <KPICard
              label="Top Asset Allocation"
              value={(() => {
                if (!products.length) return '—';
                const p = products.reduce((a, b) =>
                  getStock(a.id) * a.price > getStock(b.id) * b.price ? a : b
                );
                return p.name;
              })()}
            />
          </div>

          <div className="glass-card rounded-[17px] border border-white/60 overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.03)]">
            <div className="px-5 py-4 bg-white/40 border-b border-white/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Valuation Distribution by SKU</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/60 bg-white/30 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    {['Product Name', 'Category', 'Stock Units', 'Unit Price', 'Total Valuation', 'Portfolio Share'].map(
                      (h) => (
                        <th
                          key={h}
                          className={`px-5 py-3 ${
                            ['Stock Units', 'Unit Price', 'Total Valuation', 'Portfolio Share'].includes(h)
                              ? 'text-right'
                              : 'text-left'
                          }`}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/50">
                  {[...products]
                    .sort((a, b) => getStock(b.id) * b.price - getStock(a.id) * a.price)
                    .map((p) => {
                      const stock = getStock(p.id);
                      const val = stock * p.price;
                      const pct = totalValue > 0 ? ((val / totalValue) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={p.id} className="hover:bg-white/50 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-900">
                            <button
                              type="button"
                              onClick={() => navigate('product-detail', p.id)}
                              className="hover:text-indigo-600 transition-colors text-left cursor-pointer"
                            >
                              {p.name}
                            </button>
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 font-medium">{getCatName(p.categoryId)}</td>
                          <td className="px-5 py-3.5 text-right font-black tracking-[-0.025em] text-slate-900">{stock}</td>
                          <td className="px-5 py-3.5 text-right text-slate-500 font-mono">${p.price.toFixed(2)}</td>
                          <td className="px-5 py-3.5 text-right font-black tracking-[-0.025em] text-indigo-700">
                            ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-20 h-2 bg-white/60 rounded-full overflow-hidden border border-white/80">
                                <div
                                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-slate-500 font-mono text-[11px] w-10 text-right">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
