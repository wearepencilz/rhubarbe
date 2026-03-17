'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/admin/components/ui/button';
import { Input } from '@/app/admin/components/ui/input';
import RichTextEditor from '@/app/admin/components/RichTextEditor';
import { useToast } from '@/app/admin/components/ToastContainer';

interface FooterSettings {
  address: string;
  addressUrl: string;
  hours: string;
  instagram: string;
  contact: string;
}

interface Settings {
  logo: string;
  email: string;
  phone: string;
  companyName: string;
  footer: FooterSettings;
  formatEligibilityRules?: { [flavourTypeId: string]: string[] };
}

const defaultFooter: FooterSettings = {
  address: '<p>2455 rue Notre Dame Ouest</p><p>Montreal, H3J 1N6</p>',
  addressUrl: 'https://maps.app.goo.gl/3yU5y5Mnq4Bqf8bAA',
  hours: '<p>THU / FRI / SAT</p><p>13H – 20H – <em>SOMETIMES LATER</em></p>',
  instagram: 'https://instagram.com/janinemtl',
  contact: '<p>bonjour@janinemtl.ca</p><p>514.970.9266</p>',
};

export default function SettingsPage() {
  const toast = useToast();
  const [formData, setFormData] = useState<Settings>({
    logo: '',
    email: '',
    phone: '',
    companyName: '',
    footer: defaultFooter,
    formatEligibilityRules: {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setFormData({
          logo: data.logo || '',
          email: data.email || '',
          phone: data.phone || '',
          companyName: data.companyName || '',
          footer: { ...defaultFooter, ...data.footer },
          formatEligibilityRules: data.formatEligibilityRules || {},
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const setFooter = (patch: Partial<FooterSettings>) =>
    setFormData((p) => ({ ...p, footer: { ...p.footer, ...patch } }));

  const uploadFile = async (
    file: File,
    setBusy: (v: boolean) => void,
    onSuccess: (url: string) => void
  ) => {
    setBusy(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) onSuccess(data.url);
      else toast.error('Upload failed');
    } catch {
      toast.error('Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const current = await fetch('/api/settings').then((r) => r.json());
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...current, ...formData }),
      });
      if (res.ok) toast.success('Settings saved');
      else toast.error('Failed to save settings');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
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
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your site settings</p>
      </div>

      {formData.formatEligibilityRules &&
        Object.keys(formData.formatEligibilityRules).length > 0 && (
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Format Eligibility Rules</h2>
            <div className="space-y-3">
              {Object.entries(formData.formatEligibilityRules).map(([flavourType, formats]) => (
                <div key={flavourType} className="flex items-start gap-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    {flavourType}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(formats as string[]).map((f) => (
                      <span key={f} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white border border-gray-300 text-gray-700">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* General */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">General</h2>
          <Input
            label="Company Name"
            type="text"
            value={formData.companyName}
            onChange={(v) => setFormData((p) => ({ ...p, companyName: v }))}
            isRequired
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(v) => setFormData((p) => ({ ...p, email: v }))}
          />
          <Input
            label="Phone"
            type="text"
            value={formData.phone}
            onChange={(v) => setFormData((p) => ({ ...p, phone: v }))}
          />
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-900">Logo</label>
            {formData.logo && (
              <div className="mb-3 p-4 bg-gray-50 rounded-md border border-gray-200">
                <img src={formData.logo} alt="Logo" className="h-24 object-contain" />
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile(f, setUploading, (url) => setFormData((p) => ({ ...p, logo: url })));
              }}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
            {uploading && <p className="text-sm text-blue-600 mt-1">Uploading...</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Footer</h2>
          <RichTextEditor
            label="Address"
            value={formData.footer.address}
            onChange={(v) => setFooter({ address: v })}
            placeholder="2455 rue Notre Dame Ouest…"
          />
          <Input
            label="Maps Link"
            type="url"
            value={formData.footer.addressUrl}
            onChange={(v) => setFooter({ addressUrl: v })}
            placeholder="https://maps.app.goo.gl/…"
          />
          <RichTextEditor
            label="Hours"
            value={formData.footer.hours}
            onChange={(v) => setFooter({ hours: v })}
            placeholder="THU / FRI / SAT…"
          />
          <Input
            label="Instagram URL"
            type="url"
            value={formData.footer.instagram}
            onChange={(v) => setFooter({ instagram: v })}
            placeholder="https://instagram.com/…"
          />
          <RichTextEditor
            label="Contact"
            value={formData.footer.contact}
            onChange={(v) => setFooter({ contact: v })}
            placeholder="email, phone…"
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" variant="primary" isLoading={saving} isDisabled={saving}>
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
