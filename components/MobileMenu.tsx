'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  { href: '/order', label: 'menu' },
  { href: '/catering', label: 'catering' },
  { href: '/cake', label: 'cakes' },
  { href: '/journal', label: 'journal' },
];

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

  const menuStyle = { fontFamily: 'var(--font-solar-display)', color: '#1A3821' } as const;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className="md:hidden fixed inset-0 z-40"
          aria-hidden={!open}
        >
          <div className="absolute inset-0 bg-[#FCFBF6]" />
          <nav className="relative flex flex-col justify-center items-center h-full px-6" style={menuStyle} aria-label="Mobile navigation">
            <ul className="flex flex-col items-center gap-8">
              {menuItems.map((item, i) => (
                <motion.li key={item.href}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, delay: i * 0.05 }}>
                  <Link href={item.href} onClick={onClose} className="text-[22px] lowercase hover:opacity-50 transition-opacity">
                    {item.label}
                  </Link>
                </motion.li>
              ))}
            </ul>

            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25, delay: 0.25 }}
              className="absolute bottom-20 text-[14px] lowercase text-center" style={menuStyle}>
              <span>1320 rue charlevoix</span>
              <span className="mx-2">|</span>
              <span>9h-12h</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25, delay: 0.3 }}
              className="absolute bottom-12">
              <LanguageSwitcher />
            </motion.div>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
