import PageRenderer from '@/components/sections/PageRenderer';
import * as settingsQuery from '@/lib/db/queries/settings';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const setting = await settingsQuery.getByKey('homePage').catch(() => null);
  const pageName = (setting?.value as string) || 'home';

  return (
    <main className="bg-white min-h-screen">
      <PageRenderer pageName={pageName} />
    </main>
  );
}
