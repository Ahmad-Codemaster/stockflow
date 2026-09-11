import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Boxes,
  Eye,
  Package,
  PieChart,
  Sparkles,
  TrendingDown,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import {
  CategoryValuationDonutChart,
  KPISparkline,
  StockMovementActivityChart,
} from '../components/DashboardCharts';
import { Badge, KPICard, PageHeader } from '../components/ui';
import UserManualModal from '../components/UserManualModal';
import { useApp } from '../context';

function InventoryStatusChart({
  healthy,
  low,
  outOfStock,
  onFilterClick,
}: {
  healthy: number;
  low: number;
  outOfStock: number;
  onFilterClick: (status: string) => void;
}) {
  const total = healthy + low + outOfStock;
  const hPct = total > 0 ? (healthy / total) * 100 : 0;
  const lPct = total > 0 ? (low / total) * 100 : 0;
  const oPct = total > 0 ? (outOfStock / total) * 100 : 0;

  return (
    <div className="space-y-3.5">
      {/* Visual Multi-Segment Bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-1 p-0.5 bg-white/50 border border-white/60 shadow-2xs backdrop-blur-md">
        {total === 0 ? (
          <div className="w-full h-full bg-white/40 rounded-full flex items-center justify-center text-[9px] text-slate-400 font-medium">
            No Catalog Items
          </div>
        ) : (
          <>
            {healthy > 0 && (
              <button
                type="button"
                onClick={() => onFilterClick('In Stock')}
                className="bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-300 hover:opacity-90 cursor-pointer"
                style={{ width: `${hPct}%` }}
                title={`In Stock: ${healthy} (${Math.round(hPct)}%)`}
              />
            )}
            {low > 0 && (
              <button
                type="button"
                onClick={() => onFilterClick('Low Stock')}
                className="bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-300 hover:opacity-90 cursor-pointer"
                style={{ width: `${lPct}%` }}
                title={`Low Stock: ${low} (${Math.round(lPct)}%)`}
              />
            )}
            {outOfStock > 0 && (
              <button
                type="button"
                onClick={() => onFilterClick('Out of Stock')}
                className="bg-gradient-to-r from-rose-400 to-rose-500 rounded-full transition-all duration-300 hover:opacity-90 cursor-pointer"
                style={{ width: `${oPct}%` }}
                title={`Out of Stock: ${outOfStock} (${Math.round(oPct)}%)`}
              />
            )}
          </>
        )}
      </div>

      {/* Pill Metric Cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: 'In Stock',
            count: healthy,
            pct: Math.round(hPct),
            bg: 'bg-emerald-500/10 border-emerald-200/60 hover:bg-emerald-500/15',
            dot: 'bg-emerald-500',
            text: 'text-emerald-700',
            filter: 'In Stock',
          },
          {
            label: 'Low Stock',
            count: low,
            pct: Math.round(lPct),
            bg: 'bg-amber-500/10 border-amber-200/60 hover:bg-amber-500/15',
            dot: 'bg-amber-500',
            text: 'text-amber-700',
            filter: 'Low Stock',
          },
          {
            label: 'Depleted',
            count: outOfStock,
            pct: Math.round(oPct),
            bg: 'bg-rose-500/10 border-rose-200/60 hover:bg-rose-500/15',
            dot: 'bg-rose-500',
            text: 'text-rose-700',
            filter: 'Out of Stock',
          },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onFilterClick(item.filter)}
            className={`rounded-xl p-2.5 border ${item.bg} flex flex-col justify-between shadow-2xs backdrop-blur-md text-left transition-all cursor-pointer group`}
          >
            <div className="flex items-baseline justify-between">
              <span className={`text-lg font-black tracking-tight ${item.text}`}>{item.count}</span>
              <span className="text-[9.5px] font-mono font-bold text-slate-400">{item.pct}%</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
              <span className="text-[10px] font-semibold text-slate-600 group-hover:text-slate-900 truncate">
                {item.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { products, inventory, transactions, categories, navigate, getStockStatus } = useApp();
  const [showManual, setShowManual] = useState(false);
  const [showGuideBanner, setShowGuideBanner] = useState(true);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  );
  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );
  const inventoryMap = useMemo(
    () => new Map(inventory.map((i) => [i.productId, i.currentStock])),
    [inventory]
  );

  const totalProducts = products.length;
  const totalStock = inventory.reduce((sum, i) => sum + i.currentStock, 0);
  const lowStock = products.filter((p) => getStockStatus(p.id) === 'Low Stock').length;
  const outOfStock = products.filter((p) => getStockStatus(p.id) === 'Out of Stock').length;
  const healthy = totalProducts - lowStock - outOfStock;
  const healthRate = totalProducts > 0 ? Math.round((healthy / totalProducts) * 100) : 100;

  const inventoryValue = useMemo(() => {
    return products.reduce((sum, p) => {
      const stock = inventoryMap.get(p.id) ?? 0;
      return sum + stock * p.price;
    }, 0);
  }, [products, inventoryMap]);

  const recentTxns = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [transactions]
  );

  const lowStockProducts = useMemo(
    () =>
      products
        .filter((p) => getStockStatus(p.id) === 'Low Stock' || getStockStatus(p.id) === 'Out of Stock')
        .slice(0, 5),
    [products, getStockStatus]
  );

  function getCategoryName(id: string) {
    return categoryMap.get(id) ?? '—';
  }

  function getProductName(id: string) {
    return productMap.get(id)?.name ?? 'Unknown';
  }

  function getProductSku(id: string) {
    return productMap.get(id)?.sku ?? '—';
  }

  const txnBadge: Record<string, React.ReactNode> = {
    'Stock In': <Badge variant="Stock In" />,
    'Stock Out': <Badge variant="Stock Out" />,
    Adjustment: <Badge variant="Adjustment" />,
  };

  return (
    <div className="max-w-7xl space-y-4 sm:space-y-5">
      {/* Top Header */}
      <PageHeader
        title="Operations Dashboard"
        subtitle="Real-time catalog valuation, stock health metrics, and ledger movement."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowManual(true)}
              className="px-3 py-1.5 bg-white/70 hover:bg-white text-slate-700 border border-white/80 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all backdrop-blur-md cursor-pointer"
            >
              <BookOpen size={13.5} className="text-indigo-600" />
              <span>User Manual</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('stock-in')}
              className="px-3 py-1.5 gradient-btn-success text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <ArrowUpRight size={13.5} />
              <span>Stock In</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('stock-out')}
              className="px-3 py-1.5 gradient-btn-primary text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <ArrowDownRight size={13.5} />
              <span>Stock Out</span>
            </button>
          </div>
        }
      />

      {/* Operational Quick-Start Banner */}
      {showGuideBanner && (
        <div className="p-4 sm:p-4.5 rounded-[17px] apple-accent-card text-white shadow-[0_10px_28px_rgba(99,102,241,0.20)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden animate-fade-slide border border-white/30">
          <div className="flex items-center gap-3 z-10">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles size={17} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm tracking-tight">StockFlow Operational Guide & System Manual</span>
                <span className="text-[9.5px] font-bold px-2 py-0.2 rounded-full bg-white/25 text-white backdrop-blur-xs">
                  Quick Guide
                </span>
              </div>
              <p className="text-[11px] text-indigo-100 mt-0.5">
                Configure categories, suppliers, SKU definitions, and record tamper-proof stock movements.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 z-10 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setShowManual(true)}
              className="px-3 py-1.5 bg-white text-slate-900 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs hover:scale-[1.02] active:scale-[0.98]"
            >
              Open Manual
            </button>
            <button
              type="button"
              onClick={() => setShowGuideBanner(false)}
              className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/15 transition-colors cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* KPI Metrics Grid with Visual Sparklines (Compact & Dense) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div onClick={() => navigate('products')} className="cursor-pointer">
          <KPICard
            label="Catalog Products"
            value={totalProducts}
            sub={`${categories.length} active categories`}
            icon={<Boxes size={17} />}
            sparkline={<KPISparkline data={[3, 5, 4, 7, 6, 8, totalProducts]} color="#6366f1" />}
          />
        </div>
        <div onClick={() => navigate('inventory')} className="cursor-pointer">
          <KPICard
            label="Total Inventory Units"
            value={totalStock.toLocaleString()}
            sub={`$${inventoryValue.toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })} asset value`}
            icon={<Package size={17} />}
            sparkline={<KPISparkline data={[65, 80, 72, 90, 85, 110, totalStock || 10]} color="#10b981" />}
          />
        </div>
        <div onClick={() => navigate('inventory')} className="cursor-pointer">
          <KPICard
            label="Low Stock Alert"
            value={lowStock}
            sub={lowStock > 0 ? 'Requires restocking' : 'All levels optimum'}
            variant={lowStock > 0 ? 'warning' : 'default'}
            icon={<AlertTriangle size={17} />}
            sparkline={<KPISparkline data={[1, 3, 2, 4, 3, 2, lowStock]} color="#f59e0b" />}
          />
        </div>
        <div onClick={() => navigate('inventory')} className="cursor-pointer">
          <KPICard
            label="Out of Stock"
            value={outOfStock}
            sub={outOfStock > 0 ? 'Critical replenishment' : 'Zero depleted items'}
            variant={outOfStock > 0 ? 'danger' : 'default'}
            icon={<TrendingDown size={17} />}
            sparkline={<KPISparkline data={[2, 1, 3, 2, 1, 0, outOfStock]} color="#ef4444" />}
          />
        </div>
      </div>

      {/* Balanced Two-Pillar Master Grid (Left: Activity & Ledger | Right: Health & Valuation) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 sm:gap-4.5 items-start">
        {/* Left Column (xl:col-span-7) - Movement Activity & Recent Ledger */}
        <div className="xl:col-span-7 space-y-3.5 sm:space-y-4.5">
          {/* Stock Velocity & Movement Activity Chart */}
          <div className="glass-card rounded-[17px] border border-white/55 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 border border-orange-200/50">
                  <Activity size={14} />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">Stock Velocity & Movement Activity</h2>
                  <p className="text-[10px] text-slate-400">Inbound receipts vs outbound dispatch volumes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('transactions')}
                className="text-[10.5px] font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
              >
                View All Movements
              </button>
            </div>
            <StockMovementActivityChart transactions={transactions} />
          </div>

          {/* Recent Movement Ledger Table */}
          <div className="glass-card rounded-[17px] border border-white/55 overflow-hidden">
            <div className="px-4 py-3 bg-white/25 border-b border-white/50 flex items-center justify-between">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">Recent Movement Ledger</h2>
                <p className="text-[10px] text-slate-400">Latest immutable inventory transactions</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('transactions')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Full Ledger</span>
                <ArrowRight size={12} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/60 bg-white/30 text-slate-500 font-bold uppercase tracking-wider text-[9.5px]">
                    <th className="px-3.5 py-2.5 text-left">Product</th>
                    <th className="px-3 py-2.5 text-left">Type</th>
                    <th className="px-3 py-2.5 text-right">Qty</th>
                    <th className="px-3 py-2.5 text-left">Operator</th>
                    <th className="px-3.5 py-2.5 text-left">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/50">
                  {recentTxns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <p className="font-semibold text-slate-600 text-xs">No inventory transactions logged</p>
                          <p className="text-[10.5px] text-slate-400">Record a Stock In or Stock Out operation to begin tracking.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    recentTxns.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => navigate('transaction-detail', t.id)}
                        className="hover:bg-white/50 transition-colors cursor-pointer group"
                      >
                        <td className="px-3.5 py-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('product-detail', t.productId);
                            }}
                            className="font-bold text-slate-900 hover:text-indigo-600 text-left transition-colors cursor-pointer truncate max-w-[170px] block"
                          >
                            {getProductName(t.productId)}
                          </button>
                          <p className="text-[9.5px] text-slate-400 font-mono">{getProductSku(t.productId)}</p>
                        </td>
                        <td className="px-3 py-2.5">{txnBadge[t.type]}</td>
                        <td className="px-3 py-2.5 text-right">
                          <span
                            className={`inline-flex items-center justify-end gap-0.5 font-black tracking-tight ${
                              t.type === 'Stock In'
                                ? 'text-emerald-600'
                                : t.type === 'Stock Out'
                                ? 'text-rose-600'
                                : 'text-amber-600'
                            }`}
                          >
                            {t.type === 'Stock In' ? (
                              <ArrowUpRight size={12} />
                            ) : t.type === 'Stock Out' ? (
                              <ArrowDownRight size={12} />
                            ) : null}
                            {t.quantity}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 font-medium text-[11px]">{t.performedBy.split(' ')[0]}</td>
                        <td className="px-3.5 py-2.5 text-slate-400 font-mono text-[10.5px] group-hover:text-slate-700 transition-colors">
                          {t.createdAt}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (xl:col-span-5) - Inventory Health & Valuation */}
        <div className="xl:col-span-5 space-y-3.5 sm:space-y-4.5">
          {/* Inventory Health & Distribution Card (Compact, Naturally Sized, No Height Stretch) */}
          <div className="glass-card rounded-[17px] border border-white/55 p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 border border-purple-200/50">
                  <Sparkles size={14} />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">Inventory Distribution</h2>
                  <p className="text-[10px] text-slate-400">Stock condition across active SKUs</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('inventory')}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 border border-indigo-200/50 hover:bg-indigo-500/20 cursor-pointer transition-colors"
              >
                {totalProducts} SKUs
              </button>
            </div>

            <InventoryStatusChart
              healthy={healthy}
              low={lowStock}
              outOfStock={outOfStock}
              onFilterClick={() => navigate('inventory')}
            />

            {/* Overall Stock Health Progress & Quick Actions */}
            <div className="pt-3 border-t border-white/50 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium text-[11px]">Stock Health Ratio</span>
                <span className="font-extrabold text-emerald-700 text-[11.5px]">{healthRate}% Optimal</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${healthRate}%` }}
                />
              </div>

              {/* Fast Operational Shortcuts */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => navigate('stock-in')}
                  className="px-2.5 py-1.5 rounded-xl bg-white/60 hover:bg-white text-slate-700 text-[11px] font-bold border border-white/80 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                >
                  <ArrowUpRight size={12} className="text-emerald-600" />
                  <span>Receive (+In)</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('stock-out')}
                  className="px-2.5 py-1.5 rounded-xl bg-white/60 hover:bg-white text-slate-700 text-[11px] font-bold border border-white/80 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                >
                  <ArrowDownRight size={12} className="text-indigo-600" />
                  <span>Dispatch (-Out)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Category Asset Valuation Donut Chart Card */}
          <div className="glass-card rounded-[17px] border border-white/55 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 border border-purple-200/50">
                  <PieChart size={14} />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">Valuation by Category</h2>
                  <p className="text-[10px] text-slate-400">Asset value distribution across segments</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('reports')}
                className="text-[10.5px] font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
              >
                Detailed Report
              </button>
            </div>
            <CategoryValuationDonutChart categories={categories} products={products} inventory={inventory} />
          </div>
        </div>
      </div>

      {/* Restock Priority Queue (When Low Stock or Depleted SKUs Exist) */}
      {lowStockProducts.length > 0 && (
        <div className="glass-card rounded-[17px] border border-amber-200/60 overflow-hidden shadow-xs">
          <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-200/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-700">
                <AlertTriangle size={14} />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">Restock Priority Queue</h2>
                <p className="text-[10px] text-slate-500">{lowStockProducts.length} items operating at or below reorder levels</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('inventory')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
            >
              View Inventory Monitor
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/60 bg-white/30 text-slate-500 font-bold uppercase tracking-wider text-[9.5px]">
                  <th className="px-3.5 py-2.5 text-left">Product Name</th>
                  <th className="px-3 py-2.5 text-left">SKU</th>
                  <th className="px-3 py-2.5 text-left">Category</th>
                  <th className="px-3 py-2.5 text-right">Current Stock</th>
                  <th className="px-3 py-2.5 text-right">Reorder Level</th>
                  <th className="px-3 py-2.5 text-left">Status</th>
                  <th className="px-3.5 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/50">
                {lowStockProducts.map((p) => {
                  const stock = inventory.find((i) => i.productId === p.id)?.currentStock ?? 0;
                  const status = getStockStatus(p.id);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => navigate('product-detail', p.id)}
                      className="hover:bg-white/50 transition-colors cursor-pointer"
                    >
                      <td className="px-3.5 py-2.5 font-bold text-slate-900">{p.name}</td>
                      <td className="px-3 py-2.5 text-slate-400 font-mono text-[10.5px]">{p.sku}</td>
                      <td className="px-3 py-2.5 text-slate-600 font-medium text-[11px]">{getCategoryName(p.categoryId)}</td>
                      <td className="px-3 py-2.5 font-black tracking-tight text-slate-900 text-right">{stock}</td>
                      <td className="px-3 py-2.5 text-slate-400 font-mono text-right">{p.reorderLevel}</td>
                      <td className="px-3 py-2.5">
                        <Badge variant={status} />
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('stock-in', p.id);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-500/15 hover:bg-emerald-500/25 px-2 py-0.8 rounded-lg font-bold transition-colors cursor-pointer"
                            title="Restock this item"
                          >
                            <ArrowUpRight size={12} />
                            <span>Restock</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('product-detail', p.id);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-700 font-bold hover:underline cursor-pointer"
                          >
                            <Eye size={12} />
                            <span>Details</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <UserManualModal isOpen={showManual} onClose={() => setShowManual(false)} />
    </div>
  );
}
