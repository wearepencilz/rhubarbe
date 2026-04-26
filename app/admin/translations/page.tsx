'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/app/admin/components/ui/button';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import { useToast } from '@/app/admin/components/ToastContainer';
import AiTranslateButton from '@/app/admin/components/AiTranslateButton';
import fr from '@/lib/i18n/locales/fr';
import en from '@/lib/i18n/locales/en';

// Sections and their human-readable labels
const SECTIONS: { key: string; label: string; nested?: { key: string; label: string }[] }[] = [
  { key: 'nav', label: 'Navigation' },
  { key: 'cart', label: 'Cart / Panier' },
  { key: 'product', label: 'Product' },
  { key: 'order', label: 'Order' },
  { key: 'volumeOrder', label: 'Catering Order' },
  { key: 'flavours', label: 'Flavours' },
  { key: 'journal', label: 'Journal' },
  { key: 'availability', label: 'Availability' },
  { key: 'allergens', label: 'Allergens' },
  { key: 'dietary', label: 'Dietary' },
  { key: 'ingredients', label: 'Ingredients' },
  { key: 'thankYou', label: 'Thank You' },
  {
    key: 'form',
    label: 'Forms (Catering & Cakes)',
    nested: [
      { key: 'traiteur', label: 'Catering' },
      { key: 'gateaux', label: 'Signature Cakes' },
      { key: 'fields', label: 'Form Fields' },
    ],
  },
];

/** Get only the string keys from a section object (skip functions) */
function getStringKeys(obj: Record<string, any>): string[] {
  return Object.keys(obj).filter((k) => typeof obj[k] === 'string');
}

type Overrides = { fr: Record<string, any>; en: Record<string, any> };

export default function TranslationsAdmin() {
  const toast = useToast();
  const [overrides, setOverrides] = useState<Overrides>({ fr: {}, en: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/pages/translations')
      .then((r) => r.json())
      .then((data) => setOverrides({ fr: data?.fr ?? {}, en: data?.en ?? {} }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/pages/translations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overrides),
      });
      if (!res.ok) toast.error('Save failed', 'Could not save translations');
      else toast.success('Saved', 'Translations updated');
    } catch {
      toast.error('Save failed', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const setVal = (locale: 'fr' | 'en', section: string, key: string, value: string, nested?: string) => {
    setOverrides((prev) => {
      const loc = { ...prev[locale] };
      if (nested) {
        const sec = { ...(loc[section] ?? {}) };
        const nest = { ...(sec[nested] ?? {}) };
        if (value) nest[key] = value;
        else delete nest[key];
        sec[nested] = nest;
        loc[section] = sec;
      } else {
        const sec = { ...(loc[section] ?? {}) };
        if (value) sec[key] = value;
        else delete sec[key];
        loc[section] = sec;
      }
      return { ...prev, [locale]: loc };
    });
  };

  const getVal = (locale: 'fr' | 'en', section: string, key: string, nested?: string): string => {
    if (nested) return overrides[locale]?.[section]?.[nested]?.[key] ?? '';
    return overrides[locale]?.[section]?.[key] ?? '';
  };

  const getDefault = (locale: 'fr' | 'en', section: string, key: string, nested?: string): string => {
    const base = locale === 'fr' ? fr : en;
    const sec = (base as any)[section];
    if (nested) return sec?.[nested]?.[key] ?? '';
    return sec?.[key] ?? '';
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const collectFrFields = (section: string, nested?: string): Record<string, string> => {
    const base = (fr as any)[section];
    const obj = nested ? base?.[nested] : base;
    if (!obj) return {};
    const result: Record<string, string> = {};
    for (const k of getStringKeys(obj)) {
      result[k] = getVal('fr', section, k, nested) || obj[k];
    }
    return result;
  };

  const applyEnTranslation = (section: string, translated: Record<string, string>, nested?: string) => {
    setOverrides((prev) => {
      const loc = { ...prev.en };
      if (nested) {
        const sec = { ...(loc[section] ?? {}) };
        sec[nested] = { ...(sec[nested] ?? {}), ...translated };
        loc[section] = sec;
      } else {
        loc[section] = { ...(loc[section] ?? {}), ...translated };
      }
      return { ...prev, en: loc };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="admin-narrow">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/pages" className="hover:text-gray-900 transition-colors">Pages</Link>
        <span>/</span>
        <span className="text-gray-900">Translations</span>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Translations</h1>
        <p className="text-gray-600 mt-1">Edit all UI text. Leave blank to use the code default. Function-based strings (with variables) are not editable here.</p>
      </div>

      <div className="space-y-3 max-w-5xl">
        {SECTIONS.map((section) => (
          <SectionBlock
            key={section.key}
            section={section}
            expanded={expandedSections.has(section.key)}
            onToggle={() => toggleSection(section.key)}
            getVal={getVal}
            setVal={setVal}
            getDefault={getDefault}
            collectFrFields={collectFrFields}
            applyEnTranslation={applyEnTranslation}
          />
        ))}
      </div>

      <div className="mt-6 sticky bottom-6">
        <Button variant="primary" isLoading={saving} isDisabled={saving} onClick={save}>
          Save all translations
        </Button>
      </div>
    </div>
  );
}

interface SectionBlockProps {
  section: { key: string; label: string; nested?: { key: string; label: string }[] };
  expanded: boolean;
  onToggle: () => void;
  getVal: (locale: 'fr' | 'en', section: string, key: string, nested?: string) => string;
  setVal: (locale: 'fr' | 'en', section: string, key: string, value: string, nested?: string) => void;
  getDefault: (locale: 'fr' | 'en', section: string, key: string, nested?: string) => string;
  collectFrFields: (section: string, nested?: string) => Record<string, string>;
  applyEnTranslation: (section: string, translated: Record<string, string>, nested?: string) => void;
}

function SectionBlock({ section, expanded, onToggle, getVal, setVal, getDefault, collectFrFields, applyEnTranslation }: SectionBlockProps) {
  const base = (fr as any)[section.key];
  const stringKeys = section.nested ? [] : getStringKeys(base ?? {});
  const count = section.nested
    ? section.nested.reduce((sum, n) => sum + getStringKeys((base as any)?.[n.key] ?? {}).length, 0)
    : stringKeys.length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="admin-narrow">
          <span className="text-sm font-medium text-gray-900">{section.label}</span>
          <span className="ml-2 text-xs text-gray-400">{count} string{count !== 1 ? 's' : ''}</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-gray-200 px-5 py-5">
          {section.nested ? (
            <div className="space-y-6">
              {section.nested.map((nested) => {
                const nestedObj = (base as any)?.[nested.key] ?? {};
                const nestedKeys = getStringKeys(nestedObj);
                if (nestedKeys.length === 0) return null;
                return (
                  <div key={nested.key}>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">{nested.label}</h3>
                    <FieldGrid
                      sectionKey={section.key}
                      nestedKey={nested.key}
                      keys={nestedKeys}
                      getVal={getVal}
                      setVal={setVal}
                      getDefault={getDefault}
                      collectFrFields={collectFrFields}
                      applyEnTranslation={applyEnTranslation}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <FieldGrid
              sectionKey={section.key}
              keys={stringKeys}
              getVal={getVal}
              setVal={setVal}
              getDefault={getDefault}
              collectFrFields={collectFrFields}
              applyEnTranslation={applyEnTranslation}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface FieldGridProps {
  sectionKey: string;
  nestedKey?: string;
  keys: string[];
  getVal: (locale: 'fr' | 'en', section: string, key: string, nested?: string) => string;
  setVal: (locale: 'fr' | 'en', section: string, key: string, value: string, nested?: string) => void;
  getDefault: (locale: 'fr' | 'en', section: string, key: string, nested?: string) => string;
  collectFrFields: (section: string, nested?: string) => Record<string, string>;
  applyEnTranslation: (section: string, translated: Record<string, string>, nested?: string) => void;
}

function FieldGrid({ sectionKey, nestedKey, keys, getVal, setVal, getDefault, collectFrFields, applyEnTranslation }: FieldGridProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AiTranslateButton
          targetLocale="en"
          fields={collectFrFields(sectionKey, nestedKey)}
          onResult={(t) => applyEnTranslation(sectionKey, t, nestedKey)}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-3">
        {keys.map((key) => {
          const frDefault = getDefault('fr', sectionKey, key, nestedKey);
          const enDefault = getDefault('en', sectionKey, key, nestedKey);
          const isLong = frDefault.length > 60;
          return (
            <div key={key} className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-[120px_1fr_1fr] gap-x-4 gap-y-1 items-start">
              <div className="text-xs text-gray-400 font-mono pt-2 truncate" title={key}>{key}</div>
              <div className="admin-narrow">
                {isLong ? (
                  <Textarea
                    label=""
                    rows={2}
                    value={getVal('fr', sectionKey, key, nestedKey)}
                    onChange={(v) => setVal('fr', sectionKey, key, v, nestedKey)}
                    placeholder={frDefault}
                  />
                ) : (
                  <Input
                    label=""
                    value={getVal('fr', sectionKey, key, nestedKey)}
                    onChange={(v) => setVal('fr', sectionKey, key, v, nestedKey)}
                    placeholder={frDefault}
                  />
                )}
                <span className="text-[10px] text-gray-300">🇫🇷 FR</span>
              </div>
              <div className="admin-narrow">
                {isLong ? (
                  <Textarea
                    label=""
                    rows={2}
                    value={getVal('en', sectionKey, key, nestedKey)}
                    onChange={(v) => setVal('en', sectionKey, key, v, nestedKey)}
                    placeholder={enDefault}
                  />
                ) : (
                  <Input
                    label=""
                    value={getVal('en', sectionKey, key, nestedKey)}
                    onChange={(v) => setVal('en', sectionKey, key, v, nestedKey)}
                    placeholder={enDefault}
                  />
                )}
                <span className="text-[10px] text-gray-300">🇬🇧 EN</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
