'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/app/admin/components/ui/button';
import ConfirmModal from '@/app/admin/components/ConfirmModal';

interface EditPageLayoutProps {
  title: string;
  backHref: string;
  backLabel: string;
  onSave: () => void | Promise<void>;
  onDelete?: () => void;
  onCancel: () => void;
  saving?: boolean;
  deleting?: boolean;
  deleteDisabled?: boolean;
  deleteDisabledReason?: string;
  children: ReactNode;
  error?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '7xl';
  /** Pass a value that changes when the form is dirty to show the unsaved bar */
  isDirty?: boolean;
}

export default function EditPageLayout({
  title,
  backHref,
  backLabel,
  onSave,
  onDelete,
  onCancel,
  saving = false,
  deleting = false,
  deleteDisabled = false,
  deleteDisabledReason,
  children,
  error,
  maxWidth = '3xl',
  isDirty = false,
}: EditPageLayoutProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '7xl': 'max-w-7xl',
  }[maxWidth];

  return (
    <div className={maxWidthClass}>
      {/* Unsaved changes bar */}
      {isDirty && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 bg-gray-900 px-6 py-3 lg:left-[240px]">
          <p className="text-sm text-white">Unsaved changes</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Discard
            </button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onSave}
              isLoading={saving}
              isDisabled={saving}
            >
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Spacer when unsaved bar is visible */}
      {isDirty && <div className="h-12" />}

      {/* Header */}
      <div className="mb-6">
        <Link
          href={backHref}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </Link>

        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {children}

      {/* Bottom actions */}
      <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={onSave}
          isLoading={saving}
          isDisabled={saving}
          className="flex-1"
        >
          Save Changes
        </Button>
      </div>

      {/* Delete zone */}
      {onDelete && (
        <div className="mt-8 pt-6 border-t border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Delete this item</p>
              <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone.</p>
            </div>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setDeleteConfirmOpen(true)}
              isLoading={deleting}
              isDisabled={deleting || deleteDisabled}
              title={deleteDisabled ? deleteDisabledReason : undefined}
            >
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {onDelete && (
        <ConfirmModal
          isOpen={deleteConfirmOpen}
          variant="danger"
          title="Delete permanently?"
          message="This will permanently delete this item. This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={() => { setDeleteConfirmOpen(false); onDelete(); }}
          onCancel={() => setDeleteConfirmOpen(false)}
        />
      )}
    </div>
  );
}
