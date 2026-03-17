'use client';

import { AlertCircle } from '@untitledui/icons';
import { Modal } from '@/app/admin/components/ui/modal';
import { Button } from '@/app/admin/components/ui/button';

interface DeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: DeleteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="md"
      hideCloseButton
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" size="md" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" size="md" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-error-secondary flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-error-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  );
}
