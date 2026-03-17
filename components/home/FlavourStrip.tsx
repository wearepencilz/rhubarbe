import Image from 'next/image';
import Link from 'next/link';
import { getLaunches, getFlavours } from '@/lib/db';

function formatDate(start: string | null, end: string | null): string {
  if (!start) return 'Coming Soon';
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const month = s.toLocaleDateString('en-US', { month: 'short' });
  const startDay = s.getDate();
  if (!e) return `${month} ${startDay}`;
  const endDay = e.getDate();
  return `${month} ${startDay} – ${endDay}`;
}

function LaunchCard({ launch, flavourMap }: { launch: any; flavourMap: Record<string, any> }) {
  const firstFlavourId = launch.featuredFlavourIds?.[0];
  const flavour = firstFlavourId ? flavourMap[firstFlavourId] : null;
  const image = launch.heroImage || flavour?.image || '';
  const type = flavour?.type || '';
  const dateLabel = formatDate(launch.activeStart, launch.activeEnd);
  const isUpcoming = launch.status === 'upcoming';

  return (
    <Link href={`/launches/${launch.slug}`} className="flex-none w-[140px] md:w-[178px] group">
      <div className="bg-[#f3f3f3] h-[186px] md:h-[236px] w-full overflow-hidden relative mb-3 md:mb-4">
        {image && <Image src={image} alt={launch.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />}
        {isUpcoming && (
          <div className="absolute top-2 left-2 bg-white/80 px-2 py-0.5 text-[10px] tracking-widest uppercase" style={{ fontFamily: 'var(--font-diatype-mono)' }}>
            Soon
          </div>
        )}
      </div>
      <div className="flex flex-col gap-[5px] md:gap-[6px] text-[#333112] text-[11px] md:text-[12px] tracking-[0.24px] uppercase leading-none" style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 500 }}>
        <div className="flex gap-[6px] flex-wrap">
          <span>{dateLabel}</span>
          {type && <><span>/</span><span>{type}</span></>}
        </div>
        <span>{launch.title}</span>
      </div>
    </Link>
  );
}

export default async function FlavourStrip() {
  const [allLaunches, allFlavours] = await Promise.all([
    getLaunches().catch(() => []),
    getFlavours().catch(() => []),
  ]);

  const flavourMap = Object.fromEntries(
    (allFlavours as any[]).map((f: any) => [f.id, f])
  );

  const archived = (allLaunches as any[])
    .filter((l) => l.status === 'archived')
    .sort((a, b) => new Date(a.activeStart || a.createdAt).getTime() - new Date(b.activeStart || b.createdAt).getTime());

  const active = (allLaunches as any[])
    .filter((l) => l.status === 'active')
    .sort((a, b) => new Date(a.activeStart || a.createdAt).getTime() - new Date(b.activeStart || b.createdAt).getTime());

  const upcoming = (allLaunches as any[])
    .filter((l) => l.status === 'upcoming')
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));

  return (
    <section className="w-full px-4 md:px-8 pt-[320px] md:pt-[420px] pb-12 md:pb-16">
      <div className="flex overflow-x-auto scrollbar-hide gap-3 md:gap-0">
        {/* Archived — oldest left */}
        <div className="flex gap-3 md:gap-4 shrink-0">
          {archived.map((launch) => <LaunchCard key={launch.id} launch={launch} flavourMap={flavourMap} />)}
        </div>

        {/* Active — middle with extra gap */}
        {active.length > 0 && (
          <>
            <div className="w-8 md:w-12 shrink-0" />
            <div className="flex gap-3 md:gap-4 shrink-0">
              {active.map((launch) => <LaunchCard key={launch.id} launch={launch} flavourMap={flavourMap} />)}
            </div>
          </>
        )}

        {/* Upcoming — far right with extra gap */}
        {upcoming.length > 0 && (
          <>
            <div className="w-8 md:w-12 shrink-0" />
            <div className="flex gap-3 md:gap-4 shrink-0">
              {upcoming.map((launch) => <LaunchCard key={launch.id} launch={launch} flavourMap={flavourMap} />)}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
