import { notFound } from 'next/navigation';
import { type Section, isValidSectionType } from '@/lib/types/sections';
import { getLocale } from '@/lib/i18n/server';
import * as recipesQuery from '@/lib/db/queries/recipes';
import { SectionRenderer } from '@/components/sections/PageRenderer';

export default async function RecipeEntryPage({ params }: { params: { slug: string } }) {
  const recipe = await recipesQuery.getByIdOrSlug(params.slug).catch(() => null);
  if (!recipe || recipe.status !== 'published') notFound();

  const locale = await getLocale();
  const content = (recipe.content || {}) as { sections?: Section[] };
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
