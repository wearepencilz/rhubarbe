'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useOrderItems } from '@/contexts/OrderItemsContext';
import { useCart } from '@/contexts/CartContext';
import SiteNav from '@/components/SiteNav';
import MobileMenu from '@/components/MobileMenu';

import LanguageSwitcher from '@/components/LanguageSwitcher';

interface SiteHeaderClientProps {
  logo: string;
  companyName: string;
}

export default function SiteHeaderClient({ logo, companyName }: SiteHeaderClientProps) {
  const [visible, setVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const pathname = usePathname();
  const { orderCount, volumeCount, cakeCount } = useOrderItems();
  const { cart } = useCart();

  let currentCount = 0;
  if (pathname?.startsWith('/order')) currentCount = orderCount;
  else if (pathname?.startsWith('/catering')) currentCount = volumeCount;
  else if (pathname?.startsWith('/cake')) currentCount = cakeCount;
  else currentCount = cart?.lines.edges.reduce((sum, e) => sum + e.node.quantity, 0) ?? 0;
  const hasCartItems = currentCount > 0;

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

  useEffect(() => {
    if (menuOpen) setVisible(true);
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-[#FCFBF6] transition-transform duration-300 ${
          visible ? 'translate-y-0' : '-translate-y-full'
        } ${hasCartItems ? 'pr-[60px]' : ''}`}
      >
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-4 md:px-8 h-14 md:h-16">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link href="/" aria-label={`${companyName} home`} onClick={closeMenu}>
              {logo ? (
                <img
                  src={logo}
                  alt={companyName}
                  className="h-[24px] w-auto object-contain"
                />
              ) : (
                <span
                  className="text-[16px] lowercase"
                  style={{ fontFamily: 'var(--font-solar-display)', color: '#1A3821' }}
                >
                  {companyName}
                </span>
              )}
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:block">
              <SiteNav />
            </div>
          </div>

          {/* Right: Address + Hours (desktop) */}
          <div className="hidden md:flex items-center text-[16px] lowercase" style={{ fontFamily: 'var(--font-solar-display)', color: '#1A3821' }}>
            <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#B1CB00' }} />
            <span>1320 rue charlevoix</span>
            <span className="mx-2">|</span>
            <span>9h-12h</span>
            <span className="mx-2">|</span>
            <LanguageSwitcher color="#1A3821" />
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
                  <line x1="4" y1="4" x2="16" y2="16" stroke="#1A3821" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="16" y1="4" x2="4" y2="16" stroke="#1A3821" strokeWidth="1.5" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <line x1="2" y1="5" x2="18" y2="5" stroke="#1A3821" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="2" y1="10" x2="18" y2="10" stroke="#1A3821" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="2" y1="15" x2="18" y2="15" stroke="#1A3821" strokeWidth="1.5" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </>
  );
}
