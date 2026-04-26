/**
 * Typography Token System — Consolidated Scale
 *
 * 25 canonical styles. Every text usage on the site maps to one of these.
 * Each token has desktop + mobile values. The admin Design page lets owners edit them.
 * CSS vars: --type-{name}-size, --type-{name}-line, --type-{name}-weight, etc.
 */

export interface TypeToken {
  name: string;
  label: string;
  category: 'display' | 'heading' | 'body' | 'caption';
  fontFamily: 'display' | 'body' | 'mono';
  desktop: { fontSize: number; lineHeight: number; fontWeight: number; letterSpacing?: string; textTransform?: string };
  mobile: { fontSize: number; lineHeight: number; fontWeight: number; letterSpacing?: string; textTransform?: string };
  usedIn: string[]; // every place this style is used
}

export const FONT_STACKS = {
  display: { key: 'display', label: 'Display (Solar Display)', default: 'var(--font-solar-display)', cssVar: '--type-font-display' },
  body: { key: 'body', label: 'Body (PP Neue Montreal)', default: 'var(--font-neue-montreal)', cssVar: '--type-font-body' },
  mono: { key: 'mono', label: 'Mono (ABC Diatype Mono)', default: 'var(--font-diatype-mono)', cssVar: '--type-font-mono' },
};

export const DEFAULT_TOKENS: TypeToken[] = [
  // ── Display Scale (large headings, hero text) ────────────
  { name: 'display-xxl', label: 'Display XXL', category: 'display', fontFamily: 'display',
    desktop: { fontSize: 90, lineHeight: 90, fontWeight: 600 },
    mobile: { fontSize: 60, lineHeight: 60, fontWeight: 600 },
    usedIn: ['Section builder: step numbers (01, 02, 03)'] },

  { name: 'display-xl', label: 'Display XL', category: 'display', fontFamily: 'body',
    desktop: { fontSize: 80, lineHeight: 76, fontWeight: 700 },
    mobile: { fontSize: 36, lineHeight: 34, fontWeight: 700 },
    usedIn: ['Journal hero title', 'Story cover title', 'Flavours page hero'] },

  { name: 'display-lg', label: 'Display LG', category: 'display', fontFamily: 'display',
    desktop: { fontSize: 48, lineHeight: 52, fontWeight: 600 },
    mobile: { fontSize: 36, lineHeight: 40, fontWeight: 600 },
    usedIn: ['Section title (FAQ, Contact Us, Headings)', 'Order page hero "Commander"'] },

  { name: 'display-md', label: 'Display MD', category: 'display', fontFamily: 'display',
    desktop: { fontSize: 40, lineHeight: 44, fontWeight: 600 },
    mobile: { fontSize: 28, lineHeight: 34, fontWeight: 600 },
    usedIn: ['Content 2-up card title', 'Story ingredient focus name'] },

  { name: 'display-sm', label: 'Display SM', category: 'display', fontFamily: 'display',
    desktop: { fontSize: 36, lineHeight: 44, fontWeight: 600 },
    mobile: { fontSize: 24, lineHeight: 32, fontWeight: 600 },
    usedIn: ['Section quote text', 'Featured story card title', 'Journal card title (32px)', 'Story inline blockquote'] },

  // ── Heading Scale ────────────────────────────────────────
  { name: 'heading-xl', label: 'Heading XL', category: 'heading', fontFamily: 'display',
    desktop: { fontSize: 28, lineHeight: 34, fontWeight: 600 },
    mobile: { fontSize: 22, lineHeight: 28, fontWeight: 600 },
    usedIn: ['Section subtitle (VISIT US, Image-with-text title)'] },

  { name: 'heading-lg', label: 'Heading LG', category: 'heading', fontFamily: 'display',
    desktop: { fontSize: 26, lineHeight: 32, fontWeight: 600 },
    mobile: { fontSize: 20, lineHeight: 26, fontWeight: 600 },
    usedIn: ['Text/Instructions section title', 'Two-column title'] },

  { name: 'heading-md', label: 'Heading MD', category: 'heading', fontFamily: 'display',
    desktop: { fontSize: 24, lineHeight: 30, fontWeight: 600 },
    mobile: { fontSize: 20, lineHeight: 26, fontWeight: 600 },
    usedIn: ['FAQ topic heading', 'Heading tabs', 'Order/Catering page title', 'Home hero title', 'Thank-you heading', 'Footer brand', 'About page heading'] },

  { name: 'heading-sm', label: 'Heading SM', category: 'heading', fontFamily: 'body',
    desktop: { fontSize: 22, lineHeight: 23, fontWeight: 700 },
    mobile: { fontSize: 18, lineHeight: 19, fontWeight: 700 },
    usedIn: ['Journal/story card title in grid'] },

  { name: 'heading-xs', label: 'Heading XS', category: 'heading', fontFamily: 'body',
    desktop: { fontSize: 20, lineHeight: 26, fontWeight: 600 },
    mobile: { fontSize: 16, lineHeight: 22, fontWeight: 600 },
    usedIn: ['Section body large text', 'Home section titles', 'Contact heading', 'Visit heading', 'Flavour name', 'Mobile nav links'] },

  // ── Body Scale ───────────────────────────────────────────
  { name: 'body-xl', label: 'Body XL', category: 'body', fontFamily: 'body',
    desktop: { fontSize: 18, lineHeight: 26, fontWeight: 500 },
    mobile: { fontSize: 16, lineHeight: 22, fontWeight: 500 },
    usedIn: ['FAQ question text', 'Cart panel title', 'Home about heading'] },

  { name: 'body-lg', label: 'Body LG', category: 'body', fontFamily: 'body',
    desktop: { fontSize: 17, lineHeight: 27, fontWeight: 400 },
    mobile: { fontSize: 15, lineHeight: 24, fontWeight: 400 },
    usedIn: ['Story body text', 'About page paragraphs', 'Page intro (19-21px clamp)'] },

  { name: 'body-md', label: 'Body MD', category: 'body', fontFamily: 'display',
    desktop: { fontSize: 16, lineHeight: 24, fontWeight: 600 },
    mobile: { fontSize: 14, lineHeight: 21, fontWeight: 600 },
    usedIn: ['Section body text', 'Nav links', 'Product title/price', 'Order product/price', 'Order sidebar title/total', 'Home body', 'Language toggle', 'Visit details', 'Flavour category', 'Contact form labels'] },

  { name: 'body-sm', label: 'Body SM', category: 'body', fontFamily: 'body',
    desktop: { fontSize: 15, lineHeight: 22, fontWeight: 400 },
    mobile: { fontSize: 14, lineHeight: 20, fontWeight: 400 },
    usedIn: ['Page subtitle', 'Thank-you body', 'Contact body', 'Home story body', 'Story ingredient value'] },

  { name: 'body-xs', label: 'Body XS', category: 'body', fontFamily: 'body',
    desktop: { fontSize: 14, lineHeight: 20, fontWeight: 400 },
    mobile: { fontSize: 13, lineHeight: 18, fontWeight: 400 },
    usedIn: ['Section meta (category|date)', 'Card excerpt', 'Button text', 'Input label', 'Cart item', 'Order sidebar item', 'Catering description', 'Home CTA', 'Footer address', 'Home tagline', 'Home editorial', 'Flavour detail', 'Mobile menu address'] },

  // ── Caption Scale (small text, labels, tags) ─────────────
  { name: 'caption-lg', label: 'Caption LG', category: 'caption', fontFamily: 'body',
    desktop: { fontSize: 13, lineHeight: 20, fontWeight: 400 },
    mobile: { fontSize: 12, lineHeight: 18, fontWeight: 400 },
    usedIn: ['Flavour description', 'Story card excerpt (13px)'] },

  { name: 'caption-md', label: 'Caption MD', category: 'caption', fontFamily: 'body',
    desktop: { fontSize: 12, lineHeight: 18, fontWeight: 500 },
    mobile: { fontSize: 11, lineHeight: 16, fontWeight: 500 },
    usedIn: ['Image caption/numbers', 'Helper text', 'Footer copyright', 'Order labels', 'Catering lead time', 'Flavour tags', 'Contact tabs'] },

  { name: 'caption-sm', label: 'Caption SM', category: 'caption', fontFamily: 'mono',
    desktop: { fontSize: 11, lineHeight: 14, fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase' },
    mobile: { fontSize: 10, lineHeight: 14, fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase' },
    usedIn: ['[STORIES] section markers', 'Meta text (dates, "Read →")', 'Order micro text', 'Home about label'] },

  { name: 'caption-xs', label: 'Caption XS', category: 'caption', fontFamily: 'mono',
    desktop: { fontSize: 10, lineHeight: 14, fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase' },
    mobile: { fontSize: 10, lineHeight: 14, fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase' },
    usedIn: ['Tags/badges', 'Story attribution ("Word by")', 'Share links', 'Ingredient labels'] },
];

/** Generate CSS custom properties from tokens */
export function tokensToCss(tokens: TypeToken[], fontOverrides?: Record<string, string>): string {
  const vars: string[] = [];

  // Font stack overrides — ONLY if admin explicitly set a value
  if (fontOverrides?.display) {
    vars.push(`--font-solar-display: ${fontOverrides.display}`);
    vars.push(`--type-font-display: ${fontOverrides.display}`);
  }
  if (fontOverrides?.body) {
    vars.push(`--font-neue-montreal: ${fontOverrides.body}`);
    vars.push(`--type-font-body: ${fontOverrides.body}`);
  }
  if (fontOverrides?.mono) {
    vars.push(`--font-diatype-mono: ${fontOverrides.mono}`);
    vars.push(`--type-font-mono: ${fontOverrides.mono}`);
  }

  for (const t of tokens) {
    const prefix = `--type-${t.name}`;
    const ff = FONT_STACKS[t.fontFamily]?.cssVar || '--type-font-display';
    vars.push(`${prefix}-font: var(${ff}, var(--font-solar-display))`);
    vars.push(`${prefix}-size: ${t.desktop.fontSize}px`);
    vars.push(`${prefix}-line: ${t.desktop.lineHeight}px`);
    vars.push(`${prefix}-weight: ${t.desktop.fontWeight}`);
    if (t.desktop.letterSpacing) vars.push(`${prefix}-spacing: ${t.desktop.letterSpacing}`);
    if (t.desktop.textTransform) vars.push(`${prefix}-transform: ${t.desktop.textTransform}`);
    vars.push(`${prefix}-size-mobile: ${t.mobile.fontSize}px`);
    vars.push(`${prefix}-line-mobile: ${t.mobile.lineHeight}px`);
    vars.push(`${prefix}-weight-mobile: ${t.mobile.fontWeight}`);
  }

  if (!vars.length) return '';
  // Mobile overrides via media query
  const mobileVars: string[] = [];
  for (const t of tokens) {
    const prefix = `--type-${t.name}`;
    mobileVars.push(`${prefix}-size: ${t.mobile.fontSize}px`);
    mobileVars.push(`${prefix}-line: ${t.mobile.lineHeight}px`);
    mobileVars.push(`${prefix}-weight: ${t.mobile.fontWeight}`);
  }
  return `:root { ${vars.join('; ')} } @media (max-width: 767px) { :root { ${mobileVars.join('; ')} } }`;
}

export const TOKEN_CATEGORIES = [
  { key: 'display', label: 'Display' },
  { key: 'heading', label: 'Heading' },
  { key: 'body', label: 'Body' },
  { key: 'caption', label: 'Caption' },
] as const;

/**
 * Returns inline style object for a token. Use on any element.
 * Reads from CSS vars so admin changes propagate automatically.
 */
export function typeStyle(token: string): React.CSSProperties {
  const p = `--type-${token}`;
  return {
    fontFamily: `var(${p}-font)`,
    fontSize: `var(${p}-size)`,
    lineHeight: `var(${p}-line)`,
    fontWeight: `var(${p}-weight)` as any,
    letterSpacing: `var(${p}-spacing, normal)`,
    textTransform: `var(${p}-transform, none)` as any,
  };
}
