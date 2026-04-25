'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/app/admin/components/ui/buttons/button';

type UserRole = 'super_admin' | 'admin' | 'editor';

interface ClerkUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  imageUrl?: string;
  createdAt: number;
  lastSignInAt: number | null;
}

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
  | { type: 'invite' }
  | { type: 'editRole'; user: ClerkUser }
  | { type: 'delete'; user: ClerkUser }
  | null;

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

  const [users, setUsers] = useState<ClerkUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [modal, setModal] = useState<Modal>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('editor');
  const [editRole, setEditRole] = useState<UserRole>('editor');

  const fetchUsers = useCallback(async () => {
    setLoading(true); setFetchError('');
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsers(await res.json());
      else setFetchError((await res.json()).error ?? 'Failed to load users');
    } catch { setFetchError('Failed to load users'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openInvite = () => {
    setInviteEmail(''); setInviteRole('editor'); setError(''); setModal({ type: 'invite' });
  };

  const openEditRole = (user: ClerkUser) => {
    setEditRole(user.role); setError(''); setModal({ type: 'editRole', user });
  };

  const openDelete = (user: ClerkUser) => {
    setError(''); setModal({ type: 'delete', user });
  };

  const handleInvite = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      await fetchUsers(); setModal(null);
    } finally { setSaving(false); }
  };

  const handleEditRole = async () => {
    if (modal?.type !== 'editRole') return;
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/users/${modal.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editRole }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      await fetchUsers(); setModal(null);
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (modal?.type !== 'delete') return;
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/users/${modal.user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      await fetchUsers(); setModal(null);
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
          <Button color="primary" size="sm" onClick={openInvite}>Invite user</Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      ) : fetchError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-sm text-red-600 font-medium">{fetchError}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">User</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Last sign in</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.imageUrl ? (
                        <img src={user.imageUrl} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <span className="flex w-8 h-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="font-medium text-gray-900">
                        {user.name}
                        {user.id === sessionId && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${ROLE_BADGE[user.role] ?? ROLE_BADGE.editor}`}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4">
                    {canManage && (
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => openEditRole(user)} className="text-xs text-gray-500 hover:text-gray-900 transition-colors">Change role</button>
                        {sessionRole === 'super_admin' && user.id !== sessionId && (
                          <button onClick={() => openDelete(user)} className="text-xs text-red-500 hover:text-red-700 transition-colors">Remove</button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p className="text-center text-sm text-gray-400 py-12">No users yet. Invite someone to get started.</p>}
        </div>
      )}

      {/* Invite */}
      {modal?.type === 'invite' && (
        <ModalShell title="Invite user" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1.5">They'll receive an email invitation to create their account.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROLES.filter((r) => r.value !== 'super_admin' || sessionRole === 'super_admin').map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button color="secondary" size="sm" onClick={() => setModal(null)}>Cancel</Button>
              <Button color="primary" size="sm" onClick={handleInvite} isLoading={saving} isDisabled={saving || !inviteEmail}>Send invite</Button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Edit role */}
      {modal?.type === 'editRole' && (
        <ModalShell title={`Change role — ${modal.user.name}`} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={modal.user.id === sessionId}
              >
                {ROLES.filter((r) => r.value !== 'super_admin' || sessionRole === 'super_admin').map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              {modal.user.id === sessionId && <p className="text-xs text-gray-400 mt-1">You cannot change your own role.</p>}
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button color="secondary" size="sm" onClick={() => setModal(null)}>Cancel</Button>
              <Button color="primary" size="sm" onClick={handleEditRole} isLoading={saving} isDisabled={saving}>Save</Button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Delete */}
      {modal?.type === 'delete' && (
        <ModalShell title="Remove user" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to remove <span className="font-medium text-gray-900">{modal.user.name}</span>?
              They will lose access to the CMS immediately.
            </p>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button color="secondary" size="sm" onClick={() => setModal(null)}>Cancel</Button>
              <Button color="primary-destructive" size="sm" onClick={handleDelete} isLoading={saving} isDisabled={saving}>Remove user</Button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
