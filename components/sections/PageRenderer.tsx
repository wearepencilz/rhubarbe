import { type Section, localize, isValidSectionType } from '@/lib/types/sections';
import { typeStyle } from '@/lib/design/tokens';
import { getLocale } from '@/lib/i18n/server';
import * as journalQuery from '@/lib/db/queries/journal';
import * as recipesQuery from '@/lib/db/queries/recipes';
import * as faqQueries from '@/lib/db/queries/faqs';
import * as pageQueries from '@/lib/db/queries/pages';
import ContactFormClient from './ContactFormClient';
import FaqClient from './FaqClient';

import ImageCarouselClient from './ImageCarouselClient';

function t(field: { en: string; fr: string }, locale = 'fr') {
  return localize(field, locale as 'en' | 'fr');
}

const clr = { primary: 'var(--color-text-primary, #1A3821)', bg: 'var(--color-bg-light, #F7F6F3)', accent1: 'var(--color-accent-1, #D49BCB)', accent2: 'var(--color-accent-2, #CB9EC9)' };
// ts = typeStyle shorthand with color
const ts = (token: string) => ({ ...typeStyle(token), color: clr.primary });

export default async function PageRenderer({ pageName, locale: localeProp }: { pageName: string; locale?: string }) {
  const locale = localeProp || await getLocale();
  const page = await pageQueries.getByName(pageName).catch(() => null);
  const sections: Section[] = (page?.content as any)?.sections ?? [];
  if (!sections.length) return null;
  return <div>{sections.map((s) => isValidSectionType(s.type) ? <SectionRenderer key={s.id} section={s} locale={locale} /> : null)}</div>;
}

export async function SectionRenderer({ section: s, locale }: { section: Section; locale: string }) {
  switch (s.type) {
    case 'faq-simple': return <FaqSimple s={s} l={locale} />;
    case 'faq-grouped': return <FaqGrouped s={s} l={locale} />;
    case 'image-carousel': return <ImageCarousel s={s} l={locale} />;
    case 'image-2up': return <Image2Up s={s} />;
    case 'image-hero': return <ImageHero s={s} />;
    case 'image-with-icons': return <ImageWithIcons s={s} />;
    case 'content-brief': return <ContentBrief s={s} l={locale} />;
    case 'content-journal': return <ContentJournal s={s} l={locale} />;
    case 'content-2up': return <Content2Up s={s} l={locale} />;
    case 'heading-articles': return <HeadingArticles s={s} l={locale} />;
    case 'heading-page': return <HeadingPage s={s} l={locale} />;
    case 'heading-content': return <HeadingContent s={s} l={locale} />;
    case 'quote': return <QuoteSection s={s} l={locale} />;
    case 'text': return <TextBlock s={s} l={locale} />;
    case 'instructions': return <InstructionsBlock s={s} l={locale} />;
    case 'two-column-text': return <TwoColumnText s={s} l={locale} />;
    case 'steps': return <StepsBlock s={s} l={locale} />;
    case 'image-with-text': return <ImageWithText s={s} l={locale} />;
    case 'contact-form': return <ContactForm s={s} l={locale} />;
    default: return null;
  }
}

// ── FAQ ────────────────────────────────────────────────────
async function FaqSimple({ s, l }: { s: Extract<Section, { type: 'faq-simple' }>; l: string }) {
  const dbItems = s.topic ? await faqQueries.listByTopic(s.topic).catch(() => []) : [];
  const items = dbItems.length > 0
    ? dbItems.map((f: any) => ({ q: t(f.question, l), a: t(f.answer, l) }))
    : s.items.map((i) => ({ q: t(i.question, l), a: t(i.answer, l) }));
  return (
    <section className="px-6 py-6 md:px-[60px] md:py-[90px] flex flex-col md:flex-row gap-6 md:gap-[80px]" style={{ backgroundColor: clr.accent1 }}>
      <div className="md:w-1/2 shrink-0"><h2 style={ts('display-lg')}>{t(s.title, l)}</h2></div>
      <div className="md:w-1/2"><FaqClient items={items} defaultOpen={false} /></div>
    </section>
  );
}

async function FaqGrouped({ s, l }: { s: Extract<Section, { type: 'faq-grouped' }>; l: string }) {
  const topicGroups = s.topics?.length
    ? await Promise.all(s.topics.map(async (topic) => {
        const items = await faqQueries.listByTopic(topic).catch(() => []);
        return { heading: topic, items: items.map((f: any) => ({ q: t(f.question, l), a: t(f.answer, l) })) };
      }))
    : s.groups.map((g) => ({ heading: t(g.heading, l), items: g.items.map((i) => ({ q: t(i.question, l), a: t(i.answer, l) })) }));
  return (
    <section className="px-6 py-6 md:px-[60px] md:py-[90px] flex flex-col md:flex-row gap-6 md:gap-[80px]" style={{ backgroundColor: clr.bg }}>
      <div className="md:w-1/2 shrink-0"><h2 style={ts('display-lg')}>{t(s.title, l)}</h2></div>
      <div className="md:w-1/2 space-y-6 md:space-y-[108px]">
        {topicGroups.map((g, i) => (
          <div key={i} className="space-y-8">
            <h3 style={ts('heading-md')}>{g.heading}</h3>
            <FaqClient items={g.items} defaultOpen={false} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Image ──────────────────────────────────────────────────
function ImageCarousel({ s, l }: { s: Extract<Section, { type: 'image-carousel' }>; l: string }) {
  const images = s.images.filter((img) => img.url).map((img) => ({ url: img.url, alt: t(img.alt, l), caption: img.caption ? t(img.caption, l) : undefined }));
  return <ImageCarouselClient images={images} title={t(s.title, l)} description={t(s.description, l)} />;
}

function Image2Up({ s }: { s: Extract<Section, { type: 'image-2up' }> }) {
  return (
    <section className="flex flex-col md:flex-row gap-6 md:gap-8 p-6 md:p-[60px]" style={{ backgroundColor: clr.bg }}>
      {s.images.map((img, i) => img.url && <img key={i} src={img.url} alt={img.alt.en} className="w-full md:flex-1 h-[442px] md:h-[805px] object-cover" />)}
    </section>
  );
}

function ImageHero({ s }: { s: Extract<Section, { type: 'image-hero' }> }) {
  return s.image.url ? <img src={s.image.url} alt={s.image.alt.en} className="w-full h-[500px] md:h-[828px] object-cover" /> : null;
}

function ImageWithIcons({ s }: { s: Extract<Section, { type: 'image-with-icons' }> }) {
  return (
    <section className="relative w-full h-[500px] md:h-[816px]">
      {s.backgroundImage.url && <img src={s.backgroundImage.url} alt={s.backgroundImage.alt.en} className="absolute inset-0 w-full h-full object-cover" />}
      {s.overlayImage.url && <img src={s.overlayImage.url} alt={s.overlayImage.alt.en} className="absolute bottom-8 left-4 md:top-[359px] md:left-[171px] w-[140px] md:w-[307px] h-auto" />}
    </section>
  );
}

// ── Dynamic Content ────────────────────────────────────────
async function ContentBrief({ s, l }: { s: Extract<Section, { type: 'content-brief' }>; l: string }) {
  return (
    <section className="flex flex-col md:flex-row gap-6 md:gap-8 p-6 md:p-[60px]" style={{ backgroundColor: clr.bg }}>
      {s.items.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col gap-4 md:gap-8">
          {item.image.url && <img src={item.image.url} alt={t(item.image.alt, l)} className="w-full h-[442px] md:h-[522px] object-cover" />}
          <div className="space-y-2 md:space-y-4">
            <p style={ts('heading-xs')}>{t(item.label, l)}</p>
            <p style={ts('body-md')}>{t(item.body, l)}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

async function ContentJournal({ s, l }: { s: Extract<Section, { type: 'content-journal' }>; l: string }) {
  const q = s.source === 'recipes' ? recipesQuery : journalQuery;
  const entries = await q.listPublished(s.maxEntries).catch(() => []);
  if (!entries.length) return <section className="p-6 md:p-[60px] text-center text-gray-400">No journal entries yet.</section>;
  return (
    <section className="flex flex-col md:flex-row gap-6 md:gap-8 p-6 md:p-[60px]" style={{ backgroundColor: clr.bg }}>
      {entries.map((e: any) => {
        const title = typeof e.title === 'object' ? t(e.title, l) : e.title || '';
        return (
          <div key={e.id} className="flex-1 flex flex-col gap-4 md:gap-8">
            {e.coverImage && <img src={e.coverImage} alt={title} className="w-full h-[442px] md:h-[522px] object-cover" />}
            <div className="space-y-2 md:space-y-4">
              <div style={ts('body-xs')} className="flex items-center gap-2"><span>{e.category || 'journal'} |</span><span>{e.publishedAt ? new Date(e.publishedAt).toLocaleDateString('fr-CA') : ''}</span></div>
              <h3 style={ts('display-sm')}>{title}</h3>
            </div>
          </div>
        );
      })}
    </section>
  );
}

async function Content2Up({ s, l }: { s: Extract<Section, { type: 'content-2up' }>; l: string }) {
  const q = s.source === 'recipes' ? recipesQuery : journalQuery;
  const entries = await q.listPublished(s.maxEntries).catch(() => []);
  if (!entries.length) return null;
  return (
    <section className="flex flex-col md:flex-row gap-6 md:gap-8 p-6 md:p-[60px]" style={{ backgroundColor: clr.bg }}>
      {entries.map((e: any) => {
        const title = typeof e.title === 'object' ? t(e.title, l) : e.title || '';
        return (
          <div key={e.id} className="flex-1 flex flex-col gap-4 md:gap-8">
            {e.coverImage && <img src={e.coverImage} alt={title} className="w-full h-[442px] md:flex-1 object-cover" />}
            <div className="flex justify-between"><span style={ts('heading-xs')}>{s.source}</span><h3 style={ts('display-md')}>{title}</h3></div>
          </div>
        );
      })}
    </section>
  );
}

// ── Heading ────────────────────────────────────────────────
function HeadingArticles({ s, l }: { s: Extract<Section, { type: 'heading-articles' }>; l: string }) {
  return (
    <section className="px-6 pt-20 pb-6 md:px-[60px] md:pt-[200px] md:pb-[60px] space-y-4 md:space-y-[9px]" style={{ backgroundColor: clr.bg }}>
      <h2 style={ts('display-lg')}>{t(s.title, l)}</h2>
      <div className="flex flex-col gap-1.5 w-[113px]">
        {s.tabs.map((tab, i) => <p key={i} style={{ ...ts('heading-md'), opacity: i === 0 ? 1 : 0.4 }}>{t(tab.label, l)}</p>)}
      </div>
    </section>
  );
}

function HeadingPage({ s, l }: { s: Extract<Section, { type: 'heading-page' }>; l: string }) {
  return (
    <section className="px-6 pt-20 pb-6 md:px-[60px] md:pt-[200px] md:pb-[60px]" style={{ backgroundColor: clr.bg }}>
      <h1 style={ts('display-lg')}>{t(s.title, l)}</h1>
    </section>
  );
}

function HeadingContent({ s, l }: { s: Extract<Section, { type: 'heading-content' }>; l: string }) {
  return (
    <section className="px-6 pt-20 pb-6 md:px-[60px] md:pt-[200px] md:pb-[60px] flex flex-wrap gap-2 md:gap-[9px]" style={{ backgroundColor: clr.bg }}>
      <div className="space-y-2 md:space-y-[9px]">
        <h1 style={ts('display-lg')}>{t(s.title, l)}</h1>
        <div className="flex items-center gap-2"><span style={ts('body-xs')}>{t(s.category, l)} |</span><span style={ts('body-xs')}>{s.date}</span></div>
      </div>
    </section>
  );
}

// ── Text ───────────────────────────────────────────────────
function QuoteSection({ s, l }: { s: Extract<Section, { type: 'quote' }>; l: string }) {
  return (
    <section className="px-6 py-6 md:px-[60px] md:py-[90px] flex flex-col md:flex-row gap-6 md:gap-[80px]" style={{ backgroundColor: clr.bg }}>
      <div className="hidden md:block md:w-1/2" />
      <div className="md:w-1/2"><p style={ts('display-sm')}>&ldquo;{t(s.text, l)}&rdquo;</p></div>
    </section>
  );
}

function TextBlock({ s, l }: { s: Extract<Section, { type: 'text' }>; l: string }) {
  return (
    <section className="px-6 py-6 md:px-[60px] md:py-[90px] flex flex-col md:flex-row gap-6 md:gap-[80px]" style={{ backgroundColor: clr.bg }}>
      <div className="hidden md:block md:w-1/2" />
      <div className="md:w-1/2 space-y-4 md:space-y-6">
        <h2 style={ts('heading-lg')}>{t(s.title, l)}</h2>
        <p style={ts('body-md')} className="whitespace-pre-line">{t(s.body, l)}</p>
      </div>
    </section>
  );
}

function InstructionsBlock({ s, l }: { s: Extract<Section, { type: 'instructions' }>; l: string }) {
  return (
    <section className="px-6 py-6 md:px-[60px] md:py-[90px] flex flex-col md:flex-row gap-6 md:gap-[80px]" style={{ backgroundColor: clr.bg }}>
      <div className="hidden md:block md:w-1/2" />
      <div className="md:w-1/2 space-y-4 md:space-y-6">
        <h2 style={ts('heading-lg')}>{t(s.title, l)}</h2>
        <div className="space-y-4 md:space-y-6">
          {s.steps.map((step, i) => <p key={i} style={ts('body-md')} className="whitespace-pre-line">{i + 1}. {t(step, l)}</p>)}
        </div>
      </div>
    </section>
  );
}

function TwoColumnText({ s, l }: { s: Extract<Section, { type: 'two-column-text' }>; l: string }) {
  return (
    <section className="px-6 py-6 md:px-[240px] md:py-[90px] space-y-4 md:space-y-6" style={{ backgroundColor: clr.bg }}>
      <h2 style={ts('heading-lg')}>{t(s.title, l)}</h2>
      <div className="flex flex-col md:flex-row gap-6 md:gap-[80px]">
        <p style={ts('body-md')} className="flex-1 whitespace-pre-line">{t(s.columnLeft, l)}</p>
        <p style={ts('body-md')} className="flex-1 whitespace-pre-line">{t(s.columnRight, l)}</p>
      </div>
    </section>
  );
}

function StepsBlock({ s, l }: { s: Extract<Section, { type: 'steps' }>; l: string }) {
  return (
    <section className="px-6 py-6 md:px-[60px] md:py-[90px] flex flex-col md:flex-row gap-6 md:gap-[80px]" style={{ backgroundColor: clr.bg }}>
      <div className="hidden md:block md:w-1/2" />
      <div className="md:w-1/2 space-y-8 md:space-y-20">
        {s.steps.map((step, i) => (
          <div key={i} className="space-y-4 md:space-y-[30px]">
            <p style={ts('display-xxl')}>{t(step.label, l)}</p>
            <p style={ts('body-md')}>{t(step.body, l)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Mixed ──────────────────────────────────────────────────
function ImageWithText({ s, l }: { s: Extract<Section, { type: 'image-with-text' }>; l: string }) {
  return (
    <section className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 p-6 md:p-[60px]" style={{ backgroundColor: s.backgroundColor || clr.accent2 }}>
      {s.image.url && <img src={s.image.url} alt={t(s.image.alt, l)} className="w-full md:w-[438px] h-[354px] md:h-[529px] object-cover" />}
      <div className="md:max-w-[485px] space-y-4 md:space-y-6">
        <h2 style={ts('heading-lg')}>{t(s.title, l)}</h2>
        <p style={ts('heading-xs')}>{t(s.body, l)}</p>
      </div>
    </section>
  );
}

function ContactForm({ s, l }: { s: Extract<Section, { type: 'contact-form' }>; l: string }) {
  return (
    <section className="px-6 py-6 md:px-[60px] md:py-[90px] flex flex-col md:flex-row gap-6 md:gap-[80px]" style={{ backgroundColor: clr.bg }}>
      <div className="md:w-1/2 shrink-0"><h2 style={ts('display-lg')}>{t(s.title, l)}</h2></div>
      <div className="md:w-1/2 space-y-12 md:space-y-[108px]">
        <ContactFormClient />
        <div className="space-y-[18px]">
          {[{ label: 'Phone', value: t(s.phone, l) }, { label: 'e-mail', value: t(s.email, l) }, { label: 'socials', value: t(s.socialLinks, l) }].map((row, i) => (
            <div key={i}>
              <div className="h-px bg-black/10" />
              <div className="flex gap-2 py-3">
                <span style={ts('body-md')} className="w-1/2">{row.label}</span>
                <span style={{ ...ts('body-md'), opacity: 0.5 }} className="w-1/2 whitespace-pre-line">{row.value}</span>
              </div>
            </div>
          ))}
          <div className="h-px bg-black/10" />
        </div>
      </div>
    </section>
  );
}
