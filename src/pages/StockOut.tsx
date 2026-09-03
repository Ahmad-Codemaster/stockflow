import { AlertTriangle, ArrowDownRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FormField } from '../components/ui';
import { useApp } from '../context';

export default function StockOut() {
  const { products, inventory, navigate, stockOut } = useApp();
  const [searchParams] = useSearchParams();
  const urlProductId = searchParams.get('product');

  const [productId, setProductId] = useState(urlProductId || '');
  const [quantity, setQuantity] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (urlProductId) {
      setProductId(urlProductId);
    }
  }, [urlProductId]);

  const selectedProduct = products.find((p) => p.id === productId);
  const currentStock = inventory.find((i) => i.productId === productId)?.currentStock ?? 0;
  const qtyNum = parseInt(quantity) || 0;
  const afterStock = currentStock - qtyNum;
  const exceedsStock = qtyNum > 0 && qtyNum > currentStock;

  function validate() {
    const errs: Record<string, string> = {};
    if (!productId) errs.productId = 'Please select a product.';
    if (!quantity || qtyNum <= 0) errs.quantity = 'Quantity must be greater than 0.';
    else if (qtyNum > currentStock)
      errs.quantity = `Insufficient stock. Only ${currentStock} unit${currentStock !== 1 ? 's' : ''} available.`;
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      const ok = await stockOut(productId, qtyNum, reference.trim(), notes.trim());
      if (ok) {
        navigate('inventory');
      } else {
        setErrors({ quantity: `Insufficient stock. Only ${currentStock} units available.` });
      }
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
          className="p-2 rounded-xl glass-card text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Stock-Out Fulfillment</h1>
          <p className="text-xs text-slate-500 font-medium">Fulfill customer orders or log internal supply dispatches.</p>
        </div>
      </div>

      {products.length === 0 && (
        <div className="p-4 rounded-xl border border-blue-200/80 bg-blue-50/70 text-blue-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-slide">
          <div>
            <p className="font-bold">No Products Available in Catalog</p>
            <p className="text-[11px] text-blue-700 mt-0.5">
              Before fulfilling stock orders, products must be registered and stocked into inventory.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('product-add')}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shrink-0 cursor-pointer"
          >
            Add Product
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold animate-fade-slide">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>Fulfillment logged and physical stock atomically deducted!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <FormField label="Target SKU / Product" required error={errors.productId}>
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setQuantity('');
                if (errors.productId) setErrors((err) => ({ ...err, productId: undefined as any }));
              }}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-slate-900 cursor-pointer font-medium"
            >
              <option value="">Select a product…</option>
              {products.map((p) => {
                const s = inventory.find((i) => i.productId === p.id)?.currentStock ?? 0;
                return (
                  <option key={p.id} value={p.id} disabled={s === 0}>
                    {p.name} ({p.sku}) — {s} in stock{s === 0 ? ' (out of stock)' : ''}
                  </option>
                );
              })}
            </select>
          </FormField>

          {selectedProduct && (
            <div
              className={`border rounded-xl p-4 transition-all ${
                currentStock === 0 ? 'bg-rose-50/80 border-rose-200/80' : 'bg-slate-50/80 border-slate-200/80'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-900">{selectedProduct.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{selectedProduct.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Available Stock</p>
                  <p
                    className={`text-base font-extrabold ${
                      currentStock === 0
                        ? 'text-rose-600'
                        : currentStock <= selectedProduct.reorderLevel
                        ? 'text-amber-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {currentStock} units
                  </p>
                </div>
              </div>

              {currentStock === 0 && (
                <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-rose-600">
                  <AlertTriangle size={14} />
                  <span>SKU is completely out of stock. Dispatch impossible.</span>
                </div>
              )}

              {qtyNum > 0 && !exceedsStock && currentStock > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Stock remaining after deduction:</span>
                  <span
                    className={`text-base font-extrabold ${
                      afterStock <= selectedProduct.reorderLevel ? 'text-amber-600' : 'text-slate-900'
                    }`}
                  >
                    {afterStock} units
                  </span>
                </div>
              )}

              {exceedsStock && (
                <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-rose-600">
                  <AlertTriangle size={14} />
                  <span>Requested quantity exceeds currently available stock.</span>
                </div>
              )}
            </div>
          )}

          <FormField label="Outbound Quantity" required error={errors.quantity}>
            <input
              type="number"
              min="1"
              max={currentStock || undefined}
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                if (errors.quantity) setErrors((err) => ({ ...err, quantity: undefined as any }));
              }}
              placeholder="Enter units to dispatch"
              disabled={currentStock === 0 && !!productId}
              className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 focus:outline-none"
            />
          </FormField>

          <FormField label="Sales Order / Reference Number">
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. SO-2026-015"
              className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 focus:outline-none"
            />
          </FormField>

          <FormField label="Dispatch Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Customer reference, destination branch, or packing slip info…"
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
            disabled={submitting || (currentStock === 0 && !!productId)}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-md shadow-rose-600/20 disabled:opacity-60"
          >
            <ArrowDownRight size={14} />
            <span>{submitting ? 'Deducting Stock...' : 'Confirm Dispatch'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
