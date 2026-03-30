'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import SiteNav from '@/components/SiteNav';
import MobileMenu from '@/components/MobileMenu';

interface SiteHeaderClientProps {
  logo: string;
  companyName: string;
}

export default function SiteHeaderClient({ logo, companyName }: SiteHeaderClientProps) {
  const [visible, setVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
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
        } else if (y > lastScrollY.current && !menuOpen) {
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
  }, [menuOpen]);

  // Keep header visible while menu is open
  useEffect(() => {
    if (menuOpen) setVisible(true);
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-white transition-transform duration-300 ${
          visible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-4 md:px-8 h-14 md:h-16">
          {/* Logo */}
          <Link href="/" aria-label={`${companyName} home`} onClick={closeMenu}>
            {logo ? (
              <img
                src={logo}
                alt={companyName}
                className="h-[32px] md:h-[36px] w-auto object-contain"
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

          {/* Desktop nav */}
          <div className="hidden md:block">
            <SiteNav />
          </div>

          {/* Mobile hamburger / X */}
          <button
            className="md:hidden relative w-8 h-8 flex items-center justify-center"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="transition-transform duration-300"
              style={{ transform: menuOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              {menuOpen ? (
                <>
                  <line x1="4" y1="4" x2="16" y2="16" stroke="#333112" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="16" y1="4" x2="4" y2="16" stroke="#333112" strokeWidth="1.5" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <line x1="2" y1="5" x2="18" y2="5" stroke="#333112" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="2" y1="10" x2="18" y2="10" stroke="#333112" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="2" y1="15" x2="18" y2="15" stroke="#333112" strokeWidth="1.5" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Full-screen mobile menu */}
      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </>
  );
}
