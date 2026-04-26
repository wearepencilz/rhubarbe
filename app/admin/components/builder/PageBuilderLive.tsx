'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import SectionWrapper from './SectionWrapper';
import LiveSectionRenderer from './LiveSectionRenderer';
import SectionLibrary from '@/app/admin/components/SectionLibrary';
import { useToast } from '@/app/admin/components/ToastContainer';
import { createSection, type Section, type SectionType } from '@/lib/types/sections';

type Viewport = 'desktop' | 'tablet' | 'mobile';
const VP_W: Record<Viewport, number> = { desktop: 0, tablet: 768, mobile: 390 };

export default function PageBuilderLive() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const pageName = params?.pageName as string;
  const containerRef = useRef<HTMLDivElement>(null);

  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [locale, setLocale] = useState<'en' | 'fr'>('fr');
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [scale, setScale] = useState(1);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    fetch(`/api/pages/${pageName}`).then((r) => r.json()).then((d) => setSections(d?.sections ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, [pageName]);

  // Compute scale so the canvas fits the available width
  useEffect(() => {
    const compute = () => {
      const container = containerRef.current;
      if (!container) return;
      const available = container.clientWidth - 32; // padding
      const target = VP_W[viewport];
      if (target === 0) { setScale(1); return; } // desktop = full width
      setScale(available >= target ? 1 : available / target);
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [viewport]);

  const update = useCallback((idx: number, s: Section) => { setSections((p) => { const n = [...p]; n[idx] = s; return n; }); setDirty(true); }, []);
  const remove = useCallback((idx: number) => { setSections((p) => p.filter((_, i) => i !== idx)); setDirty(true); }, []);
  const addSection = useCallback((type: SectionType) => {
    const s = createSection(type);
    setSections((p) => { if (insertAt !== null) { const n = [...p]; n.splice(insertAt, 0, s); return n; } return [...p, s]; });
    setDirty(true); setInsertAt(null);
  }, [insertAt]);
  const handleDragEnd = (e: DragEndEvent) => { const { active, over } = e; if (over && active.id !== over.id) { setSections((p) => arrayMove(p, p.findIndex((s) => s.id === active.id), p.findIndex((s) => s.id === over.id))); setDirty(true); } };
  const handleSave = async () => { setSaving(true); try { const r = await fetch(`/api/pages/${pageName}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sections }) }); if (r.ok) { toast.success('Saved'); setDirty(false); } else toast.error('Failed'); } catch { toast.error('Failed'); } setSaving(false); };
  const openLibraryAt = (pos: 'above' | 'below', sid: string) => { const i = sections.findIndex((s) => s.id === sid); setInsertAt(pos === 'above' ? i : i + 1); setLibraryOpen(true); };

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" /></div>;

  const canvasW = VP_W[viewport] || '100%';
  const isDesktop = viewport === 'desktop';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Toolbar */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.push('/admin/pages')} className="text-sm text-gray-500 hover:text-gray-800">← Pages</button>
        <div className="h-5 w-px bg-gray-200" />
        <span className="text-sm font-medium text-gray-900">{pageName}</span>
        <div className="flex-1" />
        <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs font-medium">
          {(['fr', 'en'] as const).map((l) => <button key={l} onClick={() => setLocale(l)} className={`px-2.5 py-1 rounded-md ${locale === l ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>{l === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN'}</button>)}
        </div>
        <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs font-medium">
          {(['desktop', 'tablet', 'mobile'] as const).map((v) => <button key={v} onClick={() => setViewport(v)} className={`px-2.5 py-1 rounded-md ${viewport === v ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>{v === 'desktop' ? '🖥' : v === 'tablet' ? '📱' : '📲'}</button>)}
        </div>
        <div className="h-5 w-px bg-gray-200" />
        <button onClick={() => { setInsertAt(null); setLibraryOpen(true); }} className="text-sm text-blue-600 font-medium">+ Add section</button>
        <button onClick={() => window.open(`/p/${pageName}`, '_blank')} className="text-sm text-gray-500 hover:text-gray-800">Preview</button>
        <button onClick={handleSave} disabled={saving || !dirty} className={`text-sm font-medium px-4 py-1.5 rounded-lg ${dirty ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400'}`}>{saving ? 'Saving...' : 'Save'}</button>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className={`flex-1 flex justify-center overflow-hidden ${isDesktop ? '' : 'py-6 px-4'}`}>
        <div
          className={`bg-white origin-top transition-all duration-300 ${isDesktop ? 'w-full' : 'shadow-xl'}`}
          style={isDesktop ? {} : { width: `${canvasW}px`, transform: `scale(${scale})`, transformOrigin: 'top center' }}
        >
          {sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-gray-400">
              <p className="text-lg mb-4">Empty page</p>
              <button onClick={() => { setInsertAt(null); setLibraryOpen(true); }} className="text-sm text-blue-600 font-medium border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-50">+ Add your first section</button>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                {sections.map((section, idx) => (
                  <SectionWrapper key={section.id} section={section} onDelete={() => remove(idx)} onAddAbove={() => {}} onAddBelow={() => {}} onOpenLibrary={(pos) => openLibraryAt(pos, section.id)}>
                    <LiveSectionRenderer section={section} locale={locale} onChange={(s) => update(idx, s)} />
                  </SectionWrapper>
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {libraryOpen && <SectionLibrary onSelect={addSection} onClose={() => { setLibraryOpen(false); setInsertAt(null); }} />}
    </div>
  );
}
