import PageRenderer from '@/components/sections/PageRenderer';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Contact – Rhubarbe' };

export default async function ContactPage() {
  return (
    <main className="bg-white min-h-screen">
      <PageRenderer pageName="contact" />
    </main>
  );
}
