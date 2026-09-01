import { Building2, Edit, Mail, MapPin, Phone, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Modal from '../components/Modal';
import { Confirm, EmptyState, FormField, PageHeader } from '../components/ui';
import { useApp } from '../context';

const blank = { name: '', email: '', phone: '', address: '' };

export default function Suppliers() {
  const { suppliers, products, currentUser, navigate, addSupplier, updateSupplier, deleteSupplier } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...blank });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function set(field: keyof typeof blank, val: string) {
    setForm((f) => ({ ...f, [field]: val }));
    if (errors[field])
      setErrors((e) => {
        const n = { ...e };
        delete n[field];
        return n;
      });
  }

  function openAdd() {
    setEditingId(null);
    setForm({ ...blank });
    setErrors({});
    setShowModal(true);
  }

  function openEdit(id: string) {
    const s = suppliers.find((s) => s.id === id);
    if (!s) return;
    setEditingId(id);
    setForm({ name: s.name, email: s.email, phone: s.phone, address: s.address });
    setErrors({});
    setShowModal(true);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Supplier name is required.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address.';
    return errs;
  }

  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    const data = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    };
    if (editingId) updateSupplier(editingId, data);
    else addSupplier(data);
    setShowModal(false);
  }

  function getProductCount(suppId: string) {
    return products.filter((p) => p.supplierId === suppId).length;
  }

  return (
    <div className="max-w-6xl space-y-5">
      <PageHeader
        title="Suppliers & Vendors"
        subtitle="Maintain authorized vendor contacts, purchase channels, and catalog fulfillment links."
        action={
          currentUser?.role === 'ADMIN' && (
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 gradient-btn-primary text-white text-xs font-semibold rounded-xl shadow-sm"
            >
              <Plus size={15} />
              <span>Add Supplier</span>
            </button>
          )
        }
      />

      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="px-5 py-3.5 text-left">Company Name</th>
              <th className="px-5 py-3.5 text-left">Contact Email</th>
              <th className="px-5 py-3.5 text-left">Phone Number</th>
              <th className="px-5 py-3.5 text-left">Warehouse Address</th>
              <th className="px-5 py-3.5 text-right">Linked SKUs</th>
              {currentUser?.role === 'ADMIN' && <th className="px-5 py-3.5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    title="No suppliers found"
                    description="Register your manufacturing and distributor contacts."
                    action={currentUser?.role === 'ADMIN' ? { label: 'Add Supplier', onClick: openAdd } : undefined}
                  />
                </td>
              </tr>
            ) : (
              suppliers.map((sup) => {
                const count = getProductCount(sup.id);
                return (
                  <tr key={sup.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100/60">
                        <Building2 size={13} />
                      </div>
                      <span>{sup.name}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-medium">
                      {sup.email ? (
                        <span className="flex items-center gap-1.5 text-blue-600 font-mono">
                          <Mail size={12} className="text-slate-400" />
                          {sup.email}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-mono">
                      {sup.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone size={12} className="text-slate-400" />
                          {sup.phone}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-500 max-w-xs truncate">
                      {sup.address ? (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{sup.address}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => navigate('products')}
                        className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/60 hover:bg-blue-100 transition-colors cursor-pointer"
                        title="View products from this supplier"
                      >
                        {count} SKUs
                      </button>
                    </td>
                    {currentUser?.role === 'ADMIN' && (
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(sup.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                            aria-label="Edit supplier"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(sup.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            aria-label="Delete supplier"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal title={editingId ? 'Edit Supplier' : 'Add New Supplier'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <FormField label="Company Name" required error={errors.name}>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Acme Components LLC"
                className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 focus:outline-none"
                autoFocus
              />
            </FormField>
            <FormField label="Email Address" error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="vendor@company.com"
                className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Phone Number">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </FormField>
            <FormField label="Warehouse Address">
              <textarea
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                rows={2}
                placeholder="Street address, city, state, postal code..."
                className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 resize-none focus:outline-none"
              />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold gradient-btn-primary text-white rounded-xl shadow-md disabled:opacity-60"
              >
                {saving ? 'Saving...' : editingId ? 'Update Supplier' : 'Add Supplier'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Confirm
          title="Delete Supplier?"
          message="Products linked to this supplier will remain, but will no longer have an assigned supplier."
          confirmLabel="Delete Supplier"
          variant="danger"
          onConfirm={() => {
            deleteSupplier(confirmDelete);
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
