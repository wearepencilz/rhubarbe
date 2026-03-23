import * as pageQueries from '@/lib/db/queries/pages';
import fr from '@/lib/i18n/locales/fr';
import en from '@/lib/i18n/locales/en';
import ThankYouClient from './ThankYouClient';

export const metadata = {
  title: 'Merci / Thank You – Rhubarbe',
  description: 'Your order has been confirmed.',
};

export default async function ThankYouPage() {
  const page = await pageQueries.getByName('thank-you').catch(() => null);
  const raw = page?.content ?? {};

  // Page copy from CMS, order summary labels from i18n
  const enData = { ...en.thankYou, ...(raw as any).en };
  const frData = { ...fr.thankYou, ...(raw as any).fr };

  return <ThankYouClient en={enData} fr={frData} />;
}
