/**
 * ============================================================================
 * STOCK-IN VIEW (`src/pages/StockIn.tsx`)
 * ============================================================================
 * What this screen does:
 * - Provides the receiving workflow to record inventory replenishment from suppliers.
 * - Auto-selects the product's default supplier if linked.
 * - Displays a live preview of new projected stock ($currentStock + qty$).
 * - Calls `stockIn()` in AppContext, dispatching `POST /api/inventory/stock-in`
 *   which atomically increments stock and creates an immutable transaction receipt.
 */

import { ArrowLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FormField } from '../components/ui';
import { useApp } from '../context';

export default function StockIn() {
  const { products, suppliers, inventory, navigate, stockIn } = useApp();
  const [searchParams] = useSearchParams();
  const urlProductId = searchParams.get('product');

  const [productId, setProductId] = useState(urlProductId || '');
  const [quantity, setQuantity] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sync selected product if provided via URL query param (?product=p1)
  useEffect(() => {
    if (urlProductId) {
      setProductId(urlProductId);
      const matched = products.find((p) => p.id === urlProductId);
      if (matched?.supplierId) {
        setSupplierId(matched.supplierId);
      }
    }
  }, [urlProductId, products]);

  // Derived state: calculate stock levels and project new stock count
  const selectedProduct = products.find((p) => p.id === productId);
  const currentStock = inventory.find((i) => i.productId === productId)?.currentStock ?? 0;
  const qtyNum = parseInt(quantity) || 0;
  const afterStock = currentStock + qtyNum;

  /**
   * Validate user input
   */
  function validate() {
    const errs: Record<string, string> = {};
    if (!productId) errs.productId = 'Please select a product.';
    if (!quantity || qtyNum <= 0) errs.quantity = 'Quantity must be greater than 0.';
    return errs;
  }

  /**
   * Handle receiving submission
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      // Calls server API: POST /api/inventory/stock-in
      await stockIn(productId, qtyNum, supplierId || null, reference.trim(), notes.trim());
      navigate('inventory');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => (selectedProduct ? navigate('product-detail', selectedProduct.id) : navigate('inventory'))}
          className="p-2.5 rounded-xl glass-card border border-white/60 text-slate-500 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-[-0.025em]">Stock-In Receiving</h1>
          <p className="text-xs text-slate-500 font-medium">Record physical inbound freight and purchase orders.</p>
        </div>
      </div>

      {products.length === 0 && (
        <div className="p-4.5 rounded-[24px] border border-indigo-200/60 bg-indigo-500/10 text-indigo-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-slide backdrop-blur-md">
          <div>
            <p className="font-bold">No Products Available in Catalog</p>
            <p className="text-[11px] text-indigo-700 mt-0.5">
              Before receiving inbound inventory, at least one product must be registered in the catalog.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('product-add')}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shrink-0 cursor-pointer shadow-xs"
          >
            Add Product
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-500/15 border border-emerald-200/60 rounded-2xl text-emerald-800 text-xs font-bold animate-fade-slide">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>Inbound stock incremented and transaction logged to immutable ledger!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="glass-card rounded-[24px] border border-white/60 p-6 md:p-8 space-y-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.03)]">
          <FormField label="Target SKU / Product" required error={errors.productId}>
            <select
              value={productId}
              onChange={(e) => {
                const newId = e.target.value;
                setProductId(newId);
                const matched = products.find((p) => p.id === newId);
                if (matched?.supplierId) setSupplierId(matched.supplierId);
                if (errors.productId) setErrors((err) => ({ ...err, productId: undefined as any }));
              }}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-slate-900 cursor-pointer font-medium"
            >
              <option value="">Select a product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </FormField>

          {selectedProduct && (
            <div className="bg-white/50 border border-white/60 rounded-2xl p-4.5 animate-fade-slide backdrop-blur-xs">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-900">{selectedProduct.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{selectedProduct.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Current Stock</p>
                  <p className="text-base font-black tracking-[-0.025em] text-slate-900">{currentStock}</p>
                </div>
              </div>
              {qtyNum > 0 && (
                <div className="mt-3 pt-3 border-t border-white/60 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Projected stock after receiving:</span>
                  <span className="text-base font-black tracking-[-0.025em] text-emerald-600">{afterStock} units</span>
                </div>
              )}
            </div>
          )}

          <FormField label="Inbound Quantity" required error={errors.quantity}>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                if (errors.quantity) setErrors((err) => ({ ...err, quantity: undefined as any }));
              }}
              placeholder="Enter units received"
              className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 focus:outline-none"
            />
          </FormField>

          <FormField label="Associated Supplier">
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 cursor-pointer font-medium"
            >
              <option value="">No supplier specified</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Purchase Order / Reference Number">
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. PO-2026-001"
              className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 focus:outline-none"
            />
          </FormField>

          <FormField label="Receiving Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Dock inspections, carrier details, or pallet notes…"
              className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 resize-none focus:outline-none"
            />
          </FormField>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-5">
          <button
            type="button"
            onClick={() => {
              setProductId('');
              setQuantity('');
              setSupplierId('');
              setReference('');
              setNotes('');
              setErrors({});
            }}
            className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Reset Form
          </button>
          <button
            type="button"
            onClick={() => (selectedProduct ? navigate('product-detail', selectedProduct.id) : navigate('inventory'))}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 gradient-btn-success text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 disabled:opacity-60"
          >
            <ArrowUpRight size={14} />
            <span>{submitting ? 'Processing Inbound...' : 'Confirm Stock In'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
