'use client';

import { AlertCircle, CheckCircle, InfoCircle, AlertTriangle } from '@untitledui/icons';
import { Modal } from '@/app/admin/components/ui/modal';
import { Button } from '@/app/admin/components/ui/button';

export type ModalVariant = 'danger' | 'warning' | 'success' | 'info';

interface ConfirmModalProps {
  isOpen: boolean;
  variant?: ModalVariant;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const variantConfig = {
  danger: {
    icon: AlertCircle,
    iconColor: 'text-error-primary',
    iconBg: 'bg-error-secondary',
    confirmVariant: 'danger' as const,
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-warning-primary',
    iconBg: 'bg-warning-secondary',
    confirmVariant: 'primary' as const,
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-success-primary',
    iconBg: 'bg-success-secondary',
    confirmVariant: 'primary' as const,
  },
  info: {
    icon: InfoCircle,
    iconColor: 'text-primary',
    iconBg: 'bg-primary-secondary',
    confirmVariant: 'primary' as const,
  },
};

export default function ConfirmModal({
  isOpen,
  variant = 'info',
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="md"
      hideCloseButton
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" size="md" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={config.confirmVariant} size="md" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  );
}
