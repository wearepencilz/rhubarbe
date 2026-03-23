'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/admin/components/ui/button';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import RichTextEditor from '@/app/admin/components/RichTextEditor';
import { useToast } from '@/app/admin/components/ToastContainer';
import Link from 'next/link';

const SECTIONS = [
  { key: 'hero', label: 'Hero' },
  { key: 'about', label: 'About' },
  { key: 'story', label: 'Story' },
  { key: 'editorial', label: 'Editorial' },
  { key: 'photos', label: 'Photos' },
];

interface HeroSettings { taglineFr: string; taglineEn: string; }
interface AboutSettings { bg: string; text: string; image: string; }
interface StorySettings { bg: string; text: string; image: string; }
interface EditorialColumn { text: string; image: string; }
interface PhotosSettings { photo1: string; photo2: string; }

const defaultHero: HeroSettings = { taglineFr: 'Crème glacée artisanale \net gelato méditerranéen,', taglineEn: 'Handcraft soft serve \nmediterranean gelato,' };
const defaultAbout: AboutSettings = { bg: '#948c22', text: '<p>Handcraft soft serve mediterranean gelato, made with the heart and honesty.</p>', image: '' };
const defaultStory: StorySettings = { bg: '#333112', text: '<p>This is the story of a lost heritage in a southern village…</p>', image: '' };
const defaultEditorial: EditorialColumn[] = [
  { text: '<p>For our inspiration…</p>', image: '' },
  { text: '<p>Our jersey milk…</p>', image: '' },
  { text: '<p>All our suppliers…</p>', image: '' },
];
const defaultPhotos: PhotosSettings = { photo1: '', photo2: '' };

export default function HomePageAdmin() {
  const toast = useToast();
  const [activeSection, setActiveSection] = useState('hero');
  const [hero, setHero] = useState<HeroSettings>(defaultHero);
  const [about, setAbout] = useState<AboutSettings>(defaultAbout);
  const [story, setStory] = useState<StorySettings>(defaultStory);
  const [editorial, setEditorial] = useState<EditorialColumn[]>(defaultEditorial);
  const [photos, setPhotos] = useState<PhotosSettings>(defaultPhotos);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setHero({ ...defaultHero, ...data.home?.hero });
        setAbout({ ...defaultAbout, ...data.about });
        setStory({ ...defaultStory, ...data.home?.story });
        if (Array.isArray(data.home?.editorial)) {
          setEditorial(data.home.editorial.map((col: EditorialColumn, i: number) => ({ ...defaultEditorial[i], ...col })));
        }
        setPhotos({ ...defaultPhotos, ...data.home?.photos });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const save = async (patch: object) => {
    setSaving(true);
    try {
      const current = await fetch('/api/settings').then((r) => r.json());
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...current, ...patch }),
      });
      if (!res.ok) toast.error('Failed to save');
      else toast.success('Saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const saveHome = (homePatch: object) => {
    return save({ home: { hero, story, editorial, photos, ...homePatch } });
  };

  const upload = async (file: File, onSuccess: (url: string) => void) => {
    setUploading(true);
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
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/pages" className="hover:text-gray-900 transition-colors">Pages</Link>
        <span>/</span>
        <span className="text-gray-900">Home</span>
      </div>

      <div className="flex gap-8">
        {/* Section nav */}
        <nav className="w-48 shrink-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Sections</p>
          <ul className="space-y-1">
            {SECTIONS.map((s) => (
              <li key={s.key}>
                <button
                  onClick={() => setActiveSection(s.key)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeSection === s.key ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex-1 max-w-2xl">
          <div className="mb-6">
            <h1 className="text-3xl font-semibold text-gray-900">Home</h1>
            <p className="text-gray-600 mt-1">Edit content for the homepage</p>
          </div>

          {/* Hero */}
          {activeSection === 'hero' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Hero Tagline</h2>
              <p className="text-sm text-gray-500">The tagline displayed at the top of the homepage. Use \n for line breaks.</p>
              <Textarea
                label="🇫🇷 Français"
                rows={2}
                value={hero.taglineFr}
                onChange={(v) => setHero((h) => ({ ...h, taglineFr: v }))}
                placeholder={defaultHero.taglineFr}
              />
              <Textarea
                label="🇬🇧 English"
                rows={2}
                value={hero.taglineEn}
                onChange={(v) => setHero((h) => ({ ...h, taglineEn: v }))}
                placeholder={defaultHero.taglineEn}
              />
              <Button type="button" variant="primary" isLoading={saving} isDisabled={saving} onClick={() => saveHome({ hero })}>Save</Button>
            </div>
          )}

          {/* About */}
          {activeSection === 'about' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">About</h2>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-900">Background Colour</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={about.bg} onChange={(e) => setAbout((a) => ({ ...a, bg: e.target.value }))} className="h-10 w-16 rounded-md border border-gray-300 cursor-pointer p-0.5" />
                  <input type="text" value={about.bg} onChange={(e) => setAbout((a) => ({ ...a, bg: e.target.value }))} className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <div className="h-10 w-24 rounded-md border border-gray-200" style={{ backgroundColor: about.bg }} />
                </div>
              </div>
              <RichTextEditor label="Text" value={about.text} onChange={(v) => setAbout((a) => ({ ...a, text: v }))} placeholder="About the brand…" />
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-900">Right Side Image</label>
                {about.image && <div className="mb-3 rounded-md overflow-hidden border border-gray-200"><img src={about.image} alt="" className="w-full h-48 object-cover" /></div>}
                <input type="file" accept="image/*" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, (url) => setAbout((a) => ({ ...a, image: url }))); }} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50" />
              </div>
              <Button type="button" variant="primary" isLoading={saving} isDisabled={saving} onClick={() => save({ about })}>Save</Button>
            </div>
          )}

          {/* Story */}
          {activeSection === 'story' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Story</h2>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-900">Background Colour</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={story.bg} onChange={(e) => setStory((s) => ({ ...s, bg: e.target.value }))} className="h-10 w-16 rounded-md border border-gray-300 cursor-pointer p-0.5" />
                  <input type="text" value={story.bg} onChange={(e) => setStory((s) => ({ ...s, bg: e.target.value }))} className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <div className="h-10 w-24 rounded-md border border-gray-200" style={{ backgroundColor: story.bg }} />
                </div>
              </div>
              <RichTextEditor label="Text" value={story.text} onChange={(v) => setStory((s) => ({ ...s, text: v }))} placeholder="The story…" />
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-900">Background Image</label>
                {story.image && <div className="mb-3 rounded-md overflow-hidden border border-gray-200"><img src={story.image} alt="" className="w-full h-48 object-cover" /></div>}
                <input type="file" accept="image/*" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, (url) => setStory((s) => ({ ...s, image: url }))); }} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50" />
              </div>
              <Button type="button" variant="primary" isLoading={saving} isDisabled={saving} onClick={() => saveHome({ story })}>Save</Button>
            </div>
          )}

          {/* Editorial */}
          {activeSection === 'editorial' && (
            <div className="space-y-6">
              {editorial.map((col, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900">Column {i + 1}</h2>
                  <RichTextEditor label="Text" value={col.text} onChange={(v) => setEditorial((ed) => ed.map((c, j) => j === i ? { ...c, text: v } : c))} placeholder="Editorial text…" />
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-900">Image</label>
                    {col.image && <div className="mb-3 rounded-md overflow-hidden border border-gray-200"><img src={col.image} alt="" className="w-full h-48 object-cover" /></div>}
                    <input type="file" accept="image/*" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, (url) => setEditorial((ed) => ed.map((c, j) => j === i ? { ...c, image: url } : c))); }} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50" />
                  </div>
                </div>
              ))}
              <Button type="button" variant="primary" isLoading={saving} isDisabled={saving} onClick={() => saveHome({ editorial })}>Save</Button>
            </div>
          )}

          {/* Photos */}
          {activeSection === 'photos' && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Photos</h2>
              {(['photo1', 'photo2'] as const).map((key, i) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1.5 text-gray-900">Photo {i + 1}</label>
                  {photos[key] && <div className="mb-3 rounded-md overflow-hidden border border-gray-200"><img src={photos[key]} alt="" className="w-full h-48 object-cover" /></div>}
                  <input type="file" accept="image/*" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f, (url) => setPhotos((p) => ({ ...p, [key]: url }))); }} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50" />
                </div>
              ))}
              <Button type="button" variant="primary" isLoading={saving} isDisabled={saving} onClick={() => saveHome({ photos })}>Save</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
