'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/app/admin/components/ui/button';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import RichTextEditor from '@/app/admin/components/RichTextEditor';
import { useToast } from '@/app/admin/components/ToastContainer';
import AiTranslateButton from '@/app/admin/components/AiTranslateButton';

interface AboutLocale {
  heading?: string;
  intro?: string;
  body?: string;
  address?: string;
  signoff?: string;
}

interface AboutContent {
  en?: AboutLocale;
  fr?: AboutLocale;
}

const EN_DEFAULTS: AboutLocale = {
  heading: 'about us',
  intro: 'Pâtisserie Rhubarbe opened modestly in October 2010.',
  body: '<p>The story of Rhubarbe...</p>',
  address: '1320 rue Charlevoix, Pointe Saint-Charles, Montreal',
  signoff: 'team rhubarbe x',
};

export default function AboutAdmin() {
  const toast = useToast();
  const [content, setContent] = useState<AboutContent>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        const about = data?.about ?? {};
        if (about.en || about.fr) {
          setContent({ en: about.en ?? {}, fr: about.fr ?? {} });
        } else if (Object.keys(about).length > 0) {
          // Migrate legacy flat format → en
          setContent({ en: about, fr: {} });
        }
      })
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
        body: JSON.stringify({ ...current, about: content }),
      });
      if (!res.ok) toast.error('Save failed', 'Could not save about page');
      else toast.success('Saved', 'About page updated');
    } catch {
      toast.error('Save failed', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const setFr = (k: keyof AboutLocale, v: string) =>
    setContent((c) => ({ ...c, fr: { ...c.fr, [k]: v || undefined } }));

  const setEn = (k: keyof AboutLocale, v: string) =>
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
        <span className="text-gray-900">About</span>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">About</h1>
        <p className="text-gray-600 mt-1">Page content and translations. Leave blank to use the default.</p>
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
                  heading: content.fr?.heading ?? '',
                  intro: content.fr?.intro ?? '',
                  body: content.fr?.body ?? '',
                  address: content.fr?.address ?? '',
                  signoff: content.fr?.signoff ?? '',
                }}
                onResult={(t) =>
                  setContent((c) => ({
                    ...c,
                    en: {
                      heading: t.heading || c.en?.heading,
                      intro: t.intro || c.en?.intro,
                      body: t.body || c.en?.body,
                      address: t.address || c.en?.address,
                      signoff: t.signoff || c.en?.signoff,
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
              placeholder={EN_DEFAULTS.heading}
            />
            <Textarea
              label="Introduction"
              rows={2}
              value={content.fr?.intro ?? ''}
              onChange={(v) => setFr('intro', v)}
              placeholder={EN_DEFAULTS.intro}
            />
            <RichTextEditor
              label="Corps du texte"
              value={content.fr?.body ?? ''}
              onChange={(v) => setFr('body', v)}
              placeholder={EN_DEFAULTS.body}
            />
            <Input
              label="Adresse"
              value={content.fr?.address ?? ''}
              onChange={(v) => setFr('address', v)}
              placeholder={EN_DEFAULTS.address}
            />
            <Input
              label="Signature"
              value={content.fr?.signoff ?? ''}
              onChange={(v) => setFr('signoff', v)}
              placeholder={EN_DEFAULTS.signoff}
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
                  heading: content.en?.heading ?? EN_DEFAULTS.heading ?? '',
                  intro: content.en?.intro ?? EN_DEFAULTS.intro ?? '',
                  body: content.en?.body ?? EN_DEFAULTS.body ?? '',
                  address: content.en?.address ?? EN_DEFAULTS.address ?? '',
                  signoff: content.en?.signoff ?? EN_DEFAULTS.signoff ?? '',
                }}
                onResult={(t) =>
                  setContent((c) => ({
                    ...c,
                    fr: {
                      heading: t.heading || c.fr?.heading,
                      intro: t.intro || c.fr?.intro,
                      body: t.body || c.fr?.body,
                      address: t.address || c.fr?.address,
                      signoff: t.signoff || c.fr?.signoff,
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
              placeholder={EN_DEFAULTS.heading}
            />
            <Textarea
              label="Intro"
              rows={2}
              value={content.en?.intro ?? ''}
              onChange={(v) => setEn('intro', v)}
              placeholder={EN_DEFAULTS.intro}
            />
            <RichTextEditor
              label="Body"
              value={content.en?.body ?? ''}
              onChange={(v) => setEn('body', v)}
              placeholder={EN_DEFAULTS.body}
            />
            <Input
              label="Address"
              value={content.en?.address ?? ''}
              onChange={(v) => setEn('address', v)}
              placeholder={EN_DEFAULTS.address}
            />
            <Input
              label="Sign-off"
              value={content.en?.signoff ?? ''}
              onChange={(v) => setEn('signoff', v)}
              placeholder={EN_DEFAULTS.signoff}
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
