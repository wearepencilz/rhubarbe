import PageRenderer from '@/components/sections/PageRenderer';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  return (
    <main className="bg-white min-h-screen">
      <PageRenderer pageName="home" />
    </main>
  );
}
