'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/admin/components/ui/button';
import { Input } from '@/app/admin/components/ui/input';
import RichTextEditor from '@/app/admin/components/RichTextEditor';
import Link from 'next/link';
import { useToast } from '@/app/admin/components/ToastContainer';

interface AboutSettings {
  heading: string;
  intro: string;
  body: string;
  address: string;
  signoff: string;
}

const defaultAbout: AboutSettings = {
  heading: 'about us',
  intro: 'Pâtisserie Rhubarbe opened modestly in October 2010.',
  body: `<p>Stéphanie Labelle believed there was a gap in Montreal for a boutique pastry shop where you could find fresh products every day, made with good seasonal ingredients. She decided to go for it and open in a charming space on rue De Lanaudière, after 8 years of experience in boutique pastry and restaurant work.</p>
<p>Julien Joré, a chef with over 20 years of experience, has been helping Stéphanie since the bakery opened. He has been part of the story from the very beginning, but officially became a partner during the expansion. The move to avenue Laurier in May 2017 allowed Comptoir Rhubarbe to open alongside the shop.</p>
<p>Since then, the rhubarbe boutique has changed its model and moved on July 13, 2025.</p>
<p>Find us at our new location on Saturdays between 9am and 12pm to pick up orders placed in advance on our website.</p>`,
  address: '1320 rue Charlevoix, Pointe Saint-Charles, Montreal',
  signoff: 'team rhubarbe x',
};

export default function AboutAdmin() {
  const toast = useToast();
  const [about, setAbout] = useState<AboutSettings>(defaultAbout);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => setAbout({ ...defaultAbout, ...data.about }))
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
        body: JSON.stringify({ ...current, about }),
      });
      if (!res.ok) toast.error('Failed to save');
      else toast.success('Page saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const set = (k: keyof AboutSettings, v: string) => setAbout((a) => ({ ...a, [k]: v }));

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
        <p className="text-gray-600 mt-1">The /about page</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6 max-w-2xl">
        <Input
          label="Heading"
          value={about.heading}
          onChange={(v) => set('heading', v)}
          placeholder="about us"
        />

        <Input
          label="Intro line"
          value={about.intro}
          onChange={(v) => set('intro', v)}
          placeholder="Pâtisserie Rhubarbe opened modestly in October 2010."
        />

        <RichTextEditor
          label="Body"
          value={about.body}
          onChange={(v) => set('body', v)}
          placeholder="The story..."
        />

        <Input
          label="Address"
          value={about.address}
          onChange={(v) => set('address', v)}
          placeholder="1320 rue Charlevoix, Pointe Saint-Charles"
        />

        <Input
          label="Sign-off"
          value={about.signoff}
          onChange={(v) => set('signoff', v)}
          placeholder="team rhubarbe x"
        />

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
