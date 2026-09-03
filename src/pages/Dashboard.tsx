import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Eye,
  Package,
  PieChart,
  Sparkles,
  TrendingDown,
} from 'lucide-react';
import React, { useMemo } from 'react';
import {
  CategoryValuationDonutChart,
  KPISparkline,
  StockMovementActivityChart,
} from '../components/DashboardCharts';
import { Badge, KPICard, PageHeader } from '../components/ui';
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
  if (total === 0) return null;
  const hPct = (healthy / total) * 100;
  const lPct = (low / total) * 100;
  const oPct = (outOfStock / total) * 100;

  return (
    <div className="space-y-4">
      {/* Visual Multi-Segment Bar */}
      <div className="flex h-3.5 rounded-full overflow-hidden gap-1 p-0.5 bg-slate-100/80 border border-slate-200/80 shadow-2xs">
        {total === 0 ? (
          <div className="w-full h-full bg-slate-200/50 rounded-full flex items-center justify-center text-[9px] text-slate-400 font-medium" title="No inventory items yet">
            No Catalog Items Added
          </div>
        ) : (
          <>
            {healthy > 0 && (
              <button
                type="button"
                onClick={() => onFilterClick('In Stock')}
                className="bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500 hover:opacity-90 cursor-pointer"
                style={{ width: `${hPct}%` }}
                title={`In Stock: ${healthy} (${Math.round(hPct)}%) — Click to filter`}
              />
            )}
            {low > 0 && (
              <button
                type="button"
                onClick={() => onFilterClick('Low Stock')}
                className="bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500 hover:opacity-90 cursor-pointer"
                style={{ width: `${lPct}%` }}
                title={`Low Stock: ${low} (${Math.round(lPct)}%) — Click to filter`}
              />
            )}
            {outOfStock > 0 && (
              <button
                type="button"
                onClick={() => onFilterClick('Out of Stock')}
                className="bg-gradient-to-r from-rose-400 to-rose-500 rounded-full transition-all duration-500 hover:opacity-90 cursor-pointer"
                style={{ width: `${oPct}%` }}
                title={`Out of Stock: ${outOfStock} (${Math.round(oPct)}%) — Click to filter`}
              />
            )}
          </>
        )}
      </div>

      {/* Pill Metric Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          {
            label: 'In Stock',
            count: healthy,
            bg: 'bg-emerald-50/70 border-emerald-200/60 hover:bg-emerald-100/70',
            dot: 'bg-emerald-500',
            text: 'text-emerald-700',
            filter: 'In Stock',
          },
          {
            label: 'Low Stock',
            count: low,
            bg: 'bg-amber-50/70 border-amber-200/60 hover:bg-amber-100/70',
            dot: 'bg-amber-500',
            text: 'text-amber-700',
            filter: 'Low Stock',
          },
          {
            label: 'Out of Stock',
            count: outOfStock,
            bg: 'bg-rose-50/70 border-rose-200/60 hover:bg-rose-100/70',
            dot: 'bg-rose-500',
            text: 'text-rose-700',
            filter: 'Out of Stock',
          },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onFilterClick(item.filter)}
            className={`rounded-xl p-3 border ${item.bg} flex flex-col justify-between shadow-2xs backdrop-blur-xs text-left transition-colors cursor-pointer group`}
          >
            <div className={`text-xl font-extrabold ${item.text}`}>{item.count}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className={`w-2 h-2 rounded-full ${item.dot}`} />
              <span className="text-[11px] font-semibold text-slate-600 group-hover:text-slate-900">{item.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { products, inventory, transactions, categories, navigate, getStockStatus } = useApp();

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

  const inventoryValue = useMemo(() => {
    return products.reduce((sum, p) => {
      const stock = inventoryMap.get(p.id) ?? 0;
      return sum + stock * p.price;
    }, 0);
  }, [products, inventoryMap]);

  const recentTxns = [...transactions]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  const lowStockProducts = products
    .filter((p) => getStockStatus(p.id) === 'Low Stock' || getStockStatus(p.id) === 'Out of Stock')
    .slice(0, 5);

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
    <div className="max-w-7xl space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Operations Dashboard"
        subtitle="Real-time catalog valuation, stock health metrics, and ledger movement."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('stock-in')}
              className="px-3.5 py-2 gradient-btn-success text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <ArrowUpRight size={14} />
              <span>Stock In</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('stock-out')}
              className="px-3.5 py-2 gradient-btn-primary text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <ArrowDownRight size={14} />
              <span>Stock Out</span>
            </button>
          </div>
        }
      />

      {/* KPI Metrics Grid with Visual Sparklines */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div onClick={() => navigate('products')} className="cursor-pointer">
          <KPICard
            label="Catalog Products"
            value={totalProducts}
            sub={`${categories.length} active categories`}
            icon={<Boxes size={18} />}
            sparkline={<KPISparkline data={[3, 5, 4, 7, 6, 8, totalProducts]} color="#3b82f6" />}
          />
        </div>
        <div onClick={() => navigate('inventory')} className="cursor-pointer">
          <KPICard
            label="Total Inventory Units"
            value={totalStock.toLocaleString()}
            sub={`$${inventoryValue.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} asset value`}
            icon={<Package size={18} />}
            sparkline={<KPISparkline data={[65, 80, 72, 90, 85, 110, totalStock || 10]} color="#10b981" />}
          />
        </div>
        <div onClick={() => navigate('inventory')} className="cursor-pointer">
          <KPICard
            label="Low Stock Alert"
            value={lowStock}
            sub={lowStock > 0 ? 'Requires restocking' : 'All levels optimum'}
            variant={lowStock > 0 ? 'warning' : 'default'}
            icon={<AlertTriangle size={18} />}
            sparkline={<KPISparkline data={[1, 3, 2, 4, 3, 2, lowStock]} color="#f59e0b" />}
          />
        </div>
        <div onClick={() => navigate('inventory')} className="cursor-pointer">
          <KPICard
            label="Out of Stock"
            value={outOfStock}
            sub={outOfStock > 0 ? 'Critical replenishment' : 'Zero depleted items'}
            variant={outOfStock > 0 ? 'danger' : 'default'}
            icon={<TrendingDown size={18} />}
            sparkline={<KPISparkline data={[2, 1, 3, 2, 1, 0, outOfStock]} color="#ef4444" />}
          />
        </div>
      </div>

      {/* Modern Graphical Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 7-Day Inbound / Outbound Bar Activity Chart */}
        <div className="glass-card rounded-2xl p-5 md:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <Activity size={15} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Stock Velocity & Movement Activity</h2>
                <p className="text-[11px] text-slate-400">Inbound receipts vs outbound dispatch volumes</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('transactions')}
              className="text-[11px] font-semibold text-blue-600 hover:underline"
            >
              View All Movements
            </button>
          </div>
          <StockMovementActivityChart transactions={transactions} />
        </div>

        {/* Category Asset Valuation Donut Chart */}
        <div className="glass-card rounded-2xl p-5 md:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <PieChart size={15} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Valuation by Category</h2>
                <p className="text-[11px] text-slate-400">Proportional asset value distribution across segments</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('reports')}
              className="text-[11px] font-semibold text-blue-600 hover:underline"
            >
              Detailed Report
            </button>
          </div>
          <CategoryValuationDonutChart categories={categories} products={products} inventory={inventory} />
        </div>
      </div>

      {/* Main Grid: Inventory Distribution & Recent Ledger */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Inventory Status Breakdown */}
        <div className="glass-card rounded-2xl p-5 md:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Inventory Distribution</span>
                <Sparkles size={14} className="text-blue-500" />
              </h2>
              <button
                type="button"
                onClick={() => navigate('inventory')}
                className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
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
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Overall Stock Health</span>
            <span className="font-bold text-emerald-600">
              {totalProducts > 0 ? Math.round((healthy / totalProducts) * 100) : 0}% Optimum
            </span>
          </div>
        </div>

        {/* Recent Transactions Table Card */}
        <div className="xl:col-span-2 glass-card rounded-2xl overflow-hidden flex flex-col justify-between">
          <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-200/70 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Movement Ledger</h2>
              <p className="text-[11px] text-slate-400">Latest immutable inventory transactions</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('transactions')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>Full Ledger</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-2.5 text-left">Product</th>
                  <th className="px-4 py-2.5 text-left">Type</th>
                  <th className="px-4 py-2.5 text-right">Quantity</th>
                  <th className="px-4 py-2.5 text-left">Operator</th>
                  <th className="px-4 py-2.5 text-left">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {recentTxns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <p className="font-semibold text-slate-600">No inventory transactions logged</p>
                        <p className="text-[11px] text-slate-400">Perform a Stock In or Stock Out operation to begin tracking movements.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentTxns.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => navigate('transaction-detail', t.id)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('product-detail', t.productId);
                          }}
                          className="font-bold text-slate-900 hover:text-blue-600 text-left transition-colors cursor-pointer"
                        >
                          {getProductName(t.productId)}
                        </button>
                        <p className="text-[10px] text-slate-400 font-mono">{getProductSku(t.productId)}</p>
                      </td>
                      <td className="px-4 py-3">{txnBadge[t.type]}</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`inline-flex items-center justify-end gap-1 font-bold ${
                            t.type === 'Stock In'
                              ? 'text-emerald-600'
                              : t.type === 'Stock Out'
                              ? 'text-rose-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {t.type === 'Stock In' ? (
                            <ArrowUpRight size={13} />
                          ) : t.type === 'Stock Out' ? (
                            <ArrowDownRight size={13} />
                          ) : null}
                          {t.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{t.performedBy.split(' ')[0]}</td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px] group-hover:text-slate-700 transition-colors">
                        {t.createdAt}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Urgent Replenishment Priority Queue */}
        {lowStockProducts.length > 0 && (
          <div className="xl:col-span-3 glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-4 bg-amber-50/50 border-b border-amber-200/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                  <AlertTriangle size={15} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Restock Priority Queue</h2>
                  <p className="text-[11px] text-slate-500">Products operating at or below configured reorder levels</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('inventory')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
              >
                View Inventory
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-2.5 text-left">Product Name</th>
                    <th className="px-4 py-2.5 text-left">SKU</th>
                    <th className="px-4 py-2.5 text-left">Category</th>
                    <th className="px-4 py-2.5 text-right">Current Stock</th>
                    <th className="px-4 py-2.5 text-right">Reorder Threshold</th>
                    <th className="px-4 py-2.5 text-left">Status</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {lowStockProducts.map((p) => {
                    const stock = inventory.find((i) => i.productId === p.id)?.currentStock ?? 0;
                    const status = getStockStatus(p.id);
                    return (
                      <tr
                        key={p.id}
                        onClick={() => navigate('product-detail', p.id)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 font-bold text-slate-900">{p.name}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{p.sku}</td>
                        <td className="px-4 py-3 text-slate-600 font-medium">{getCategoryName(p.categoryId)}</td>
                        <td className="px-4 py-3 font-extrabold text-slate-900 text-right">{stock}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-right">{p.reorderLevel}</td>
                        <td className="px-4 py-3">
                          <Badge variant={status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('product-detail', p.id);
                            }}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
