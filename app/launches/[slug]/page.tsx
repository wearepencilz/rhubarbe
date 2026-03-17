import { notFound } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/home/SiteFooter';
import { getLaunches, getFlavours, getProducts, getFormats } from '@/lib/db';

export async function generateStaticParams() {
  const launches = await getLaunches().catch(() => []);
  return (launches as any[]).map((l) => ({ slug: l.slug }));
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return '';
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
}

export default async function LaunchPage({ params }: { params: { slug: string } }) {
  const [launches, allFlavours, allProducts, allFormats] = await Promise.all([
    getLaunches().catch(() => []),
    getFlavours().catch(() => []),
    getProducts().catch(() => []),
    getFormats().catch(() => []),
  ]);

  const launch = (launches as any[]).find((l) => l.slug === params.slug);
  if (!launch) notFound();

  const flavours = (allFlavours as any[]).filter((f) =>
    launch.featuredFlavourIds?.includes(f.id)
  );
  const products = (allProducts as any[]).filter((p) =>
    launch.featuredProductIds?.includes(p.id)
  );
  const formatMap = Object.fromEntries((allFormats as any[]).map((f) => [f.id, f.name]));

  const dateRange = formatDateRange(launch.activeStart, launch.activeEnd);

  // Pick a background colour from the first flavour, or fall back to brand olive
  const heroBg = flavours[0]?.colour || '#948c22';

  return (
    <main className="bg-white min-h-screen">
      <SiteHeader theme="light" />

      {/* Hero */}
      <section
        className="relative w-full min-h-[50vh] md:min-h-[60vh] flex flex-col justify-end px-4 md:px-8 pb-10 md:pb-16 pt-[100px] md:pt-[120px]"
        style={{ backgroundColor: heroBg }}
      >
        {dateRange && (
          <p
            className="text-white/70 text-[13px] tracking-[0.26px] uppercase mb-3"
            style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
          >
            {dateRange}
          </p>
        )}
        <h1
          className="text-white text-[clamp(40px,7vw,96px)] leading-none tracking-tight uppercase"
          style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 700 }}
        >
          {launch.title}
        </h1>
        {launch.description && (
          <p
            className="mt-6 max-w-lg text-white/80 text-[16px] leading-[1.6]"
            style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 400 }}
          >
            {launch.description}
          </p>
        )}
      </section>

      {/* Flavours */}
      {flavours.length > 0 && (
        <section className="px-4 md:px-8 py-12 md:py-16 border-b border-[#333112]/10">
          <p
            className="text-[#333112] text-[13px] tracking-[0.26px] uppercase mb-10"
            style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
          >
            [FLAVOURS]
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#333112]/10">
            {flavours.map((flavour) => (
              <div key={flavour.id} className="bg-white p-8">
                {/* Colour swatch + name */}
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className="w-10 h-10 rounded-full flex-shrink-0"
                    style={{ backgroundColor: flavour.colour || '#dad5bb' }}
                  />
                  <div>
                    <p
                      className="text-[#333112] text-[22px] leading-none uppercase"
                      style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 700 }}
                    >
                      {flavour.name}
                    </p>
                    <p
                      className="text-[#333112]/50 text-[12px] tracking-[0.24px] uppercase mt-1"
                      style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
                    >
                      {flavour.type}
                    </p>
                  </div>
                </div>

                {flavour.description && (
                  <p
                    className="text-[#333112] text-[15px] leading-[1.6] mb-6"
                    style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 400 }}
                  >
                    {flavour.description}
                  </p>
                )}

                {/* Key notes */}
                {flavour.keyNotes?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {flavour.keyNotes.map((note: string) => (
                      <span
                        key={note}
                        className="px-3 py-1 border border-[#333112]/20 text-[#333112]/60 text-[11px] tracking-[0.22px] uppercase"
                        style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                )}

                {/* Ingredients */}
                {flavour.ingredients?.length > 0 && (
                  <div>
                    <p
                      className="text-[#333112]/40 text-[11px] tracking-[0.22px] uppercase mb-2"
                      style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
                    >
                      Ingredients
                    </p>
                    <p
                      className="text-[#333112] text-[13px] tracking-[0.26px] uppercase"
                      style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
                    >
                      {flavour.ingredients
                        .sort((a: any, b: any) => a.displayOrder - b.displayOrder)
                        .map((i: any) => i.ingredientId.replace(/-/g, ' '))
                        .join(', ')}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      {products.length > 0 && (
        <section className="px-4 md:px-8 py-12 md:py-16 border-b border-[#333112]/10">
          <p
            className="text-[#333112] text-[13px] tracking-[0.26px] uppercase mb-10"
            style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
          >
            [AVAILABLE AS]
          </p>
          <div className="flex flex-col">
            {products.map((product, i) => (
              <div key={product.id}>
                <div className="h-px bg-[#333112] opacity-10" />
                <div
                  className="flex items-center justify-between py-4 text-[14px] tracking-[0.28px] uppercase leading-none"
                  style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500, color: '#333112' }}
                >
                  <span className="flex-1">{product.publicName}</span>
                  <span className="text-[#333112]/40">
                    {formatMap[product.formatId] || product.formatId}
                  </span>
                </div>
              </div>
            ))}
            <div className="h-px bg-[#333112] opacity-10" />
          </div>
        </section>
      )}

      {/* Story / notes */}
      {launch.story && (
        <section className="px-4 md:px-8 py-12 md:py-16 max-w-2xl">
          <p
            className="text-[#333112] text-[13px] tracking-[0.26px] uppercase mb-6"
            style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
          >
            [NOTES]
          </p>
          <p
            className="text-[#333112] text-[18px] leading-[1.7]"
            style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 400 }}
          >
            {launch.story}
          </p>
        </section>
      )}

      <SiteFooter />
    </main>
  );
}
