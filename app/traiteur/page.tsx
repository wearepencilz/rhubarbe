import RequestForm from '@/components/RequestForm';
import * as pageQueries from '@/lib/db/queries/pages';

export const metadata = {
  title: 'Traiteur / Catering – Rhubarbe',
  description: "Service traiteur pour tous types d'événements.",
};

export default async function TraiteurPage() {
  const page = await pageQueries.getByName('traiteur').catch(() => null);
  const content = (page?.content as any) ?? {};
  return <RequestForm type="traiteur" content={content} />;
}
