export default function HeroSection() {
  return (
    <section className="relative w-full min-h-screen bg-white flex flex-col justify-end pb-0">
      {/* Tagline — top area */}
      <div
        className="absolute top-[33px] left-1/2 -translate-x-1/2 text-[#333112] text-[14px] leading-[18px] tracking-[0.42px] whitespace-pre-line"
        style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 400 }}
      >
        {'Handcraft soft serve \nmediterranean gelato,'}
      </div>
    </section>
  );
}
