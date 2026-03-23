import * as settingsQueries from '@/lib/db/queries/settings';
import { HeroTagline } from './HeroTagline';

export default async function HeroSection() {
  const settings = await settingsQueries.getAll().catch(() => ({})) as any;
  const hero = settings?.home?.hero || {};
  const taglineFr = hero.taglineFr || 'Crème glacée artisanale \net gelato méditerranéen,';
  const taglineEn = hero.taglineEn || 'Handcraft soft serve \nmediterranean gelato,';

  return (
    <section className="relative w-full min-h-screen bg-white flex flex-col justify-end pb-0">
      <HeroTagline fr={taglineFr} en={taglineEn} />
    </section>
  );
}
