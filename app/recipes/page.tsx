import * as pageQueries from '@/lib/db/queries/pages';
import PageRenderer from '@/components/sections/PageRenderer';

export const metadata = {
  title: 'Recipes – Rhubarbe',
  description: 'Recettes et contenu culinaire.',
};

export default async function RecipesPage() {
  const page = await pageQueries.getByName('recipes').catch(() => null);
  if ((page?.content as any)?.sections?.length) {
    return <main className="min-h-screen bg-white"><PageRenderer pageName="recipes" /></main>;
  }

  return (
    <main className="min-h-screen bg-white px-6 py-20 text-center" style={{ fontFamily: 'var(--font-solar-display)' }}>
      <h1 className="text-4xl font-semibold" style={{ color: '#1A3821' }}>Recipes</h1>
      <p className="mt-4 text-gray-500">Coming soon. Compose this page in the admin page builder.</p>
    </main>
  );
}
