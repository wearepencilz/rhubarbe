'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/app/admin/components/ui/button';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import { useToast } from '@/app/admin/components/ToastContainer';
import AiTranslateButton from '@/app/admin/components/AiTranslateButton';

interface FormLocaleContent {
  heading?: string;
  intro?: string;
  menuNote?: string;
  contactNote?: string;
}

interface FormPageContent {
  heading?: string;
  intro?: string;
  menuNote?: string;
  contactNote?: string;
  fr?: FormLocaleContent;
  en?: FormLocaleContent;
}

interface FormPageEditorProps {
  pageKey: 'traiteur' | 'gateaux';
  label: string;
  defaults: { heading: string; intro: string; menuNote: string; contactNote: string };
}

export default function FormPageEditor({ pageKey, label, defaults }: FormPageEditorProps) {
  const toast = useToast();
  const [content, setContent] = useState<FormPageContent>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/pages/${pageKey}`)
      .then((r) => r.json())
      .then((data) => setContent(data || {}))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [pageKey]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/pages/${pageKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      if (!res.ok) toast.error('Save failed', 'Could not save page content');
      else toast.success('Saved', `${label} page content updated`);
    } catch {
      toast.error('Save failed', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const setFr = (k: keyof FormLocaleContent, v: string) =>
    setContent((c) => ({ ...c, fr: { ...c.fr, [k]: v || undefined } }));

  const setEn = (k: keyof FormLocaleContent, v: string) =>
    setContent((c) => ({ ...c, en: { ...c.en, [k]: v || undefined } }));

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
        <span className="text-gray-900">{label}</span>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">{label}</h1>
        <p className="text-gray-600 mt-1">Page content and translations. Leave blank to use the locale default.</p>
        <p className="text-xs text-gray-400 mt-1">Form field labels, event types, and success/error messages are managed in the locale files.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">

        {/* French */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <span className="text-base">🇫🇷</span>
            <h2 className="text-sm font-semibold text-gray-900">Français</h2>
            <span className="text-xs text-gray-400">Affiché par défaut</span>
            <div className="ml-auto">
              <AiTranslateButton
                targetLocale="en"
                fields={{
                  heading: content.fr?.heading ?? defaults.heading,
                  intro: content.fr?.intro ?? defaults.intro,
                  menuNote: content.fr?.menuNote ?? defaults.menuNote,
                  contactNote: content.fr?.contactNote ?? defaults.contactNote,
                }}
                onResult={(t) =>
                  setContent((c) => ({
                    ...c,
                    en: {
                      heading: t.heading || c.en?.heading,
                      intro: t.intro || c.en?.intro,
                      menuNote: t.menuNote || c.en?.menuNote,
                      contactNote: t.contactNote || c.en?.contactNote,
                    },
                  }))
                }
              />
            </div>
          </div>
          <div className="px-6 py-6 space-y-4">
            <Input
              label="Titre"
              value={content.fr?.heading ?? ''}
              onChange={(v) => setFr('heading', v)}
              placeholder={defaults.heading}
            />
            <Textarea
              label="Introduction"
              rows={3}
              value={content.fr?.intro ?? ''}
              onChange={(v) => setFr('intro', v)}
              placeholder={defaults.intro}
            />
            <Input
              label="Note menu"
              value={content.fr?.menuNote ?? ''}
              onChange={(v) => setFr('menuNote', v)}
              placeholder={defaults.menuNote}
            />
            <Input
              label="Note formulaire"
              value={content.fr?.contactNote ?? ''}
              onChange={(v) => setFr('contactNote', v)}
              placeholder={defaults.contactNote}
            />
          </div>
        </div>

        {/* English */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <span className="text-base">🇬🇧</span>
            <h2 className="text-sm font-semibold text-gray-900">English</h2>
            <div className="ml-auto">
              <AiTranslateButton
                targetLocale="fr"
                fields={{
                  heading: content.en?.heading ?? defaults.heading,
                  intro: content.en?.intro ?? defaults.intro,
                  menuNote: content.en?.menuNote ?? defaults.menuNote,
                  contactNote: content.en?.contactNote ?? defaults.contactNote,
                }}
                onResult={(t) =>
                  setContent((c) => ({
                    ...c,
                    fr: {
                      heading: t.heading || c.fr?.heading,
                      intro: t.intro || c.fr?.intro,
                      menuNote: t.menuNote || c.fr?.menuNote,
                      contactNote: t.contactNote || c.fr?.contactNote,
                    },
                  }))
                }
              />
            </div>
          </div>
          <div className="px-6 py-6 space-y-4">
            <Input
              label="Heading"
              value={content.en?.heading ?? ''}
              onChange={(v) => setEn('heading', v)}
              placeholder={defaults.heading}
            />
            <Textarea
              label="Intro"
              rows={3}
              value={content.en?.intro ?? ''}
              onChange={(v) => setEn('intro', v)}
              placeholder={defaults.intro}
            />
            <Input
              label="Menu note"
              value={content.en?.menuNote ?? ''}
              onChange={(v) => setEn('menuNote', v)}
              placeholder={defaults.menuNote}
            />
            <Input
              label="Contact note"
              value={content.en?.contactNote ?? ''}
              onChange={(v) => setEn('contactNote', v)}
              placeholder={defaults.contactNote}
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Button variant="primary" isLoading={saving} isDisabled={saving} onClick={save}>
          Save
        </Button>
      </div>
    </div>
  );
}
