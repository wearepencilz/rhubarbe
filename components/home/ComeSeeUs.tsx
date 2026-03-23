import Image from 'next/image';
import * as settingsQueries from '@/lib/db/queries/settings';

export default async function ComeSeeUs() {
  const settings = await settingsQueries.getAll().catch(() => ({})) as any;
  const visit = settings?.visit || {};

  const message = visit.message || '<p>THU / FRI / SAT</p><p>13H – 20H <em>SOMETIMES LATER</em></p>';
  const address = visit.address || '<p>2455 Notre Dame,</p><p>Montreal, QC, H3J 1N6</p>';
  const addressUrl = visit.addressUrl || 'https://maps.app.goo.gl/3yU5y5Mnq4Bqf8bAA';
  const photo = visit.photo || '';

  return (
    <section
      id="visit"
      className="relative w-full min-h-screen flex flex-col md:flex-row"
      style={{ backgroundColor: '#948c22' }}
    >
      {/* Left: info panel */}
      <div className="flex flex-col justify-center px-6 md:px-16 pt-28 md:pt-24 pb-12 md:pb-24 relative z-10 gap-6 w-full md:flex-1">
        <div
          className="text-white text-[16px] md:text-[20px] tracking-[0.4px] uppercase leading-snug visit-content"
          style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
          dangerouslySetInnerHTML={{ __html: message }}
        />
        <a
          href={addressUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white text-[16px] md:text-[20px] tracking-[0.4px] uppercase leading-snug hover:opacity-70 transition-opacity visit-content"
          style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
          dangerouslySetInnerHTML={{ __html: address }}
        />
      </div>

      {/* Right: photo */}
      {photo && (
        <div className="w-full h-[50vw] md:h-auto md:w-1/2 relative overflow-hidden">
          <Image
            src={photo}
            alt="Janine storefront"
            fill
            className="object-cover object-center"
          />
        </div>
      )}

      <style>{`
        .visit-content p { margin: 0; }
        .visit-content p + p { margin-top: 0.15em; }
      `}</style>
    </section>
  );
}
