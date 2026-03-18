import RequestForm from '@/components/RequestForm';
import { db } from '@/lib/db';

export const metadata = {
  title: "Gâteaux signatures / Signature Cakes – Rhubarbe",
  description: "Gâteaux signatures pour mariages et occasions spéciales.",
};

export default async function GateauxSignaturesPage() {
  const pages = await db.read('pages.json').catch(() => ({})) || {};
  const content = (pages as any)?.gateaux || {};
  return <RequestForm type="gateaux" content={content} />;
}
