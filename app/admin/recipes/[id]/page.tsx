'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import SectionWrapper from '@/app/admin/components/builder/SectionWrapper';
import LiveSectionRenderer from '@/app/admin/components/builder/LiveSectionRenderer';
import SectionLibrary from '@/app/admin/components/SectionLibrary';
import ImageUploader from '@/app/admin/components/ImageUploader';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import { useToast } from '@/app/admin/components/ToastContainer';
import { Input } from '@/app/admin/components/ui/input';
import { Select } from '@/app/admin/components/ui/select';
import { BadgeWithDot } from '@/app/admin/components/ui/nav/badges';
import { createSection, type Section, type SectionType } from '@/lib/types/sections';

interface Meta { slug: string; slugFr: string; slugEn: string; titleFr: string; titleEn: string; status: 'draft' | 'published'; category: string; coverImage: string; }
const emptyMeta: Meta = { slug: '', slugFr: '', slugEn: '', titleFr: '', titleEn: '', status: 'draft', category: '', coverImage: '' };
function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

export default function RecipeEditPage() {
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/recipes/${id}`)
        .then((r) => r.json())
        .then((data) => {
          const content = data.content || {};
          setMeta({ slug: data.slug || '', slugFr: data.slugFr || data.slug || '', slugEn: data.slugEn || '', titleFr: typeof data.title === 'object' ? data.title?.fr || '' : data.title || '', titleEn: typeof data.title === 'object' ? data.title?.en || '' : '', status: data.status || 'draft', category: data.category || '', coverImage: data.coverImage || '' });
          setSections(content.sections || []);
        })
        .catch(() => router.push('/admin/recipes'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const set = useCallback((patch: Partial<Meta>) => setMeta((m) => ({ ...m, ...patch })), []);
  const handleTitleChange = (field: 'titleFr' | 'titleEn', value: string) => { const patch: Partial<Meta> = { [field]: value }; if (!slugTouched) { if (field === 'titleFr') { patch.slugFr = slugify(value); patch.slug = slugify(value); } if (field === 'titleEn') patch.slugEn = slugify(value); } set(patch); };

  const handleSave = async () => {
    if (!meta.titleFr && !meta.titleEn) { toast.error('Title is required'); return; }
    setSaving(true);
    const body = { slug: meta.slugFr || meta.slug, slugFr: meta.slugFr, slugEn: meta.slugEn, title: { fr: meta.titleFr, en: meta.titleEn }, status: meta.status, category: meta.category, coverImage: meta.coverImage, content: { sections } };
    try {
      const url = isNew ? '/api/recipes' : `/api/recipes/${id}`;
      const res = await fetch(url, { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { const saved = await res.json(); toast.success(isNew ? 'Created' : 'Saved'); if (isNew) router.push(`/admin/recipes/${saved.id}`); }
      else toast.error('Failed to save');
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Deleted'); router.push('/admin/recipes'); } else toast.error('Failed');
    setShowDelete(false);
  };

  const updateSection = (idx: number, s: Section) => setSections((prev) => { const n = [...prev]; n[idx] = s; return n; });
  const removeSection = (idx: number) => setSections((prev) => prev.filter((_, i) => i !== idx));
  const addSection = (type: SectionType) => {
    const s = createSection(type);
    setSections((prev) => { if (insertAt !== null) { const n = [...prev]; n.splice(insertAt, 0, s); return n; } return [...prev, s]; });
    setInsertAt(null);
  };
  const handleDragEnd = (e: DragEndEvent) => { const { active, over } = e; if (over && active.id !== over.id) setSections((prev) => arrayMove(prev, prev.findIndex((s) => s.id === active.id), prev.findIndex((s) => s.id === over.id))); };
  const openLibraryAt = (pos: 'above' | 'below', sectionId: string) => { const idx = sections.findIndex((s) => s.id === sectionId); setInsertAt(pos === 'above' ? idx : idx + 1); setLibraryOpen(true); };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.push('/admin/recipes')} className="text-sm text-gray-500 hover:text-gray-800">← Recipes</button>
        <div className="h-5 w-px bg-gray-200" />
        <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{meta.titleFr || meta.titleEn || 'New Recipe'}</span>
        {meta.status && <BadgeWithDot color={meta.status === 'published' ? 'success' : 'gray'}>{meta.status}</BadgeWithDot>}
        <div className="flex-1" />
        <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs font-medium">
          {(['fr', 'en'] as const).map((l) => (<button key={l} onClick={() => setLocale(l)} className={`px-2.5 py-1 rounded-md transition-colors ${locale === l ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>{l === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN'}</button>))}
        </div>
        <button onClick={() => setSettingsOpen(!settingsOpen)} className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${settingsOpen ? 'bg-gray-200 text-gray-900' : 'text-gray-500'}`}>⚙ Settings</button>
        <button onClick={() => { setInsertAt(null); setLibraryOpen(true); }} className="text-sm text-blue-600 font-medium">+ Section</button>
        {!isNew && <button onClick={() => setShowDelete(true)} className="text-sm text-red-500">Delete</button>}
        {!isNew && (meta.slugFr || meta.slugEn) && <button onClick={() => window.open(`/${locale}/recipes/${locale === 'fr' ? meta.slugFr : meta.slugEn || meta.slugFr}`, '_blank')} className="text-sm text-gray-500 hover:text-gray-800">Preview ↗</button>}
        <button onClick={handleSave} disabled={saving} className="text-sm font-medium px-4 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
      </div>

      <div className="flex-1 flex">
        {settingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSettingsOpen(false)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recipe Settings</h2>
                <button onClick={() => setSettingsOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Title (FR)" value={meta.titleFr} onChange={(v) => handleTitleChange('titleFr', v)} isRequired />
                <Input label="Title (EN)" value={meta.titleEn} onChange={(v) => handleTitleChange('titleEn', v)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Slug (FR)" value={meta.slugFr} onChange={(v) => { setSlugTouched(true); set({ slugFr: slugify(v), slug: slugify(v) }); }} helperText={meta.slugFr ? `/fr/recipes/${meta.slugFr}` : undefined} />
                <Input label="Slug (EN)" value={meta.slugEn} onChange={(v) => { setSlugTouched(true); set({ slugEn: slugify(v) }); }} helperText={meta.slugEn ? `/en/recipes/${meta.slugEn}` : undefined} />
              </div>
              <Select label="Status" value={meta.status} onChange={(v) => set({ status: v as 'draft' | 'published' })} options={[{ id: 'draft', label: 'Draft' }, { id: 'published', label: 'Published' }]} />
              <Input label="Category" value={meta.category} onChange={(v) => set({ category: v })} placeholder="dessert, main, etc." />
              <ImageUploader value={meta.coverImage} onChange={(url) => set({ coverImage: url })} onDelete={() => set({ coverImage: '' })} label="Cover image" />
            </div>
          </div>
        )}

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
      <ConfirmModal isOpen={showDelete} variant="danger" title="Delete Recipe" message={`Delete "${meta.titleFr || meta.titleEn}"?`} confirmLabel="Delete" cancelLabel="Cancel" onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
    </div>
  );
}
