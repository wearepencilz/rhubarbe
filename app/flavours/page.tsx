import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/home/SiteFooter';
import { getLaunches, getFlavours, getIngredients, getModifiers } from '@/lib/db';

export const metadata = {
  title: 'Flavours – Janine',
  description: 'All Janine flavours, ingredients, and modifiers.',
};

export default async function FlavoursPage() {
  const [allLaunches, allFlavours, allIngredients, allModifiers] = await Promise.all([
    getLaunches().catch(() => []),
    getFlavours().catch(() => []),
    getIngredients().catch(() => []),
    getModifiers().catch(() => []),
  ]);

  const ingredientMap = Object.fromEntries(
    (allIngredients as any[]).map((i: any) => [i.id, i])
  );

  // Only show active/archived launches with flavours
  const launches = (allLaunches as any[])
    .filter((l) => l.status !== 'upcoming' && l.featuredFlavourIds?.length > 0)
    .sort((a, b) => new Date(b.activeStart || b.createdAt).getTime() - new Date(a.activeStart || a.createdAt).getTime());

  const flavourMap = Object.fromEntries(
    (allFlavours as any[]).map((f: any) => [f.id, f])
  );

  // Flavours not tied to any launch
  const launchFlavourIds = new Set(launches.flatMap((l: any) => l.featuredFlavourIds || []));
  const standaloneFlavours = (allFlavours as any[]).filter((f) => !launchFlavourIds.has(f.id) && f.status === 'active');

  const activeModifiers = (allModifiers as any[]).filter((m) => m.status === 'active');

  return (
    <main className="bg-white min-h-screen">
      <SiteHeader />

      <div className="px-4 md:px-8 pt-[100px] md:pt-[120px] pb-24">
        <p
          className="text-[#333112] text-[16px] tracking-[0.32px] mb-16"
          style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
        >
          [FLAVOURS]
        </p>

        {/* Launches + their flavours */}
        {launches.map((launch: any) => {
          const flavours = (launch.featuredFlavourIds || [])
            .map((id: string) => flavourMap[id])
            .filter(Boolean);

          return (
            <section key={launch.id} className="mb-20">
              {/* Launch header */}
              <div className="flex items-baseline justify-between mb-8 border-b border-[#333112]/10 pb-4">
                <Link
                  href={`/launches/${launch.slug}`}
                  className="text-[#333112] text-[28px] md:text-[36px] leading-none uppercase hover:opacity-60 transition-opacity"
                  style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 700 }}
                >
                  {launch.title}
                </Link>
                <span
                  className="text-[#333112]/40 text-[11px] tracking-[0.22px] uppercase ml-4 shrink-0"
                  style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
                >
                  {launch.status === 'active' ? 'Now' : launch.activeStart
                    ? new Date(launch.activeStart).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
                    : '—'}
                </span>
              </div>

              {/* Flavour cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#333112]/10">
                {flavours.map((flavour: any) => (
                  <FlavourCard key={flavour.id} flavour={flavour} ingredientMap={ingredientMap} />
                ))}
              </div>
            </section>
          );
        })}

        {/* Standalone flavours */}
        {standaloneFlavours.length > 0 && (
          <section className="mb-20">
            <p
              className="text-[#333112]/40 text-[11px] tracking-[0.22px] uppercase mb-8 border-b border-[#333112]/10 pb-4"
              style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
            >
              Other Flavours
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#333112]/10">
              {standaloneFlavours.map((flavour: any) => (
                <FlavourCard key={flavour.id} flavour={flavour} ingredientMap={ingredientMap} />
              ))}
            </div>
          </section>
        )}

        {/* Modifiers */}
        {activeModifiers.length > 0 && (
          <section className="mb-20">
            <p
              className="text-[#333112] text-[16px] tracking-[0.32px] mb-8 border-b border-[#333112]/10 pb-4"
              style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
            >
              [MODIFIERS]
            </p>
            <div className="flex flex-col">
              {activeModifiers.map((mod: any, i: number) => (
                <div key={mod.id}>
                  <div className="h-px bg-[#333112] opacity-10" />
                  <div className="flex items-center justify-between py-4 gap-4">
                    <div className="flex flex-col gap-1">
                      <p
                        className="text-[#333112] text-[16px] uppercase leading-none"
                        style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 600 }}
                      >
                        {mod.name}
                      </p>
                      {mod.description && (
                        <p
                          className="text-[#333112]/50 text-[13px] leading-[1.4]"
                          style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 400 }}
                        >
                          {mod.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      {mod.type && (
                        <span
                          className="text-[#333112]/40 text-[11px] tracking-[0.22px] uppercase"
                          style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
                        >
                          {mod.type}
                        </span>
                      )}
                      {mod.price > 0 && (
                        <span
                          className="text-[#333112] text-[13px] tracking-[0.26px]"
                          style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
                        >
                          +${mod.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div className="h-px bg-[#333112] opacity-10" />
            </div>
          </section>
        )}

        {/* Ingredients glossary */}
        {(allIngredients as any[]).length > 0 && (
          <section>
            <p
              className="text-[#333112] text-[16px] tracking-[0.32px] mb-8 border-b border-[#333112]/10 pb-4"
              style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
            >
              [INGREDIENTS]
            </p>
            <div className="flex flex-col">
              {(allIngredients as any[])
                .filter((i) => i.status !== 'archived')
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((ing: any) => (
                  <div key={ing.id}>
                    <div className="h-px bg-[#333112] opacity-10" />
                    <div className="flex items-start justify-between py-4 gap-4">
                      <div className="flex flex-col gap-1">
                        <p
                          className="text-[#333112] text-[16px] uppercase leading-none"
                          style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 600 }}
                        >
                          {ing.name}
                          {ing.latinName && (
                            <span
                              className="ml-3 text-[#333112]/30 text-[12px] normal-case italic"
                              style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 400 }}
                            >
                              {ing.latinName}
                            </span>
                          )}
                        </p>
                        {ing.description && (
                          <p
                            className="text-[#333112]/50 text-[13px] leading-[1.4] max-w-lg"
                            style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 400 }}
                          >
                            {ing.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {ing.origin && (
                          <span
                            className="text-[#333112]/40 text-[11px] tracking-[0.22px] uppercase"
                            style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
                          >
                            {ing.origin}
                          </span>
                        )}
                        {ing.category && (
                          <span
                            className="text-[#333112]/30 text-[11px] tracking-[0.22px] uppercase"
                            style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
                          >
                            {ing.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              <div className="h-px bg-[#333112] opacity-10" />
            </div>
          </section>
        )}
      </div>

      <SiteFooter />
    </main>
  );
}

function FlavourCard({ flavour, ingredientMap }: { flavour: any; ingredientMap: Record<string, any> }) {
  const resolvedIngredients = (flavour.ingredients || [])
    .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map((i: any) => ingredientMap[i.ingredientId] || { name: i.ingredientId.replace(/-/g, ' ') });

  return (
    <div className="bg-white p-6 md:p-8">
      {/* Colour + name */}
      <div className="flex items-center gap-4 mb-5">
        <div
          className="w-8 h-8 rounded-full shrink-0"
          style={{ backgroundColor: flavour.colour || '#dad5bb' }}
        />
        <div>
          <p
            className="text-[#333112] text-[20px] leading-none uppercase"
            style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 700 }}
          >
            {flavour.name}
          </p>
          <p
            className="text-[#333112]/40 text-[11px] tracking-[0.22px] uppercase mt-1"
            style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
          >
            {[flavour.type, flavour.baseStyle].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      {flavour.description && (
        <p
          className="text-[#333112]/70 text-[14px] leading-[1.6] mb-5"
          style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 400 }}
        >
          {flavour.description}
        </p>
      )}

      {/* Key notes */}
      {flavour.keyNotes?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {flavour.keyNotes.map((note: string) => (
            <span
              key={note}
              className="px-2 py-1 border border-[#333112]/15 text-[#333112]/50 text-[10px] tracking-[0.2px] uppercase"
              style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
            >
              {note}
            </span>
          ))}
        </div>
      )}

      {/* Ingredients */}
      {resolvedIngredients.length > 0 && (
        <div>
          <p
            className="text-[#333112]/30 text-[10px] tracking-[0.2px] uppercase mb-2"
            style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
          >
            Ingredients
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {resolvedIngredients.map((ing: any, idx: number) => (
              <span
                key={idx}
                className="text-[#333112] text-[12px] tracking-[0.24px] uppercase"
                style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
              >
                {ing.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
