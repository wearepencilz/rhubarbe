'use client';

import { useEffect, useRef } from 'react';

interface MobileCartModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function MobileCartModal({ open, onClose, children }: MobileCartModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div ref={backdropRef} className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        {/* Handle */}
        <div className="flex justify-center py-3 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}
