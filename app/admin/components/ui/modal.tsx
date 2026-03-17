'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from '@untitledui/icons';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when the modal should close (ESC, backdrop click, X button) */
  onClose: () => void;
  /** Modal title shown in the header */
  title?: string;
  /** Optional subtitle / description below the title */
  description?: string;
  /** Modal body content */
  children: ReactNode;
  /** Footer content (actions) */
  footer?: ReactNode;
  /** Size variant */
  size?: ModalSize;
  /** Whether clicking the backdrop closes the modal */
  closeOnBackdrop?: boolean;
  /** Hide the default header X close button */
  hideCloseButton?: boolean;
  /** Additional class for the modal panel */
  className?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-full mx-4',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  hideCloseButton = false,
  className = '',
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Focus trap — move focus into panel when opened
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4"
      onClick={closeOnBackdrop ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`bg-white rounded-xl shadow-xl w-full flex flex-col max-h-[90vh] outline-none ${sizeClasses[size]} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || !hideCloseButton) && (
          <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <div>
              {title && (
                <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-gray-600">{description}</p>
              )}
            </div>
            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-gray-50 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
