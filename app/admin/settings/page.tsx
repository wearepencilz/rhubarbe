'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/admin/components/ui/button';
import { Input } from '@/app/admin/components/ui/input';
import RichTextEditor from '@/app/admin/components/RichTextEditor';
import { useToast } from '@/app/admin/components/ToastContainer';
import AiTranslateButton from '@/app/admin/components/AiTranslateButton';

interface FooterLocale {
  address?: string;
  hours?: string;
  contact?: string;
}

interface FooterSettings {
  addressUrl?: string;
  instagram?: string;
  en?: FooterLocale;
  fr?: FooterLocale;
  // legacy flat fields (migrated on load)
  address?: string;
  hours?: string;
  contact?: string;
}

interface NavLabels {
  en: Record<string, string>;
  fr: Record<string, string>;
}

interface Settings {
  logo: string;
  email: string;
  phone: string;
  companyName: string;
  brandColor: string;
  footer: FooterSettings;
  navLabels: NavLabels;
  formatEligibilityRules?: { [flavourTypeId: string]: string[] };
}

const defaultNavLabels: NavLabels = {
  en: { order: '', volumeOrder: '', cateringAndCakes: '', about: '' },
  fr: { order: '', volumeOrder: '', cateringAndCakes: '', about: '' },
};

const defaultFooter: FooterSettings = {
  addressUrl: '',
  instagram: '',
  en: { address: '', hours: '', contact: '' },
  fr: { address: '', hours: '', contact: '' },
};

export default function SettingsPage() {
  const toast = useToast();
  const [formData, setFormData] = useState<Settings>({
    logo: '',
    email: '',
    phone: '',
    companyName: '',
    brandColor: '#144437',
    footer: defaultFooter,
    navLabels: defaultNavLabels,
    formatEligibilityRules: {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        const raw = data.footer ?? {};
        // Migrate legacy flat footer → { en, fr }
        let footer: FooterSettings;
        if (raw.en || raw.fr) {
          footer = { addressUrl: raw.addressUrl ?? '', instagram: raw.instagram ?? '', en: raw.en ?? {}, fr: raw.fr ?? {} };
        } else {
          footer = { addressUrl: raw.addressUrl ?? '', instagram: raw.instagram ?? '', en: { address: raw.address ?? '', hours: raw.hours ?? '', contact: raw.contact ?? '' }, fr: {} };
        }
        setFormData({
          logo: data.logo || '',
          email: data.email || '',
          phone: data.phone || '',
          companyName: data.companyName || '',
          brandColor: data.brandColor || '#144437',
          footer,
          navLabels: data.navLabels ?? defaultNavLabels,
          formatEligibilityRules: data.formatEligibilityRules || {},
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const setFooterEn = (k: keyof FooterLocale, v: string) =>
    setFormData((p) => ({ ...p, footer: { ...p.footer, en: { ...p.footer.en, [k]: v } } }));

  const setFooterFr = (k: keyof FooterLocale, v: string) =>
    setFormData((p) => ({ ...p, footer: { ...p.footer, fr: { ...p.footer.fr, [k]: v } } }));

  const setNavLabel = (locale: 'en' | 'fr', key: string, value: string) =>
    setFormData((p) => ({
      ...p,
      navLabels: {
        ...p.navLabels,
        [locale]: { ...p.navLabels[locale], [key]: value },
      },
    }));

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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6 max-w-2xl">
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
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-900">Brand Color</label>
            <p className="text-xs text-gray-500 mb-2">Used as fallback background for products without images.</p>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.brandColor}
                onChange={(e) => setFormData((p) => ({ ...p, brandColor: e.target.value }))}
                className="h-10 w-10 rounded border border-gray-300 cursor-pointer p-0.5"
              />
              <Input
                type="text"
                value={formData.brandColor}
                onChange={(v) => {
                  const val = v.startsWith('#') ? v : `#${v}`;
                  setFormData((p) => ({ ...p, brandColor: val }));
                }}
                placeholder="#144437"
              />
              <div
                className="h-10 w-20 rounded border border-gray-200"
                style={{ backgroundColor: formData.brandColor }}
              />
            </div>
          </div>
        </div>

        {/* Navigation Labels */}
        <div className="space-y-3 max-w-5xl">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Navigation Labels</h2>
            <p className="text-gray-600 text-sm mt-0.5">Customize the main menu link labels. Leave blank to use defaults.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* French */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                <span className="text-base">🇫🇷</span>
                <h3 className="text-sm font-semibold text-gray-900">Français</h3>
              </div>
              <div className="px-6 py-6 space-y-4">
                <Input label="Commander" value={formData.navLabels.fr.order ?? ''} onChange={(v) => setNavLabel('fr', 'order', v)} placeholder="Commander" />
                <Input label="Commande en volume" value={formData.navLabels.fr.volumeOrder ?? ''} onChange={(v) => setNavLabel('fr', 'volumeOrder', v)} placeholder="Commande en volume" />
                <Input label="Traiteur & Gâteaux" value={formData.navLabels.fr.cateringAndCakes ?? ''} onChange={(v) => setNavLabel('fr', 'cateringAndCakes', v)} placeholder="Traiteur & Gâteaux" />
                <Input label="À propos" value={formData.navLabels.fr.about ?? ''} onChange={(v) => setNavLabel('fr', 'about', v)} placeholder="À propos" />
              </div>
            </div>
            {/* English */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                <span className="text-base">🇬🇧</span>
                <h3 className="text-sm font-semibold text-gray-900">English</h3>
              </div>
              <div className="px-6 py-6 space-y-4">
                <Input label="Order" value={formData.navLabels.en.order ?? ''} onChange={(v) => setNavLabel('en', 'order', v)} placeholder="Order" />
                <Input label="Volume Order" value={formData.navLabels.en.volumeOrder ?? ''} onChange={(v) => setNavLabel('en', 'volumeOrder', v)} placeholder="Volume Order" />
                <Input label="Catering & Cakes" value={formData.navLabels.en.cateringAndCakes ?? ''} onChange={(v) => setNavLabel('en', 'cateringAndCakes', v)} placeholder="Catering & Cakes" />
                <Input label="About" value={formData.navLabels.en.about ?? ''} onChange={(v) => setNavLabel('en', 'about', v)} placeholder="About" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="space-y-3 max-w-5xl">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Footer</h2>
            <p className="text-gray-600 text-sm mt-0.5">Translatable content and links. Leave blank to hide.</p>
          </div>

          {/* Shared (non-translatable) */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 max-w-2xl">
            <Input
              label="Maps Link"
              type="url"
              value={formData.footer.addressUrl ?? ''}
              onChange={(v) => setFormData((p) => ({ ...p, footer: { ...p.footer, addressUrl: v } }))}
              placeholder="https://maps.app.goo.gl/…"
            />
            <Input
              label="Instagram URL"
              type="url"
              value={formData.footer.instagram ?? ''}
              onChange={(v) => setFormData((p) => ({ ...p, footer: { ...p.footer, instagram: v } }))}
              placeholder="https://instagram.com/…"
            />
          </div>

          {/* FR / EN side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* French */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                <span className="text-base">🇫🇷</span>
                <h3 className="text-sm font-semibold text-gray-900">Français</h3>
                <span className="text-xs text-gray-400">Affiché par défaut</span>
                <div className="ml-auto">
                  <AiTranslateButton
                    targetLocale="en"
                    fields={{
                      address: formData.footer.fr?.address ?? '',
                      hours: formData.footer.fr?.hours ?? '',
                      contact: formData.footer.fr?.contact ?? '',
                    }}
                    onResult={(t) =>
                      setFormData((p) => ({
                        ...p,
                        footer: {
                          ...p.footer,
                          en: {
                            address: t.address || p.footer.en?.address,
                            hours: t.hours || p.footer.en?.hours,
                            contact: t.contact || p.footer.en?.contact,
                          },
                        },
                      }))
                    }
                  />
                </div>
              </div>
              <div className="px-6 py-6 space-y-4">
                <RichTextEditor
                  label="Adresse"
                  value={formData.footer.fr?.address ?? ''}
                  onChange={(v) => setFooterFr('address', v)}
                  placeholder={formData.footer.en?.address || '1320 rue Charlevoix…'}
                />
                <RichTextEditor
                  label="Heures"
                  value={formData.footer.fr?.hours ?? ''}
                  onChange={(v) => setFooterFr('hours', v)}
                  placeholder={formData.footer.en?.hours || 'SAM 9H–12H…'}
                />
                <RichTextEditor
                  label="Contact"
                  value={formData.footer.fr?.contact ?? ''}
                  onChange={(v) => setFooterFr('contact', v)}
                  placeholder={formData.footer.en?.contact || 'courriel, téléphone…'}
                />
              </div>
            </div>

            {/* English */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                <span className="text-base">🇬🇧</span>
                <h3 className="text-sm font-semibold text-gray-900">English</h3>
                <div className="ml-auto">
                  <AiTranslateButton
                    targetLocale="fr"
                    fields={{
                      address: formData.footer.en?.address ?? '',
                      hours: formData.footer.en?.hours ?? '',
                      contact: formData.footer.en?.contact ?? '',
                    }}
                    onResult={(t) =>
                      setFormData((p) => ({
                        ...p,
                        footer: {
                          ...p.footer,
                          fr: {
                            address: t.address || p.footer.fr?.address,
                            hours: t.hours || p.footer.fr?.hours,
                            contact: t.contact || p.footer.fr?.contact,
                          },
                        },
                      }))
                    }
                  />
                </div>
              </div>
              <div className="px-6 py-6 space-y-4">
                <RichTextEditor
                  label="Address"
                  value={formData.footer.en?.address ?? ''}
                  onChange={(v) => setFooterEn('address', v)}
                  placeholder="1320 rue Charlevoix…"
                />
                <RichTextEditor
                  label="Hours"
                  value={formData.footer.en?.hours ?? ''}
                  onChange={(v) => setFooterEn('hours', v)}
                  placeholder="SAT 9AM–12PM…"
                />
                <RichTextEditor
                  label="Contact"
                  value={formData.footer.en?.contact ?? ''}
                  onChange={(v) => setFooterEn('contact', v)}
                  placeholder="email, phone…"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 max-w-2xl">
          <Button type="submit" variant="primary" isLoading={saving} isDisabled={saving}>
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
