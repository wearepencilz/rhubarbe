import Image from 'next/image';
import * as settingsQueries from '@/lib/db/queries/settings';

export default async function AboutSection() {
  const settings = await settingsQueries.getAll().catch(() => ({}));
  const about = (settings as any)?.about || {};

  const bg: string = about.bg || '#948c22';
  const text: string = about.text || 'Handcraft soft serve mediterranean gelato, made with the heart and honesty.<br /><br />Local supplier and a research of insane flavour, so everyone can find a piece of their happy memory in each icy creation.';
  const image: string = about.image || '';

  return (
    <section className="relative w-full overflow-hidden" style={{ backgroundColor: bg }}>
      <div className="flex flex-col md:flex-row min-h-[500px] md:min-h-[854px]">
        {/* Text content */}
        <div className="relative z-10 flex flex-col justify-start md:justify-start px-6 md:px-[46px] pt-12 md:pt-[57px] pb-12 md:pb-16 w-full md:w-1/2 shrink-0">
          <div
            className="text-white text-[16px] md:text-[18px] leading-[22px] mb-8 [&_p]:mb-4 [&_p:last-child]:mb-0"
            style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 400 }}
            dangerouslySetInnerHTML={{ __html: text }}
          />
          <p
            className="text-white text-[16px] md:text-[18px] leading-[22px]"
            style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
          >
            [ ABOUT ]
          </p>
        </div>

        {/* Right image */}
        <div className="w-full md:w-1/2 h-[300px] md:h-auto overflow-hidden relative">
          {image ? (
            <Image src={image} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          ) : (
            <div className="w-full h-full opacity-60" style={{ backgroundColor: bg }} />
          )}
        </div>
      </div>
    </section>
  );
}
