'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useT } from '@/lib/i18n/useT';
import { useOrderItems } from '@/contexts/OrderItemsContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useState } from 'react';

interface NavLabels {
  en: Record<string, string>;
  fr: Record<string, string>;
}

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileMenu({ open, onClose }: MobileMenuProps) {
  const { T, locale } = useT();
  const { orderCount, volumeCount, cakeCount } = useOrderItems();
  const [navLabels, setNavLabels] = useState<NavLabels | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.navLabels) setNavLabels(data.navLabels);
      })
      .catch(() => {});
  }, []);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const label = (key: string, fallback: string) => {
    const override = navLabels?.[locale as 'en' | 'fr']?.[key];
    return override || fallback;
  };

  const navFont = {
    fontFamily: 'var(--font-diatype-mono)',
    fontWeight: 500 as const,
    color: '#333112',
  };

  const menuItems = [
    { href: '/order', label: label('order', T.nav.order), count: orderCount },
    { href: '/volume-order', label: label('volumeOrder', T.nav.volumeOrder), count: volumeCount },
    { href: '/cake-order', label: label('cakeOrder', T.nav.cakeOrder), count: cakeCount },
    { href: '/about', label: label('about', T.nav.about), count: 0 },
  ];

  return (
    <div
      className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ease-out ${
        open
          ? 'opacity-100 pointer-events-auto'
          : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-white" />

      {/* Content */}
      <nav
        className="relative flex flex-col justify-center items-center h-full px-6"
        style={navFont}
        aria-label="Mobile navigation"
      >
        <ul className="flex flex-col items-center gap-8">
          {menuItems.map((item, i) => (
            <li
              key={item.href}
              className={`transition-all duration-300 ${
                open
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: open ? `${100 + i * 60}ms` : '0ms' }}
            >
              <Link
                href={item.href}
                onClick={onClose}
                className="text-[18px] tracking-[0.04em] uppercase hover:opacity-50 transition-opacity flex items-center gap-2"
              >
                {item.label}
                {item.count > 0 && (
                  <span className="text-[13px] opacity-40">({item.count})</span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* Language switcher at bottom */}
        <div
          className={`absolute bottom-12 transition-all duration-300 ${
            open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: open ? '400ms' : '0ms' }}
        >
          <LanguageSwitcher />
        </div>
      </nav>
    </div>
  );
}
