'use client';

import { type InputHTMLAttributes } from 'react';

export interface CheckboxBaseProps {
  isSelected?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  hint?: string;
  isDisabled?: boolean;
  className?: string;
}

export function CheckboxBase({ isSelected, onChange, label, hint, isDisabled, className = '' }: CheckboxBaseProps) {
  return (
    <label className={`inline-flex items-start gap-2 cursor-pointer ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <input
        type="checkbox"
        checked={isSelected ?? false}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={isDisabled}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
      />
      <div>
        {label && <span className="text-sm text-gray-700">{label}</span>}
        {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      </div>
    </label>
  );
}

export const Checkbox = CheckboxBase;
export default Checkbox;
