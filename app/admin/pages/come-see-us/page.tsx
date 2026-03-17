'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/admin/components/ui/button';
import { Input } from '@/app/admin/components/ui/input';
import RichTextEditor from '@/app/admin/components/RichTextEditor';
import Link from 'next/link';
import { useToast } from '@/app/admin/components/ToastContainer';

interface VisitSettings {
  message: string;
  address: string;
  addressUrl: string;
  photo: string;
}

const defaultVisit: VisitSettings = {
  message: '<p>THU / FRI / SAT</p><p>13H – 20H <em>SOMETIMES LATER</em></p>',
  address: '<p>2455 Notre Dame,</p><p>Montreal, QC, H3J 1N6</p>',
  addressUrl: 'https://maps.app.goo.gl/3yU5y5Mnq4Bqf8bAA',
  photo: '',
};

export default function ComeSeeUsAdmin() {
  const toast = useToast();
  const [visit, setVisit] = useState<VisitSettings>(defaultVisit);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => setVisit({ ...defaultVisit, ...data.visit }))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const current = await fetch('/api/settings').then((r) => r.json());
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...current, visit }),
      });
      if (!res.ok) toast.error('Failed to save');
      else toast.success('Page saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) setVisit((v) => ({ ...v, photo: data.url }));
      else toast.error('Upload failed');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/pages" className="hover:text-gray-900 transition-colors">Pages</Link>
        <span>/</span>
        <span className="text-gray-900">Come See Us</span>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Come See Us</h1>
        <p className="text-gray-600 mt-1">The /visit page</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6 max-w-2xl">
        <RichTextEditor
          label="Message"
          value={visit.message}
          onChange={(v) => setVisit((vs) => ({ ...vs, message: v }))}
          placeholder="THU / FRI / SAT — 13H – 20H"
          helperText="Hours, days, and any extra info"
        />

        <RichTextEditor
          label="Address"
          value={visit.address}
          onChange={(v) => setVisit((vs) => ({ ...vs, address: v }))}
          placeholder="2455 Notre Dame, Montreal, QC"
        />

        <Input
          label="Maps Link"
          type="url"
          value={visit.addressUrl}
          onChange={(v) => setVisit((vs) => ({ ...vs, addressUrl: v }))}
          placeholder="https://maps.app.goo.gl/…"
        />

        <div>
          <label className="block text-sm font-medium mb-1.5 text-gray-900">Image</label>
          {visit.photo && (
            <div className="mb-3 rounded-md overflow-hidden border border-gray-200">
              <img src={visit.photo} alt="Visit" className="w-full h-48 object-cover" />
            </div>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={uploading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          />
          {uploading && <p className="text-sm text-blue-600 mt-1">Uploading...</p>}
        </div>

        <Button
          type="button"
          variant="primary"
          isLoading={saving}
          isDisabled={saving}
          onClick={save}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
