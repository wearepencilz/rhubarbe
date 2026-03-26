import CateringPageClient from './CateringPageClient';
import * as pageQueries from '@/lib/db/queries/pages';

export const metadata = {
  title: 'Traiteur & Gâteaux / Catering & Cakes – Rhubarbe',
  description: "Service traiteur et gâteaux signatures pour tous types d'événements.",
};

export default async function CateringPage() {
  const traiteurPage = await pageQueries.getByName('traiteur').catch(() => null);
  const gateauxPage = await pageQueries.getByName('gateaux').catch(() => null);
  const traiteurContent = (traiteurPage?.content as any) ?? {};
  const gateauxContent = (gateauxPage?.content as any) ?? {};
  return <CateringPageClient traiteurContent={traiteurContent} gateauxContent={gateauxContent} />;
}
