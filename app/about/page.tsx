import * as settingsQueries from '@/lib/db/queries/settings';
import AboutPageClient from './AboutPageClient';

export const metadata = {
  title: 'About – Rhubarbe',
  description: 'The story of Patisserie Rhubarbe, Montreal.',
};

const EN_DEFAULTS = {
  heading: 'about us',
  intro: 'Pâtisserie Rhubarbe opened modestly in October 2010.',
  body: `<p>Stéphanie Labelle believed there was a gap in Montreal for a boutique pastry shop where you could find fresh products every day, made with good seasonal ingredients. She decided to go for it and open in a charming space on rue De Lanaudière, after 8 years of experience in boutique pastry and restaurant work.</p>
<p>Julien Joré, a chef with over 20 years of experience, has been helping Stéphanie since the bakery opened. He has been part of the story from the very beginning, but officially became a partner during the expansion. The move to avenue Laurier in May 2017 allowed Comptoir Rhubarbe to open alongside the shop.</p>
<p>Since then, the rhubarbe boutique has changed its model and moved on July 13, 2025.</p>
<p>Find us at our new location on Saturdays between 9am and 12pm to pick up orders placed in advance on our website.</p>`,
  address: '1320 rue Charlevoix, Pointe Saint-Charles, Montreal',
  signoff: 'team rhubarbe x',
};

export default async function AboutPage() {
  const settings = await settingsQueries.getAll().catch(() => ({}));
  const raw = (settings as any)?.about ?? {};

  let en: Record<string, string>;
  let fr: Record<string, string>;

  if (raw.en || raw.fr) {
    en = { ...EN_DEFAULTS, ...raw.en };
    fr = raw.fr ?? {};
  } else {
    // Legacy flat format — treat as EN
    en = { ...EN_DEFAULTS, ...raw };
    fr = {};
  }

  return <AboutPageClient en={en} fr={fr} />;
}
