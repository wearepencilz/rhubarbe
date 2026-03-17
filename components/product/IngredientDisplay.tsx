'use client';

import { useState, useEffect } from 'react';
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
  const [data, setData] = useState<IngredientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchIngredients();
  }, [flavourId]);

  const fetchIngredients = async () => {
    try {
      const response = await fetch(`/api/flavours/${flavourId}/ingredients`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        setError('Failed to load ingredients');
      }
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      setError('Failed to load ingredients');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const { ingredients, hasSeasonalIngredients } = data;

  // Group ingredients by category
  const groupedIngredients = ingredients.reduce((acc, ing) => {
    if (!acc[ing.category]) {
      acc[ing.category] = [];
    }
    acc[ing.category].push(ing);
    return acc;
  }, {} as Record<string, IngredientWithDetails[]>);

  const categoryOrder = ['base', 'flavor', 'mix-in', 'topping', 'spice'];
  const categoryLabels: Record<string, string> = {
    base: 'Base',
    flavor: 'Flavours',
    'mix-in': 'Mix-ins',
    topping: 'Toppings',
    spice: 'Spices'
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Ingredients</h3>
        {hasSeasonalIngredients && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            Seasonal
          </span>
        )}
      </div>

      <div className="space-y-6">
        {categoryOrder.map(category => {
          const categoryIngredients = groupedIngredients[category];
          if (!categoryIngredients || categoryIngredients.length === 0) return null;

          return (
            <div key={category}>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {categoryLabels[category]}
              </h4>
              <ul className="space-y-2">
                {categoryIngredients.map(ing => (
                  <li key={ing.id} className="flex items-start gap-2 text-sm">
                    <span className="text-gray-900">
                      {ing.name}
                      {ing.quantity && (
                        <span className="text-gray-500 ml-1">({ing.quantity})</span>
                      )}
                    </span>
                    {ing.seasonal && (
                      <span className="text-amber-600 text-xs">🌿</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {ingredients.length === 0 && (
        <p className="text-sm text-gray-500">No ingredients listed</p>
      )}
    </div>
  );
}
