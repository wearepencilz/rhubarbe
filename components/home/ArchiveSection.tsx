import Link from 'next/link';
import { getLaunches } from '@/lib/db';

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

function Row({ entry, num }: { entry: any; num: string }) {
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

export default async function ArchiveSection() {
  const allLaunches = await getLaunches().catch(() => []);

  const active = (allLaunches as any[])
    .filter((l) => l.status === 'active')
    .sort((a, b) => new Date(b.activeStart || b.createdAt).getTime() - new Date(a.activeStart || a.createdAt).getTime());

  const archived = (allLaunches as any[])
    .filter((l) => l.status === 'archived')
    .sort((a, b) => new Date(b.activeStart || b.createdAt).getTime() - new Date(a.activeStart || a.createdAt).getTime());

  return (
    <section id="archive" className="px-8 py-16">
      <p
        className="text-[#333112] text-[16px] tracking-[0.32px] mb-6"
        style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
      >
        [ARCHIVE]
      </p>

      {/* Active launches */}
      {active.length > 0 && (
        <div className="flex flex-col mb-10">
          {active.map((entry) => (
            <Row key={entry.id} entry={entry} num="NOW" />
          ))}
          <div className="h-px bg-[#333112] opacity-20" />
        </div>
      )}

      {/* Archived launches */}
      <div className="flex flex-col">
        {archived.length === 0 ? (
          <p
            className="py-8 text-[14px] tracking-[0.28px] text-[#333112] opacity-40 uppercase"
            style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
          >
            No archived launches yet.
          </p>
        ) : (
          archived.map((entry, i) => (
            <Row key={entry.id} entry={entry} num={padNumber(archived.length - i)} />
          ))
        )}
        <div className="h-px bg-[#333112] opacity-20" />
      </div>
    </section>
  );
}
