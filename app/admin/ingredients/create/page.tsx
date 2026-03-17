'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from '../../components/ImageUploader';
import TaxonomySelect from '@/app/admin/components/TaxonomySelect';
import TaxonomyTagSelect from '@/app/admin/components/TaxonomyTagSelect';
import EditPageLayout from '@/app/admin/components/EditPageLayout';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import { useToast } from '@/app/admin/components/ToastContainer';
import TaxonomyTagPicker from '@/app/admin/components/TaxonomyTagPicker';
import AiAutofillButton from '@/app/admin/components/AiAutofillButton';
import { ingredientSourceTypeOptions } from '@/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function TagPicker({
  label,
  description,
  options,
  selected,
  onChange,
}: {
  label: string;
  description?: string;
  options: readonly string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (val: string) =>
    onChange(selected.includes(val) ? selected.filter((s) => s !== val) : [...selected, val]);
  return (
    <div>
      <p className="text-sm font-medium text-gray-900 mb-0.5">{label}</p>
      {description && <p className="text-xs text-gray-500 mb-2">{description}</p>}
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
              selected.includes(opt)
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionCard({ title, description, children, collapsible = false, defaultOpen = true, action, forceOpen }: { title: string; description?: string; children: React.ReactNode; collapsible?: boolean; defaultOpen?: boolean; action?: React.ReactNode; forceOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = forceOpen || open;
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div
        className={`px-6 py-4 border-b border-gray-100 flex items-center justify-between ${collapsible ? 'cursor-pointer select-none' : ''}`}
        onClick={collapsible ? () => setOpen((o) => !o) : undefined}
      >
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {action && <span onClick={(e) => e.stopPropagation()}>{action}</span>}
          {collapsible && (
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>
      {(!collapsible || isOpen) && (
        <div className="px-6 py-5 space-y-5">{children}</div>
      )}
    </div>
  );
}

const emptyForm = {
  name: '',
  latinName: '',
  origin: '',
  taxonomyCategory: '',
  description: '',
  story: '',
  tastingNotes: [] as string[],
  texture: [] as string[],
  process: [] as string[],
  attributes: [] as string[],
  usedAs: [] as string[],
  sourceName: '',
  sourceType: '',
  allergens: [] as string[],
  availableMonths: [] as number[],
  animalDerived: false,
  image: '',
  imageAlt: '',
};

export default function CreateIngredientPage() {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [allOpen, setAllOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const set = (patch: Partial<typeof emptyForm>, touch = true) => {
    if (touch) {
      setTouchedFields((prev) => {
        const next = new Set(prev);
        Object.keys(patch).forEach((k) => next.add(k));
        return next;
      });
    }
    setFormData((p) => ({ ...p, ...patch }));
  };

  const handleAutofill = (result: Partial<typeof emptyForm>) => {
    setAllOpen(true);
    const skip = (field: string) => touchedFields.has(field);
    set({
      ...(!skip('latinName') && result.latinName && { latinName: result.latinName }),
      ...(!skip('origin') && result.origin && { origin: result.origin }),
      ...(!skip('description') && result.description && { description: result.description }),
      ...(!skip('story') && result.story && { story: result.story }),
      ...(!skip('tastingNotes') && result.tastingNotes?.length && { tastingNotes: result.tastingNotes }),
      ...(!skip('texture') && result.texture?.length && { texture: result.texture }),
      ...(!skip('process') && result.process?.length && { process: result.process }),
      ...(!skip('attributes') && result.attributes?.length && { attributes: result.attributes }),
      ...(!skip('availableMonths') && result.availableMonths?.length && { availableMonths: result.availableMonths }),
    }, false);
  };

  const toggleMonth = (i: number) =>
    set({
      availableMonths: formData.availableMonths.includes(i)
        ? formData.availableMonths.filter((m) => m !== i)
        : [...formData.availableMonths, i].sort((a, b) => a - b),
    });

  const handleSave = async () => {
    if (!formData.name) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const created = await res.json();
        toast.success('Ingredient created');
        router.push(`/admin/ingredients/${created.id}`);
      } else {
        toast.error('Failed to create ingredient');
      }
    } catch {
      toast.error('Failed to create ingredient');
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditPageLayout
      title="New Ingredient"
      backHref="/admin/ingredients"
      backLabel="Back to Ingredients"
      onSave={handleSave}
      onCancel={() => router.push('/admin/ingredients')}
      saving={saving}
      maxWidth="7xl"
    >
      <div className="grid grid-cols-3 gap-6">

        {/* ── Left: main form ── */}
        <div className="col-span-2 space-y-5">

          <SectionCard title="Basics" description="Name, category, and origin." action={
            <AiAutofillButton
              name={formData.name}
              latinName={formData.latinName}
              origin={formData.origin}
              onResult={handleAutofill}
            />
          }>
            <Input label="Name" type="text" isRequired value={formData.name} onChange={(v) => set({ name: v })} placeholder="e.g., Blood Orange" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Origin" type="text" value={formData.origin} onChange={(v) => set({ origin: v })} placeholder="e.g., Sicily" />
              <TaxonomySelect category="ingredientCategories" value={formData.taxonomyCategory} onChange={(v) => set({ taxonomyCategory: v })} label="Category" />
            </div>
            <Input label="Latin Name" type="text" value={formData.latinName} onChange={(v) => set({ latinName: v })} placeholder="e.g., Citrus × sinensis" />
          </SectionCard>

          <SectionCard title="Story & Provenance" description="Editorial context for this ingredient.">
            <Textarea label="Description" value={formData.description} onChange={(v) => set({ description: v })} rows={2} placeholder="One-line description..." />
            <Textarea label="Story & Provenance" value={formData.story} onChange={(v) => set({ story: v })} rows={5} placeholder="Where does it come from? Who grows it? Why does it matter?" />
          </SectionCard>

          <SectionCard title="Sensory & Culinary Profile" description="How this ingredient is perceived and prepared." collapsible defaultOpen={false} forceOpen={allOpen}>
            <TaxonomyTagPicker
              category="tastingNotes"
              label="Tasting Notes"
              description="How this ingredient is perceived on the palate"
              values={formData.tastingNotes}
              onChange={(v) => set({ tastingNotes: v })}
            />
            <TaxonomyTagPicker
              category="ingredientTextures"
              label="Texture"
              description="Mouthfeel contribution"
              values={formData.texture}
              onChange={(v) => set({ texture: v })}
            />
            <TaxonomyTagPicker
              category="ingredientProcesses"
              label="Process / Preparation"
              description="How this ingredient is transformed before use"
              values={formData.process}
              onChange={(v) => set({ process: v })}
            />
            <TaxonomyTagPicker
              category="ingredientAttributes"
              label="Attributes"
              description="Provenance and dietary characteristics"
              values={formData.attributes}
              onChange={(v) => set({ attributes: v })}
            />
          </SectionCard>

          <SectionCard title="Sourcing" description="Where this ingredient comes from." collapsible defaultOpen={false} forceOpen={allOpen}>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Source Name" type="text" value={formData.sourceName} onChange={(v) => set({ sourceName: v })} placeholder="e.g., Ferme Cadet-Roussel" />
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1.5">Source Type</p>
                <div className="flex flex-wrap gap-1.5">
                  {ingredientSourceTypeOptions.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set({ sourceType: formData.sourceType === t ? '' : t })}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                        formData.sourceType === t
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Usage" description="How this ingredient is used in a recipe." collapsible defaultOpen={false} forceOpen={allOpen}>
            <TaxonomyTagSelect
              category="ingredientUsedAs"
              values={formData.usedAs}
              onChange={(v) => set({ usedAs: v })}
              label="Used As"
            />
          </SectionCard>

          <SectionCard title="Operational" description="Allergens and seasonal availability." collapsible defaultOpen={false} forceOpen={allOpen}>
            <TaxonomyTagSelect
              category="allergens"
              values={formData.allergens}
              onChange={(v) => set({ allergens: v })}
              label="Allergens"
              allowCreate={false}
            />
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Season</p>
              <p className="text-xs text-gray-500 mb-2">Leave empty if available year-round</p>
              <div className="flex gap-1.5 flex-wrap">
                {MONTHS.map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMonth(i)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                      formData.availableMonths.includes(i)
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

        </div>

        {/* ── Right rail ── */}
        <div className="col-span-1">
          <SectionCard title="Image" description="Upload a photo of this ingredient.">
            <ImageUploader
              value={formData.image}
              onChange={(url: string) => set({ image: url })}
              altText={formData.imageAlt}
              onAltTextChange={(alt: string) => set({ imageAlt: alt })}
              aspectRatio="1:1"
              label="Ingredient Image"
              required={false}
            />
          </SectionCard>
        </div>

      </div>
    </EditPageLayout>
  );
}
