import * as settingsQueries from '@/lib/db/queries/settings';
import SiteFooterClient from './SiteFooterClient';

export default async function SiteFooter() {
  const settings = await settingsQueries.getAll().catch(() => ({})) as any;

  const logo: string = settings?.logo || '';
  const companyName: string = settings?.companyName || 'Rhubarbe';
  const raw = settings?.footer ?? {};

  const addressUrl: string = raw.addressUrl || '';
  const instagram: string = raw.instagram || '';

  // Support new { en, fr } shape and legacy flat shape
  let en: { address?: string; hours?: string; contact?: string };
  let fr: { address?: string; hours?: string; contact?: string };

  if (raw.en || raw.fr) {
    en = raw.en ?? {};
    fr = raw.fr ?? {};
  } else {
    // Legacy flat — treat as EN with hardcoded defaults
    en = {
      address: raw.address || '1320 rue Charlevoix, Pointe Saint-Charles, Montreal',
      hours: raw.hours || 'SAT 9AM – 12PM',
      contact: raw.contact || '',
    };
    fr = {};
  }

  return (
    <SiteFooterClient
      companyName={companyName}
      logo={logo}
      addressUrl={addressUrl}
      instagram={instagram}
      en={en}
      fr={fr}
    />
  );
}
