import PageRenderer from '@/components/sections/PageRenderer';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Merci – Rhubarbe' };

export default async function ThankYouPage() {
  return (
    <main className="bg-white min-h-screen">
      <PageRenderer pageName="thank-you" />
    </main>
  );
}
