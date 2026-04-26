import PageRenderer from '@/components/sections/PageRenderer';
import { notFound } from 'next/navigation';
import * as pageQueries from '@/lib/db/queries/pages';

export const dynamic = 'force-dynamic';

export default async function ComposedPage({ params }: { params: { slug: string } }) {
  const page = await pageQueries.getByName(params.slug).catch(() => null);
  if (!page || !(page.content as any)?.sections?.length) notFound();

  return (
    <main className="min-h-screen bg-white">
      <PageRenderer pageName={params.slug} />
    </main>
  );
}
