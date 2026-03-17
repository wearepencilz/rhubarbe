import { getSettings } from '@/lib/db';

export default async function PhotoPanels() {
  const settings = await getSettings().catch(() => ({}));
  const photos = (settings as any)?.home?.photos || {};
  const photo1: string = photos.photo1 || '';
  const photo2: string = photos.photo2 || '';

  return (
    <section className="flex flex-col md:flex-row gap-3 md:gap-4 px-4 md:px-8 py-12 md:py-16">
      <div className="w-full md:flex-none md:w-[680px] h-[400px] md:h-[863px] bg-[#dad5bb] overflow-hidden">
        {photo1 && <img src={photo1} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="w-full md:flex-none md:w-[681px] h-[320px] md:h-[721px] bg-[#dad5bb] overflow-hidden md:self-start">
        {photo2 && <img src={photo2} alt="" className="w-full h-full object-cover" />}
      </div>
    </section>
  );
}
