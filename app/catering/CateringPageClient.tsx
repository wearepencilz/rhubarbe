'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n/useT';
import RequestForm from '@/components/RequestForm';

interface PageContent {
  heading?: string;
  intro?: string;
  menuNote?: string;
  contactNote?: string;
  fr?: { heading?: string; intro?: string; menuNote?: string; contactNote?: string };
  en?: { heading?: string; intro?: string; menuNote?: string; contactNote?: string };
}

export default function CateringPageClient({
  traiteurContent,
  gateauxContent,
}: {
  traiteurContent: PageContent;
  gateauxContent: PageContent;
}) {
  const { T, locale } = useT();
  const isFr = locale === 'fr';
  const [activeTab, setActiveTab] = useState<'traiteur' | 'gateaux'>('traiteur');

  return (
    <main className="max-w-2xl mx-auto px-6 pt-20 pb-16">
      {/* Tab switcher */}
      <div className="flex gap-2 mb-10">
        {(['traiteur', 'gateaux'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs uppercase tracking-widest rounded transition-colors ${
              activeTab === tab
                ? 'bg-[#333112] text-white'
                : 'border border-gray-300 text-gray-600 hover:border-[#333112]'
            }`}
            style={{ fontFamily: 'var(--font-diatype-mono)' }}
          >
            {tab === 'traiteur'
              ? (isFr ? 'Traiteur' : 'Catering')
              : (isFr ? 'Gâteaux signatures' : 'Signature Cakes')}
          </button>
        ))}
      </div>

      {/* Form content */}
      {activeTab === 'traiteur' ? (
        <RequestForm type="traiteur" content={traiteurContent} embedded />
      ) : (
        <RequestForm type="gateaux" content={gateauxContent} embedded />
      )}
    </main>
  );
}
