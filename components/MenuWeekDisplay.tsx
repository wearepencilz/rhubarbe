'use client';

import { useState, useEffect } from 'react';
import { useT } from '@/lib/i18n/useT';

interface ActiveLaunch {
  id: string;
  title: { en: string; fr: string };
  introCopy: { en: string; fr: string };
  orderOpens: string;
  orderCloses: string;
  pickupDate: string;
  pickupSlots: Array<{ id: string; startTime: string; endTime: string; capacity?: number }>;
  products: Array<{ productId: string; productName: string; sortOrder: number }>;
  pickupLocation: { publicLabel: { en: string; fr: string }; address: string } | null;
  status: string;
}

export function MenuWeekHomepage() {
  const { locale } = useT();
  const [launch, setLaunch] = useState<ActiveLaunch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/launches/current')
      .then(r => r.ok ? r.json() : null)
      .then(data => { setLaunch(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-32 bg-gray-100 rounded-lg" />;
  if (!launch) return null;

  const lang = locale === 'fr' ? 'fr' : 'en';
  const cutoff = new Date(launch.orderCloses);
  const isPastCutoff = new Date() > cutoff;

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium tracking-wide uppercase" style={{ fontFamily: 'var(--font-neue-montreal)' }}>
          {launch.title[lang]}
        </h2>
        {!isPastCutoff && <CutoffCountdown cutoff={cutoff} locale={lang} />}
      </div>

      {launch.introCopy[lang] && (
        <p className="text-sm text-gray-600 leading-relaxed">{launch.introCopy[lang]}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>
          {lang === 'fr' ? 'Cueillette:' : 'Pickup:'}{' '}
          {new Date(launch.pickupDate).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}
        </span>
        {launch.pickupLocation && (
          <span>@ {launch.pickupLocation.publicLabel[lang]}</span>
        )}
      </div>

      {isPastCutoff && (
        <p className="text-sm text-red-600">{lang === 'fr' ? 'La période de commande est terminée' : 'Order period has ended'}</p>
      )}
    </section>
  );
}

export function MenuWeekBanner() {
  const { locale } = useT();
  const [launch, setLaunch] = useState<ActiveLaunch | null>(null);

  useEffect(() => {
    fetch('/api/launches/current')
      .then(r => r.ok ? r.json() : null)
      .then(setLaunch)
      .catch(() => {});
  }, []);

  if (!launch) return null;

  const lang = locale === 'fr' ? 'fr' : 'en';
  const cutoff = new Date(launch.orderCloses);
  const isPastCutoff = new Date() > cutoff;

  return (
    <div className={`px-4 py-3 rounded-lg text-sm ${isPastCutoff ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
      {isPastCutoff
        ? (lang === 'fr' ? 'La période de commande est terminée' : 'Order period has ended')
        : launch.title[lang]
      }
      {!isPastCutoff && <CutoffCountdown cutoff={cutoff} locale={lang} inline />}
    </div>
  );
}

function CutoffCountdown({ cutoff, locale, inline }: { cutoff: Date; locale: string; inline?: boolean }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = cutoff.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft(locale === 'fr' ? 'Terminé' : 'Ended'); return; }
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeLeft(locale === 'fr' ? `${days}j restants` : `${days}d left`);
      } else {
        setTimeLeft(locale === 'fr' ? `${hours}h ${minutes}m restants` : `${hours}h ${minutes}m left`);
      }
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [cutoff, locale]);

  if (inline) return <span className="ml-2 font-medium">{timeLeft}</span>;
  return <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">{timeLeft}</span>;
}
