import SiteHeader from '@/components/SiteHeader';
import ComeSeeUs from '@/components/home/ComeSeeUs';

export const metadata = {
  title: 'Come See Us – Rhubarbe',
  description: 'Visit Rhubarbe in Montreal.',
};

export default function VisitPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader theme="dark" />
      <ComeSeeUs />
    </main>
  );
}
