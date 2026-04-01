'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/app/admin/components/ui/button';
import { Input } from '@/app/admin/components/ui/input';
import { useToast } from '@/app/admin/components/ToastContainer';
import AiTranslateButton from '@/app/admin/components/AiTranslateButton';

interface CakeOrderPageContent {
  fr?: { title?: string; subtitle?: string };
  en?: { title?: string; subtitle?: string };
}

const DEFAULTS = {
  title: { en: 'Cake Order', fr: 'Commande de gâteau' },
  subtitle: {
    en: 'Select a cake, enter the number of guests, and pick your date.',
    fr: "Sélectionnez un gâteau, entrez le nombre d'invités et choisissez votre date.",
  },
};

export default function CakeOrderPageAdmin() {
  const toast = useToast();
  const [content, setContent] = useState<CakeOrderPageContent>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/pages/cake-order')
      .then((r) => r.json())
      .then((data) => setContent(data || {}))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/pages/cake-order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      if (!res.ok) toast.error('Save failed', 'Could not save page content');
      else toast.success('Saved', 'Cake order page content updated');
    } catch { toast.error('Save failed', 'An unexpected error occurred'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/pages" className="hover:text-gray-900 transition-colors">Pages</Link>
        <span>/</span>
        <span className="text-gray-900">Cake Order</span>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Cake Order Page</h1>
        <p className="text-gray-600 mt-1">Title and subtitle shown on the /cake-order page.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
        {/* French */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <span className="text-base">🇫🇷</span>
            <h2 className="text-sm font-semibold text-gray-900">Français</h2>
            <div className="ml-auto">
              <AiTranslateButton targetLocale="en"
                fields={{ title: content.fr?.title ?? DEFAULTS.title.fr, subtitle: content.fr?.subtitle ?? DEFAULTS.subtitle.fr }}
                onResult={(t) => setContent((c) => ({ ...c, en: { title: t.title || c.en?.title, subtitle: t.subtitle || c.en?.subtitle } }))} />
            </div>
          </div>
          <div className="px-6 py-6 space-y-4">
            <Input label="Titre" value={content.fr?.title ?? ''} onChange={(v) => setContent((c) => ({ ...c, fr: { ...c.fr, title: v || undefined } }))} placeholder={DEFAULTS.title.fr} />
            <Input label="Sous-titre" value={content.fr?.subtitle ?? ''} onChange={(v) => setContent((c) => ({ ...c, fr: { ...c.fr, subtitle: v || undefined } }))} placeholder={DEFAULTS.subtitle.fr} />
          </div>
        </div>

        {/* English */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <span className="text-base">🇬🇧</span>
            <h2 className="text-sm font-semibold text-gray-900">English</h2>
            <div className="ml-auto">
              <AiTranslateButton targetLocale="fr"
                fields={{ title: content.en?.title ?? DEFAULTS.title.en, subtitle: content.en?.subtitle ?? DEFAULTS.subtitle.en }}
                onResult={(t) => setContent((c) => ({ ...c, fr: { title: t.title || c.fr?.title, subtitle: t.subtitle || c.fr?.subtitle } }))} />
            </div>
          </div>
          <div className="px-6 py-6 space-y-4">
            <Input label="Title" value={content.en?.title ?? ''} onChange={(v) => setContent((c) => ({ ...c, en: { ...c.en, title: v || undefined } }))} placeholder={DEFAULTS.title.en} />
            <Input label="Subtitle" value={content.en?.subtitle ?? ''} onChange={(v) => setContent((c) => ({ ...c, en: { ...c.en, subtitle: v || undefined } }))} placeholder={DEFAULTS.subtitle.en} />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Button variant="primary" isLoading={saving} isDisabled={saving} onClick={save}>Save</Button>
      </div>
    </div>
  );
}
