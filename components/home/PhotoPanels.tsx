import Image from 'next/image';
import * as settingsQueries from '@/lib/db/queries/settings';

export default async function PhotoPanels() {
  const settings = await settingsQueries.getAll().catch(() => ({}));
  const photos = (settings as any)?.home?.photos || {};
  const photo1: string = photos.photo1 || '';
  const photo2: string = photos.photo2 || '';

  return (
    <section className="flex flex-col md:flex-row gap-3 md:gap-4 px-4 md:px-8 py-12 md:py-16">
      <div className="w-full md:flex-none md:w-[680px] h-[400px] md:h-[863px] bg-[#dad5bb] overflow-hidden relative">
        {photo1 && <Image src={photo1} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 680px" priority />}
      </div>
      <div className="w-full md:flex-none md:w-[681px] h-[320px] md:h-[721px] bg-[#dad5bb] overflow-hidden md:self-start relative">
        {photo2 && <Image src={photo2} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 681px" priority />}
      </div>
    </section>
  );
}
