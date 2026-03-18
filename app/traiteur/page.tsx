import RequestForm from '@/components/RequestForm';
import { db } from '@/lib/db';

export const metadata = {
  title: 'Traiteur / Catering – Rhubarbe',
  description: "Service traiteur pour tous types d'événements.",
};

export default async function TraiteurPage() {
  const pages = await db.read('pages.json').catch(() => ({})) || {};
  const content = (pages as any)?.traiteur || {};
  return <RequestForm type="traiteur" content={content} />;
}
