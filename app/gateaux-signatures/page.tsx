import RequestForm from '@/components/RequestForm';
import * as pageQueries from '@/lib/db/queries/pages';

export const metadata = {
  title: "Gâteaux signatures / Signature Cakes – Rhubarbe",
  description: "Gâteaux signatures pour mariages et occasions spéciales.",
};

export default async function GateauxSignaturesPage() {
  const page = await pageQueries.getByName('gateaux').catch(() => null);
  const content = (page?.content as any) ?? {};
  return <RequestForm type="gateaux" content={content} />;
}
