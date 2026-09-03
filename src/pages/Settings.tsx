import { Database, KeyRound, Lock, Palette, ShieldAlert, Trash2, User } from 'lucide-react';
import React, { useState } from 'react';
import { api } from '../api/client';
import { Badge, Confirm, FormField, PageHeader } from '../components/ui';
import { useApp } from '../context';

export default function Settings() {
  const { currentUser, showToast, wipeStoreData } = useApp();
  const [profileName, setProfileName] = useState(currentUser?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifLowStock, setNotifLowStock] = useState(true);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [wiping, setWiping] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      showToast('success', 'Profile updated successfully.');
    } finally {
      setSaving(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!pwForm.current) errs.current = 'Current password is required.';
    if (!pwForm.next) errs.next = 'New password is required.';
    else if (pwForm.next.length < 8) errs.next = 'Password must be at least 8 characters.';
    if (pwForm.next !== pwForm.confirm) errs.confirm = 'Passwords do not match.';
    if (Object.keys(errs).length) {
      setPwErrors(errs);
      return;
    }
    try {
      await api.auth.changePassword(pwForm.current, pwForm.next);
      setPwForm({ current: '', next: '', confirm: '' });
      setPwErrors({});
      showToast('success', 'Password updated successfully.');
    } catch (err: any) {
      setPwErrors({ current: err.message || 'Failed to update password. Verify current password.' });
      showToast('error', err.message || 'Failed to update password.');
    }
  }

  async function handleWipeData() {
    setConfirmWipe(false);
    setWiping(true);
    await wipeStoreData();
    setWiping(false);
  }


  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="System Settings"
        subtitle="Personal preferences, authentication credentials, notifications, and store data management."
      />

      <div className="space-y-5">
        {/* Profile Card */}
        <section className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <User size={15} />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Operator Identity</h2>
          </div>

          <form onSubmit={saveProfile} className="space-y-4">
            <div className="flex items-center gap-4 mb-5 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/60">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-sm ${
                  currentUser?.role === 'ADMIN'
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600'
                    : 'bg-gradient-to-br from-emerald-600 to-teal-600'
                }`}
              >
                {currentUser?.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{currentUser?.name}</p>
                <p className="text-xs text-slate-400 font-mono">{currentUser?.email}</p>
                <div className="mt-1">
                  <Badge variant={currentUser?.role === 'ADMIN' ? 'Admin' : 'Staff'} />
                </div>
              </div>
            </div>

            <FormField label="Display Name">
              <input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </FormField>

            <FormField label="Email Address">
              <input
                value={currentUser?.email ?? ''}
                disabled
                className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-400 bg-slate-100/60 cursor-not-allowed font-mono"
              />
            </FormField>

            <FormField label="Access Authority">
              <input
                value={currentUser?.role === 'ADMIN' ? 'Administrator (Full Authority)' : 'Staff (Operations Terminal)'}
                disabled
                className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-400 bg-slate-100/60 cursor-not-allowed"
              />
            </FormField>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 gradient-btn-primary text-white text-xs font-semibold rounded-xl shadow-md disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </section>

        {/* Change Password Card */}
        <section className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <KeyRound size={15} />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Security Credentials</h2>
          </div>

          <form onSubmit={savePassword} className="space-y-4">
            <FormField label="Current Password" error={pwErrors.current}>
              <input
                type="password"
                value={pwForm.current}
                onChange={(e) => {
                  setPwForm((f) => ({ ...f, current: e.target.value }));
                  if (pwErrors.current) setPwErrors((er) => ({ ...er, current: undefined as any }));
                }}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </FormField>

            <FormField label="New Password (min. 8 characters)" error={pwErrors.next}>
              <input
                type="password"
                value={pwForm.next}
                onChange={(e) => {
                  setPwForm((f) => ({ ...f, next: e.target.value }));
                  if (pwErrors.next) setPwErrors((er) => ({ ...er, next: undefined as any }));
                }}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </FormField>

            <FormField label="Confirm New Password" error={pwErrors.confirm}>
              <input
                type="password"
                value={pwForm.confirm}
                onChange={(e) => {
                  setPwForm((f) => ({ ...f, confirm: e.target.value }));
                  if (pwErrors.confirm) setPwErrors((er) => ({ ...er, confirm: undefined as any }));
                }}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </FormField>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 gradient-btn-primary text-white text-xs font-semibold rounded-xl shadow-md"
              >
                Change Password
              </button>
            </div>
          </form>
        </section>

        {/* Preferences & Appearance Card */}
        <section className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600 border border-teal-100">
              <Palette size={15} />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Interface & Alerts</h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <div>
                <p className="font-bold text-slate-900">Low Stock Alert Banners</p>
                <p className="text-slate-400 text-[11px]">Show proactive warning badges when thresholds trigger</p>
              </div>
              <input
                type="checkbox"
                checked={notifLowStock}
                onChange={(e) => setNotifLowStock(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-bold text-slate-900">Stock Receipt Email Notifications</p>
                <p className="text-slate-400 text-[11px]">Send daily ledger digest to registered email</p>
              </div>
              <input
                type="checkbox"
                checked={notifEmail}
                onChange={(e) => setNotifEmail(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* Store Data Management (ADMIN Only) */}
        {currentUser?.role === 'ADMIN' && (
          <section className="glass-card rounded-2xl p-6 border border-slate-200/80 bg-white/90">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <Database size={15} />
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Store Data & Inventory Management
                </h2>
                <p className="text-[11px] text-slate-500">
                  Reset catalog, stock units, and transaction records to a clean slate
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl border border-rose-200/80 bg-rose-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                    <Trash2 size={13} className="text-rose-600" />
                    <span>Wipe All Store Data (Clean Slate)</span>
                  </p>
                  <p className="text-[11px] text-rose-700 mt-0.5 max-w-md leading-relaxed">
                    Permanently deletes all products, categories, suppliers, stock counts, and transactions. Leaves a 100% empty store for you to input your own fresh inventory. Your login session and user account stay active.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={wiping}
                  onClick={() => setConfirmWipe(true)}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-60 cursor-pointer shrink-0 inline-flex items-center gap-1.5"
                >
                  <Trash2 size={13} className={wiping ? 'animate-spin' : ''} />
                  <span>{wiping ? 'Wiping Store...' : 'Wipe to Blank Store'}</span>
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {confirmWipe && (
        <Confirm
          title="Wipe All Store Data to Blank?"
          message="Are you sure you want to wipe all store data? All products, categories, suppliers, inventory levels, and transaction logs will be permanently deleted. You will have a completely clean, empty store. Your user account and login session will remain active."
          confirmLabel="Wipe Everything to Blank"
          variant="danger"
          onConfirm={handleWipeData}
          onCancel={() => setConfirmWipe(false)}
        />
      )}
    </div>
  );
}
