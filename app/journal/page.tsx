import * as journalQuery from '@/lib/db/queries/journal';
import * as pageQueries from '@/lib/db/queries/pages';
import PageRenderer from '@/components/sections/PageRenderer';
import JournalPageClient from './JournalPageClient';

export const metadata = {
  title: 'Journal – Rhubarbe',
  description: 'Un journal saisonnier de moments, d\'ingrédients et de personnes.',
};

export default async function JournalPage() {
  // If a section-based page exists for 'journal', use it
  const page = await pageQueries.getByName('journal').catch(() => null);
  if ((page?.content as any)?.sections?.length) {
    return <main className="min-h-screen bg-white"><PageRenderer pageName="journal" /></main>;
  }

  // Fallback to the original journal listing
  const all = await journalQuery.list().catch(() => []) as any[];
  const entries = all.filter((s) => s.status === 'published');
  return <JournalPageClient entries={entries} />;
}
