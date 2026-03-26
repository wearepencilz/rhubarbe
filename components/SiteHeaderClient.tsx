'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import SiteNav from '@/components/SiteNav';

interface SiteHeaderClientProps {
  logo: string;
  companyName: string;
}

export default function SiteHeaderClient({ logo, companyName }: SiteHeaderClientProps) {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < 10) {
          setVisible(true);
        } else if (y > lastScrollY.current) {
          setVisible(false);
        } else {
          setVisible(true);
        }
        lastScrollY.current = y;
        ticking.current = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-transform duration-300 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="max-w-[1600px] mx-auto flex items-center justify-between px-4 md:px-8 h-14 md:h-16">
        {/* Logo */}
        <Link href="/" aria-label={`${companyName} home`}>
          {logo ? (
            <img
              src={logo}
              alt={companyName}
              className="h-[22px] md:h-[27px] w-auto object-contain"
            />
          ) : (
            <span
              className="text-sm tracking-widest uppercase"
              style={{ fontFamily: 'var(--font-neue-montreal)', fontWeight: 500, color: '#333112' }}
            >
              {companyName}
            </span>
          )}
        </Link>

        {/* Nav */}
        <SiteNav />
      </div>
    </header>
  );
}
