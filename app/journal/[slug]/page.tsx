import { notFound } from 'next/navigation';
import { type Section, isValidSectionType } from '@/lib/types/sections';
import { getLocale } from '@/lib/i18n/server';
import * as journalQuery from '@/lib/db/queries/journal';
import { SectionRenderer } from '@/components/sections/PageRenderer';

export default async function JournalEntryPage({ params }: { params: { slug: string } }) {
  const story = await journalQuery.getByIdOrSlug(params.slug).catch(() => null);
  if (!story || story.status !== 'published') notFound();

  const locale = await getLocale();
  const content = (story.content || {}) as { sections?: Section[] };
  const sections = (content.sections || []).filter((s) => isValidSectionType(s.type));

  if (!sections.length) notFound();

  return (
    <main className="min-h-screen bg-white">
      {sections.map((s) => (
        <SectionRenderer key={s.id} section={s} locale={locale} />
      ))}
    </main>
  );
}
