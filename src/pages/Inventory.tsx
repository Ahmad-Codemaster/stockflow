import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Eye,
  Filter,
  Package,
  RotateCcw,
  Search,
  TrendingDown,
} from 'lucide-react';
import { useState } from 'react';
import { Badge, EmptyState, KPICard, PageHeader, Pagination } from '../components/ui';
import { useApp } from '../context';

const PAGE_SIZE = 12;

export default function Inventory() {
  const { products, inventory, categories, navigate, getStockStatus } = useApp();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  function getStock(pid: string) {
    return inventory.find((i) => i.productId === pid)?.currentStock ?? 0;
  }
  function getCatName(cid: string) {
    return categories.find((c) => c.id === cid)?.name ?? '—';
  }

  const totalStock = inventory.reduce((s, i) => s + i.currentStock, 0);
  const lowCount = products.filter((p) => getStockStatus(p.id) === 'Low Stock').length;
  const outCount = products.filter((p) => getStockStatus(p.id) === 'Out of Stock').length;
  const healthyCount = products.length - lowCount - outCount;
  const totalValue = products.reduce((sum, p) => sum + getStock(p.id) * p.price, 0);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchCategory = !filterCategory || p.categoryId === filterCategory;
    const matchStatus = !filterStatus || getStockStatus(p.id) === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const isFiltered = search || filterCategory || filterStatus;

  const handleResetFilters = () => {
    setSearch('');
    setFilterCategory('');
    setFilterStatus('');
    setPage(1);
  };

  return (
    <div className="max-w-7xl space-y-4 sm:space-y-5">
      {/* Top Header */}
      <PageHeader
        title="Inventory Monitoring"
        subtitle="Live physical stock count, asset valuation, and low stock warnings."
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate('stock-in')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 gradient-btn-success text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer"
            >
              <ArrowUpRight size={13.5} />
              <span>Stock In</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('stock-out')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 gradient-btn-primary text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer"
            >
              <ArrowDownRight size={13.5} />
              <span>Stock Out</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards (Compact & Informative) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div
          onClick={() => {
            setFilterStatus('');
            setPage(1);
          }}
          className="cursor-pointer"
        >
          <KPICard
            label="Total Units"
            value={totalStock.toLocaleString()}
            sub={`${products.length} catalog items`}
            icon={<Package size={17} />}
          />
        </div>
        <KPICard
          label="Total Valuation"
          value={`$${totalValue.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`}
          sub="Asset cost across inventory"
          icon={<DollarSign size={17} />}
        />
        <div
          onClick={() => {
            setFilterStatus('Low Stock');
            setPage(1);
          }}
          className="cursor-pointer"
        >
          <KPICard
            label="Low Stock Alert"
            value={lowCount}
            sub={lowCount > 0 ? 'Restock recommended' : 'All levels optimum'}
            variant={lowCount > 0 ? 'warning' : 'default'}
            icon={<AlertTriangle size={17} />}
          />
        </div>
        <div
          onClick={() => {
            setFilterStatus('Out of Stock');
            setPage(1);
          }}
          className="cursor-pointer"
        >
          <KPICard
            label="Depleted Items"
            value={outCount}
            sub={outCount > 0 ? 'Requires immediate restock' : 'Zero depleted items'}
            variant={outCount > 0 ? 'danger' : 'default'}
            icon={<TrendingDown size={17} />}
          />
        </div>
      </div>

      {/* Glassmorphic Integrated Search & Filter Control Center (No Empty Gaps) */}
      <div className="glass-card rounded-[17px] border border-white/55 p-3 sm:p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="flex items-center gap-2 glass-input rounded-xl px-3 py-1.5 flex-1 min-w-[220px] sm:min-w-[260px] max-w-md">
            <Search size={13.5} className="text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by product name or SKU…"
              className="bg-transparent text-xs text-slate-900 placeholder-slate-400 outline-none w-full font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Dropdown */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 glass-input rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
              <Filter size={12.5} className="text-slate-400" />
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs text-slate-800 outline-none cursor-pointer font-medium pr-1"
              >
                <option value="">All Categories ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters Button */}
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white px-2.5 py-1.5 rounded-xl border border-white/80 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                title="Reset all filters and search"
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1 p-1 bg-white/50 rounded-xl border border-white/60 backdrop-blur-xs flex-wrap">
            {[
              { label: 'All', value: '', count: products.length },
              { label: 'In Stock', value: 'In Stock', count: healthyCount },
              { label: 'Low Stock', value: 'Low Stock', count: lowCount },
              { label: 'Out of Stock', value: 'Out of Stock', count: outCount },
            ].map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => {
                  setFilterStatus(s.value);
                  setPage(1);
                }}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  filterStatus === s.value
                    ? 'bg-white text-slate-900 shadow-2xs border border-white/80 font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>{s.label}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                    filterStatus === s.value ? 'bg-slate-100 text-slate-700' : 'bg-slate-200/50 text-slate-500'
                  }`}
                >
                  {s.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Status bar reporting showing results count */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1 border-t border-white/40">
          <span>
            Showing <strong className="text-slate-700 font-semibold">{filtered.length}</strong> of {products.length} items
          </span>
          {isFiltered && (
            <span className="text-indigo-600 font-medium">Filtered view active</span>
          )}
        </div>
      </div>

      {/* Glass Data Table (Compact Rows & Visual Stock Depth) */}
      <div className="glass-card rounded-[17px] border border-white/55 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/60 bg-white/30 text-slate-500 font-bold uppercase tracking-wider text-[9.5px]">
                <th className="px-3.5 py-2.5 text-left">Product Name</th>
                <th className="px-3.5 py-2.5 text-left">SKU</th>
                <th className="px-3.5 py-2.5 text-left">Category</th>
                <th className="px-3.5 py-2.5 text-right">Units In Stock</th>
                <th className="px-3.5 py-2.5 text-right">Reorder Level</th>
                <th className="px-3.5 py-2.5 text-right">Unit Price</th>
                <th className="px-3.5 py-2.5 text-right">Asset Valuation</th>
                <th className="px-3.5 py-2.5 text-left">Status</th>
                <th className="px-3.5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/50">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      title="No inventory records found"
                      description="Adjust your search or category filters to view inventory units."
                    />
                  </td>
                </tr>
              ) : (
                paged.map((p) => {
                  const stock = getStock(p.id);
                  const status = getStockStatus(p.id);
                  const itemValue = stock * p.price;
                  const ratio = p.reorderLevel > 0 ? Math.min((stock / (p.reorderLevel * 2)) * 100, 100) : 100;

                  return (
                    <tr key={p.id} className="hover:bg-white/50 transition-colors">
                      <td className="px-3.5 py-2.5">
                        <button
                          type="button"
                          onClick={() => navigate('product-detail', p.id)}
                          className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-left cursor-pointer truncate max-w-[200px] block"
                        >
                          {p.name}
                        </button>
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-[10.5px] text-slate-500">{p.sku}</td>
                      <td className="px-3.5 py-2.5 text-slate-600 font-medium text-[11px]">{getCatName(p.categoryId)}</td>
                      <td className="px-3.5 py-2.5 text-right">
                        <div className="inline-flex flex-col items-end">
                          <span className="font-black tracking-tight text-slate-900 text-xs">{stock}</span>
                          <div className="w-14 h-1 bg-slate-200/60 rounded-full overflow-hidden mt-0.5">
                            <div
                              className={`h-full rounded-full ${
                                stock === 0
                                  ? 'bg-rose-500'
                                  : stock <= p.reorderLevel
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${stock === 0 ? 100 : Math.max(ratio, 8)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono text-slate-400 text-[11px]">{p.reorderLevel}</td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-slate-900 text-xs">${p.price.toFixed(2)}</td>
                      <td className="px-3.5 py-2.5 text-right font-black tracking-tight text-indigo-700 text-xs">
                        ${itemValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <Badge variant={status} />
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => navigate('stock-in', p.id)}
                            title="Stock In (+)"
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border border-emerald-200/50 transition-colors cursor-pointer"
                          >
                            <ArrowUpRight size={12.5} />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate('stock-out', p.id)}
                            disabled={stock === 0}
                            title="Stock Out (-)"
                            className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/20 border border-indigo-200/50 transition-colors disabled:opacity-40 cursor-pointer"
                          >
                            <ArrowDownRight size={12.5} />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate('product-detail', p.id)}
                            title="View Details"
                            className="p-1.5 rounded-lg bg-white/70 text-slate-600 hover:bg-white border border-white/80 transition-colors cursor-pointer"
                          >
                            <Eye size={12.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />
      </div>
    </div>
  );
}
