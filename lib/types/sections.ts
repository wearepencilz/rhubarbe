// ── Shared primitives ──────────────────────────────────────

export interface Bilingual {
  en: string;
  fr: string;
}

export interface SectionImage {
  url: string;
  alt: Bilingual;
  caption?: Bilingual;
}

// ── Section type literals ──────────────────────────────────

export const SECTION_TYPES = [
  'faq-simple',
  'faq-grouped',
  'image-carousel',
  'image-2up',
  'image-hero',
  'image-with-icons',
  'content-brief',
  'content-journal',
  'content-2up',
  'heading-articles',
  'heading-page',
  'heading-content',
  'quote',
  'text',
  'instructions',
  'two-column-text',
  'steps',
  'image-with-text',
  'contact-form',
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

// ── Section base ───────────────────────────────────────────

interface SectionBase {
  id: string;
  type: SectionType;
}

// ── FAQ ────────────────────────────────────────────────────

export interface FaqSimpleSection extends SectionBase {
  type: 'faq-simple';
  title: Bilingual;
  topic: string; // references a FAQ topic — pulls all Q&As for this topic
  items: { question: Bilingual; answer: Bilingual }[]; // fallback inline items if no topic set
}

export interface FaqGroupedSection extends SectionBase {
  type: 'faq-grouped';
  title: Bilingual;
  topics: string[]; // list of FAQ topics to render as groups
  groups: { heading: Bilingual; items: { question: Bilingual; answer: Bilingual }[] }[]; // fallback
}

// ── Image ──────────────────────────────────────────────────

export interface ImageCarouselSection extends SectionBase {
  type: 'image-carousel';
  title: Bilingual;
  description: Bilingual;
  images: SectionImage[];
}

export interface Image2UpSection extends SectionBase {
  type: 'image-2up';
  images: [SectionImage, SectionImage];
}

export interface ImageHeroSection extends SectionBase {
  type: 'image-hero';
  image: SectionImage;
}

export interface ImageWithIconsSection extends SectionBase {
  type: 'image-with-icons';
  backgroundImage: SectionImage;
  overlayImage: SectionImage;
}

// ── Dynamic Content ────────────────────────────────────────

export interface ContentBriefSection extends SectionBase {
  type: 'content-brief';
  title: Bilingual;
  items: { image: SectionImage; label: Bilingual; body: Bilingual }[];
}

export interface ContentJournalSection extends SectionBase {
  type: 'content-journal';
  title: Bilingual;
  source: 'journal' | 'recipes';
  maxEntries: number;
}

export interface Content2UpSection extends SectionBase {
  type: 'content-2up';
  title: Bilingual;
  source: 'journal' | 'recipes';
  maxEntries: number;
}

// ── Heading ────────────────────────────────────────────────

export interface HeadingArticlesSection extends SectionBase {
  type: 'heading-articles';
  title: Bilingual;
  tabs: { label: Bilingual }[];
}

export interface HeadingPageSection extends SectionBase {
  type: 'heading-page';
  title: Bilingual;
}

export interface HeadingContentSection extends SectionBase {
  type: 'heading-content';
  title: Bilingual;
  category: Bilingual;
  date: string;
}

// ── Text ───────────────────────────────────────────────────

export interface QuoteSection extends SectionBase {
  type: 'quote';
  text: Bilingual;
}

export interface TextSection extends SectionBase {
  type: 'text';
  title: Bilingual;
  body: Bilingual;
}

export interface InstructionsSection extends SectionBase {
  type: 'instructions';
  title: Bilingual;
  steps: Bilingual[];
}

export interface TwoColumnTextSection extends SectionBase {
  type: 'two-column-text';
  title: Bilingual;
  columnLeft: Bilingual;
  columnRight: Bilingual;
}

export interface StepsSection extends SectionBase {
  type: 'steps';
  steps: { label: Bilingual; body: Bilingual }[];
}

// ── Mixed ──────────────────────────────────────────────────

export interface ImageWithTextSection extends SectionBase {
  type: 'image-with-text';
  image: SectionImage;
  title: Bilingual;
  body: Bilingual;
  backgroundColor: string;
}

export interface ContactFormSection extends SectionBase {
  type: 'contact-form';
  title: Bilingual;
  phone: Bilingual;
  email: Bilingual;
  socialLinks: Bilingual;
}

// ── Union ──────────────────────────────────────────────────

export type Section =
  | FaqSimpleSection
  | FaqGroupedSection
  | ImageCarouselSection
  | Image2UpSection
  | ImageHeroSection
  | ImageWithIconsSection
  | ContentBriefSection
  | ContentJournalSection
  | Content2UpSection
  | HeadingArticlesSection
  | HeadingPageSection
  | HeadingContentSection
  | QuoteSection
  | TextSection
  | InstructionsSection
  | TwoColumnTextSection
  | StepsSection
  | ImageWithTextSection
  | ContactFormSection;

// ── Category registry ──────────────────────────────────────

export const SECTION_CATEGORIES: Record<string, { types: SectionType[]; label: string }> = {
  faq: { label: 'FAQ', types: ['faq-simple', 'faq-grouped'] },
  image: { label: 'Image', types: ['image-carousel', 'image-2up', 'image-hero', 'image-with-icons'] },
  dynamic: { label: 'Dynamic Content', types: ['content-journal', 'content-brief', 'content-2up'] },
  heading: { label: 'Heading', types: ['heading-articles', 'heading-page', 'heading-content'] },
  text: { label: 'Text', types: ['quote', 'text', 'instructions', 'two-column-text', 'steps'] },
  mixed: { label: 'Mixed', types: ['image-with-text', 'contact-form'] },
};

export const SECTION_META: Record<SectionType, { label: string; icon: string; description: string }> = {
  'faq-simple': { label: 'FAQ Simple', icon: '❓', description: 'Accordion Q&A list' },
  'faq-grouped': { label: 'FAQ Grouped', icon: '❓', description: 'Q&A grouped by topic' },
  'image-carousel': { label: 'Image Carousel', icon: '🖼️', description: 'Title + numbered image grid' },
  'image-2up': { label: 'Image 2-Up', icon: '🖼️', description: 'Two side-by-side images' },
  'image-hero': { label: 'Image Hero', icon: '🖼️', description: 'Full-width hero image' },
  'image-with-icons': { label: 'Image with Icons', icon: '🖼️', description: 'Background image with SVG overlay' },
  'content-brief': { label: 'Content Brief', icon: '📄', description: 'Numbered content cards with images' },
  'content-journal': { label: 'Content Journal', icon: '📰', description: 'Latest journal entries (dynamic)' },
  'content-2up': { label: 'Content 2-Up', icon: '📰', description: 'Two content cards (dynamic)' },
  'heading-articles': { label: 'Heading Articles', icon: '📑', description: 'Title with category filter tabs' },
  'heading-page': { label: 'Heading Page', icon: '📑', description: 'Large right-aligned page title' },
  'heading-content': { label: 'Heading Content', icon: '📑', description: 'Title with category and date' },
  'quote': { label: 'Quote', icon: '💬', description: 'Pull quote in large typography' },
  'text': { label: 'Text', icon: '📝', description: 'Title and body paragraphs' },
  'instructions': { label: 'Instructions', icon: '📝', description: 'Numbered instruction steps' },
  'two-column-text': { label: 'Two Column Text', icon: '📝', description: 'Title with two text columns' },
  'steps': { label: 'Steps', icon: '📝', description: 'Large numbered steps' },
  'image-with-text': { label: 'Image with Text', icon: '🎨', description: 'Image + text on colored background' },
  'contact-form': { label: 'Contact Form', icon: '✉️', description: 'Contact form with info sidebar' },
};

// ── Helpers ─────────────────────────────────────────────────

const emptyBilingual = (): Bilingual => ({ en: '', fr: '' });
const emptyImage = (): SectionImage => ({ url: '', alt: emptyBilingual() });

let _counter = 0;
function genId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `s-${Date.now()}-${++_counter}`;
}

/** Create a new section with default empty fields */
export function createSection(type: SectionType): Section {
  const id = genId();
  switch (type) {
    case 'faq-simple':
      return { id, type, title: emptyBilingual(), topic: '', items: [] };
    case 'faq-grouped':
      return { id, type, title: emptyBilingual(), topics: [], groups: [] };
    case 'image-carousel':
      return { id, type, title: emptyBilingual(), description: emptyBilingual(), images: [emptyImage(), emptyImage(), emptyImage()] };
    case 'image-2up':
      return { id, type, images: [emptyImage(), emptyImage()] };
    case 'image-hero':
      return { id, type, image: emptyImage() };
    case 'image-with-icons':
      return { id, type, backgroundImage: emptyImage(), overlayImage: emptyImage() };
    case 'content-brief':
      return { id, type, title: emptyBilingual(), items: [{ image: emptyImage(), label: emptyBilingual(), body: emptyBilingual() }] };
    case 'content-journal':
      return { id, type, title: emptyBilingual(), source: 'journal', maxEntries: 3 };
    case 'content-2up':
      return { id, type, title: emptyBilingual(), source: 'journal', maxEntries: 2 };
    case 'heading-articles':
      return { id, type, title: emptyBilingual(), tabs: [{ label: emptyBilingual() }] };
    case 'heading-page':
      return { id, type, title: emptyBilingual() };
    case 'heading-content':
      return { id, type, title: emptyBilingual(), category: emptyBilingual(), date: '' };
    case 'quote':
      return { id, type, text: emptyBilingual() };
    case 'text':
      return { id, type, title: emptyBilingual(), body: emptyBilingual() };
    case 'instructions':
      return { id, type, title: emptyBilingual(), steps: [emptyBilingual()] };
    case 'two-column-text':
      return { id, type, title: emptyBilingual(), columnLeft: emptyBilingual(), columnRight: emptyBilingual() };
    case 'steps':
      return { id, type, steps: [{ label: emptyBilingual(), body: emptyBilingual() }] };
    case 'image-with-text':
      return { id, type, image: emptyImage(), title: emptyBilingual(), body: emptyBilingual(), backgroundColor: '#CB9EC9' };
    case 'contact-form':
      return { id, type, title: emptyBilingual(), phone: emptyBilingual(), email: emptyBilingual(), socialLinks: emptyBilingual() };
  }
}

/** Get the bilingual title/text summary for a section (for card headers) */
export function getSectionSummary(section: Section): string {
  switch (section.type) {
    case 'quote': return section.text.en || section.text.fr || '';
    case 'image-2up':
    case 'image-hero':
    case 'image-with-icons': return '';
    default: {
      const s = section as { title?: Bilingual };
      return s.title?.en || s.title?.fr || '';
    }
  }
}

/** Select the correct locale string from a Bilingual field */
export function localize(field: Bilingual, locale: 'en' | 'fr'): string {
  return field[locale] || field[locale === 'en' ? 'fr' : 'en'] || '';
}

/** Check if a type string is a valid SectionType */
export function isValidSectionType(type: string): type is SectionType {
  return (SECTION_TYPES as readonly string[]).includes(type);
}

/** Auto-linkify URLs in text, preserving existing <a> tags */
export function linkifyText(text: string): string {
  const URL_RE = /(https?:\/\/[^\s<]+)/g;
  const parts = text.split(/(<a\s[^>]*>.*?<\/a>)/gi);
  return parts.map((p) =>
    p.startsWith('<a') ? p : p.replace(URL_RE, '<a href="$1" target="_blank" rel="noopener noreferrer" class="underline">$1</a>')
  ).join('');
}
