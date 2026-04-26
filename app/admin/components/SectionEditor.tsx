'use client';

import BilingualField from '@/app/admin/components/BilingualField';
import ImageUploader from '@/app/admin/components/ImageUploader';
import { Input } from '@/app/admin/components/ui/input';
import { Select } from '@/app/admin/components/ui/select';
import type { Section, Bilingual, SectionImage } from '@/lib/types/sections';

interface Props {
  section: Section;
  onChange: (updated: Section) => void;
}

const emptyBi = (): Bilingual => ({ en: '', fr: '' });
const emptyImg = (): SectionImage => ({ url: '', alt: emptyBi() });

// Reusable sub-editors
function ImageField({ label, value, onChange }: { label: string; value: SectionImage; onChange: (v: SectionImage) => void }) {
  return (
    <div className="space-y-2">
      <ImageUploader value={value.url} onChange={(url) => onChange({ ...value, url })} onDelete={() => onChange({ ...value, url: '' })} label={label} />
      <BilingualField label="Alt text" value={value.alt} onChange={(alt) => onChange({ ...value, alt })} />
    </div>
  );
}

function QAList({ items, onChange }: { items: { question: Bilingual; answer: Bilingual }[]; onChange: (v: typeof items) => void }) {
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">Q&A #{i + 1}</span>
            {items.length > 1 && (
              <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-xs text-red-500 hover:text-red-700">Remove</button>
            )}
          </div>
          <BilingualField label="Question" value={item.question} onChange={(question) => { const n = [...items]; n[i] = { ...n[i], question }; onChange(n); }} />
          <BilingualField label="Answer" value={item.answer} onChange={(answer) => { const n = [...items]; n[i] = { ...n[i], answer }; onChange(n); }} multiline />
        </div>
      ))}
      <button onClick={() => onChange([...items, { question: emptyBi(), answer: emptyBi() }])} className="text-sm text-blue-600 hover:text-blue-800">+ Add Q&A</button>
    </div>
  );
}

export default function SectionEditor({ section, onChange }: Props) {
  const s = section;
  // Helper to update section fields
  const set = (patch: Partial<Section>) => onChange({ ...s, ...patch } as Section);

  switch (s.type) {
    case 'faq-simple':
      return (
        <div className="space-y-4">
          <BilingualField label="Title" value={s.title} onChange={(title) => set({ title })} />
          <QAList items={s.items} onChange={(items) => set({ items })} />
        </div>
      );

    case 'faq-grouped':
      return (
        <div className="space-y-4">
          <BilingualField label="Title" value={s.title} onChange={(title) => set({ title })} />
          {s.groups.map((group, gi) => (
            <div key={gi} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Group #{gi + 1}</span>
                {s.groups.length > 1 && (
                  <button onClick={() => set({ groups: s.groups.filter((_, j) => j !== gi) })} className="text-xs text-red-500">Remove group</button>
                )}
              </div>
              <BilingualField label="Group heading" value={group.heading} onChange={(heading) => { const g = [...s.groups]; g[gi] = { ...g[gi], heading }; set({ groups: g }); }} />
              <QAList items={group.items} onChange={(items) => { const g = [...s.groups]; g[gi] = { ...g[gi], items }; set({ groups: g }); }} />
            </div>
          ))}
          <button onClick={() => set({ groups: [...s.groups, { heading: emptyBi(), items: [{ question: emptyBi(), answer: emptyBi() }] }] })} className="text-sm text-blue-600">+ Add group</button>
        </div>
      );

    case 'image-carousel':
      return (
        <div className="space-y-4">
          <BilingualField label="Title" value={s.title} onChange={(title) => set({ title })} />
          <BilingualField label="Description" value={s.description} onChange={(description) => set({ description })} multiline />
          {s.images.map((img, i) => (
            <ImageField key={i} label={`Image ${i + 1}`} value={img} onChange={(v) => { const imgs = [...s.images]; imgs[i] = v; set({ images: imgs }); }} />
          ))}
        </div>
      );

    case 'image-2up':
      return (
        <div className="space-y-4">
          <ImageField label="Left image" value={s.images[0]} onChange={(v) => set({ images: [v, s.images[1]] })} />
          <ImageField label="Right image" value={s.images[1]} onChange={(v) => set({ images: [s.images[0], v] })} />
        </div>
      );

    case 'image-hero':
      return <ImageField label="Hero image" value={s.image} onChange={(image) => set({ image })} />;

    case 'image-with-icons':
      return (
        <div className="space-y-4">
          <ImageField label="Background image" value={s.backgroundImage} onChange={(backgroundImage) => set({ backgroundImage })} />
          <ImageField label="Overlay SVG" value={s.overlayImage} onChange={(overlayImage) => set({ overlayImage })} />
        </div>
      );

    case 'content-brief':
      return (
        <div className="space-y-4">
          <BilingualField label="Title" value={s.title} onChange={(title) => set({ title })} />
          {s.items.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Item #{i + 1}</span>
                {s.items.length > 1 && <button onClick={() => set({ items: s.items.filter((_, j) => j !== i) })} className="text-xs text-red-500">Remove</button>}
              </div>
              <ImageField label="Image" value={item.image} onChange={(image) => { const n = [...s.items]; n[i] = { ...n[i], image }; set({ items: n }); }} />
              <BilingualField label="Label" value={item.label} onChange={(label) => { const n = [...s.items]; n[i] = { ...n[i], label }; set({ items: n }); }} />
              <BilingualField label="Body" value={item.body} onChange={(body) => { const n = [...s.items]; n[i] = { ...n[i], body }; set({ items: n }); }} multiline />
            </div>
          ))}
          <button onClick={() => set({ items: [...s.items, { image: emptyImg(), label: emptyBi(), body: emptyBi() }] })} className="text-sm text-blue-600">+ Add item</button>
        </div>
      );

    case 'content-journal':
      return (
        <div className="space-y-4">
          <BilingualField label="Title" value={s.title} onChange={(title) => set({ title })} />
          <Input label="Max entries" value={String(s.maxEntries)} onChange={(v) => set({ maxEntries: Math.max(1, parseInt(v) || 1) })} />
          <p className="text-xs text-gray-500">Pulls the latest published journal entries automatically.</p>
        </div>
      );

    case 'content-2up':
      return (
        <div className="space-y-4">
          <BilingualField label="Title" value={s.title} onChange={(title) => set({ title })} />
          <Select label="Source" value={s.source} onChange={(v) => set({ source: v as 'journal' | 'recipes' })} options={[{ id: 'journal', label: 'Journal' }, { id: 'recipes', label: 'Recipes' }]} />
          <Input label="Max entries" value={String(s.maxEntries)} onChange={(v) => set({ maxEntries: Math.max(1, parseInt(v) || 1) })} />
        </div>
      );

    case 'heading-articles':
      return (
        <div className="space-y-4">
          <BilingualField label="Title" value={s.title} onChange={(title) => set({ title })} />
          {s.tabs.map((tab, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1"><BilingualField label={`Tab ${i + 1}`} value={tab.label} onChange={(label) => { const t = [...s.tabs]; t[i] = { label }; set({ tabs: t }); }} /></div>
              {s.tabs.length > 1 && <button onClick={() => set({ tabs: s.tabs.filter((_, j) => j !== i) })} className="text-xs text-red-500 pb-2">Remove</button>}
            </div>
          ))}
          <button onClick={() => set({ tabs: [...s.tabs, { label: emptyBi() }] })} className="text-sm text-blue-600">+ Add tab</button>
        </div>
      );

    case 'heading-page':
      return <BilingualField label="Page title" value={s.title} onChange={(title) => set({ title })} />;

    case 'heading-content':
      return (
        <div className="space-y-4">
          <BilingualField label="Title" value={s.title} onChange={(title) => set({ title })} />
          <BilingualField label="Category" value={s.category} onChange={(category) => set({ category })} />
          <Input label="Date" value={s.date} onChange={(date) => set({ date })} placeholder="DD.MM.YYYY" />
        </div>
      );

    case 'quote':
      return <BilingualField label="Quote text" value={s.text} onChange={(text) => set({ text })} multiline rows={4} />;

    case 'text':
      return (
        <div className="space-y-4">
          <BilingualField label="Title" value={s.title} onChange={(title) => set({ title })} />
          <BilingualField label="Body" value={s.body} onChange={(body) => set({ body })} multiline rows={6} />
        </div>
      );

    case 'instructions':
      return (
        <div className="space-y-4">
          <BilingualField label="Title" value={s.title} onChange={(title) => set({ title })} />
          {s.steps.map((step, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="flex-1"><BilingualField label={`Step ${i + 1}`} value={step} onChange={(v) => { const n = [...s.steps]; n[i] = v; set({ steps: n }); }} multiline /></div>
              {s.steps.length > 1 && <button onClick={() => set({ steps: s.steps.filter((_, j) => j !== i) })} className="text-xs text-red-500 pb-2">Remove</button>}
            </div>
          ))}
          <button onClick={() => set({ steps: [...s.steps, emptyBi()] })} className="text-sm text-blue-600">+ Add step</button>
        </div>
      );

    case 'two-column-text':
      return (
        <div className="space-y-4">
          <BilingualField label="Title" value={s.title} onChange={(title) => set({ title })} />
          <BilingualField label="Left column" value={s.columnLeft} onChange={(columnLeft) => set({ columnLeft })} multiline />
          <BilingualField label="Right column" value={s.columnRight} onChange={(columnRight) => set({ columnRight })} multiline />
        </div>
      );

    case 'steps':
      return (
        <div className="space-y-4">
          {s.steps.map((step, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Step #{i + 1}</span>
                {s.steps.length > 1 && <button onClick={() => set({ steps: s.steps.filter((_, j) => j !== i) })} className="text-xs text-red-500">Remove</button>}
              </div>
              <BilingualField label="Label" value={step.label} onChange={(label) => { const n = [...s.steps]; n[i] = { ...n[i], label }; set({ steps: n }); }} placeholder="01" />
              <BilingualField label="Body" value={step.body} onChange={(body) => { const n = [...s.steps]; n[i] = { ...n[i], body }; set({ steps: n }); }} multiline />
            </div>
          ))}
          <button onClick={() => set({ steps: [...s.steps, { label: emptyBi(), body: emptyBi() }] })} className="text-sm text-blue-600">+ Add step</button>
        </div>
      );

    case 'image-with-text':
      return (
        <div className="space-y-4">
          <ImageField label="Image" value={s.image} onChange={(image) => set({ image })} />
          <BilingualField label="Title" value={s.title} onChange={(title) => set({ title })} />
          <BilingualField label="Body" value={s.body} onChange={(body) => set({ body })} multiline />
          <Input label="Background color" value={s.backgroundColor} onChange={(backgroundColor) => set({ backgroundColor })} placeholder="#CB9EC9" />
        </div>
      );

    case 'contact-form':
      return (
        <div className="space-y-4">
          <BilingualField label="Title" value={s.title} onChange={(title) => set({ title })} />
          <BilingualField label="Phone" value={s.phone} onChange={(phone) => set({ phone })} />
          <BilingualField label="Email" value={s.email} onChange={(email) => set({ email })} />
          <BilingualField label="Social links" value={s.socialLinks} onChange={(socialLinks) => set({ socialLinks })} multiline />
        </div>
      );

    default:
      return <p className="text-sm text-gray-500">Unknown section type</p>;
  }
}
