import {
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit,
  ExternalLink,
  Layers,
  Lock,
  Package,
  Plus,
  Tag,
  Trash2,
} from 'lucide-react';
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge, Confirm, StatusDot } from '../components/ui';
import { useApp } from '../context';

export default function ProductDetail() {
  const {
    products,
    categories,
    suppliers,
    inventory,
    transactions,
    currentUser,
    selectedId,
    navigate,
    deleteProduct,
    getStockStatus,
  } = useApp();
  const { id: paramId } = useParams<{ id: string }>();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const targetId = paramId || selectedId;
  const product = products.find((p) => p.id === targetId);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="glass-card rounded-2xl p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <Package size={24} />
          </div>
          <h2 className="text-base font-bold text-slate-900">Product SKU Not Found</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            The requested SKU identifier "{targetId}" does not exist in the catalog or may have been archived.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('products')}
              className="px-4 py-2 gradient-btn-primary text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              <span>Return to Products Catalog</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stock = inventory.find((i) => i.productId === product.id)?.currentStock ?? 0;
  const status = getStockStatus(product.id);
  const category = categories.find((c) => c.id === product.categoryId);
  const supplier = suppliers.find((s) => s.id === product.supplierId);

  const productTxns = [...transactions]
    .filter((t) => t.productId === product.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const totalIn = productTxns.filter((t) => t.type === 'Stock In').reduce((s, t) => s + t.quantity, 0);
  const totalOut = productTxns.filter((t) => t.type === 'Stock Out').reduce((s, t) => s + t.quantity, 0);
  const inventoryValue = stock * product.price;
  const maxStock = Math.max(stock, product.reorderLevel, 1);
  const stockPct = Math.min((stock / (maxStock * 1.5)) * 100, 100);

  const txnBadge: Record<string, React.ReactNode> = {
    'Stock In': <Badge variant="Stock In" />,
    'Stock Out': <Badge variant="Stock Out" />,
    Adjustment: <Badge variant="Adjustment" />,
  };

  return (
    <div className="max-w-6xl space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigate('products')}
            className="p-2.5 rounded-xl glass-card text-slate-500 hover:text-slate-900 transition-colors shrink-0 shadow-xs"
            title="Back to Catalog"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{product.name}</h1>
              <Badge variant={status} />
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold border border-slate-200/80">
                {product.sku}
              </span>
              <span>•</span>
              <button
                type="button"
                onClick={() => navigate('categories')}
                className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
              >
                <Tag size={12} />
                <span>{category?.name ?? 'Uncategorized'}</span>
              </button>
              {supplier && (
                <>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => navigate('suppliers')}
                    className="text-slate-600 hover:text-blue-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Building2 size={12} />
                    <span>{supplier.name}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Operational Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('stock-in', product.id)}
            className="px-3.5 py-2 gradient-btn-success text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-sm"
          >
            <ArrowUpRight size={14} />
            <span>Stock In</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('stock-out', product.id)}
            disabled={stock === 0}
            className="px-3.5 py-2 gradient-btn-primary text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownRight size={14} />
            <span>Stock Out</span>
          </button>

          {currentUser?.role === 'ADMIN' && (
            <>
              <button
                type="button"
                onClick={() => navigate('product-edit', product.id)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 glass-input hover:bg-white text-slate-700 transition-all shadow-xs inline-flex items-center gap-1.5"
              >
                <Edit size={13} />
                <span>Edit SKU</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-600 transition-all shadow-xs inline-flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Archive</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stock Out Alert Warning if zero or low */}
      {status === 'Out of Stock' && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between gap-4 animate-fade-slide">
          <div className="flex items-center gap-3 text-xs text-rose-800">
            <div className="p-2 bg-rose-100 rounded-xl text-rose-600 shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="font-bold">Immediate Action Required: Product is Out of Stock</p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Physical inventory is at 0 units. Outbound fulfillments are currently blocked.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('stock-in', product.id)}
            className="px-4 py-2 gradient-btn-success text-white text-xs font-semibold rounded-xl shrink-0"
          >
            Create Restock Receipt
          </button>
        </div>
      )}

      {/* Main Metadata & Stock Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left Column: Stock Analytics & Specifications */}
        <div className="space-y-5">
          {/* Stock Metrics Card */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Physical Stock Level</h3>
              <StatusDot status={status} />
            </div>

            <div className="mb-4">
              <div className="flex items-end justify-between mb-2">
                <span className="text-xs text-slate-500 font-medium">Available Units</span>
                <span className="text-3xl font-extrabold text-slate-900">{stock}</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    status === 'In Stock'
                      ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                      : status === 'Low Stock'
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                      : 'bg-gradient-to-r from-rose-400 to-rose-500'
                  }`}
                  style={{ width: `${stockPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1.5">
                <span>0 units</span>
                <span>Threshold: {product.reorderLevel} units</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100">
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Received</p>
                <p className="text-base font-extrabold text-emerald-600">+{totalIn}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Dispatched</p>
                <p className="text-base font-extrabold text-rose-600">-{totalOut}</p>
              </div>
            </div>
          </div>

          {/* Pricing & Valuation Card */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">Financial Valuation</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Unit Retail Price</span>
                <span className="font-extrabold text-slate-900 text-sm">${product.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Current Stock Asset Value</span>
                <span className="font-extrabold text-blue-700 text-sm">
                  ${inventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-500 font-medium">Reorder Warning Point</span>
                <span className="font-mono text-slate-700 font-bold">{product.reorderLevel} units</span>
              </div>
            </div>
          </div>

          {/* Supplier Directory Quick Card */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Vendor Information</h3>
              <button
                type="button"
                onClick={() => navigate('suppliers')}
                className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
              >
                <span>Directory</span>
                <ExternalLink size={10} />
              </button>
            </div>
            {supplier ? (
              <div className="space-y-2 text-xs">
                <p className="font-bold text-slate-900">{supplier.name}</p>
                {supplier.email && <p className="text-slate-500 font-mono text-[11px]">{supplier.email}</p>}
                {supplier.phone && <p className="text-slate-500 font-mono text-[11px]">{supplier.phone}</p>}
                {supplier.address && <p className="text-slate-400 text-[11px]">{supplier.address}</p>}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No primary vendor assigned to this SKU.</p>
            )}
          </div>
        </div>

        {/* Right Column: Item Description & Immutable Ledger Table */}
        <div className="xl:col-span-2 space-y-5">
          {/* Specification / Description */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Technical Description</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {product.description || 'No detailed technical specification provided for this product.'}
            </p>
          </div>

          {/* Transaction Ledger for this product */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-4 bg-slate-50/60 border-b border-slate-200/60 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">SKU Movement Audit Trail</h3>
                <p className="text-[11px] text-slate-400">Click any row to open the cryptographic audit record</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                {productTxns.length} records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    {['Timestamp', 'Movement Type', 'Quantity', 'Previous', 'New Stock', 'Operator', 'Reference'].map(
                      (h) => (
                        <th
                          key={h}
                          className={`px-4 py-2.5 ${
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
                  {productTxns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        No transactions recorded for this SKU yet.
                      </td>
                    </tr>
                  ) : (
                    productTxns.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => navigate('transaction-detail', t.id)}
                        className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                      >
                        <td className="px-4 py-3 text-slate-400 font-mono text-[11px] flex items-center gap-1.5">
                          <Clock size={11} className="text-slate-300" />
                          <span>{t.createdAt}</span>
                        </td>
                        <td className="px-4 py-3">{txnBadge[t.type]}</td>
                        <td className="px-4 py-3 text-right font-extrabold text-slate-900">
                          <span
                            className={`inline-flex items-center gap-0.5 ${
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
                        <td className="px-4 py-3 text-right font-mono text-slate-400">{t.previousStock}</td>
                        <td className="px-4 py-3 text-right font-bold text-blue-700">{t.newStock}</td>
                        <td className="px-4 py-3 text-slate-600 font-medium">{t.performedBy}</td>
                        <td className="px-4 py-3 font-mono text-slate-400 text-[11px] group-hover:text-blue-600 transition-colors">
                          {t.reference || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <Confirm
          title="Archive Product SKU?"
          message={`Are you sure you want to archive "${product.name}" (${product.sku})? Historical inventory movements and audit logs will remain preserved.`}
          confirmLabel="Archive SKU"
          variant="danger"
          onConfirm={async () => {
            await deleteProduct(product.id);
            setConfirmDelete(false);
            navigate('products');
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
