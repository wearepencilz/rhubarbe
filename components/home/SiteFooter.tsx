export default function SiteFooter() {
  return (
    <footer className="px-6 py-16 md:px-[60px] md:pt-[120px] md:pb-[60px] flex flex-col gap-10 md:gap-[120px]" style={{ backgroundColor: 'var(--color-bg-light, #F7F6F3)' }}>
      <div className="flex flex-col gap-6 md:flex-row md:justify-between" style={{ fontFamily: 'var(--font-solar-display)', fontSize: 16, fontWeight: 600, color: '#1A3821' }}>
        <span className="whitespace-pre-line">{'1320 Charlevoix Street\nPointe Saint-Charles, Montreal'}</span>
        <span className="whitespace-pre-line">{'Order Pickups\nSaturday between 9am and 12pm'}</span>
        <a href="https://instagram.com/rhubarbe_mtl" target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity">@rhubarbe_mtl</a>
        <span className="whitespace-pre-line">{'514 316-2935\ninfo@rhubarbe.ca'}</span>
      </div>
      <img src="/images/footer-logo.svg" alt="Rhubarbe" className="w-full h-[60px] md:h-auto object-contain object-left" />
    </footer>
  );
}
