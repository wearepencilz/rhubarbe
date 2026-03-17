import Link from 'next/link';
import Image from 'next/image';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/home/SiteFooter';
import { getLaunches, getFlavours } from '@/lib/db';

export const metadata = {
  title: 'Archive – Janine',
  description: 'All Janine launches — upcoming, active, and archived.',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function padNumber(n: number): string {
  return String(n).padStart(3, '0');
}

function LaunchCard({ launch, flavourMap }: { launch: any; flavourMap: Record<string, any> }) {
  const firstFlavourId = launch.featuredFlavourIds?.[0];
  const flavour = firstFlavourId ? flavourMap[firstFlavourId] : null;
  const image = launch.heroImage || flavour?.image || '';
  const bg = flavour?.colour || '#dad5bb';

  return (
    <Link
      href={`/launches/${launch.slug}`}
      className="group flex flex-col md:flex-row gap-6 py-8 border-b border-[#333112]/10 hover:opacity-70 transition-opacity"
    >
      {/* Thumbnail */}
      <div
        className="w-full md:w-[160px] h-[200px] md:h-[100px] shrink-0 overflow-hidden relative"
        style={{ backgroundColor: bg }}
      >
        {image && (
          <Image
            src={image}
            alt={launch.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col justify-center gap-2">
        <p
          className="text-[#333112]/50 text-[11px] tracking-[0.22px] uppercase"
          style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
        >
          {formatDate(launch.activeStart || launch.createdAt)}
        </p>
        <p
          className="text-[#333112] text-[22px] leading-none uppercase"
          style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 700 }}
        >
          {launch.title}
        </p>
        {launch.description && (
          <p
            className="text-[#333112]/60 text-[14px] leading-[1.5] max-w-md"
            style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 400 }}
          >
            {launch.description}
          </p>
        )}
      </div>
    </Link>
  );
}

function ArchiveRow({ entry, num }: { entry: any; num: string }) {
  return (
    <div>
      <div className="h-px bg-[#333112] opacity-20" />
      <Link
        href={`/launches/${entry.slug}`}
        className="flex items-center justify-between py-4 text-[14px] tracking-[0.28px] uppercase leading-none hover:opacity-60 transition-opacity"
        style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500, color: '#333112' }}
      >
        <span className="flex-1 pr-8">{entry.title}</span>
        <span className="whitespace-nowrap mr-8">{formatDate(entry.activeStart || entry.createdAt)}</span>
        <span className="whitespace-nowrap">{num}</span>
      </Link>
    </div>
  );
}

export default async function ArchivePage() {
  const [allLaunches, allFlavours] = await Promise.all([
    getLaunches().catch(() => []),
    getFlavours().catch(() => []),
  ]);

  const flavourMap = Object.fromEntries(
    (allFlavours as any[]).map((f: any) => [f.id, f])
  );

  const upcoming = (allLaunches as any[])
    .filter((l) => l.status === 'upcoming')
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));

  const active = (allLaunches as any[])
    .filter((l) => l.status === 'active')
    .sort((a, b) => new Date(b.activeStart || b.createdAt).getTime() - new Date(a.activeStart || a.createdAt).getTime());

  const archived = (allLaunches as any[])
    .filter((l) => l.status === 'archived')
    .sort((a, b) => new Date(b.activeStart || b.createdAt).getTime() - new Date(a.activeStart || a.createdAt).getTime());

  return (
    <main className="bg-white min-h-screen">
      <SiteHeader />

      <div className="px-4 md:px-8 pt-[100px] md:pt-[120px] pb-24">
        <p
          className="text-[#333112] text-[16px] tracking-[0.32px] mb-16"
          style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
        >
          [ARCHIVE]
        </p>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section className="mb-20">
            <p
              className="text-[#333112]/40 text-[11px] tracking-[0.22px] uppercase mb-8"
              style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
            >
              Upcoming
            </p>
            <div className="flex flex-col">
              {upcoming.map((launch) => (
                <LaunchCard key={launch.id} launch={launch} flavourMap={flavourMap} />
              ))}
            </div>
          </section>
        )}

        {/* Active */}
        {active.length > 0 && (
          <section className="mb-20">
            <p
              className="text-[#333112]/40 text-[11px] tracking-[0.22px] uppercase mb-8"
              style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
            >
              Now
            </p>
            <div className="flex flex-col">
              {active.map((launch) => (
                <LaunchCard key={launch.id} launch={launch} flavourMap={flavourMap} />
              ))}
            </div>
          </section>
        )}

        {/* Archived — list view */}
        <section>
          <p
            className="text-[#333112]/40 text-[11px] tracking-[0.22px] uppercase mb-8"
            style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
          >
            Past
          </p>
          {archived.length === 0 ? (
            <p
              className="py-8 text-[14px] tracking-[0.28px] text-[#333112] opacity-40 uppercase"
              style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
            >
              No archived launches yet.
            </p>
          ) : (
            <div className="flex flex-col">
              {archived.map((entry, i) => (
                <ArchiveRow key={entry.id} entry={entry} num={padNumber(archived.length - i)} />
              ))}
              <div className="h-px bg-[#333112] opacity-20" />
            </div>
          )}
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
