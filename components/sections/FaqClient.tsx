'use client';

import { useState } from 'react';

export default function FaqClient({ items, defaultOpen = false }: { items: { q: string; a: string }[]; defaultOpen?: boolean }) {
  const [openIdx, setOpenIdx] = useState<number | null>(defaultOpen ? 0 : null);

  return (
    <div>
      {items.map((item, i) => {
        const isOpen = openIdx === i;
        return (
          <div key={i}>
            <div className="h-px bg-black" />
            <button
              onClick={() => setOpenIdx(isOpen ? null : i)}
              className="flex items-center justify-between w-full py-7 text-left"
            >
              <span className="text-lg font-semibold" style={{ color: '#1A3821', maxWidth: 447 }}>{item.q}</span>
              <span className="text-xl font-semibold" style={{ color: '#1A3821' }}>{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && item.a && (
              <p className="pb-7 text-base font-semibold whitespace-pre-line" style={{ color: 'rgba(26,56,33,0.7)', maxWidth: 569 }}>
                {item.a}
              </p>
            )}
          </div>
        );
      })}
      <div className="h-px bg-black" />
    </div>
  );
}
