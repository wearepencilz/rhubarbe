'use client';

import { useState } from 'react';
import { useToast } from './ToastContainer';

interface AiTranslateButtonProps {
  /** The source fields to translate (key → value) */
  fields: Record<string, string>;
  /** Which locale to translate INTO */
  targetLocale: 'fr' | 'en';
  /** Called with the translated key→value map */
  onResult: (translated: Record<string, string>) => void;
  disabled?: boolean;
}

export default function AiTranslateButton({
  fields,
  targetLocale,
  onResult,
  disabled,
}: AiTranslateButtonProps) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const hasContent = Object.values(fields).some((v) => v?.trim());
  const label = targetLocale === 'fr' ? 'Translate to French' : 'Translate to English';
  const flag = targetLocale === 'fr' ? '🇫🇷' : '🇬🇧';

  const handleTranslate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields, targetLocale }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error('Translation failed', data.error || 'Something went wrong');
        return;
      }
      onResult(data);
      toast.success('Translation applied', 'Review and adjust as needed');
    } catch {
      toast.error('Translation failed', 'Could not reach the AI service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleTranslate}
      disabled={disabled || loading || !hasContent}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors
        bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50
        disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Translating...
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          {flag} {label}
        </>
      )}
    </button>
  );
}
