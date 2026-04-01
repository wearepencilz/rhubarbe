import CakeOrderPageClient from './CakeOrderPageClient';
import * as pageQueries from '@/lib/db/queries/pages';

export const metadata = {
  title: 'Commande de gâteau / Cake Order - Rhubarbe',
  description:
    'Commandez un gâteau sur mesure chez Rhubarbe. Order a custom cake from Rhubarbe.',
};

export default async function CakeOrderPage() {
  const page = await pageQueries.getByName('cake-order').catch(() => null);
  const cmsContent = (page?.content as any) ?? {};
  return <CakeOrderPageClient cmsContent={cmsContent} />;
}
