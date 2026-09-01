import { Eye, EyeOff, Plus, Trash2, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';
import Modal from '../components/Modal';
import { Badge, Confirm, EmptyState, FormField, PageHeader } from '../components/ui';
import { useApp } from '../context';
import type { Role, UserStatus } from '../types';

export default function Users() {
  const { users, currentUser, addUser, updateUser, deleteUser } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [confirmRole, setConfirmRole] = useState<{ id: string; from: Role; to: Role } | null>(null);

  // Add user form
  const [addForm, setAddForm] = useState({ name: '', email: '', role: 'STAFF' as Role, password: '' });
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});
  const [addSaving, setAddSaving] = useState(false);

  // Edit user form
  const [showAddPw, setShowAddPw] = useState(false);
  const [showEditPw, setShowEditPw] = useState(false);
  const [editForm, setEditForm] = useState<{ name: string; role: Role; status: UserStatus; password?: string }>({
    name: '',
    role: 'STAFF',
    status: 'Active',
    password: '',
  });
  const [editSaving, setEditSaving] = useState(false);

  function openEdit(id: string) {
    const u = users.find((u) => u.id === id);
    if (!u) return;
    setEditingId(id);
    setEditForm({ name: u.name, role: u.role, status: u.status });
  }

  function validateAdd() {
    const errs: Record<string, string> = {};
    if (!addForm.name.trim()) errs.name = 'Full name is required.';
    if (!addForm.email.trim()) errs.email = 'Corporate email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email)) errs.email = 'Please enter a valid corporate email address.';
    else if (users.some((u) => u.email.toLowerCase() === addForm.email.trim().toLowerCase()))
      errs.email = 'An account with this corporate email already exists in the system.';
    if (!addForm.password) errs.password = 'Initial security password is required.';
    else if (addForm.password.length < 6) errs.password = 'Password must contain at least 6 characters.';
    return errs;
  }

  async function handleAddUser() {
    const errs = validateAdd();
    if (Object.keys(errs).length) {
      setAddErrors(errs);
      return;
    }
    setAddSaving(true);
    const success = await addUser({
      name: addForm.name.trim(),
      email: addForm.email.trim(),
      role: addForm.role,
      status: 'Active',
      password: addForm.password,
    });
    setAddSaving(false);
    if (success) {
      setShowAdd(false);
      setAddForm({ name: '', email: '', role: 'STAFF', password: '' });
      setAddErrors({});
    }
  }

  async function handleEditSave() {
    if (!editingId) return;
    const editing = users.find((u) => u.id === editingId);
    if (!editing) return;
    if (editForm.role !== editing.role) {
      setConfirmRole({ id: editingId, from: editing.role, to: editForm.role });
      return;
    }
    setEditSaving(true);
    const payload: { name: string; role: Role; status: UserStatus; password?: string } = {
      name: editForm.name.trim(),
      role: editForm.role,
      status: editForm.status,
    };
    if (editForm.password && editForm.password.trim().length >= 6) {
      payload.password = editForm.password.trim();
    }
    const success = await updateUser(editingId, payload);
    setEditSaving(false);
    if (success) {
      setEditingId(null);
    }
  }

  function confirmRoleChange() {
    if (!confirmRole) return;
    const payload: { name: string; role: Role; status: UserStatus; password?: string } = {
      role: confirmRole.to,
      name: editForm.name.trim(),
      status: editForm.status,
    };
    if (editForm.password && editForm.password.trim().length >= 6) {
      payload.password = editForm.password.trim();
    }
    updateUser(confirmRole.id, payload);
    setConfirmRole(null);
    setEditingId(null);
  }

  function handleDeactivate(id: string) {
    updateUser(id, { status: 'Inactive' });
    setConfirmDeactivate(null);
  }

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto mt-12">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-4 text-rose-600">
          <UserX size={26} />
        </div>
        <h2 className="text-base font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          Administrator privileges are required to provision accounts, modify roles, or deactivate sessions.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-5">
      <PageHeader
        title="User Access Management"
        subtitle="Manage administrative authority, warehouse staff profiles, and session security."
        action={
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 gradient-btn-primary text-white text-xs font-semibold rounded-xl"
          >
            <Plus size={15} />
            <span>Add User</span>
          </button>
        }
      />

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                {['User Name', 'Corporate Email', 'Assigned Role', 'Account Status', 'Created', 'Last Active', 'Actions'].map(
                  (h) => (
                    <th key={h} className={`px-5 py-3.5 ${h === 'Actions' ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState title="No users found" description="Provision user accounts to begin team collaboration." />
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            u.role === 'ADMIN'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {u.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900">{u.name}</span>
                        {u.id === currentUser?.id && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-1.5 py-0.2 rounded">
                            you
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-500">{u.email}</td>
                    <td className="px-5 py-4">
                      <Badge variant={u.role === 'ADMIN' ? 'Admin' : 'Staff'} />
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={u.status} />
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">{u.createdAt}</td>
                    <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">{u.lastActivity}</td>
                    <td className="px-5 py-4 text-right">
                      {u.id !== currentUser?.id && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(u.id)}
                            className="px-2.5 py-1 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
                          >
                            Edit
                          </button>
                          {u.status === 'Active' && (
                            <button
                              type="button"
                              onClick={() => setConfirmDeactivate(u.id)}
                              className="px-2.5 py-1 text-xs font-semibold border border-amber-200 rounded-lg hover:bg-amber-50 text-amber-700 transition-colors"
                            >
                              Deactivate
                            </button>
                          )}
                          {u.status === 'Inactive' && (
                            <button
                              type="button"
                              onClick={() => updateUser(u.id, { status: 'Active' })}
                              className="px-2.5 py-1 text-xs font-semibold border border-emerald-200 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                            >
                              Activate
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setConfirmDelete({ id: u.id, name: u.name })}
                            className="p-1 text-xs font-semibold border border-rose-200 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors inline-flex items-center justify-center"
                            title={`Remove user "${u.name}"`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAdd && (
        <Modal title="Provision New Account" onClose={() => setShowAdd(false)}>
          <div className="space-y-4">
            <FormField label="Full Name" required error={addErrors.name}>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => {
                  setAddForm((f) => ({ ...f, name: e.target.value }));
                  if (addErrors.name) setAddErrors((er) => ({ ...er, name: undefined as any }));
                }}
                placeholder="e.g. Tariq Mehmood"
                className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 focus:outline-none"
                autoFocus
              />
            </FormField>

            <FormField label="Corporate Email" required error={addErrors.email}>
              <input
                type="email"
                value={addForm.email}
                onChange={(e) => {
                  setAddForm((f) => ({ ...f, email: e.target.value }));
                  if (addErrors.email) setAddErrors((er) => ({ ...er, email: undefined as any }));
                }}
                placeholder="tariq@stockflow.com"
                className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Access Authority / Role">
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value as Role }))}
                  className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 cursor-pointer font-medium"
                >
                  <option value="STAFF">STAFF (Floor Operations)</option>
                  <option value="ADMIN">ADMIN (Full Authority)</option>
                </select>
              </FormField>

              <FormField label="Initial Password" required error={addErrors.password}>
                <div className="relative">
                  <input
                    type={showAddPw ? 'text' : 'password'}
                    value={addForm.password}
                    onChange={(e) => {
                      setAddForm((f) => ({ ...f, password: e.target.value }));
                      if (addErrors.password) setAddErrors((er) => ({ ...er, password: undefined as any }));
                    }}
                    placeholder="Min 6 characters"
                    className="w-full pl-3 pr-8 py-2 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPw(!showAddPw)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  >
                    {showAddPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </FormField>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddUser}
                disabled={addSaving}
                className="px-4 py-2 text-xs font-semibold gradient-btn-primary text-white rounded-xl shadow-md disabled:opacity-60 cursor-pointer"
              >
                {addSaving ? 'Provisioning...' : 'Create Account'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit User Modal */}
      {editingId && (
        <Modal title="Update User Profile" onClose={() => setEditingId(null)} size="sm">
          <div className="space-y-4">
            <FormField label="Full Name" required>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Role Assignment">
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as Role }))}
                  className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 cursor-pointer font-medium"
                >
                  <option value="STAFF">STAFF</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </FormField>

              <FormField label="Account Status">
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as UserStatus }))}
                  className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 cursor-pointer font-medium"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </FormField>
            </div>

            <FormField label="Reset Password (Optional)">
              <div className="relative">
                <input
                  type={showEditPw ? 'text' : 'password'}
                  value={editForm.password || ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Leave blank to keep current password"
                  className="w-full pl-3 pr-8 py-2 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPw(!showEditPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                >
                  {showEditPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </FormField>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                disabled={editSaving}
                className="px-4 py-2 text-xs font-semibold gradient-btn-primary text-white rounded-xl shadow-md disabled:opacity-60 cursor-pointer"
              >
                {editSaving ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {confirmDeactivate && (
        <Confirm
          title="Deactivate Account?"
          message="This user will immediately lose access and have active login sessions terminated."
          confirmLabel="Deactivate Account"
          variant="warning"
          onConfirm={() => handleDeactivate(confirmDeactivate)}
          onCancel={() => setConfirmDeactivate(null)}
        />
      )}

      {confirmDelete && (
        <Confirm
          title="Permanently Remove User Account?"
          message={`Are you sure you want to remove ${confirmDelete.name}? Their active sessions will be terminated and the user will be permanently deleted from the system.`}
          confirmLabel="Remove User"
          variant="danger"
          onConfirm={async () => {
            await deleteUser(confirmDelete.id);
            setConfirmDelete(null);
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmRole && (
        <Confirm
          title="Modify Authority Role?"
          message={`Are you sure you want to change this user's role from ${confirmRole.from} to ${confirmRole.to}?`}
          confirmLabel="Confirm Role Change"
          variant="warning"
          onConfirm={confirmRoleChange}
          onCancel={() => setConfirmRole(null)}
        />
      )}
    </div>
  );
}
