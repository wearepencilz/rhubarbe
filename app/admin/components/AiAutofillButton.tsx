'use client';

import { useState } from 'react';
import { useToast } from './ToastContainer';

interface IngredientAutofillResult {
  latinName?: string;
  origin?: string;
  description?: string;
  story?: string;
  tastingNotes?: string[];
  texture?: string[];
  process?: string[];
  attributes?: string[];
  availableMonths?: number[];
}

interface AiAutofillButtonProps {
  name: string;
  latinName?: string;
  origin?: string;
  onResult: (result: IngredientAutofillResult) => void;
  disabled?: boolean;
}

export default function AiAutofillButton({ name, latinName, origin, onResult, disabled }: AiAutofillButtonProps) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleAutofill = async () => {
    if (!name.trim()) {
      toast.error('Enter an ingredient name first');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ai/autofill-ingredient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, latinName, origin }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error('Autofill failed', data.error || 'Something went wrong');
        return;
      }
      onResult(data);
      toast.success('AI suggestions applied', 'Review and adjust as needed');
    } catch {
      toast.error('Autofill failed', 'Could not reach the AI service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleAutofill}
      disabled={disabled || loading || !name.trim()}
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
          Thinking...
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          AI Autofill
        </>
      )}
    </button>
  );
}
