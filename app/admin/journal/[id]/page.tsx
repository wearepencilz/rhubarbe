'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import SectionWrapper from '@/app/admin/components/builder/SectionWrapper';
import LiveSectionRenderer from '@/app/admin/components/builder/LiveSectionRenderer';
import SectionLibrary from '@/app/admin/components/SectionLibrary';
import ImageUploader from '@/app/admin/components/ImageUploader';
import TaxonomySelect from '@/app/admin/components/TaxonomySelect';
import TaxonomyMultiSelect from '@/app/admin/components/TaxonomyMultiSelect';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import { useToast } from '@/app/admin/components/ToastContainer';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import { Select } from '@/app/admin/components/ui/select';
import { BadgeWithDot } from '@/app/admin/components/ui/nav/badges';
import { createSection, type Section, type SectionType } from '@/lib/types/sections';

interface Meta {
  slug: string;
  slugFr: string;
  slugEn: string;
  titleFr: string;
  titleEn: string;
  subtitleFr: string;
  subtitleEn: string;
  status: 'draft' | 'published';
  category: string;
  tags: string[];
  coverImage: string;
  introFr: string;
  introEn: string;
  wordBy: string;
  wordByRole: string;
}

const emptyMeta: Meta = { slug: '', slugFr: '', slugEn: '', titleFr: '', titleEn: '', subtitleFr: '', subtitleEn: '', status: 'draft', category: '', tags: [], coverImage: '', introFr: '', introEn: '', wordBy: '', wordByRole: '' };

function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

export default function JournalEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isNew = id === 'new';
  const toast = useToast();

  const [meta, setMeta] = useState<Meta>(emptyMeta);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [locale, setLocale] = useState<'en' | 'fr'>('fr');
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [discardConfirm, setDiscardConfirm] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const navigateBack = () => { if (dirty) setDiscardConfirm(true); else router.push('/admin/journal'); };

  useEffect(() => {
    if (!id || isNew) return;
    fetch(`/api/journal/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const content = data.content || {};
        setMeta({
          slug: data.slug || '',
          slugFr: data.slugFr || data.slug || '',
          slugEn: data.slugEn || '',
          titleFr: data.title?.fr || '',
          titleEn: data.title?.en || '',
          subtitleFr: data.subtitle?.fr || '',
          subtitleEn: data.subtitle?.en || '',
          status: data.status || 'draft',
          category: data.category || '',
          tags: data.tags || [],
          coverImage: data.coverImage || '',
          introFr: typeof content.intro === 'object' ? content.intro?.fr || '' : content.intro || '',
          introEn: typeof content.intro === 'object' ? content.intro?.en || '' : '',
          wordBy: content.wordBy || '',
          wordByRole: content.wordByRole || '',
        });
        setSections(content.sections || []);
      })
      .catch((err) => {
        console.error('Failed to load journal entry:', err);
        router.push('/admin/journal');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const set = useCallback((patch: Partial<Meta>) => { setMeta((m) => ({ ...m, ...patch })); setDirty(true); }, []);

  const handleTitleChange = (field: 'titleFr' | 'titleEn', value: string) => {
    const patch: Partial<Meta> = { [field]: value };
    if (!slugTouched) {
      if (field === 'titleFr') { patch.slugFr = slugify(value); patch.slug = slugify(value); }
      if (field === 'titleEn') patch.slugEn = slugify(value);
    }
    set(patch);
  };

  const handleSave = async () => {
    if (!meta.titleFr && !meta.titleEn) { toast.error('Title is required'); return; }
    setSaving(true);
    const body = {
      slug: meta.slugFr || meta.slug,
      slugFr: meta.slugFr,
      slugEn: meta.slugEn,
      title: { en: meta.titleEn, fr: meta.titleFr },
      subtitle: { en: meta.subtitleEn, fr: meta.subtitleFr },
      status: meta.status,
      category: meta.category,
      tags: meta.tags,
      coverImage: meta.coverImage,
      content: { intro: { en: meta.introEn, fr: meta.introFr }, wordBy: meta.wordBy, wordByRole: meta.wordByRole, sections },
    };
    try {
      const url = isNew ? '/api/journal' : `/api/journal/${id}`;
      const res = await fetch(url, { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) {
        const saved = await res.json();
        toast.success(isNew ? 'Created' : 'Saved');
        setDirty(false);
        if (isNew) router.push(`/admin/journal/${saved.id}`);
      } else toast.error('Failed to save');
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/journal/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted'); router.push('/admin/journal'); }
    else toast.error('Failed to delete');
    setShowDelete(false);
  };

  const updateSection = (idx: number, s: Section) => { setSections((prev) => { const n = [...prev]; n[idx] = s; return n; }); setDirty(true); };
  const removeSection = (idx: number) => { setSections((prev) => prev.filter((_, i) => i !== idx)); setDirty(true); };
  const addSection = (type: SectionType) => {
    const s = createSection(type);
    setSections((prev) => { if (insertAt !== null) { const n = [...prev]; n.splice(insertAt, 0, s); return n; } return [...prev, s]; });
    setInsertAt(null);
    setDirty(true);
  };
  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) setSections((prev) => { setDirty(true); return arrayMove(prev, prev.findIndex((s) => s.id === active.id), prev.findIndex((s) => s.id === over.id)); });
  };
  const openLibraryAt = (pos: 'above' | 'below', sectionId: string) => {
    const idx = sections.findIndex((s) => s.id === sectionId);
    setInsertAt(pos === 'above' ? idx : idx + 1);
    setLibraryOpen(true);
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Toolbar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3 shadow-sm">
        <button onClick={navigateBack} className="text-sm text-gray-500 hover:text-gray-800">← Journal</button>
        <div className="h-5 w-px bg-gray-200" />
        <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{meta.titleFr || meta.titleEn || 'New Entry'}</span>
        {meta.status && <BadgeWithDot color={meta.status === 'published' ? 'success' : 'gray'}>{meta.status}</BadgeWithDot>}
        <div className="flex-1" />
        <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs font-medium">
          {(['fr', 'en'] as const).map((l) => (
            <button key={l} onClick={() => setLocale(l)} className={`px-2.5 py-1 rounded-md transition-colors ${locale === l ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>{l === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN'}</button>
          ))}
        </div>
        <button onClick={() => setSettingsOpen(!settingsOpen)} className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${settingsOpen ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-800'}`}>⚙ Settings</button>
        <button onClick={() => { setInsertAt(null); setLibraryOpen(true); }} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Section</button>
        {!isNew && <button onClick={() => setShowDelete(true)} className="text-sm text-red-500 hover:text-red-700">Delete</button>}
        {!isNew && (meta.slugFr || meta.slugEn) && <button onClick={() => window.open(`/${locale}/journal/${locale === 'fr' ? meta.slugFr : meta.slugEn || meta.slugFr}`, '_blank')} className="text-sm text-gray-500 hover:text-gray-800">Preview ↗</button>}
        <button onClick={handleSave} disabled={saving} className="text-sm font-medium px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
      </div>

      <div className="flex-1 flex">
        {/* Settings modal */}
        {settingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSettingsOpen(false)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Entry Settings</h2>
                <button onClick={() => setSettingsOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Title (FR)" value={meta.titleFr} onChange={(v) => handleTitleChange('titleFr', v)} isRequired placeholder="Les premières fraises" />
                <Input label="Title (EN)" value={meta.titleEn} onChange={(v) => handleTitleChange('titleEn', v)} placeholder="The First Strawberries" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Subtitle (FR)" value={meta.subtitleFr} onChange={(v) => set({ subtitleFr: v })} placeholder="Sous-titre" />
                <Input label="Subtitle (EN)" value={meta.subtitleEn} onChange={(v) => set({ subtitleEn: v })} placeholder="Subtitle" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Slug (FR)" value={meta.slugFr} onChange={(v) => { setSlugTouched(true); set({ slugFr: slugify(v), slug: slugify(v) }); }} placeholder="les-premieres-fraises" helperText={meta.slugFr ? `/fr/journal/${meta.slugFr}` : undefined} />
                <Input label="Slug (EN)" value={meta.slugEn} onChange={(v) => { setSlugTouched(true); set({ slugEn: slugify(v) }); }} placeholder="the-first-strawberries" helperText={meta.slugEn ? `/en/journal/${meta.slugEn}` : undefined} />
              </div>
              <Select label="Status" value={meta.status} onChange={(v) => set({ status: v as 'draft' | 'published' })} options={[{ id: 'draft', label: 'Draft' }, { id: 'published', label: 'Published' }]} />
              <TaxonomySelect label="Category" category="journalCategories" value={meta.category} onChange={(v) => set({ category: v })} placeholder="Select…" />
              <TaxonomyMultiSelect label="Tags" category="journalTags" values={meta.tags} onChange={(v) => set({ tags: v })} />
              <ImageUploader value={meta.coverImage} onChange={(url) => set({ coverImage: url })} onDelete={() => set({ coverImage: '' })} label="Cover image" aspectRatio="16:9" />
              <div className="grid grid-cols-2 gap-3">
                <Textarea label="Intro (FR)" value={meta.introFr} onChange={(v) => set({ introFr: v })} rows={2} placeholder="Une courte intro" />
                <Textarea label="Intro (EN)" value={meta.introEn} onChange={(v) => set({ introEn: v })} rows={2} placeholder="A short intro line" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Word by" value={meta.wordBy} onChange={(v) => set({ wordBy: v })} placeholder="Name" />
                <Input label="Role" value={meta.wordByRole} onChange={(v) => set({ wordByRole: v })} placeholder="Role" />
              </div>
            </div>
          </div>
        )}

        {/* Section canvas — full width */}
        <div className="flex-1 overflow-auto py-6 px-4 flex justify-center">
          <div className="bg-white shadow-xl w-full max-w-[1440px] min-h-[60vh]">
            {sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                <p className="text-lg mb-4">No sections yet</p>
                <button onClick={() => { setInsertAt(null); setLibraryOpen(true); }} className="text-sm text-blue-600 font-medium border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50">+ Add your first section</button>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  {sections.map((section, idx) => (
                    <SectionWrapper key={section.id} section={section} onDelete={() => removeSection(idx)} onAddAbove={() => {}} onAddBelow={() => {}} onOpenLibrary={(pos) => openLibraryAt(pos, section.id)}>
                      <LiveSectionRenderer section={section} locale={locale} onChange={(s) => updateSection(idx, s)} />
                    </SectionWrapper>
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>

      {libraryOpen && <SectionLibrary onSelect={addSection} onClose={() => { setLibraryOpen(false); setInsertAt(null); }} />}
      <ConfirmModal isOpen={showDelete} variant="danger" title="Delete Entry" message={`Delete "${meta.titleFr || meta.titleEn}"? This cannot be undone.`} confirmLabel="Delete" cancelLabel="Cancel" onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
      <ConfirmModal isOpen={discardConfirm} variant="warning" title="Unsaved changes" message="You have unsaved changes. Discard them and leave?" confirmLabel="Discard" cancelLabel="Keep editing" onConfirm={() => { setDiscardConfirm(false); router.push('/admin/journal'); }} onCancel={() => setDiscardConfirm(false)} />
    </div>
  );
}
