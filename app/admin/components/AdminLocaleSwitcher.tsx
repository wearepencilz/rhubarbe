'use client';

import { useAdminLocale } from '@/contexts/AdminLocaleContext';

export default function AdminLocaleSwitcher() {
  const { adminLocale, setAdminLocale } = useAdminLocale();

  return (
    <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
      <span className="text-[10px] text-gray-400 uppercase tracking-widest mr-1 font-medium">Editing</span>
      <button
        onClick={() => setAdminLocale('en')}
        className={`text-xs px-2 py-0.5 rounded font-medium transition-colors ${
          adminLocale === 'en'
            ? 'bg-gray-900 text-white'
            : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setAdminLocale('fr')}
        className={`text-xs px-2 py-0.5 rounded font-medium transition-colors ${
          adminLocale === 'fr'
            ? 'bg-blue-600 text-white'
            : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        FR
      </button>
    </div>
  );
}
