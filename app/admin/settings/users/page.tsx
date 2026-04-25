'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/app/admin/components/ui/button';
import type { PublicUser, UserRole } from '@/lib/db/queries/users';

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
];

const ROLE_BADGE: Record<UserRole, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  editor: 'bg-gray-100 text-gray-600',
};

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  editor: 'Editor',
};

type Modal =
  | { type: 'create' }
  | { type: 'edit'; user: PublicUser; active: boolean }
  | { type: 'password'; user: PublicUser }
  | { type: 'delete'; user: PublicUser }
  | null;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, type = 'text', placeholder, autoComplete }: {
  value: string; onChange: (v: string) => void; type?: string; placeholder?: string; autoComplete?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { user: clerkUser } = useUser();
  const sessionRole = ((clerkUser?.publicMetadata as any)?.role ?? 'admin') as UserRole;
  const sessionId = clerkUser?.id;

  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [modal, setModal] = useState<Modal>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', role: 'editor' as UserRole });
  const [editActive, setEditActive] = useState(true);
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        setUsers(await res.json());
      } else {
        const data = await res.json();
        setFetchError(data.error || 'Failed to load users');
      }
    } catch {
      setFetchError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => {
    setForm({ name: '', email: '', username: '', password: '', role: 'editor' });
    setError('');
    setModal({ type: 'create' });
  };

  const openEdit = (user: PublicUser) => {
    setForm({ name: user.name, email: user.email, username: user.username, password: '', role: user.role });
    setEditActive(user.active);
    setError('');
    setModal({ type: 'edit', user, active: user.active });
  };

  const openPassword = (user: PublicUser) => {
    setNewPassword('');
    setError('');
    setModal({ type: 'password', user });
  };

  const openDelete = (user: PublicUser) => {
    setError('');
    setModal({ type: 'delete', user });
  };

  const handleCreate = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      await fetchUsers();
      setModal(null);
    } finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (modal?.type !== 'edit') return;
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/users/${modal.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, username: form.username, role: form.role, active: editActive }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      await fetchUsers();
      setModal(null);
    } finally { setSaving(false); }
  };

  const handlePassword = async () => {
    if (modal?.type !== 'password') return;
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/users/${modal.user.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setModal(null);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (modal?.type !== 'delete') return;
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/users/${modal.user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      await fetchUsers();
      setModal(null);
    } finally { setSaving(false); }
  };

  const canManage = sessionRole === 'super_admin' || sessionRole === 'admin';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage CMS user accounts and roles</p>
        </div>
        {canManage && (
          <Button variant="primary" size="sm" onClick={openCreate}>Add user</Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      ) : fetchError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-sm text-red-600 font-medium">{fetchError}</p>
          <p className="text-xs text-red-400 mt-1">Try signing out and back in to refresh your session.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Username</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {user.name}
                    {user.id === sessionId && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-xs">{user.username}</td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${ROLE_BADGE[user.role]}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.active ? 'text-green-700' : 'text-gray-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {canManage && (
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => openEdit(user)} className="text-xs text-gray-500 hover:text-gray-900 transition-colors">Edit</button>
                        <button onClick={() => openPassword(user)} className="text-xs text-gray-500 hover:text-gray-900 transition-colors">Reset password</button>
                        {sessionRole === 'super_admin' && user.id !== sessionId && (
                          <button onClick={() => openDelete(user)} className="text-xs text-red-500 hover:text-red-700 transition-colors">Delete</button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-12">No users found.</p>
          )}
        </div>
      )}

      {/* Create */}
      {modal?.type === 'create' && (
        <ModalShell title="Add user" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <Field label="Name"><TextInput value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Full name" /></Field>
            <Field label="Username"><TextInput value={form.username} onChange={(v) => setForm({ ...form, username: v })} placeholder="username" autoComplete="off" /></Field>
            <Field label="Email"><TextInput value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" placeholder="email@example.com" /></Field>
            <Field label="Password"><TextInput value={form.password} onChange={(v) => setForm({ ...form, password: v })} type="password" placeholder="Min. 6 characters" autoComplete="new-password" /></Field>
            <Field label="Role">
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                {ROLES.filter((r) => r.value !== 'super_admin' || sessionRole === 'super_admin').map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </Field>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setModal(null)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleCreate} isLoading={saving} isDisabled={saving || !form.name || !form.username || !form.email || !form.password}>Create user</Button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Edit */}
      {modal?.type === 'edit' && (
        <ModalShell title="Edit user" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <Field label="Name"><TextInput value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Full name" /></Field>
            <Field label="Username"><TextInput value={form.username} onChange={(v) => setForm({ ...form, username: v })} placeholder="username" autoComplete="off" /></Field>
            <Field label="Email"><TextInput value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" placeholder="email@example.com" /></Field>
            <Field label="Role">
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })} className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={modal.user.id === sessionId}>
                {ROLES.filter((r) => r.value !== 'super_admin' || sessionRole === 'super_admin').map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              {modal.user.id === sessionId && <p className="text-xs text-gray-400 mt-1">You cannot change your own role.</p>}
            </Field>
            <Field label="Status">
              <select value={String(editActive)} onChange={(e) => setEditActive(e.target.value === 'true')} className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={modal.user.id === sessionId}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </Field>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setModal(null)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleEdit} isLoading={saving} isDisabled={saving}>Save changes</Button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Reset password */}
      {modal?.type === 'password' && (
        <ModalShell title={`Reset password — ${modal.user.name}`} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <Field label="New password">
              <TextInput value={newPassword} onChange={setNewPassword} type="password" placeholder="Min. 6 characters" autoComplete="new-password" />
            </Field>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setModal(null)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handlePassword} isLoading={saving} isDisabled={saving || newPassword.length < 6}>Set password</Button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Delete */}
      {modal?.type === 'delete' && (
        <ModalShell title="Delete user" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <span className="font-medium text-gray-900">{modal.user.name}</span>? This cannot be undone.
            </p>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setModal(null)}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={handleDelete} isLoading={saving} isDisabled={saving}>Delete user</Button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
