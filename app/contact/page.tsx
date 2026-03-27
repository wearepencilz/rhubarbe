import ContactPageClient from './ContactPageClient';
import * as pageQueries from '@/lib/db/queries/pages';

export const metadata = {
  title: 'Contact – Rhubarbe',
  description: "Contactez-nous pour le traiteur, les gâteaux signatures, ou toute autre demande. Contact us for catering, signature cakes, or any other inquiry.",
};

export default async function ContactPage() {
  const traiteurPage = await pageQueries.getByName('traiteur').catch(() => null);
  const gateauxPage = await pageQueries.getByName('gateaux').catch(() => null);
  const traiteurContent = (traiteurPage?.content as any) ?? {};
  const gateauxContent = (gateauxPage?.content as any) ?? {};
  return <ContactPageClient traiteurContent={traiteurContent} gateauxContent={gateauxContent} />;
}
