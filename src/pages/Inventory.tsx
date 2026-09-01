import { ArrowDownRight, ArrowUpRight, Eye, RotateCcw, Search } from 'lucide-react';
import { useState } from 'react';
import { Badge, EmptyState, KPICard, PageHeader, Pagination } from '../components/ui';
import { useApp } from '../context';

const PAGE_SIZE = 12;

export default function Inventory() {
  const { products, inventory, categories, navigate, getStockStatus } = useApp();
  const [search, setSearch] = useState('');
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
  const totalValue = products.reduce((sum, p) => sum + getStock(p.id) * p.price, 0);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchStatus = !filterStatus || getStockStatus(p.id) === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-7xl space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Inventory Monitoring"
        subtitle="Live physical stock count, asset valuation, and low stock warnings."
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate('stock-in')}
              className="inline-flex items-center gap-1.5 px-4 py-2 gradient-btn-success text-white text-xs font-semibold rounded-xl shadow-sm"
            >
              <ArrowUpRight size={14} />
              <span>Stock In</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('stock-out')}
              className="inline-flex items-center gap-1.5 px-4 py-2 gradient-btn-primary text-white text-xs font-semibold rounded-xl shadow-sm"
            >
              <ArrowDownRight size={14} />
              <span>Stock Out</span>
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div
          onClick={() => {
            setFilterStatus('');
            setPage(1);
          }}
          className="cursor-pointer"
        >
          <KPICard label="Total Physical Units" value={totalStock.toLocaleString()} />
        </div>
        <KPICard
          label="Total Inventory Value"
          value={`$${totalValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
        />
        <div
          onClick={() => {
            setFilterStatus('Low Stock');
            setPage(1);
          }}
          className="cursor-pointer"
        >
          <KPICard
            label="Low Stock Items"
            value={lowCount}
            sub="Click to filter low stock"
            variant={lowCount > 0 ? 'warning' : 'default'}
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
            label="Out of Stock Items"
            value={outCount}
            sub="Click to filter out of stock"
            variant={outCount > 0 ? 'danger' : 'default'}
          />
        </div>
      </div>

      {/* Glassmorphic Search & Filter Pills Toolbar */}
      <div className="glass-card rounded-2xl p-3 md:p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 glass-input rounded-xl px-3 py-2 min-w-[240px] flex-1 sm:flex-initial">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Filter by product name or SKU…"
            className="bg-transparent text-xs text-slate-900 placeholder-slate-400 outline-none w-full font-medium"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(search || filterStatus) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setFilterStatus('');
                setPage(1);
              }}
              className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-xl border border-slate-200/80 transition-colors inline-flex items-center gap-1 cursor-pointer"
              title="Reset all filters and search"
            >
              <RotateCcw size={11} />
              <span>Reset Filters</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
            {['', 'In Stock', 'Low Stock', 'Out of Stock'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setFilterStatus(s);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  filterStatus === s
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {s || 'All Statuses'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Glass Data Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                {[
                  'Product Name',
                  'SKU',
                  'Category',
                  'Current Units',
                  'Reorder Level',
                  'Unit Price',
                  'Total Valuation',
                  'Status',
                  'Actions',
                ].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 ${
                      ['Current Units', 'Reorder Level', 'Unit Price', 'Total Valuation', 'Actions'].includes(h)
                        ? 'text-right'
                        : 'text-left'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      title="No inventory records found"
                      description="Adjust your search filters to view inventory units."
                    />
                  </td>
                </tr>
              ) : (
                paged.map((p) => {
                  const stock = getStock(p.id);
                  const status = getStockStatus(p.id);
                  const itemValue = stock * p.price;
                  return (
                    <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={() => navigate('product-detail', p.id)}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left"
                        >
                          {p.name}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-500">{p.sku}</td>
                      <td className="px-4 py-3.5 text-slate-600 font-medium">{getCatName(p.categoryId)}</td>
                      <td className="px-4 py-3.5 text-right font-extrabold text-slate-900">{stock}</td>
                      <td className="px-4 py-3.5 text-right font-mono text-slate-400">{p.reorderLevel}</td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900">${p.price.toFixed(2)}</td>
                      <td className="px-4 py-3.5 text-right font-extrabold text-blue-700">
                        ${itemValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={status} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate('stock-in', p.id)}
                            title="Stock In (+)"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60 transition-colors"
                          >
                            <ArrowUpRight size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate('stock-out', p.id)}
                            disabled={stock === 0}
                            title="Stock Out (-)"
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60 transition-colors disabled:opacity-40"
                          >
                            <ArrowDownRight size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate('product-detail', p.id)}
                            title="View Details"
                            className="p-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60 transition-colors"
                          >
                            <Eye size={13} />
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
