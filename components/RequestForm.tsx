'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n/useT';

const EVENT_TYPES_FR = ['mariage', 'boîte repas', 'buffet', 'banquet', 'dîner cocktail', 'autre'];
const EVENT_TYPES_EN = ['wedding', 'lunch box', 'buffet', 'banquet', 'cocktail dinner', 'other'];

interface PageContent {
  heading?: string;
  intro?: string;
  menuNote?: string;
  contactNote?: string;
  // per-locale overrides from CMS
  fr?: { heading?: string; intro?: string; menuNote?: string; contactNote?: string };
  en?: { heading?: string; intro?: string; menuNote?: string; contactNote?: string };
}

interface RequestFormProps {
  type: 'traiteur' | 'gateaux';
  /** CMS-managed page content — falls back to locale defaults if not provided */
  content?: PageContent;
  onSuccess?: () => void;
}

export default function RequestForm({ type, content, onSuccess }: RequestFormProps) {
  const { T, locale } = useT();
  const F = T.form.fields;

  const [form, setForm] = useState({
    name: '', email: '', phone: '', date: '', time: '',
    guests: '', eventType: '', delivery: 'no', address: '', notes: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Resolve page content: CMS locale override → CMS base → locale default
  const defaultContent = T.form[type];
  const cmsLocale = content?.[locale as 'fr' | 'en'];
  const heading   = cmsLocale?.heading   ?? content?.heading   ?? defaultContent.heading;
  const intro     = cmsLocale?.intro     ?? content?.intro     ?? defaultContent.intro;
  const menuNote  = cmsLocale?.menuNote  ?? content?.menuNote  ?? defaultContent.menuNote;
  const contactNote = cmsLocale?.contactNote ?? content?.contactNote ?? defaultContent.contactNote;

  const eventTypes = locale === 'fr' ? EVENT_TYPES_FR : EVENT_TYPES_EN;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type, locale }),
      });
      if (!res.ok) throw new Error();
      setStatus('sent');
      onSuccess?.();
    } catch {
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return <p className="text-sm text-gray-600 py-4">{F.success}</p>;
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-16 space-y-10">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold">{heading}</h1>
        <p className="text-gray-600 leading-relaxed">{intro}</p>
        <p className="text-sm text-gray-400">{menuNote}</p>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-500">{contactNote}</p>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={F.name} required>
              <input required value={form.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label={F.email} required>
              <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label={F.phone}>
              <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </Field>
            <Field label={F.date}>
              <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </Field>
            <Field label={F.time}>
              <input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
            </Field>
            <Field label={F.guests}>
              <input type="number" min="1" value={form.guests} onChange={(e) => set('guests', e.target.value)} />
            </Field>
          </div>

          <Field label={F.eventType}>
            <select value={form.eventType} onChange={(e) => set('eventType', e.target.value)}>
              <option value="">{F.select}</option>
              {eventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>

          <Field label={F.delivery}>
            <div className="flex gap-6 pt-1">
              {(['yes', 'no'] as const).map((v) => (
                <label key={v} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="delivery" value={v} checked={form.delivery === v}
                    onChange={() => set('delivery', v)} />
                  {v === 'yes' ? F.yes : F.no}
                </label>
              ))}
            </div>
          </Field>

          {form.delivery === 'yes' && (
            <Field label={F.deliveryAddress}>
              <input value={form.address} onChange={(e) => set('address', e.target.value)} />
            </Field>
          )}

          <Field label={F.notes}>
            <textarea rows={4} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>

          {status === 'error' && (
            <p className="text-red-500 text-xs">{F.error}</p>
          )}

          <button
            type="submit"
            disabled={status === 'sending'}
            className="px-6 py-2 bg-gray-900 text-white text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {status === 'sending' ? F.sending : F.submit}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500 uppercase tracking-wide">
        {label}{required && ' *'}
      </label>
      <div className="[&_input]:w-full [&_input]:border-b [&_input]:border-gray-300 [&_input]:py-1.5 [&_input]:outline-none [&_input]:bg-transparent [&_select]:w-full [&_select]:border-b [&_select]:border-gray-300 [&_select]:py-1.5 [&_select]:outline-none [&_select]:bg-transparent [&_textarea]:w-full [&_textarea]:border-b [&_textarea]:border-gray-300 [&_textarea]:py-1.5 [&_textarea]:outline-none [&_textarea]:bg-transparent [&_textarea]:resize-none">
        {children}
      </div>
    </div>
  );
}
