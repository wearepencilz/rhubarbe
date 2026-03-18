import SiteFooter from '@/components/home/SiteFooter';

export const metadata = {
  title: 'Archive – Rhubarbe',
  description: 'Rhubarbe archive.',
};

export default function ArchivePage() {
  return (
    <main className="bg-white min-h-screen">
      <div className="px-4 md:px-8 pt-[100px] md:pt-[120px] pb-24">
        <p
          className="text-[#333112] text-[16px] tracking-[0.32px]"
          style={{ fontFamily: 'var(--font-diatype-mono)', fontWeight: 500 }}
        >
          [ARCHIVE]
        </p>
      </div>
    </main>
  );
}
