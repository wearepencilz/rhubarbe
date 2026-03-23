'use client';

import type { Allergen } from '@/types';
import { useT } from '@/lib/i18n/useT';

interface Props {
  allergens: Allergen[];
  className?: string;
}

const allergenIcons: Record<Allergen, string> = {
  dairy: '🥛',
  egg: '🥚',
  'tree-nuts': '🌰',
  peanuts: '🥜',
  soy: '🫘',
  gluten: '🌾',
  sesame: '🫘',
};

export default function AllergenWarning({ allergens, className = '' }: Props) {
  const { T } = useT();

  if (!allergens || allergens.length === 0) return null;

  return (
    <div className={`border-l-4 border-red-500 bg-red-50 p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-semibold text-red-800">{T.allergens.title}</h3>
          <div className="mt-2 text-sm text-red-700">
            <p className="font-medium mb-2">{T.allergens.contains}</p>
            <ul className="list-none space-y-1">
              {allergens.map((allergen) => (
                <li key={allergen} className="flex items-center gap-2">
                  <span className="text-base" aria-hidden="true">{allergenIcons[allergen]}</span>
                  <span>{(T.allergens as any)[allergen] ?? allergen}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
