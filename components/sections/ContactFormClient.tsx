'use client';

import { useState } from 'react';

export default function ContactFormClient() {
  const [form, setForm] = useState({ email: '', name: '', inquiry: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type: 'contact', status: 'new' }),
      });
      setSent(true);
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  if (sent) return <p className="text-base font-semibold" style={{ color: '#1A3821' }}>Thank you! We&apos;ll be in touch.</p>;

  const inputStyle = "w-full bg-transparent border-0 border-b border-black/10 py-3 text-base font-semibold uppercase tracking-[5%] placeholder:opacity-60 focus:outline-none focus:border-black/30";

  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      <input className={inputStyle} placeholder="Email*" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input className={inputStyle} placeholder="Name*" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input className={inputStyle} placeholder="Inquiry*" required value={form.inquiry} onChange={(e) => setForm({ ...form, inquiry: e.target.value })} />
      <textarea className={inputStyle + " resize-none"} placeholder="Add message..." rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
      <button
        type="submit"
        disabled={sending}
        className="mt-4 w-full py-2 px-8 rounded-full text-base font-semibold"
        style={{ backgroundColor: '#CB9EC9', color: '#FFFFFF' }}
      >
        {sending ? 'Sending...' : 'Send message'}
      </button>
    </form>
  );
}
