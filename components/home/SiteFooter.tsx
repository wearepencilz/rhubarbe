import * as settingsQueries from '@/lib/db/queries/settings';

export default async function SiteFooter() {
  const settings = await settingsQueries.getAll().catch(() => ({})) as any;
  const logo: string = settings?.logo || '';

  return (
    <footer className="mt-[400px] pb-8 px-4 md:px-8">
      <div className="flex justify-end">
        {logo ? (
          <img src={logo} alt="Rhubarbe" className="h-[72px] w-auto object-contain" />
        ) : (
          <span className="text-[24px]" style={{ fontFamily: 'var(--font-solar-display)', color: '#1A3821' }}>
            Rhubarbe
          </span>
        )}
      </div>
    </footer>
  );
}
