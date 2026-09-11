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
  Layers,
  PieChart,
  TrendingUp,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Badge, KPICard, PageHeader } from '../components/ui';
import { useApp } from '../context';

type ReportTab = 'overview' | 'summary' | 'movement' | 'lowstock' | 'value';

function SimpleBarChart({ data }: { data: { label: string; inQty: number; outQty: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 text-xs font-medium border border-dashed border-white/50 rounded-2xl bg-white/25">
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
          <div className="flex gap-1.5 h-3.5 p-0.5 bg-white/35 rounded-full border border-white/50 backdrop-blur-xs">
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
      <div className="flex gap-5 mt-4 pt-3 border-t border-white/50 text-xs font-semibold text-slate-600">
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

  // Real data-driven mini bars for movement (last 8 movements)
  const movementSparklines = useMemo(() => {
    if (transactions.length === 0) return [15, 15, 15, 15, 15, 15, 15, 15];
    const recent = transactions.slice(0, 8).reverse();
    const max = Math.max(...recent.map((t) => t.quantity), 1);
    return recent.map((t) => Math.max(15, Math.round((t.quantity / max) * 100)));
  }, [transactions]);

  // Real data-driven mini bars for valuation (top 8 products by value)
  const valuationSparklines = useMemo(() => {
    if (products.length === 0) return [15, 15, 15, 15, 15, 15, 15, 15];
    const sorted = [...products].sort((a, b) => (getStock(b.id) * b.price) - (getStock(a.id) * a.price)).slice(0, 8);
    const max = Math.max(...sorted.map((p) => getStock(p.id) * p.price), 1);
    return sorted.map((p) => Math.max(15, Math.round(((getStock(p.id) * p.price) / max) * 100)));
  }, [products, inventory]);

  const chartData = products.slice(0, 6).map((p) => ({
    label: p.name.split(' ').slice(0, 2).join(' '),
    inQty: transactions.filter((t) => t.productId === p.id && t.type === 'Stock In').reduce((s, t) => s + t.quantity, 0),
    outQty: transactions.filter((t) => t.productId === p.id && t.type === 'Stock Out').reduce((s, t) => s + t.quantity, 0),
  }));

  const lowStockProducts = products.filter(
    (p) => getStockStatus(p.id) === 'Low Stock' || getStockStatus(p.id) === 'Out of Stock'
  );

  const tabs: { id: ReportTab; label: string }[] = [
    { id: 'overview', label: 'Executive Overview' },
    { id: 'summary', label: 'Catalog Summary' },
    { id: 'movement', label: 'Stock Movement' },
    { id: 'lowstock', label: 'Low Stock Risk' },
    { id: 'value', label: 'Asset Valuation' },
  ];

  const handleExportCSV = () => {
    let csvContent = '';
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `stockflow-${tab}-report-${dateStr}.csv`;

    if (tab === 'summary' || tab === 'overview') {
      csvContent = 'Product Name,SKU,Category,Units In Stock,Unit Price,Total Valuation,Status\n';
      products.forEach((p) => {
        const stock = getStock(p.id);
        const val = stock * p.price;
        csvContent += `"${p.name}","${p.sku}","${getCatName(p.categoryId)}",${stock},${p.price.toFixed(2)},${val.toFixed(2)},"${getStockStatus(p.id)}"\n`;
      });
    } else if (tab === 'movement') {
      csvContent = 'Timestamp,Reference,Product,Type,Quantity,Operator\n';
      filteredMovement.forEach((t) => {
        const prod = products.find((p) => p.id === t.productId);
        csvContent += `"${t.createdAt}","${t.reference}","${prod?.name ?? 'Unknown'}","${t.type}",${t.quantity},"${t.performedBy}"\n`;
      });
    } else if (tab === 'lowstock') {
      csvContent = 'Product Name,SKU,Category,Current Stock,Reorder Level,Status\n';
      lowStockProducts.forEach((p) => {
        csvContent += `"${p.name}","${p.sku}","${getCatName(p.categoryId)}",${getStock(p.id)},${p.reorderLevel},"${getStockStatus(p.id)}"\n`;
      });
    } else if (tab === 'value') {
      csvContent = 'Product Name,Category,Units In Stock,Unit Price,Total Valuation,Portfolio Share %\n';
      products.forEach((p) => {
        const stock = getStock(p.id);
        const val = stock * p.price;
        const pct = totalValue > 0 ? ((val / totalValue) * 100).toFixed(1) : '0.0';
        csvContent += `"${p.name}","${getCatName(p.categoryId)}",${stock},${p.price.toFixed(2)},${val.toFixed(2)},${pct}%\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', `Exported ${tab.toUpperCase()} report to CSV`);
  };

  return (
    <div className="max-w-7xl space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Operational Reports"
        subtitle="Synthesize real-time catalog movements, asset valuations, and replenishment schedules."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2 glass-input rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-2 cursor-pointer border border-white/70 hover:bg-white/60 transition-all shadow-xs"
            >
              <Download size={14} className="text-slate-500" />
              <span>Export {tab.toUpperCase()} CSV</span>
            </button>
          </div>
        }
      />

      {/* Apple Glass Tab Navigator */}
      <div className="flex gap-1.5 bg-white/35 p-1.5 rounded-[17px] border border-white/55 w-full sm:w-fit overflow-x-auto backdrop-blur-xl shadow-xs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer ${
              tab === t.id
                ? 'bg-white/80 text-slate-900 shadow-xs border border-white/70'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. EXECUTIVE OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI & Distribution Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Catalog Stock Distribution */}
            <div className="glass-card rounded-[17px] border border-white/55 p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 tracking-tight mb-3">Stock Level Health</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2 p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-xs flex flex-col justify-between">
                    <span className="text-[10px] font-semibold text-indigo-200">In Stock Buffer</span>
                    <span className="text-xl font-black tracking-tight mt-1">{inStockPct}%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-2xs flex flex-col justify-between">
                    <span className="text-[9px] font-semibold text-amber-100">Low Stock</span>
                    <span className="text-sm font-black tracking-tight mt-0.5">{lowStockPct}%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-500 text-white shadow-2xs flex flex-col justify-between">
                    <span className="text-[9px] font-semibold text-rose-100">Depleted</span>
                    <span className="text-sm font-black tracking-tight mt-0.5">{outOfStockPct}%</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                <span>Active Scope</span>
                <span className="text-indigo-600 font-bold">{products.length} SKUs in {categories.length} Categories</span>
              </div>
            </div>

            {/* Card 2: 30D Movement Volume */}
            <div className="glass-card rounded-[17px] border border-white/55 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight">Stock Movement Volume</h3>
                  <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                    30-Day Activity
                  </span>
                </div>
                <div className="text-3xl font-black tracking-tight text-slate-900 mt-2">
                  {totalUnitsMoved.toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Total units transacted</p>
                <div className="flex items-end gap-1 h-8 mt-2">
                  {movementSparklines.map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-indigo-500 rounded-t-sm opacity-80"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/50 text-[11px] text-slate-500 space-y-1">
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
            <div className="glass-card rounded-[17px] border border-white/55 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight">Total Capitalization</h3>
                  <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Asset Value
                  </span>
                </div>
                <div className="text-3xl font-black tracking-tight text-slate-900 mt-2">
                  ${totalValue >= 10000 ? `${(totalValue / 1000).toFixed(1)}k` : totalValue.toFixed(2)}
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} valuation</p>
                <div className="flex items-end gap-1 h-8 mt-2">
                  {valuationSparklines.map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-emerald-500 rounded-t-sm opacity-80"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/50 text-[11px] text-slate-500 space-y-1">
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
            <div className="glass-card rounded-[17px] border border-white/55 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 tracking-tight">Supplier Network</h3>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <div className="text-3xl font-black tracking-tight text-slate-900 mt-2">
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
                  <div className="w-8 h-8 rounded-xl bg-white/50 text-slate-500 flex items-center justify-center text-[10px] font-bold border border-white/60">
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

          {/* Middle Row: Operational Workspaces (Replacing AI card & Mock items with Real Workspaces) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Workspace 1: Valuation Breakdown */}
            <div className="glass-card rounded-[17px] border border-white/55 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center border border-indigo-200/50">
                    <TrendingUp size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                    Asset Audit
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">Asset Valuation & Portfolio</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Analyze inventory capitalization, weighted average SKU values, and portfolio concentration.
                </p>
                <div className="mt-4 p-3 rounded-xl bg-white/35 border border-white/50 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Valuation:</span>
                    <span className="font-bold text-slate-900">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Active SKUs:</span>
                    <span className="font-bold text-slate-900">{products.length} Items</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTab('value')}
                className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                View Asset Valuation →
              </button>
            </div>

            {/* Workspace 2: Velocity & Movements */}
            <div className="glass-card rounded-[17px] border border-white/55 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-200/50">
                    <Activity size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Flow Analysis
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">Stock Movement & Velocity</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Track inbound replenish flow against customer dispatch throughput to identify inventory turn rates.
                </p>
                <div className="mt-4 p-3 rounded-xl bg-white/35 border border-white/50 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Net Delta:</span>
                    <span className={`font-bold ${netMovement >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {netMovement >= 0 ? `+${netMovement}` : netMovement} Units
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transactions:</span>
                    <span className="font-bold text-slate-900">{transactions.length} Records</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTab('movement')}
                className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Analyze Movement Flow →
              </button>
            </div>

            {/* Workspace 3: Threshold & Reorder Risk */}
            <div className="glass-card rounded-[17px] border border-white/55 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-200/50">
                    <AlertTriangle size={16} />
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    Restock Alerts
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">Threshold & Reorder Buffer</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Monitor SKUs approaching zero safety buffers to prevent fulfillment halts and backorders.
                </p>
                <div className="mt-4 p-3 rounded-xl bg-white/35 border border-white/50 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Low Stock SKUs:</span>
                    <span className="font-bold text-amber-600">{lowCount} Items</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Depleted SKUs:</span>
                    <span className="font-bold text-rose-600">{outCount} Items</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTab('lowstock')}
                className="mt-4 w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Review Reorder Risk →
              </button>
            </div>
          </div>

          {/* Bottom Row: Recent Transaction Ledger Activity + Movement Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Recent Transaction Activity (8 Cols) */}
            <div className="lg:col-span-8 glass-card rounded-[17px] border border-white/55 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">Recent Movement Activity</h3>
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
                    <tr className="border-b border-white/50 bg-white/20 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="px-4 py-2.5 text-left">Reference / Item</th>
                      <th className="px-4 py-2.5 text-left">Type</th>
                      <th className="px-4 py-2.5 text-right">Units</th>
                      <th className="px-4 py-2.5 text-left">Recorded By</th>
                      <th className="px-4 py-2.5 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/40">
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
                          <tr key={t.id} className="hover:bg-white/40 transition-colors">
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
                            <td className="px-4 py-3 text-right font-black tracking-tight text-slate-900">
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
            <div className="lg:col-span-4 glass-card rounded-[17px] border border-white/55 p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-1">
                  Movement Distribution
                </h3>
                <p className="text-[11px] text-slate-400 mb-4">Volume breakdown across transaction types</p>

                <div className="flex items-center justify-center py-2">
                  <div className="relative w-28 h-28 rounded-full border-8 border-indigo-500/20 border-t-emerald-500 border-r-indigo-600 flex items-center justify-center shadow-inner">
                    <div className="text-center">
                      <span className="text-xl font-black tracking-tight text-slate-900">{transactions.length}</span>
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
        <div className="space-y-5">
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

          <div className="glass-card rounded-[17px] border border-white/55 overflow-hidden">
            <div className="px-5 py-4 bg-white/25 border-b border-white/50 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Master Catalog Overview</h2>
              <span className="text-[11px] text-slate-400">{products.length} Products</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/50 bg-white/20 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
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
                <tbody className="divide-y divide-white/40">
                  {products.map((p) => {
                    const stock = getStock(p.id);
                    const val = stock * p.price;
                    return (
                      <tr key={p.id} className="hover:bg-white/40 transition-colors">
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
                        <td className="px-5 py-3.5 text-right font-black tracking-tight text-slate-900">{stock}</td>
                        <td className="px-5 py-3.5 text-right text-slate-500 font-mono">${p.price.toFixed(2)}</td>
                        <td className="px-5 py-3.5 text-right font-black tracking-tight text-indigo-700">
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
        <div className="space-y-5">
          <div className="glass-card rounded-[17px] border border-white/55 p-3 md:p-4 flex gap-3 flex-wrap items-center">
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
            <div className="glass-card rounded-[17px] border border-white/55 p-5 md:p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
                Velocity Comparison by SKU
              </h3>
              <SimpleBarChart data={chartData} />
            </div>

            <div className="glass-card rounded-[17px] border border-white/55 overflow-hidden flex flex-col justify-between">
              <div className="px-5 py-4 bg-white/25 border-b border-white/50">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Movement Activity</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/50 bg-white/20 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      {['Timestamp', 'Product Name', 'Type', 'Qty', 'Operator'].map((h) => (
                        <th key={h} className={`px-4 py-2.5 ${h === 'Qty' ? 'text-right' : 'text-left'}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/40">
                    {filteredMovement.slice(0, 10).map((t) => (
                      <tr key={t.id} className="hover:bg-white/40 transition-colors">
                        <td className="px-4 py-3 text-[11px] font-mono text-slate-400">{t.createdAt}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{products.find((p) => p.id === t.productId)?.name ?? 'Unknown'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={t.type} />
                        </td>
                        <td className="px-4 py-3 text-right font-black tracking-tight text-slate-900">{t.quantity}</td>
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
        <div className="space-y-5">
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

          <div className="glass-card rounded-[17px] border border-white/55 overflow-hidden">
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
                    <tr className="border-b border-white/50 bg-white/20 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
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
                  <tbody className="divide-y divide-white/40">
                    {lowStockProducts.map((p) => {
                      const stock = getStock(p.id);
                      return (
                        <tr key={p.id} className="hover:bg-white/40 transition-colors">
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
                          <td className="px-5 py-3.5 text-right font-black tracking-tight text-slate-900">{stock}</td>
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
        <div className="space-y-5">
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

          <div className="glass-card rounded-[17px] border border-white/55 overflow-hidden">
            <div className="px-5 py-4 bg-white/25 border-b border-white/50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Valuation Distribution by SKU</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/50 bg-white/20 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
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
                <tbody className="divide-y divide-white/40">
                  {[...products]
                    .sort((a, b) => getStock(b.id) * b.price - getStock(a.id) * a.price)
                    .map((p) => {
                      const stock = getStock(p.id);
                      const val = stock * p.price;
                      const pct = totalValue > 0 ? ((val / totalValue) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={p.id} className="hover:bg-white/40 transition-colors">
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
                          <td className="px-5 py-3.5 text-right font-black tracking-tight text-slate-900">{stock}</td>
                          <td className="px-5 py-3.5 text-right text-slate-500 font-mono">${p.price.toFixed(2)}</td>
                          <td className="px-5 py-3.5 text-right font-black tracking-tight text-indigo-700">
                            ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-20 h-2 bg-white/40 rounded-full overflow-hidden border border-white/60">
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
