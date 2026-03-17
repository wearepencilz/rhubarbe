import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/home/SiteFooter';

export default function HomePage() {
  return (
    <main className="bg-white min-h-screen">
      <SiteHeader />
      <SiteFooter />
    </main>
  );
}
