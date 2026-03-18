'use client';

import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import RichTextEditor from '@/app/admin/components/RichTextEditor';
import { useAdminLocale } from '@/contexts/AdminLocaleContext';
import type { ContentTranslations } from '@/types';

interface FieldDef {
  key: string;
  label: string;
  type?: 'input' | 'textarea' | 'richtext';
  rows?: number;
  placeholder?: string;
}

interface TranslationFieldsProps {
  /** The base English values */
  base: Record<string, string>;
  translations: ContentTranslations | undefined;
  onChange: (translations: ContentTranslations) => void;
  onBaseChange?: (field: string, value: string) => void;
  fields: FieldDef[];
}

/**
 * Locale-aware field renderer.
 * - adminLocale = 'en': shows and edits base English fields via onBaseChange
 * - adminLocale = 'fr': shows FR translation fields, with EN value as placeholder
 */
export default function TranslationFields({
  base,
  translations,
  onChange,
  onBaseChange,
  fields,
}: TranslationFieldsProps) {
  const { adminLocale } = useAdminLocale();
  const fr = translations?.fr ?? {};

  function updateFr(key: string, value: string) {
    onChange({
      ...translations,
      fr: { ...fr, [key]: value || undefined },
    });
  }

  const isFr = adminLocale === 'fr';

  return (
    <div className="space-y-4">
      {isFr && (
        <div className="flex items-center gap-2 py-1 px-3 rounded-md bg-blue-50 border border-blue-100">
          <span className="text-xs font-semibold text-blue-600">🇫🇷 Editing French</span>
          <span className="text-xs text-blue-400">— leave blank to inherit English</span>
        </div>
      )}
      {fields.map((field) => {
        const value = isFr ? (fr[field.key] ?? '') : (base[field.key] ?? '');
        const placeholder = isFr ? (base[field.key] || field.placeholder) : field.placeholder;
        const handleChange = isFr
          ? (v: string) => updateFr(field.key, v)
          : (v: string) => onBaseChange?.(field.key, v);

        if (field.type === 'richtext') {
          return (
            <RichTextEditor
              key={field.key}
              label={field.label}
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
            />
          );
        }
        if (field.type === 'textarea') {
          return (
            <Textarea
              key={field.key}
              label={field.label}
              rows={field.rows ?? 3}
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
            />
          );
        }
        return (
          <Input
            key={field.key}
            label={field.label}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
          />
        );
      })}
    </div>
  );
}
