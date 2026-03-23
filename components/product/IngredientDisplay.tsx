'use client';

import { useState, useEffect } from 'react';
import { useT } from '@/lib/i18n/useT';
import type { IngredientWithDetails } from '@/types';

interface Props {
  flavourId: string;
  className?: string;
}

interface IngredientData {
  ingredients: IngredientWithDetails[];
  allergens: string[];
  dietaryFlags: string[];
  hasSeasonalIngredients: boolean;
}

export default function IngredientDisplay({ flavourId, className = '' }: Props) {
  const { T } = useT();
  const [data, setData] = useState<IngredientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/flavours/${flavourId}/ingredients`)
      .then((r) => { if (r.ok) return r.json(); throw new Error(); })
      .then(setData)
      .catch(() => setError('Failed to load ingredients'))
      .finally(() => setLoading(false));
  }, [flavourId]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
        </div>
      </div>
    );
  }

  if (error || !data) return null;

  const { ingredients, hasSeasonalIngredients } = data;
  const grouped = ingredients.reduce((acc, ing) => {
    if (!acc[ing.category]) acc[ing.category] = [];
    acc[ing.category].push(ing);
    return acc;
  }, {} as Record<string, IngredientWithDetails[]>);

  const categoryOrder = ['base', 'flavor', 'mix-in', 'topping', 'spice'];

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{T.ingredients.title}</h3>
        {hasSeasonalIngredients && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            {T.ingredients.seasonal}
          </span>
        )}
      </div>
      <div className="space-y-6">
        {categoryOrder.map((category) => {
          const items = grouped[category];
          if (!items || items.length === 0) return null;
          return (
            <div key={category}>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {(T.ingredients as any)[category] ?? category}
              </h4>
              <ul className="space-y-2">
                {items.map((ing) => (
                  <li key={ing.id} className="flex items-start gap-2 text-sm">
                    <span className="text-gray-900">
                      {ing.name}
                      {ing.quantity && <span className="text-gray-500 ml-1">({ing.quantity})</span>}
                    </span>
                    {ing.seasonal && <span className="text-amber-600 text-xs">🌿</span>}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      {ingredients.length === 0 && <p className="text-sm text-gray-500">{T.ingredients.none}</p>}
    </div>
  );
}
