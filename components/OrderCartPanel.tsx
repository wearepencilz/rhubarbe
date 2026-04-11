'use client';

import { useEffect } from 'react';

interface OrderCartPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  itemCount: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function OrderCartPanel({ open, onClose, title, itemCount, children, footer }: OrderCartPanelProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-[60] transition-opacity" onClick={onClose} />
      )}
      <div
        className={`fixed right-0 top-0 h-full w-1/2 max-w-[50vw] min-w-[360px] z-[70] flex flex-col transition-transform duration-300 ease-out cart-panel ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ backgroundColor: '#0065B6' }}
      >
        <div className="flex items-center justify-between p-6">
          <h2 className="text-[24px] text-white font-medium">
            {title}<sup className="text-[14px] ml-[2px]">({itemCount})</sup>
          </h2>
          <button onClick={onClose} className="text-[16px] text-white/70 hover:text-white" aria-label="Close">close</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pt-2 pb-4 cart-panel-content">
          {children}
        </div>
        {footer && (
          <div className="px-6 py-4" style={{ backgroundColor: '#0065B6' }}>
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
