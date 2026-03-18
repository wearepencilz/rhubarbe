import { getStories as getStoriesFromDB } from '@/lib/db';
import StoriesPageClient from './StoriesPageClient';

export const metadata = {
  title: 'Récits / Stories – Rhubarbe',
  description: 'Une archive saisonnière de moments, d\'ingrédients et de personnes.',
};

export default async function StoriesPage() {
  const all = await getStoriesFromDB().catch(() => []) as any[];
  const stories = all.filter((s) => s.status === 'published');
  return <StoriesPageClient stories={stories} />;
}
