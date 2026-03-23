import * as settingsQueries from '@/lib/db/queries/settings';
import SiteFooterClient from './SiteFooterClient';

interface FooterLocale {
  address?: string;
  hours?: string;
  contact?: string;
}

export default async function SiteFooter() {
  const settings = await settingsQueries.getAll().catch(() => ({})) as any;

  const companyName: string = settings?.companyName || 'Rhubarbe';
  const addressUrl: string = settings?.footer?.addressUrl || '';
  const instagram: string = settings?.footer?.instagram || '';

  // Footer CMS content — support { en, fr } shape
  const rawFooter = settings?.footer ?? {};
  let en: FooterLocale;
  let fr: FooterLocale;

  if (rawFooter.en || rawFooter.fr) {
    en = rawFooter.en ?? {};
    fr = rawFooter.fr ?? {};
  } else {
    // Legacy flat format — treat as EN
    en = {
      address: rawFooter.address,
      hours: rawFooter.hours,
      contact: rawFooter.contact,
    };
    fr = {};
  }

  return (
    <SiteFooterClient
      companyName={companyName}
      addressUrl={addressUrl}
      instagram={instagram}
      en={en}
      fr={fr}
    />
  );
}
