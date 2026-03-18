'use client';

import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import type { ContentTranslations } from '@/types';

interface FieldDef {
  key: string;
  label: string;
  type?: 'input' | 'textarea';
  rows?: number;
  placeholder?: string;
}

interface TranslationFieldsProps {
  translations: ContentTranslations | undefined;
  onChange: (translations: ContentTranslations) => void;
  fields: FieldDef[];
}

/**
 * Renders French translation inputs for any set of content fields.
 * Used in admin edit pages alongside the English base fields.
 */
export default function TranslationFields({ translations, onChange, fields }: TranslationFieldsProps) {
  const fr = translations?.fr ?? {};

  function update(key: string, value: string) {
    onChange({
      ...translations,
      fr: { ...fr, [key]: value || undefined },
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest">🇫🇷 Français</span>
        <span className="text-xs text-gray-400">— laissez vide pour utiliser l'anglais par défaut</span>
      </div>
      {fields.map((field) =>
        field.type === 'textarea' ? (
          <Textarea
            key={field.key}
            label={field.label}
            rows={field.rows ?? 3}
            value={fr[field.key] ?? ''}
            onChange={(v) => update(field.key, v)}
            placeholder={field.placeholder}
          />
        ) : (
          <Input
            key={field.key}
            label={field.label}
            value={fr[field.key] ?? ''}
            onChange={(v) => update(field.key, v)}
            placeholder={field.placeholder}
          />
        )
      )}
    </div>
  );
}
