import { ArrowDownRight, ArrowUpRight, Edit, Eye, MoreVertical, Plus, RotateCcw, Search, Tag, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { Badge, Confirm, EmptyState, PageHeader, Pagination } from '../components/ui';
import { useApp } from '../context';

const PAGE_SIZE = 10;

export default function Products() {
  const { products, categories, inventory, currentUser, navigate, deleteProduct, getStockStatus } = useApp();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [page, setPage] = useState(1);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function getStock(pid: string) {
    return inventory.find((i) => i.productId === pid)?.currentStock ?? 0;
  }

  function getCatName(cid: string) {
    return categories.find((c) => c.id === cid)?.name ?? '—';
  }

  const filtered = products
    .filter((p) => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      const matchCat = !filterCat || p.categoryId === filterCat;
      const matchStatus = !filterStatus || getStockStatus(p.id) === filterStatus;
      return matchSearch && matchCat && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'stock') return getStock(b.id) - getStock(a.id);
      if (sortBy === 'date') return b.createdAt.localeCompare(a.createdAt);
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleDelete(id: string) {
    setConfirmDelete(null);
    deleteProduct(id);
  }

  return (
    <div className="max-w-7xl space-y-5">
      {/* Top Header */}
      <PageHeader
        title="Products Catalog"
        subtitle="Maintain master SKUs, dynamic price books, and threshold triggers."
        action={
          currentUser?.role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => navigate('product-add')}
              className="inline-flex items-center gap-1.5 px-4 py-2 gradient-btn-primary text-white text-xs font-semibold rounded-xl shadow-sm"
            >
              <Plus size={15} />
              <span>Add Product</span>
            </button>
          )
        }
      />

      {/* Glassmorphic Search & Filters Toolbar */}
      <div className="glass-card rounded-2xl p-3 md:p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2.5 glass-input rounded-xl px-3 py-2 min-w-[240px] flex-1 sm:flex-initial">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by product name or SKU…"
            className="bg-transparent text-xs text-slate-900 placeholder-slate-400 outline-none w-full font-medium"
          />
        </div>

        <select
          value={filterCat}
          onChange={(e) => {
            setFilterCat(e.target.value);
            setPage(1);
          }}
          className="glass-input px-3 py-2 text-xs rounded-xl text-slate-700 cursor-pointer font-medium"
        >
          <option value="">All Categories ({categories.length})</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
          className="glass-input px-3 py-2 text-xs rounded-xl text-slate-700 cursor-pointer font-medium"
        >
          <option value="">All Stock Statuses</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>

        {(search || filterCat || filterStatus || sortBy !== 'name') && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setFilterCat('');
              setFilterStatus('');
              setSortBy('name');
              setPage(1);
            }}
            className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-xl border border-slate-200/80 transition-colors inline-flex items-center gap-1 cursor-pointer"
            title="Reset all filters and search"
          >
            <RotateCcw size={11} />
            <span>Reset Filters</span>
          </button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="glass-input px-2.5 py-1.5 text-xs rounded-xl text-slate-700 cursor-pointer font-semibold"
          >
            <option value="name">Product Name</option>
            <option value="stock">Current Stock</option>
            <option value="date">Date Added</option>
          </select>
        </div>
      </div>

      {/* Glassmorphic Data Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                {['Product Name', 'SKU', 'Category', 'Unit Price', 'Current Stock', 'Threshold', 'Status', 'Actions'].map(
                  (h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 ${
                        h === 'Actions' || h === 'Unit Price' || h === 'Current Stock' || h === 'Threshold'
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
            <tbody className="divide-y divide-slate-100/80">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      title="No products found"
                      description={
                        search || filterCat || filterStatus
                          ? 'Try adjusting your search criteria or clear active filters.'
                          : 'Add your first SKU to begin inventory monitoring.'
                      }
                      action={
                        currentUser?.role === 'ADMIN' && !search && !filterCat && !filterStatus
                          ? { label: 'Add Product', onClick: () => navigate('product-add') }
                          : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                paged.map((p) => {
                  const stock = getStock(p.id);
                  const status = getStockStatus(p.id);
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
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        <button
                          type="button"
                          onClick={() => setFilterCat(p.categoryId)}
                          className="hover:text-blue-600 transition-colors"
                          title="Click to filter by this category"
                        >
                          {getCatName(p.categoryId)}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900">${p.price.toFixed(2)}</td>
                      <td className="px-4 py-3.5 text-right font-extrabold text-slate-900">{stock}</td>
                      <td className="px-4 py-3.5 text-right font-mono text-slate-400">{p.reorderLevel}</td>
                      <td className="px-4 py-3.5">
                        <Badge variant={status} />
                      </td>
                      <td className="px-4 py-3.5 text-right relative">
                        <div className="relative inline-block" ref={menuId === p.id ? menuRef : undefined}>
                          <button
                            type="button"
                            onClick={() => setMenuId((v) => (v === p.id ? null : p.id))}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                            aria-label="Actions"
                          >
                            <MoreVertical size={14} />
                          </button>
                          {menuId === p.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} />
                              <div className="absolute right-0 top-full mt-1 w-40 glass-modal rounded-xl shadow-xl z-20 overflow-hidden border border-slate-200/80 animate-fade-slide">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigate('product-detail', p.id);
                                    setMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                                >
                                  <Eye size={12} />
                                  <span>View Details</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigate('stock-in', p.id);
                                    setMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors flex items-center gap-2"
                                >
                                  <ArrowUpRight size={12} />
                                  <span>Stock In (+)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigate('stock-out', p.id);
                                    setMenuId(null);
                                  }}
                                  disabled={stock === 0}
                                  className="w-full text-left px-3.5 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50 transition-colors flex items-center gap-2 disabled:opacity-40"
                                >
                                  <ArrowDownRight size={12} />
                                  <span>Stock Out (-)</span>
                                </button>
                                {currentUser?.role === 'ADMIN' && (
                                  <>
                                    <div className="border-t border-slate-100 my-0.5" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigate('product-edit', p.id);
                                        setMenuId(null);
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                                    >
                                      <Edit size={12} />
                                      <span>Edit SKU</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setConfirmDelete(p.id);
                                        setMenuId(null);
                                      }}
                                      className="w-full text-left px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
                                    >
                                      <Trash2 size={12} />
                                      <span>Archive SKU</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          )}
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

      {confirmDelete && (
        <Confirm
          title="Archive Product SKU?"
          message="Are you sure you want to archive this product? Historical inventory movements will remain preserved."
          confirmLabel="Archive SKU"
          variant="danger"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
