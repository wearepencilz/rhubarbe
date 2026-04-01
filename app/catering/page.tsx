import VolumeOrderPageClient from './VolumeOrderPageClient';
import * as pageQueries from '@/lib/db/queries/pages';

export const metadata = {
  title: 'Commande traiteur / Catering Order - Rhubarbe',
  description:
    'Commandez des produits artisanaux de Rhubarbe pour vos événements. Order artisanal catering products from Rhubarbe.',
};

export default async function CateringPage() {
  const page = await pageQueries.getByName('catering-order').catch(() => null);
  const cmsContent = (page?.content as any) ?? {};
  return <VolumeOrderPageClient cmsContent={cmsContent} />;
}
