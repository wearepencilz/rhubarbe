'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileMenu({ open, onClose }: MobileMenuProps) {

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const menuStyle = {
    fontFamily: 'var(--font-solar-display)',
    color: '#1A3821',
  } as const;

  const items = [
    { href: '/order', label: 'menu' },
    { href: '/catering', label: 'catering' },
    { href: '/cake', label: 'cakes' },
    { href: '/stories', label: 'stories' },
  ];

  return (
    <div
      className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ease-out ${
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      <div className="absolute inset-0 bg-[#FCFBF6]" />
      <nav
        className="relative flex flex-col justify-center items-center h-full px-6"
        style={menuStyle}
        aria-label="Mobile navigation"
      >
        <ul className="flex flex-col items-center gap-8">
          {items.map((item, i) => (
            <li
              key={item.href}
              className={`transition-all duration-300 ${open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: open ? `${100 + i * 60}ms` : '0ms' }}
            >
              <Link
                href={item.href}
                onClick={onClose}
                className="text-[22px] lowercase hover:opacity-50 transition-opacity"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Address + hours */}
        <div
          className={`absolute bottom-20 text-[14px] lowercase text-center transition-all duration-300 ${
            open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ ...menuStyle, transitionDelay: open ? '360ms' : '0ms' }}
        >
          <span>1320 rue charlevoix</span>
          <span className="mx-2">|</span>
          <span>9h-12h</span>
        </div>

        <div
          className={`absolute bottom-12 transition-all duration-300 ${open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: open ? '420ms' : '0ms' }}
        >
          <LanguageSwitcher />
        </div>
      </nav>
    </div>
  );
}
