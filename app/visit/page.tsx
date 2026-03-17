import SiteHeader from '@/components/SiteHeader';
import ComeSeeUs from '@/components/home/ComeSeeUs';

export const metadata = {
  title: 'Come See Us – Janine',
  description: 'Visit Janine in Montreal. Thu / Fri / Sat, 13H–20H. 2455 Notre Dame, Montreal, QC.',
};

export default function VisitPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader theme="dark" />
      <ComeSeeUs />
    </main>
  );
}
