'use client';

import { useState } from 'react';

interface CarouselImage {
  url: string;
  alt: string;
  caption?: string;
}

export default function ImageCarouselClient({ images, title, description }: { images: CarouselImage[]; title: string; description: string }) {
  const [active, setActive] = useState(0);
  if (!images.length) return null;

  const main = images[active] || images[0];
  const thumbnails = images.filter((_, i) => i !== active);

  return (
    <section className="px-6 py-6 md:px-[60px] md:py-[90px] flex flex-col md:flex-row md:justify-center md:items-center gap-6 md:gap-20" style={{ backgroundColor: 'var(--color-bg-light, #F7F6F3)' }}>
      <div className="flex-1 space-y-4 md:space-y-7">
        {title && <h2 className="text-[28px] font-semibold" style={{ color: 'var(--color-text-primary, #1A3821)', fontFamily: 'var(--font-solar-display)' }}>{title}</h2>}
        {description && <p className="text-xl font-semibold" style={{ color: 'var(--color-text-primary, #1A3821)', fontFamily: 'var(--font-solar-display)' }}>{description}</p>}
      </div>
      <div className="flex flex-col md:flex-row gap-2 flex-1">
        {/* Main image */}
        <div className="flex-1 order-first md:order-last">
          <img src={main.url} alt={main.alt} className="w-full aspect-[4/3] md:aspect-auto md:h-full object-cover transition-opacity duration-300" />
          {main.caption && <p className="mt-1 text-xs text-gray-500">{main.caption}</p>}
        </div>
        {/* Thumbnails */}
        {thumbnails.length > 0 && (
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible md:w-[97px]">
            {images.map((img, i) => i !== active && (
              <button key={i} onClick={() => setActive(i)} className="relative shrink-0 w-24 md:w-full group">
                <img src={img.url} alt={img.alt} className="w-full h-20 md:h-[116px] object-cover opacity-50 hover:opacity-80 transition-opacity" />
                <span className="absolute bottom-1 left-1 text-xs text-white/70 font-medium" style={{ fontFamily: 'var(--font-solar-display)' }}>{String(i + 1).padStart(2, '0')}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
