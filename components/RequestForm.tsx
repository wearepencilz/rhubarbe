'use client';

import { useState } from 'react';

const EVENT_TYPES = ['wedding', 'lunch box', 'buffet', 'banquet', 'cocktail dinner', 'other'];

interface RequestFormProps {
  type: 'traiteur' | 'gateaux';
  onSuccess?: () => void;
}

export default function RequestForm({ type, onSuccess }: RequestFormProps) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', date: '', time: '',
    guests: '', eventType: '', delivery: 'no', address: '', notes: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type }),
      });
      if (!res.ok) throw new Error();
      setStatus('sent');
      onSuccess?.();
    } catch {
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <p className="text-sm text-gray-600 py-4">
        Thank you! We will be in touch shortly.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full name" required>
          <input required value={form.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Email" required>
          <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label="Phone">
          <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="Date">
          <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
        </Field>
        <Field label="Time">
          <input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
        </Field>
        <Field label="Number of guests">
          <input type="number" min="1" value={form.guests} onChange={(e) => set('guests', e.target.value)} />
        </Field>
      </div>

      <Field label="Event type">
        <select value={form.eventType} onChange={(e) => set('eventType', e.target.value)}>
          <option value="">— select —</option>
          {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>

      <Field label="Delivery?">
        <div className="flex gap-6 pt-1">
          {['yes', 'no'].map((v) => (
            <label key={v} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="delivery" value={v} checked={form.delivery === v}
                onChange={() => set('delivery', v)} />
              {v}
            </label>
          ))}
        </div>
      </Field>

      {form.delivery === 'yes' && (
        <Field label="Delivery address">
          <input value={form.address} onChange={(e) => set('address', e.target.value)} />
        </Field>
      )}

      <Field label="Additional information">
        <textarea rows={4} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
      </Field>

      {status === 'error' && (
        <p className="text-red-500 text-xs">Something went wrong. Please try again.</p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="px-6 py-2 bg-gray-900 text-white text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        {status === 'sending' ? 'sending...' : 'send'}
      </button>
    </form>
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
