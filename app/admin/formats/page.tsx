'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Format } from '@/types';
import { Badge, BadgeWithDot } from '@/app/admin/components/ui/nav/badges';
import { Button } from '@/app/admin/components/ui/button';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import { useToast } from '@/app/admin/components/ToastContainer';
import { Edit01, Trash01 } from '@untitledui/icons';

const CATEGORY_COLOR: Record<string, 'purple' | 'blue' | 'orange' | 'success' | 'gray'> = {
  frozen: 'blue',
  food: 'orange',
  experience: 'purple',
  bundle: 'success',
};

const SERVING_COLOR: Record<string, 'gray' | 'indigo' | 'blue' | 'pink'> = {
  scoop: 'indigo',
  'soft-serve': 'pink',
  packaged: 'blue',
  plated: 'gray',
};

export default function FormatsPage() {
  const router = useRouter();
  const toast = useToast();
  const [formats, setFormats] = useState<Format[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: '', name: '' });

  useEffect(() => { fetchFormats(); }, []);

  const fetchFormats = async () => {
    try {
      const response = await fetch('/api/formats');
      if (response.ok) {
        const data = await response.json();
        setFormats(data.data || data);
      }
    } catch (error) {
      console.error('Error fetching formats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const response = await fetch(`/api/formats/${deleteConfirm.id}`, { method: 'DELETE' });
    if (response.ok) {
      setFormats(formats.filter((f) => f.id !== deleteConfirm.id));
      toast.success('Format deleted', `"${deleteConfirm.name}" has been removed`);
      setDeleteConfirm({ show: false, id: '', name: '' });
    } else {
      const error = await response.json();
      toast.error('Delete failed', error.details?.message || error.error || 'Failed to delete format');
      setDeleteConfirm({ show: false, id: '', name: '' });
    }
  };

  const filtered = formats.filter((f) => categoryFilter === 'all' || f.category === categoryFilter);

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Formats</h1>
            <p className="text-sm text-gray-500 mt-0.5">Product format templates</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All categories</option>
              <option value="frozen">Frozen</option>
              <option value="food">Food</option>
              <option value="experience">Experience</option>
              <option value="bundle">Bundle</option>
            </select>
            <Link href="/admin/formats/create">
              <Button variant="primary" size="sm">Add format</Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-sm text-gray-500">No formats found</p>
            <Link href="/admin/formats/create">
              <Button variant="secondary" size="sm">Add your first format</Button>
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Serving</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Flavours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Add-ons</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((format) => (
                <tr
                  key={format.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/admin/formats/${format.id}`)}
                >
                  <td className="px-6 py-3">
                    <p className="font-medium text-gray-900">{format.name}</p>
                    <p className="text-xs text-gray-400">{format.slug}</p>
                  </td>
                  <td className="px-6 py-3">
                    <Badge color={CATEGORY_COLOR[format.category] ?? 'gray'} size="sm">{format.category}</Badge>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {(format.servingStyles || []).map((s: string) => (
                        <Badge key={s} color={SERVING_COLOR[s] ?? 'gray'} size="sm">{s}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    {!format.requiresFlavours ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <Badge color="purple" size="sm">
                        {format.minFlavours === format.maxFlavours
                          ? `${format.minFlavours} flavour${format.minFlavours !== 1 ? 's' : ''}`
                          : `${format.minFlavours}–${format.maxFlavours} flavours`}
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {format.canIncludeAddOns
                      ? <Badge color="success" size="sm">Add-ons</Badge>
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Link href={`/admin/formats/${format.id}`}>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded" title="Edit">
                          <Edit01 className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded"
                        title="Delete"
                        onClick={() => setDeleteConfirm({ show: true, id: format.id, name: format.name })}
                      >
                        <Trash01 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteConfirm.show}
        variant="danger"
        title="Delete Format"
        message={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ show: false, id: '', name: '' })}
      />
    </>
  );
}
