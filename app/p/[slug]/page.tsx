import PageRenderer from '@/components/sections/PageRenderer';
import { notFound } from 'next/navigation';
import * as pageQueries from '@/lib/db/queries/pages';

export const dynamic = 'force-dynamic';

export default async function ComposedPage({ params }: { params: { slug: string } }) {
  // Resolve by locale slug (e.g. "recettes" → recipes page)
  const page = await pageQueries.getBySlug(params.slug).catch(() => null);
  if (!page || !(page.content as any)?.sections?.length) notFound();

  return (
    <main className="min-h-screen bg-white">
      <PageRenderer pageName={page.pageName} />
    </main>
  );
}
