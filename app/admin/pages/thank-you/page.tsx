'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/app/admin/components/ui/button';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import { useToast } from '@/app/admin/components/ToastContainer';
import AiTranslateButton from '@/app/admin/components/AiTranslateButton';

interface ThankYouLocale {
  heading?: string;
  message?: string;
  pickupReminder?: string;
  backToMenu?: string;
}

interface ThankYouContent {
  en?: ThankYouLocale;
  fr?: ThankYouLocale;
}

const FR_DEFAULTS: ThankYouLocale = {
  heading: 'Merci pour votre commande!',
  message: 'Votre commande a été confirmée. Vous recevrez un courriel de confirmation sous peu.',
  pickupReminder: 'N\'oubliez pas de vous présenter à l\'heure de cueillette choisie.',
  backToMenu: '← Retour au menu',
};

const EN_DEFAULTS: ThankYouLocale = {
  heading: 'Thank you for your order!',
  message: 'Your order has been confirmed. You\'ll receive a confirmation email shortly.',
  pickupReminder: 'Don\'t forget to arrive at your chosen pickup time.',
  backToMenu: '← Back to menu',
};

export default function ThankYouAdmin() {
  const toast = useToast();
  const [content, setContent] = useState<ThankYouContent>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/pages/thank-you')
      .then((r) => r.json())
      .then((data) => {
        if (data?.en || data?.fr) {
          setContent({ en: data.en ?? {}, fr: data.fr ?? {} });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/pages/thank-you', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      if (!res.ok) toast.error('Save failed', 'Could not save page content');
      else toast.success('Saved', 'Thank you page updated');
    } catch {
      toast.error('Save failed', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const setFr = (k: keyof ThankYouLocale, v: string) =>
    setContent((c) => ({ ...c, fr: { ...c.fr, [k]: v || undefined } }));

  const setEn = (k: keyof ThankYouLocale, v: string) =>
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
        <span className="text-gray-900">Thank You</span>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Thank You</h1>
        <p className="text-gray-600 mt-1">Post-checkout confirmation page. Leave blank to use defaults.</p>
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
                  heading: content.fr?.heading ?? FR_DEFAULTS.heading ?? '',
                  message: content.fr?.message ?? FR_DEFAULTS.message ?? '',
                  pickupReminder: content.fr?.pickupReminder ?? FR_DEFAULTS.pickupReminder ?? '',
                  backToMenu: content.fr?.backToMenu ?? FR_DEFAULTS.backToMenu ?? '',
                }}
                onResult={(t) =>
                  setContent((c) => ({
                    ...c,
                    en: {
                      heading: t.heading || c.en?.heading,
                      message: t.message || c.en?.message,
                      pickupReminder: t.pickupReminder || c.en?.pickupReminder,
                      backToMenu: t.backToMenu || c.en?.backToMenu,
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
              placeholder={FR_DEFAULTS.heading}
            />
            <Textarea
              label="Message"
              rows={2}
              value={content.fr?.message ?? ''}
              onChange={(v) => setFr('message', v)}
              placeholder={FR_DEFAULTS.message}
            />
            <Input
              label="Rappel de cueillette"
              value={content.fr?.pickupReminder ?? ''}
              onChange={(v) => setFr('pickupReminder', v)}
              placeholder={FR_DEFAULTS.pickupReminder}
            />
            <Input
              label="Lien retour"
              value={content.fr?.backToMenu ?? ''}
              onChange={(v) => setFr('backToMenu', v)}
              placeholder={FR_DEFAULTS.backToMenu}
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
                  message: content.en?.message ?? EN_DEFAULTS.message ?? '',
                  pickupReminder: content.en?.pickupReminder ?? EN_DEFAULTS.pickupReminder ?? '',
                  backToMenu: content.en?.backToMenu ?? EN_DEFAULTS.backToMenu ?? '',
                }}
                onResult={(t) =>
                  setContent((c) => ({
                    ...c,
                    fr: {
                      heading: t.heading || c.fr?.heading,
                      message: t.message || c.fr?.message,
                      pickupReminder: t.pickupReminder || c.fr?.pickupReminder,
                      backToMenu: t.backToMenu || c.fr?.backToMenu,
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
              label="Message"
              rows={2}
              value={content.en?.message ?? ''}
              onChange={(v) => setEn('message', v)}
              placeholder={EN_DEFAULTS.message}
            />
            <Input
              label="Pickup reminder"
              value={content.en?.pickupReminder ?? ''}
              onChange={(v) => setEn('pickupReminder', v)}
              placeholder={EN_DEFAULTS.pickupReminder}
            />
            <Input
              label="Back link text"
              value={content.en?.backToMenu ?? ''}
              onChange={(v) => setEn('backToMenu', v)}
              placeholder={EN_DEFAULTS.backToMenu}
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
