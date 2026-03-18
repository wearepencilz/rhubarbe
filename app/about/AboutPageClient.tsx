'use client';

import { useLocale } from '@/contexts/LocaleContext';

interface AboutLocale {
  heading?: string;
  intro?: string;
  body?: string;
  address?: string;
  signoff?: string;
}

interface AboutPageClientProps {
  en: AboutLocale;
  fr: AboutLocale;
}

export default function AboutPageClient({ en, fr }: AboutPageClientProps) {
  const { locale } = useLocale();

  const resolve = (field: keyof AboutLocale): string =>
    (locale === 'fr' ? fr[field] : undefined) ?? en[field] ?? '';

  return (
    <main className="max-w-xl mx-auto px-6 py-24 space-y-8">
      <h1 className="text-2xl font-semibold">{resolve('heading')}</h1>

      <p className="text-gray-700 leading-relaxed">{resolve('intro')}</p>

      <div
        className="prose prose-sm text-gray-600 space-y-4"
        dangerouslySetInnerHTML={{ __html: resolve('body') }}
      />

      <p className="text-gray-700">{resolve('address')}</p>

      <p className="text-sm text-gray-400">{resolve('signoff')}</p>
    </main>
  );
}
