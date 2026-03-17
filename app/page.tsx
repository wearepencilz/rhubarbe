import SiteHeader from '@/components/SiteHeader';
import FlavourStrip from '@/components/home/FlavourStrip';
import StorySection from '@/components/home/StorySection';
import AboutSection from '@/components/home/AboutSection';
import EditorialColumns from '@/components/home/EditorialColumns';
import ArchiveSection from '@/components/home/ArchiveSection';
import PhotoPanels from '@/components/home/PhotoPanels';
import SiteFooter from '@/components/home/SiteFooter';

export default function HomePage() {
  return (
    <main className="bg-white min-h-screen">
      <SiteHeader />

      {/* Hero + flavour strip */}
      <section className="relative w-full bg-white pt-[80px] md:pt-[120px]">
        {/* Tagline */}
        <p
          className="absolute top-[24px] md:top-[33px] left-1/2 -translate-x-1/2 text-[#333112] text-[12px] md:text-[14px] leading-[18px] tracking-[0.42px] whitespace-pre-line text-left"
          style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 400 }}
        >
          {'Handcraft soft serve \nmediterranean gelato,'}
        </p>

        <FlavourStrip />
      </section>

      <StorySection />
      <AboutSection />
      <EditorialColumns />
      <ArchiveSection />
      <PhotoPanels />
      <SiteFooter />
    </main>
  );
}
