import { ArrowLeft, Plus, Save } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FormField } from '../components/ui';
import { useApp } from '../context';

interface Props {
  mode: 'add' | 'edit';
}

export default function ProductForm({ mode }: Props) {
  const { products, categories, suppliers, selectedId, navigate, addProduct, updateProduct, skuExists } = useApp();
  const { id: paramId } = useParams<{ id: string }>();

  const targetId = paramId || selectedId;
  const editing = mode === 'edit' ? products.find((p) => p.id === targetId) : null;

  const [form, setForm] = useState({
    name: editing?.name ?? '',
    sku: editing?.sku ?? '',
    categoryId: editing?.categoryId ?? '',
    supplierId: editing?.supplierId ?? '',
    price: editing?.price?.toString() ?? '',
    initialStock: '0',
    reorderLevel: editing?.reorderLevel?.toString() ?? '',
    description: editing?.description ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Synchronize form values whenever editing product resolves
  useEffect(() => {
    if (mode === 'edit' && editing) {
      setForm({
        name: editing.name ?? '',
        sku: editing.sku ?? '',
        categoryId: editing.categoryId ?? '',
        supplierId: editing.supplierId ?? '',
        price: editing.price?.toString() ?? '',
        initialStock: '0',
        reorderLevel: editing.reorderLevel?.toString() ?? '',
        description: editing.description ?? '',
      });
    }
  }, [mode, editing]);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field])
      setErrors((e) => {
        const n = { ...e };
        delete n[field];
        return n;
      });
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Product name is required.';
    if (!form.sku.trim()) errs.sku = 'SKU is required.';
    else if (skuExists(form.sku.trim(), editing?.id)) errs.sku = 'SKU already exists.';
    if (!form.categoryId) errs.categoryId = 'Category is required.';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0)
      errs.price = 'Price must be a non-negative number.';
    if (mode === 'add' && (isNaN(Number(form.initialStock)) || Number(form.initialStock) < 0))
      errs.initialStock = 'Initial stock must be a non-negative number.';
    if (!form.reorderLevel || isNaN(Number(form.reorderLevel)) || Number(form.reorderLevel) < 0)
      errs.reorderLevel = 'Reorder level must be a non-negative number.';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    if (mode === 'add') {
      await addProduct({
        name: form.name.trim(),
        sku: form.sku.trim().toUpperCase(),
        categoryId: form.categoryId,
        supplierId: form.supplierId || null,
        price: Number(form.price),
        initialStock: Number(form.initialStock),
        reorderLevel: Number(form.reorderLevel),
        description: form.description.trim(),
      });
      navigate('products');
    } else if (editing) {
      await updateProduct(editing.id, {
        name: form.name.trim(),
        categoryId: form.categoryId,
        supplierId: form.supplierId || null,
        price: Number(form.price),
        reorderLevel: Number(form.reorderLevel),
        description: form.description.trim(),
      });
      navigate('product-detail', editing.id);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => (mode === 'edit' && editing ? navigate('product-detail', editing.id) : navigate('products'))}
          className="p-2 rounded-xl glass-card text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {mode === 'add' ? 'Create Catalog SKU' : 'Edit Product Specification'}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {mode === 'add' ? 'Provision a new product into inventory.' : `Updating ${editing?.name ?? 'SKU'}`}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormField label="Product Full Name" required error={errors.name}>
                <input
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Mechanical Ergonomic Keyboard"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 focus:outline-none"
                />
              </FormField>
            </div>

            <FormField label="Stock Keeping Unit (SKU)" required error={errors.sku}>
              <input
                value={form.sku}
                onChange={(e) => set('sku', e.target.value)}
                placeholder="e.g. KB-009"
                disabled={mode === 'edit'}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input font-mono text-slate-900 placeholder-slate-400 disabled:opacity-60 focus:outline-none uppercase"
              />
            </FormField>

            <FormField label="Product Category" required error={errors.categoryId}>
              <select
                value={form.categoryId}
                onChange={(e) => set('categoryId', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-slate-900 cursor-pointer font-medium"
              >
                <option value="">Select category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Primary Supplier">
              <select
                value={form.supplierId}
                onChange={(e) => set('supplierId', e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-slate-900 cursor-pointer font-medium"
              >
                <option value="">No supplier specified</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Unit Retail Price ($)" required error={errors.price}>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </FormField>

            {mode === 'add' && (
              <FormField label="Initial Opening Units" error={errors.initialStock}>
                <input
                  type="number"
                  min="0"
                  value={form.initialStock}
                  onChange={(e) => set('initialStock', e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 focus:outline-none"
                />
              </FormField>
            )}

            <FormField label="Reorder Threshold" required error={errors.reorderLevel}>
              <input
                type="number"
                min="0"
                value={form.reorderLevel}
                onChange={(e) => set('reorderLevel', e.target.value)}
                placeholder="e.g. 10"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </FormField>

            <div className="col-span-2">
              <FormField label="Technical Description & Specs">
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={3}
                  placeholder="Item dimensions, compliance standards, warranty, or packaging details…"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 resize-none focus:outline-none"
                />
              </FormField>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-5">
          <button
            type="button"
            onClick={() => (mode === 'edit' && editing ? navigate('product-detail', editing.id) : navigate('products'))}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 gradient-btn-primary text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-md disabled:opacity-60"
          >
            {mode === 'add' ? <Plus size={14} /> : <Save size={14} />}
            <span>{saving ? 'Processing...' : mode === 'add' ? 'Create SKU' : 'Save Modifications'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
