'use client';

import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/app/admin/components/ui/nav/badges';
import { XClose } from '@untitledui/icons';
import { useToast } from '@/app/admin/components/ToastContainer';
import type { Ingredient, FlavourIngredient, Allergen, DietaryClaim } from '@/types';

interface Props {
  selectedIngredients: FlavourIngredient[];
  onChange: (ingredients: FlavourIngredient[]) => void;
}

const ALLERGEN_COLOR: Record<string, 'error' | 'warning' | 'orange'> = {
  dairy: 'error',
  egg: 'warning',
  gluten: 'warning',
  'tree-nuts': 'orange',
  peanuts: 'orange',
  sesame: 'warning',
  soy: 'warning',
};

const DIETARY_COLOR: Record<string, 'success' | 'blue' | 'indigo'> = {
  vegan: 'success',
  vegetarian: 'success',
  'gluten-free': 'blue',
  'dairy-free': 'blue',
  'nut-free': 'indigo',
};

export default function FlavourIngredientSelector({ selectedIngredients, onChange }: Props) {
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [dietary, setDietary] = useState<DietaryClaim[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchIngredients(); }, []);
  useEffect(() => { calculateMetadata(); }, [selectedIngredients, allIngredients]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const fetchIngredients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ingredients?pageSize=200');
      const data = await res.json();
      setAllIngredients(data.data || data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetadata = () => {
    const ids = selectedIngredients.map(si => si.ingredientId);
    const selected = allIngredients.filter(ing => ids.includes(ing.id));

    const allergenSet = new Set<Allergen>();
    selected.forEach(ing => ing.allergens.forEach(a => allergenSet.add(a)));
    setAllergens(Array.from(allergenSet));

    const claims: DietaryClaim[] = [];
    if (selected.length > 0) {
      const hasAnimal = selected.some(ing => ing.allergens.includes('dairy') || ing.allergens.includes('egg'));
      if (!hasAnimal) claims.push('vegan', 'vegetarian');
      else claims.push('vegetarian');
      if (!selected.some(ing => ing.allergens.includes('gluten'))) claims.push('gluten-free');
      if (!selected.some(ing => ing.allergens.includes('dairy'))) claims.push('dairy-free');
      if (!selected.some(ing => ing.allergens.includes('tree-nuts') || ing.allergens.includes('peanuts'))) claims.push('nut-free');
    }
    setDietary(claims);
  };

  // Close on outside click
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const add = (ingredient: Ingredient) => {
    // Prevent duplicate ingredients
    if (selectedIngredients.some(si => si.ingredientId === ingredient.id)) return;
    const maxOrder = selectedIngredients.length > 0
      ? Math.max(...selectedIngredients.map(si => si.displayOrder))
      : -1;
    onChange([...selectedIngredients, { ingredientId: ingredient.id, displayOrder: maxOrder + 1, quantity: '', notes: '' }]);
  };

  const toast = useToast();

  const quickCreate = async () => {
    const name = search.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      const res = await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, origin: '', category: 'base', allergens: [] }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error('Create failed', err.error || 'Could not create ingredient');
        return;
      }
      const created: Ingredient = await res.json();
      setAllIngredients(prev => [...prev, created]);
      add(created);
      setSearch('');
      toast.success('Ingredient created', `"${created.name}" created and added`);
    } catch {
      toast.error('Create failed', 'An unexpected error occurred');
    } finally {
      setCreating(false);
    }
  };

  const remove = (id: string) => {
    onChange(selectedIngredients.filter(si => si.ingredientId !== id).map((si, i) => ({ ...si, displayOrder: i })));
  };

  const sorted = [...selectedIngredients].sort((a, b) => a.displayOrder - b.displayOrder);

  const filtered = allIngredients.filter(ing =>
    !selectedIngredients.some(si => si.ingredientId === ing.id) &&
    ing.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">

      {/* Selected pills */}
      {sorted.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sorted.map((si, idx) => {
            const ing = allIngredients.find(i => i.id === si.ingredientId);
            if (!ing) return null;
            return (
              <span
                key={`${si.ingredientId}-${idx}`}
                className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-gray-100 text-sm font-medium text-gray-800 ring-1 ring-gray-200"
              >
                {ing.name}
                <button
                  type="button"
                  onClick={() => remove(si.ingredientId)}
                  className="rounded-full p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                  aria-label={`Remove ${ing.name}`}
                >
                  <XClose size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Search / add input */}
      <div className="relative" ref={wrapperRef}>
        <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 bg-white">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder={loading ? 'Loading ingredients…' : `Search ingredients… (${filtered.length} available)`}
            value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
            aria-label="Search ingredients to add"
          />
          {search && (
            <button type="button" onClick={() => { setSearch(''); }} className="text-gray-400 hover:text-gray-600">
              <XClose size={14} />
            </button>
          )}
        </div>

        {open && filtered.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            {filtered.slice(0, 30).map(ing => (
                <button
                  key={ing.id}
                  type="button"
                  onClick={() => add(ing)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-brand-50 hover:text-brand-700 transition-colors"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-900">{ing.name}</span>
                    {ing.origin && <span className="text-xs text-gray-500 ml-2">{ing.origin}</span>}
                  </div>
                  <div className="flex items-center gap-1 ml-3 shrink-0">
                    <span className="text-xs text-gray-400">+ Add</span>
                  </div>
                </button>
              ))}
            {search && !filtered.some(ing => ing.name.toLowerCase() === search.toLowerCase()) && (
              <button
                type="button"
                onClick={quickCreate}
                disabled={creating}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left border-t border-gray-100 hover:bg-brand-50 transition-colors disabled:opacity-50"
              >
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold shrink-0">+</span>
                <span className="text-sm text-gray-700">
                  {creating ? 'Creating…' : <>Create <span className="font-medium text-gray-900">&ldquo;{search}&rdquo;</span> as a new ingredient</>}
                </span>
              </button>
            )}
          </div>
        )}

        {open && search && !filtered.some(ing => ing.name.toLowerCase() === search.toLowerCase()) && filtered.length === 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-2">
            <button
              type="button"
              onClick={quickCreate}
              disabled={creating}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-left hover:bg-brand-50 transition-colors disabled:opacity-50"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold shrink-0">+</span>
              <span className="text-sm text-gray-700">
                {creating ? 'Creating…' : <>Create <span className="font-medium text-gray-900">&ldquo;{search}&rdquo;</span> as a new ingredient</>}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Auto-calculated metadata */}
      {sorted.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 space-y-2.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Auto-calculated</p>
          {allergens.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-gray-500 w-16 shrink-0">Allergens</span>
              {allergens.map(a => (
                <Badge key={a} color={ALLERGEN_COLOR[a] ?? 'error'} size="sm">{a}</Badge>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 w-16 shrink-0">Allergens</span>
              <Badge color="success" size="sm">None detected</Badge>
            </div>
          )}
          {dietary.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-gray-500 w-16 shrink-0">Dietary</span>
              {dietary.map(d => (
                <Badge key={d} color={DIETARY_COLOR[d] ?? 'gray'} size="sm">{d}</Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
