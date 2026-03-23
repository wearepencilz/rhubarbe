'use client';

import type { DietaryFlag } from '@/types';
import { useT } from '@/lib/i18n/useT';

interface Props {
  dietaryFlags: DietaryFlag[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const dietaryIcons: Partial<Record<DietaryFlag, string>> = {
  vegan: '🌱',
  vegetarian: '🥬',
  'gluten-free': '🌾',
  'dairy-free': '🥛',
  'nut-free': '🌰',
};

const dietaryColors: Partial<Record<DietaryFlag, string>> = {
  vegan: 'bg-green-100 text-green-800 border-green-300',
  vegetarian: 'bg-green-100 text-green-800 border-green-300',
  'gluten-free': 'bg-amber-100 text-amber-800 border-amber-300',
  'dairy-free': 'bg-blue-100 text-blue-800 border-blue-300',
  'nut-free': 'bg-purple-100 text-purple-800 border-purple-300',
};

export default function DietaryBadges({ dietaryFlags, size = 'md', className = '' }: Props) {
  const { T } = useT();

  if (!dietaryFlags || dietaryFlags.length === 0) return null;

  const sizeClasses = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-2.5 py-1', lg: 'text-base px-3 py-1.5' };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {dietaryFlags.map((flag) => {
        const label = (T.dietary as any)[flag] ?? flag;
        return (
          <span
            key={flag}
            className={`inline-flex items-center gap-1 rounded-full font-medium border ${dietaryColors[flag] || 'bg-gray-100 text-gray-800 border-gray-300'} ${sizeClasses[size]}`}
            role="img"
            aria-label={label}
          >
            <span aria-hidden="true">{dietaryIcons[flag] || '🏷️'}</span>
            <span>{label}</span>
          </span>
        );
      })}
    </div>
  );
}
