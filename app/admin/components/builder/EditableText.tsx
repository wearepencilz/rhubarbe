'use client';

import { useRef, useEffect, useCallback } from 'react';
import type { Bilingual } from '@/lib/types/sections';

interface EditableTextProps {
  value: Bilingual;
  locale: 'en' | 'fr';
  onChange: (value: Bilingual) => void;
  className?: string;
  style?: React.CSSProperties;
  tag?: 'p' | 'h1' | 'h2' | 'h3' | 'span';
  placeholder?: string;
  multiline?: boolean;
}

export default function EditableText({
  value, locale, onChange, className = '', style, tag: Tag = 'p', placeholder = 'Click to edit...', multiline,
}: EditableTextProps) {
  const ref = useRef<HTMLElement>(null);
  const text = value[locale] || '';
  // Track whether we're focused to avoid overwriting user input
  const focused = useRef(false);

  // Set initial content and update when value changes externally (locale switch etc)
  useEffect(() => {
    const el = ref.current;
    if (!el || focused.current) return;
    el.textContent = text;
  }, [text, locale]);

  const handleFocus = useCallback(() => {
    focused.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    focused.current = false;
    const el = ref.current;
    if (!el) return;
    const newText = el.textContent || '';
    if (newText !== text) {
      onChange({ ...value, [locale]: newText });
    }
  }, [text, value, locale, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLElement).blur();
    }
  }, [multiline]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text/plain');
    // Insert as plain text, auto-linkify URLs
    const urlRe = /(https?:\/\/[^\s]+)/g;
    const linked = pasted.replace(urlRe, '<a href="$1" target="_blank" rel="noopener noreferrer" style="text-decoration:underline;color:#1d4ed8">$1</a>');
    document.execCommand('insertHTML', false, linked);
  }, []);

  return (
    <Tag
      ref={ref as any}
      contentEditable
      suppressContentEditableWarning
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      data-placeholder={placeholder}
      className={`outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-1 rounded-sm cursor-text hover:ring-1 hover:ring-blue-300/30 transition-shadow empty:before:content-[attr(data-placeholder)] empty:before:opacity-30 ${className}`}
      style={{ ...style, minHeight: '1em', whiteSpace: multiline ? 'pre-wrap' : undefined }}
    />
  );
}
