import { Edit, Plus, Tag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import Modal from '../components/Modal';
import { Confirm, EmptyState, FormField, PageHeader } from '../components/ui';
import { useApp } from '../context';

export default function Categories() {
  const { categories, products, currentUser, navigate, addCategory, updateCategory, deleteCategory } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function openAdd() {
    setEditingId(null);
    setName('');
    setNameError('');
    setShowModal(true);
  }

  function openEdit(id: string) {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    setEditingId(id);
    setName(cat.name);
    setNameError('');
    setShowModal(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      setNameError('Category name is required.');
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    if (editingId) {
      const ok = await updateCategory(editingId, name.trim());
      if (!ok) {
        setNameError('A category with this name already exists.');
        return;
      }
    } else {
      const ok = await addCategory(name.trim());
      if (!ok) {
        setNameError('A category with this name already exists.');
        return;
      }
    }
    setShowModal(false);
  }

  function getProductCount(catId: string) {
    return products.filter((p) => p.categoryId === catId).length;
  }

  return (
    <div className="max-w-4xl space-y-5">
      <PageHeader
        title="Product Categories"
        subtitle="Logical classification taxonomies for items and reorder threshold presets."
        action={
          currentUser?.role === 'ADMIN' && (
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 gradient-btn-primary text-white text-xs font-semibold rounded-xl shadow-sm"
            >
              <Plus size={15} />
              <span>Add Category</span>
            </button>
          )
        }
      />

      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="px-5 py-3.5 text-left">Category Name</th>
              <th className="px-5 py-3.5 text-right">Products Count</th>
              <th className="px-5 py-3.5 text-left">Created Date</th>
              {currentUser?.role === 'ADMIN' && <th className="px-5 py-3.5 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <EmptyState
                    title="No categories configured"
                    description="Group your SKUs into organized taxonomy folders."
                    action={currentUser?.role === 'ADMIN' ? { label: 'Add Category', onClick: openAdd } : undefined}
                  />
                </td>
              </tr>
            ) : (
              categories.map((cat) => {
                const count = getProductCount(cat.id);
                return (
                  <tr key={cat.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100/60">
                        <Tag size={13} />
                      </div>
                      <span>{cat.name}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => navigate('products')}
                        className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/60 hover:bg-blue-100 transition-colors cursor-pointer"
                        title="View products in this category"
                      >
                        {count} {count === 1 ? 'item' : 'items'}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">{cat.createdAt}</td>
                    {currentUser?.role === 'ADMIN' && (
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(cat.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                            aria-label="Edit category"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(cat.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            aria-label="Delete category"
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
        <Modal title={editingId ? 'Edit Category' : 'Create New Category'} onClose={() => setShowModal(false)} size="sm">
          <div className="space-y-4">
            <FormField label="Category Name" required error={nameError}>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError('');
                }}
                placeholder="e.g. Computer Accessories, Networking"
                className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 focus:outline-none"
                autoFocus
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
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold gradient-btn-primary text-white rounded-xl shadow-md disabled:opacity-60"
              >
                {saving ? 'Saving...' : editingId ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Confirm
          title="Delete Category?"
          message="Products assigned to this category will remain, but will have their category unlinked."
          confirmLabel="Delete Category"
          variant="danger"
          onConfirm={() => {
            deleteCategory(confirmDelete);
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
