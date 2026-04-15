'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useOrderItems } from '@/contexts/OrderItemsContext';
import { useCart } from '@/contexts/CartContext';
import { useCartDrawer } from '@/contexts/CartDrawerContext';
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
  const { orderCount, volumeCount, cakeCount } = useOrderItems();
  const { cart } = useCart();
  const { openCart } = useCartDrawer();

  const shopifyCount = cart?.lines.edges.reduce((sum, e) => sum + e.node.quantity, 0) ?? 0;
  const totalCount = shopifyCount + orderCount + volumeCount + cakeCount;

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
        }`}
      >
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-4 md:px-8 h-14 md:h-16">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <Link href="/" aria-label={`${companyName} home`} onClick={closeMenu}>
              {logo ? (
                <img src={logo} alt={companyName} className="h-[24px] w-auto object-contain" />
              ) : (
                <span className="text-[16px] lowercase" style={{ fontFamily: 'var(--font-solar-display)', color: '#1A3821' }}>
                  {companyName}
                </span>
              )}
            </Link>
            <div className="hidden md:block">
              <SiteNav />
            </div>
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center gap-4 text-[16px] lowercase" style={{ fontFamily: 'var(--font-solar-display)', color: '#1A3821' }}>
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#B1CB00' }} />
            <span>1320 rue charlevoix</span>
            <span>|</span>
            <span>9h-12h</span>
            <span>|</span>
            <LanguageSwitcher color="#1A3821" />
            <span>|</span>
            <button
              onClick={() => openCart()}
              className="hover:opacity-70 transition-opacity"
              aria-label={`Open cart${totalCount > 0 ? ` (${totalCount} items)` : ''}`}
            >
              cart{totalCount > 0 && <sup style={{ fontSize: 11, marginLeft: 1 }}>({totalCount})</sup>}
            </button>
          </div>

          {/* Mobile: cart + menu text links */}
          <div className="md:hidden flex items-center gap-4 text-[14px] lowercase" style={{ fontFamily: 'var(--font-solar-display)', color: '#1A3821' }}>
            <button
              onClick={() => openCart()}
              className="hover:opacity-50 transition-opacity"
              aria-label={`Open cart${totalCount > 0 ? ` (${totalCount} items)` : ''}`}
            >
              cart{totalCount > 0 && <sup style={{ fontSize: 10, marginLeft: 1 }}>({totalCount})</sup>}
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="hover:opacity-50 transition-opacity"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? 'close' : 'menu'}
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={closeMenu} />
    </>
  );
}
