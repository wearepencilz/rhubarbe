'use client';

import EditableText from './EditableText';
import EditableImage from './EditableImage';
import FaqLivePreview from './FaqLivePreview';
import ContactFormClient from '@/components/sections/ContactFormClient';
import type { Section, Bilingual, SectionImage } from '@/lib/types/sections';
import { localize } from '@/lib/types/sections';

type P = { section: Section; locale: 'en' | 'fr'; onChange: (s: Section) => void };
const clr = { primary: 'var(--color-text-primary, #1A3821)', bg: 'var(--color-bg-light, #F7F6F3)', accent1: 'var(--color-accent-1, #D49BCB)', accent2: 'var(--color-accent-2, #CB9EC9)' };
const solar: React.CSSProperties = { fontFamily: 'var(--font-section-heading, var(--font-solar-display, "ABC Solar Display", sans-serif))' };

// Helpers
function ET({ value, onChange, locale, ...rest }: { value: Bilingual; onChange: (v: Bilingual) => void; locale: 'en' | 'fr'; className?: string; style?: React.CSSProperties; tag?: 'p' | 'h1' | 'h2' | 'h3' | 'span'; placeholder?: string; multiline?: boolean }) {
  return <EditableText value={value} onChange={onChange} locale={locale} {...rest} />;
}
function EI({ value, onChange, ...rest }: { value: SectionImage; onChange: (v: SectionImage) => void; className?: string; style?: React.CSSProperties }) {
  return <EditableImage value={value} onChange={onChange} {...rest} />;
}

export default function LiveSectionRenderer({ section, locale, onChange }: P) {
  const set = (patch: Partial<Section>) => onChange({ ...section, ...patch } as Section);
  const s = section;

  switch (s.type) {
    case 'faq-simple':
      return (
        <section className="px-6 py-6 md:px-[60px] md:py-[90px] flex flex-col md:flex-row gap-6 md:gap-[80px]" style={{ ...solar, backgroundColor: clr.accent1 }}>
          <div className="md:w-1/2 shrink-0"><ET value={s.title} onChange={(title) => set({ title })} locale={locale} tag="h2" className="text-4xl md:text-5xl font-semibold" style={{ color: clr.primary }} /></div>
          <div className="md:w-1/2">
            <FaqLivePreview topic={s.topic} onTopicChange={(topic) => set({ topic })} />
          </div>
        </section>
      );

    case 'faq-grouped':
      return (
        <section className="px-6 py-6 md:px-[60px] md:py-[90px] flex flex-col md:flex-row gap-6 md:gap-[80px]" style={{ ...solar, backgroundColor: clr.bg }}>
          <div className="md:w-1/2 shrink-0"><ET value={s.title} onChange={(title) => set({ title })} locale={locale} tag="h2" className="text-4xl md:text-5xl font-semibold" style={{ color: clr.primary }} /></div>
          <div className="md:w-1/2">
            <FaqLivePreview topics={s.topics} onTopicsChange={(topics) => set({ topics })} grouped />
          </div>
        </section>
      );

    case 'image-carousel': {
      const [img1, img2, img3] = s.images;
      const setImg = (idx: number, v: SectionImage) => { const imgs = [...s.images]; imgs[idx] = v; set({ images: imgs }); };
      return (
        <section className="px-6 py-6 md:px-[60px] md:py-[90px] flex flex-col md:flex-row md:justify-center md:items-center gap-6 md:gap-20" style={{ ...solar, backgroundColor: clr.bg }}>
          <div className="flex-1 space-y-4 md:space-y-7">
            <ET value={s.title} onChange={(title) => set({ title })} locale={locale} tag="h2" className="text-2xl md:text-[28px] font-semibold" style={{ color: clr.primary }} />
            <ET value={s.description} onChange={(description) => set({ description })} locale={locale} className="text-lg md:text-2xl font-semibold" style={{ color: clr.primary }} multiline />
          </div>
          <div className="flex flex-col md:flex-row gap-2 flex-1">
            {img3 && <EI value={img3} onChange={(v) => setImg(2, v)} className="flex-1 order-first md:order-last aspect-[4/3] md:aspect-auto" />}
            <div className="flex md:flex-col gap-2 md:w-[97px]">
              {img1 && <EI value={img1} onChange={(v) => setImg(0, v)} className="w-24 md:w-full h-20 md:h-[116px]" />}
              {img2 && <EI value={img2} onChange={(v) => setImg(1, v)} className="w-24 md:w-full h-20 md:h-[114px]" />}
            </div>
          </div>
        </section>
      );
    }

    case 'image-2up':
      return (
        <section className="flex flex-col md:flex-row gap-6 md:gap-8 p-6 md:p-[60px]" style={{ backgroundColor: clr.bg }}>
          <EI value={s.images[0]} onChange={(v) => set({ images: [v, s.images[1]] })} className="w-full md:flex-1 h-[442px] md:h-[805px]" />
          <EI value={s.images[1]} onChange={(v) => set({ images: [s.images[0], v] })} className="w-full md:flex-1 h-[442px] md:h-[805px]" />
        </section>
      );

    case 'image-hero':
      return <EI value={s.image} onChange={(image) => set({ image })} className="w-full h-[500px] md:h-[828px]" />;

    case 'image-with-icons':
      return (
        <section className="relative w-full h-[500px] md:h-[816px]">
          <EI value={s.backgroundImage} onChange={(backgroundImage) => set({ backgroundImage })} className="absolute inset-0 w-full h-full" />
        </section>
      );

    case 'content-brief':
      return (
        <section className="flex flex-col md:flex-row gap-6 md:gap-8 p-6 md:p-[60px]" style={{ ...solar, backgroundColor: clr.bg }}>
          {s.items.map((item, i) => (
            <div key={i} className="flex-1 flex flex-col gap-4 md:gap-8">
              <EI value={item.image} onChange={(image) => { const items = [...s.items]; items[i] = { ...item, image }; set({ items }); }} className="w-full h-[442px] md:h-[522px]" />
              <div className="space-y-2 md:space-y-4">
                <ET value={item.label} onChange={(label) => { const items = [...s.items]; items[i] = { ...item, label }; set({ items }); }} locale={locale} className="text-lg md:text-xl font-semibold" style={{ color: clr.primary }} />
                <ET value={item.body} onChange={(body) => { const items = [...s.items]; items[i] = { ...item, body }; set({ items }); }} locale={locale} className="text-sm md:text-base font-semibold" style={{ color: clr.primary }} multiline />
              </div>
            </div>
          ))}
        </section>
      );

    case 'content-journal':
      return (
        <section className="p-6 md:p-[60px] text-center" style={{ ...solar, backgroundColor: clr.bg }}>
          <ET value={s.title} onChange={(title) => set({ title })} locale={locale} tag="h2" className="text-2xl font-semibold mb-4" style={{ color: clr.primary }} />
          <div className="flex items-center justify-center gap-2 mb-2">
            {(['journal', 'recipes'] as const).map((src) => (
              <button key={src} onClick={() => set({ source: src })} className={`text-xs px-3 py-1 rounded-full border ${s.source === src ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-500 border-gray-300'}`}>{src}</button>
            ))}
            <input type="number" value={s.maxEntries} onChange={(e) => set({ maxEntries: Math.max(0, parseInt(e.target.value) || 0) })} className="w-12 text-xs border border-gray-200 rounded px-2 py-1 text-center" />
          </div>
          <p className="text-xs text-gray-400">Shows latest {s.maxEntries} published {s.source} entries</p>
        </section>
      );

    case 'content-2up':
      return (
        <section className="p-6 md:p-[60px] text-center" style={{ ...solar, backgroundColor: clr.bg }}>
          <ET value={s.title} onChange={(title) => set({ title })} locale={locale} tag="h2" className="text-2xl font-semibold mb-4" style={{ color: clr.primary }} />
          <div className="flex items-center justify-center gap-2 mb-2">
            {(['journal', 'recipes'] as const).map((src) => (
              <button key={src} onClick={() => set({ source: src })} className={`text-xs px-3 py-1 rounded-full border ${s.source === src ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-500 border-gray-300'}`}>{src}</button>
            ))}
            <input type="number" value={s.maxEntries} onChange={(e) => set({ maxEntries: Math.max(0, parseInt(e.target.value) || 0) })} className="w-12 text-xs border border-gray-200 rounded px-2 py-1 text-center" />
          </div>
          <p className="text-xs text-gray-400">Shows latest {s.maxEntries} published {s.source} entries</p>
        </section>
      );

    case 'heading-articles':
      return (
        <section className="px-6 pt-20 pb-6 md:px-[60px] md:pt-[200px] md:pb-[60px] space-y-4" style={{ ...solar, backgroundColor: clr.bg }}>
          <ET value={s.title} onChange={(title) => set({ title })} locale={locale} tag="h2" className="text-4xl md:text-5xl font-semibold" style={{ color: clr.primary }} />
          <div className="flex flex-col gap-1.5 w-[113px]">
            {s.tabs.map((tab, i) => (
              <ET key={i} value={tab.label} onChange={(label) => { const tabs = [...s.tabs]; tabs[i] = { label }; set({ tabs }); }} locale={locale} className="text-lg md:text-2xl font-semibold" style={{ color: clr.primary, opacity: i === 0 ? 1 : 0.4 }} />
            ))}
          </div>
        </section>
      );

    case 'heading-page':
      return (
        <section className="px-6 pt-20 pb-6 md:px-[60px] md:pt-[200px] md:pb-[60px]" style={{ ...solar, backgroundColor: clr.bg }}>
          <ET value={s.title} onChange={(title) => set({ title })} locale={locale} tag="h1" className="text-4xl md:text-5xl font-semibold" style={{ color: clr.primary }} />
        </section>
      );

    case 'heading-content':
      return (
        <section className="px-6 pt-20 pb-6 md:px-[60px] md:pt-[200px] md:pb-[60px]" style={{ ...solar, backgroundColor: clr.bg }}>
          <ET value={s.title} onChange={(title) => set({ title })} locale={locale} tag="h1" className="text-4xl md:text-5xl font-semibold" style={{ color: clr.primary }} />
          <div className="flex items-center gap-2 mt-2">
            <ET value={s.category} onChange={(category) => set({ category })} locale={locale} tag="span" className="text-sm font-semibold" style={{ color: clr.primary }} />
            <span className="text-sm font-semibold" style={{ color: clr.primary }}>| {s.date}</span>
          </div>
        </section>
      );

    case 'quote':
      return (
        <section className="px-6 py-6 md:px-[60px] md:py-[90px] flex flex-col md:flex-row gap-6 md:gap-[80px]" style={{ ...solar, backgroundColor: clr.bg }}>
          <div className="hidden md:block md:w-1/2" />
          <div className="md:w-1/2"><ET value={s.text} onChange={(text) => set({ text })} locale={locale} className="text-2xl md:text-[36px] font-semibold leading-snug" style={{ color: clr.primary }} multiline placeholder="Enter quote..." /></div>
        </section>
      );

    case 'text':
      return (
        <section className="px-6 py-6 md:px-[60px] md:py-[90px] flex flex-col md:flex-row gap-6 md:gap-[80px]" style={{ ...solar, backgroundColor: clr.bg }}>
          <div className="hidden md:block md:w-1/2" />
          <div className="md:w-1/2 space-y-4 md:space-y-6">
            <ET value={s.title} onChange={(title) => set({ title })} locale={locale} tag="h2" className="text-xl md:text-[26px] font-semibold" style={{ color: clr.primary }} />
            <ET value={s.body} onChange={(body) => set({ body })} locale={locale} className="text-sm md:text-base font-semibold" style={{ color: clr.primary }} multiline />
          </div>
        </section>
      );

    case 'instructions':
      return (
        <section className="px-6 py-6 md:px-[60px] md:py-[90px] flex flex-col md:flex-row gap-6 md:gap-[80px]" style={{ ...solar, backgroundColor: clr.bg }}>
          <div className="hidden md:block md:w-1/2" />
          <div className="md:w-1/2 space-y-4 md:space-y-6">
            <ET value={s.title} onChange={(title) => set({ title })} locale={locale} tag="h2" className="text-xl md:text-[26px] font-semibold" style={{ color: clr.primary }} />
            <div className="space-y-4 md:space-y-6">
              {s.steps.map((step, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-sm md:text-base font-semibold shrink-0" style={{ color: clr.primary }}>{i + 1}.</span>
                  <ET value={step} onChange={(v) => { const steps = [...s.steps]; steps[i] = v; set({ steps }); }} locale={locale} className="text-sm md:text-base font-semibold" style={{ color: clr.primary }} multiline />
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'two-column-text':
      return (
        <section className="px-6 py-6 md:px-[240px] md:py-[90px] space-y-4 md:space-y-6" style={{ ...solar, backgroundColor: clr.bg }}>
          <ET value={s.title} onChange={(title) => set({ title })} locale={locale} tag="h2" className="text-xl md:text-[26px] font-semibold text-left" style={{ color: clr.primary }} />
          <div className="flex flex-col md:flex-row gap-6 md:gap-[80px]">
            <ET value={s.columnLeft} onChange={(columnLeft) => set({ columnLeft })} locale={locale} className="flex-1 text-sm md:text-base font-semibold text-left" style={{ color: clr.primary }} multiline />
            <ET value={s.columnRight} onChange={(columnRight) => set({ columnRight })} locale={locale} className="flex-1 text-sm md:text-base font-semibold text-left" style={{ color: clr.primary }} multiline />
          </div>
        </section>
      );

    case 'steps':
      return (
        <section className="px-6 py-6 md:px-[60px] md:py-[90px] flex flex-col md:flex-row gap-6 md:gap-[80px]" style={{ ...solar, backgroundColor: clr.bg }}>
          <div className="hidden md:block md:w-1/2" />
          <div className="md:w-1/2 space-y-8 md:space-y-20">
            {s.steps.map((step, i) => (
              <div key={i} className="space-y-4 md:space-y-[30px]">
                <ET value={step.label} onChange={(label) => { const steps = [...s.steps]; steps[i] = { ...step, label }; set({ steps }); }} locale={locale} className="text-6xl md:text-[90px] font-semibold leading-none" style={{ color: clr.primary }} />
                <ET value={step.body} onChange={(body) => { const steps = [...s.steps]; steps[i] = { ...step, body }; set({ steps }); }} locale={locale} className="text-sm md:text-base font-semibold" style={{ color: clr.primary }} multiline />
              </div>
            ))}
          </div>
        </section>
      );

    case 'image-with-text':
      return (
        <section className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 p-6 md:p-[60px]" style={{ ...solar, backgroundColor: s.backgroundColor || clr.accent2 }}>
          <EI value={s.image} onChange={(image) => set({ image })} className="w-full md:w-[438px] h-[354px] md:h-[529px]" />
          <div className="md:max-w-[485px] space-y-4 md:space-y-6">
            <ET value={s.title} onChange={(title) => set({ title })} locale={locale} tag="h2" className="text-xl md:text-[26px] font-semibold" style={{ color: clr.primary }} />
            <ET value={s.body} onChange={(body) => set({ body })} locale={locale} className="text-base md:text-xl font-semibold" style={{ color: clr.primary }} multiline />
          </div>
        </section>
      );

    case 'contact-form':
      return (
        <section className="px-6 py-6 md:px-[60px] md:py-[90px] flex flex-col md:flex-row gap-6 md:gap-[80px]" style={{ ...solar, backgroundColor: clr.bg }}>
          <div className="md:w-1/2 shrink-0"><ET value={s.title} onChange={(title) => set({ title })} locale={locale} tag="h2" className="text-4xl md:text-5xl font-semibold" style={{ color: clr.primary }} /></div>
          <div className="md:w-1/2 space-y-12">
            <ContactFormClient />
            <div className="space-y-[18px]">
              {[{ k: 'phone' as const, l: 'Phone' }, { k: 'email' as const, l: 'e-mail' }, { k: 'socialLinks' as const, l: 'socials' }].map(({ k, l }) => (
                <div key={k}><div className="h-px bg-black/10" /><div className="flex gap-2 py-3"><span className="w-1/2 text-base font-semibold uppercase tracking-[0.05em]">{l}</span><ET value={s[k]} onChange={(v) => set({ [k]: v })} locale={locale} className="w-1/2 text-base font-semibold uppercase tracking-[0.05em] opacity-50" multiline /></div></div>
              ))}
              <div className="h-px bg-black/10" />
            </div>
          </div>
        </section>
      );

    default:
      return <div className="p-8 text-center text-gray-400">Unknown section type: {(s as any).type}</div>;
  }
}
