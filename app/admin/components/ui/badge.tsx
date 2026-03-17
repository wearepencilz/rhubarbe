'use client';

import { type ReactNode, type FC } from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'gray';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  /** Alias for variant — accepted for compatibility */
  color?: BadgeVariant;
  size?: BadgeSize;
  /** Optional icon rendered before the label */
  icon?: FC<{ className?: string }>;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary-secondary text-primary',
  success: 'bg-success-secondary text-success-primary',
  warning: 'bg-warning-secondary text-warning-primary',
  error:   'bg-error-secondary text-error-primary',
  info:    'bg-blue-50 text-blue-700',
  purple:  'bg-purple-100 text-purple-700',
  gray:    'bg-gray-100 text-gray-700',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export function Badge({
  children,
  variant = 'default',
  color,
  size = 'md',
  icon: Icon,
  className = '',
}: BadgeProps) {
  const resolvedVariant = color ?? variant;
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded ${variantClasses[resolvedVariant]} ${sizeClasses[size]} ${className}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
}

export default Badge;
