'use client';

import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import type { Bilingual } from '@/lib/types/sections';

interface BilingualFieldProps {
  label: string;
  value: Bilingual;
  onChange: (value: Bilingual) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
}

export default function BilingualField({ label, value, onChange, multiline, rows = 3, placeholder }: BilingualFieldProps) {
  const enEmpty = !value.en && !!value.fr;
  const frEmpty = !value.fr && !!value.en;
  const Field = multiline ? Textarea : Input;

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="🇬🇧 EN"
          value={value.en}
          onChange={(v: string) => onChange({ ...value, en: v })}
          placeholder={placeholder}
          validationState={enEmpty ? 'warning' : 'default'}
          helperText={enEmpty ? 'Missing English' : undefined}
          {...(multiline ? { rows } : {})}
        />
        <Field
          label="🇫🇷 FR"
          value={value.fr}
          onChange={(v: string) => onChange({ ...value, fr: v })}
          placeholder={placeholder}
          validationState={frEmpty ? 'warning' : 'default'}
          helperText={frEmpty ? 'Français manquant' : undefined}
          {...(multiline ? { rows } : {})}
        />
      </div>
    </div>
  );
}
