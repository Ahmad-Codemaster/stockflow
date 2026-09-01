import { Clock, RotateCcw, Search } from 'lucide-react';
import { useState } from 'react';
import { Badge, EmptyState, PageHeader, Pagination } from '../components/ui';
import { useApp } from '../context';

const PAGE_SIZE = 12;

export default function Transactions() {
  const { transactions, products, navigate } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [page, setPage] = useState(1);

  function getProduct(pid: string) {
    return products.find((p) => p.id === pid);
  }

  const filtered = [...transactions]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .filter((t) => {
      const p = getProduct(t.productId);
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p?.name.toLowerCase().includes(q) ||
        p?.sku.toLowerCase().includes(q) ||
        t.reference.toLowerCase().includes(q) ||
        t.performedBy.toLowerCase().includes(q);
      const matchType = !filterType || t.type === filterType;
      const matchProduct = !filterProduct || t.productId === filterProduct;
      return matchSearch && matchType && matchProduct;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="max-w-7xl space-y-5">
      <PageHeader
        title="Transaction Ledger"
        subtitle="Immutable audit log of all inbound receiving, stock deductions, and count adjustments."
      />

      {/* Filters Toolbar */}
      <div className="glass-card rounded-2xl p-3 md:p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2.5 glass-input rounded-xl px-3 py-2 min-w-[240px] flex-1 sm:flex-initial">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search product, reference, or user…"
            className="bg-transparent text-xs text-slate-900 placeholder-slate-400 outline-none w-full font-medium"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setPage(1);
          }}
          className="glass-input px-3 py-2 text-xs rounded-xl text-slate-700 cursor-pointer font-medium"
        >
          <option value="">All Movement Types</option>
          <option value="Stock In">Stock In</option>
          <option value="Stock Out">Stock Out</option>
          <option value="Adjustment">Adjustment</option>
        </select>

        <select
          value={filterProduct}
          onChange={(e) => {
            setFilterProduct(e.target.value);
            setPage(1);
          }}
          className="glass-input px-3 py-2 text-xs rounded-xl text-slate-700 cursor-pointer font-medium"
        >
          <option value="">All Products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.sku})
            </option>
          ))}
        </select>

        {(search || filterType || filterProduct) && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setFilterType('');
              setFilterProduct('');
              setPage(1);
            }}
            className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-xl border border-slate-200/80 transition-colors inline-flex items-center gap-1 cursor-pointer"
            title="Reset all ledger filters and search"
          >
            <RotateCcw size={11} />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Glass Data Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                {['Timestamp', 'Product Name', 'SKU', 'Movement Type', 'Quantity', 'Previous', 'New Stock', 'Operator', 'Reference'].map(
                  (h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 ${
                        ['Quantity', 'Previous', 'New Stock'].includes(h) ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      title="No transactions found"
                      description="No movement logs match your current filter criteria."
                    />
                  </td>
                </tr>
              ) : (
                paged.map((t) => {
                  const p = getProduct(t.productId);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => navigate('transaction-detail', t.id)}
                      className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap flex items-center gap-1.5">
                        <Clock size={11} className="text-slate-300" />
                        <span>{t.createdAt}</span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('product-detail', t.productId);
                          }}
                          className="hover:text-blue-600 hover:underline transition-colors text-left font-bold text-slate-900"
                        >
                          {p?.name ?? 'Unknown'}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-400">{p?.sku ?? '—'}</td>
                      <td className="px-4 py-3.5">
                        <Badge variant={t.type} />
                      </td>
                      <td className="px-4 py-3.5 text-right font-extrabold text-slate-900">{t.quantity}</td>
                      <td className="px-4 py-3.5 text-right font-mono text-slate-400">{t.previousStock}</td>
                      <td className="px-4 py-3.5 text-right font-bold text-blue-700">{t.newStock}</td>
                      <td className="px-4 py-3.5 text-slate-700 font-medium">{t.performedBy}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-400 text-[11px] group-hover:text-slate-700 transition-colors">
                        {t.reference || '—'}
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
