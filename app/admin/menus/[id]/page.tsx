'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import EditPageLayout from '@/app/admin/components/EditPageLayout';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import { useToast } from '@/app/admin/components/ToastContainer';
import AiTranslateButton from '@/app/admin/components/AiTranslateButton';
import { AdminDateTimeField, AdminDateField, AdminTimeField } from '@/app/admin/components/ui/date-picker/admin-date-time-field';

function generateId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Convert a UTC ISO string to a local datetime-local value (YYYY-MM-DDTHH:mm) */
function toLocalDatetime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Convert a UTC ISO string to a local date value (YYYY-MM-DD) */
function toLocalDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5 space-y-5">{children}</div>
    </div>
  );
}

interface PickupSlot {
  id: string;
  startTime: string;
  endTime: string;
  capacity?: number;
}

interface PickupLocation {
  id: string;
  internalName: string;
  publicLabel: { en: string; fr: string };
  active: boolean;
}

interface ProductOption {
  id: string;
  name: string;
  slug: string;
}

/** Standalone product picker with filter, click-to-add, and "Add all" */
function ProductPicker({
  allProducts,
  linkedProductIds,
  onAdd,
  onAddAll,
}: {
  allProducts: ProductOption[];
  linkedProductIds: Set<string>;
  onAdd: (id: string) => void;
  onAddAll: () => void;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const available = allProducts.filter(
    (p) => !linkedProductIds.has(p.id) && (!search || p.name.toLowerCase().includes(search.toLowerCase()))
  );

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleAdd = (id: string) => {
    onAdd(id);
    // Keep picker open and search intact so user can keep adding
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={`Search products… (${available.length} available)`}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
            aria-label="Search products to add"
          />
        </div>
        {available.length > 0 && (
          <button
            type="button"
            onClick={onAddAll}
            className="shrink-0 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Add all ({available.length})
          </button>
        )}
      </div>

      {open && available.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {available.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleAdd(product.id)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-brand-50 hover:text-brand-700 transition-colors flex items-center justify-between group"
            >
              <span>{product.name}</span>
              <span className="text-xs text-gray-400 group-hover:text-brand-500">+ Add</span>
            </button>
          ))}
        </div>
      )}

      {open && search && available.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm text-gray-500 text-center">No matching products found</p>
        </div>
      )}
    </div>
  );
}

interface LinkedProduct {
  id: string;
  productId: string;
  productName: string;
  sortOrder: number;
  minQuantityOverride: number | null;
  maxQuantityOverride: number | null;
  quantityStepOverride: number | null;
}

interface FormData {
  titleEn: string;
  titleFr: string;
  introCopyEn: string;
  introCopyFr: string;
  status: 'draft' | 'active' | 'archived';
  orderOpens: string;
  orderCloses: string;
  allowEarlyOrdering: boolean;
  pickupDate: string;
  pickupLocationId: string;
  pickupInstructionsEn: string;
  pickupInstructionsFr: string;
  slotStartTime: string;
  slotEndTime: string;
  slotInterval: string;
  pickupSlots: PickupSlot[];
}

const EMPTY_FORM: FormData = {
  titleEn: '', titleFr: '',
  introCopyEn: '', introCopyFr: '',
  status: 'draft',
  orderOpens: '', orderCloses: '',
  allowEarlyOrdering: false,
  pickupDate: '',
  pickupLocationId: '',
  pickupInstructionsEn: '', pickupInstructionsFr: '',
  slotStartTime: '09:00', slotEndTime: '17:00', slotInterval: '30',
  pickupSlots: [],
};

export default function EditLaunchPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const isNew = params.id === 'create';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [allProducts, setAllProducts] = useState<ProductOption[]>([]);
  const [linkedProducts, setLinkedProducts] = useState<LinkedProduct[]>([]);

  const set = (patch: Partial<FormData>) => setForm((p) => ({ ...p, ...patch }));

  useEffect(() => {
    fetchLocations();
    fetchProducts();
    if (!isNew) loadLaunch();
  }, [params.id]);

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/pickup-locations?active=true');
      if (res.ok) setLocations(await res.json());
    } catch { /* ignore */ }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.products || [];
        setAllProducts(list.map((p: any) => ({ id: p.id, name: p.name || p.title || p.id, slug: p.slug || '' })));
      }
    } catch { /* ignore */ }
  };

  const loadLaunch = async () => {
    try {
      const res = await fetch(`/api/launches/${params.id}`);
      if (!res.ok) { router.push('/admin/menus'); return; }
      const d = await res.json();
      const slotConfig = d.pickupSlotConfig || {};
      setForm({
        titleEn: d.title?.en || '',
        titleFr: d.title?.fr || '',
        introCopyEn: d.introCopy?.en || '',
        introCopyFr: d.introCopy?.fr || '',
        status: d.status || 'draft',
        orderOpens: toLocalDatetime(d.orderOpens),
        orderCloses: toLocalDatetime(d.orderCloses),
        allowEarlyOrdering: d.allowEarlyOrdering ?? false,
        pickupDate: toLocalDate(d.pickupDate),
        pickupLocationId: d.pickupLocationId || '',
        pickupInstructionsEn: d.pickupInstructions?.en || '',
        pickupInstructionsFr: d.pickupInstructions?.fr || '',
        slotStartTime: slotConfig.startTime || '09:00',
        slotEndTime: slotConfig.endTime || '17:00',
        slotInterval: String(slotConfig.intervalMinutes || 30),
        pickupSlots: d.pickupSlots || [],
      });
      setLinkedProducts(
        (d.products || []).map((p: any) => ({
          id: p.id,
          productId: p.productId,
          productName: p.productName,
          sortOrder: p.sortOrder,
          minQuantityOverride: p.minQuantityOverride,
          maxQuantityOverride: p.maxQuantityOverride,
          quantityStepOverride: p.quantityStepOverride,
        }))
      );
    } catch (err) {
      console.error('Failed to load launch:', err);
      toast.error('Load failed', 'Could not load this menu. It may have been deleted.');
      router.push('/admin/menus');
    }
    finally { setLoading(false); }
  };

  // Slot generation
  const generateSlots = () => {
    const start = form.slotStartTime;
    const end = form.slotEndTime;
    const interval = parseInt(form.slotInterval, 10);
    if (!start || !end || !interval || interval <= 0) {
      toast.error('Invalid config', 'Please set valid start time, end time, and interval');
      return;
    }

    if (form.pickupSlots.length > 0) {
      if (!window.confirm('This will replace existing slots. Continue?')) return;
    }

    const slots: PickupSlot[] = [];
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let currentMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + interval <= endMinutes) {
      const slotStart = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;
      const slotEndMin = currentMinutes + interval;
      const slotEnd = `${String(Math.floor(slotEndMin / 60)).padStart(2, '0')}:${String(slotEndMin % 60).padStart(2, '0')}`;
      slots.push({ id: generateId(), startTime: slotStart, endTime: slotEnd });
      currentMinutes = slotEndMin;
    }

    set({ pickupSlots: slots });
    toast.success('Slots generated', `${slots.length} pickup slots created`);
  };

  const removeSlot = (slotId: string) => {
    set({ pickupSlots: form.pickupSlots.filter((s) => s.id !== slotId) });
  };

  const updateSlotCapacity = (slotId: string, capacity: string) => {
    set({
      pickupSlots: form.pickupSlots.map((s) =>
        s.id === slotId ? { ...s, capacity: capacity ? parseInt(capacity, 10) : undefined } : s
      ),
    });
  };

  // Product management
  const addProduct = async (productId: string) => {
    if (linkedProducts.some((p) => p.productId === productId)) return;
    const product = allProducts.find((p) => p.id === productId);
    setLinkedProducts((prev) => [
      ...prev,
      {
        id: generateId(),
        productId,
        productName: product?.name || productId,
        sortOrder: prev.length,
        minQuantityOverride: 1,
        maxQuantityOverride: null,
        quantityStepOverride: null,
      },
    ]);
  };

  const addAllProducts = () => {
    const toAdd = allProducts.filter((p) => !linkedProducts.some((lp) => lp.productId === p.id));
    if (toAdd.length === 0) return;
    const newProducts = toAdd.map((product, i) => ({
      id: generateId(),
      productId: product.id,
      productName: product.name,
      sortOrder: linkedProducts.length + i,
      minQuantityOverride: 1,
      maxQuantityOverride: null,
      quantityStepOverride: null,
    }));
    setLinkedProducts((prev) => [...prev, ...newProducts]);
    toast.success('Added', `${newProducts.length} product${newProducts.length !== 1 ? 's' : ''} added`);
  };

  const removeProduct = (lpId: string) => {
    setLinkedProducts((prev) => prev.filter((p) => p.id !== lpId));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.titleEn.trim()) e.titleEn = 'English title is required';
    if (!form.titleFr.trim()) e.titleFr = 'French title is required';
    if (!form.introCopyEn.trim()) e.introCopyEn = 'English intro is required';
    if (!form.introCopyFr.trim()) e.introCopyFr = 'French intro is required';
    if (!form.orderOpens) e.orderOpens = 'Order open date is required';
    if (!form.orderCloses) e.orderCloses = 'Order close date is required';
    if (!form.pickupDate) e.pickupDate = 'Pickup date is required';

    if (form.orderCloses && form.pickupDate) {
      const closes = new Date(form.orderCloses);
      const pickup = new Date(form.pickupDate);
      if (closes >= pickup) e.orderCloses = 'Order close must be before pickup date';
    }

    // Validate product quantity overrides
    for (const lp of linkedProducts) {
      if (lp.maxQuantityOverride != null && lp.maxQuantityOverride === 0) {
        e.products = `"${lp.productName}" has max quantity of 0 — customers won't be able to order it`;
        break;
      }
      if (lp.maxQuantityOverride != null && lp.minQuantityOverride != null && lp.maxQuantityOverride < lp.minQuantityOverride) {
        e.products = `"${lp.productName}" has max quantity (${lp.maxQuantityOverride}) less than min (${lp.minQuantityOverride})`;
        break;
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        title: { en: form.titleEn, fr: form.titleFr },
        introCopy: { en: form.introCopyEn, fr: form.introCopyFr },
        status: form.status,
        orderOpens: form.orderOpens,
        orderCloses: form.orderCloses,
        allowEarlyOrdering: form.allowEarlyOrdering,
        pickupDate: form.pickupDate,
        pickupLocationId: form.pickupLocationId || null,
        pickupInstructions: form.pickupInstructionsEn || form.pickupInstructionsFr
          ? { en: form.pickupInstructionsEn, fr: form.pickupInstructionsFr }
          : null,
        pickupSlotConfig: {
          startTime: form.slotStartTime,
          endTime: form.slotEndTime,
          intervalMinutes: parseInt(form.slotInterval, 10) || 30,
        },
        pickupSlots: form.pickupSlots,
      };

      const url = isNew ? '/api/launches' : `/api/launches/${params.id}`;
      const method = isNew ? 'POST' : 'PATCH';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();
        toast.success(isNew ? 'Menu created' : 'Menu saved', `"${form.titleEn}" has been ${isNew ? 'created' : 'updated'}`);

        const launchId = isNew ? saved.id : params.id;

        // Sync products: delete existing, re-add current list
        await fetch(`/api/launches/${launchId}/products`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            products: linkedProducts.map((p, i) => ({
              productId: p.productId,
              productName: p.productName,
              sortOrder: i,
              minQuantityOverride: p.minQuantityOverride,
              maxQuantityOverride: p.maxQuantityOverride,
              quantityStepOverride: p.quantityStepOverride,
            })),
          }),
        });

        if (isNew) {
          router.push(`/admin/menus/${saved.id}`);
        }
      } else {
        const err = await res.json();
        toast.error('Save failed', err.error || 'Failed to save menu');
      }
    } catch {
      toast.error('Save failed', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const [duplicating, setDuplicating] = useState(false);

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      const res = await fetch(`/api/launches/${params.id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        const created = await res.json();
        toast.success('Duplicated', `Menu duplicated as draft`);
        router.push(`/admin/menus/${created.id}`);
      } else {
        toast.error('Duplicate failed', 'Failed to duplicate menu');
      }
    } catch {
      toast.error('Duplicate failed', 'An unexpected error occurred');
    } finally {
      setDuplicating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const linkedProductIds = new Set(linkedProducts.map((p) => p.productId));

  return (
    <EditPageLayout
      title={isNew ? 'New Menu' : 'Edit Menu'}
      backHref="/admin/menus"
      backLabel="Back to Menus"
      onSave={handleSave}
      onCancel={() => router.push('/admin/menus')}
      saving={saving}
      maxWidth="7xl"
    >
      <div className="grid grid-cols-3 gap-6">

        {/* LEFT COLUMN */}
        <div className="col-span-2 space-y-5">

        {/* Duplicate button — only for existing menus */}
        {!isNew && (
          <button
            type="button"
            onClick={handleDuplicate}
            disabled={duplicating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {duplicating ? 'Duplicating…' : 'Duplicate menu'}
          </button>
        )}

        {/* Section 1: Menu Details — side-by-side translations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* French */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
              <span className="text-base">🇫🇷</span>
              <h2 className="text-sm font-semibold text-gray-900">Français</h2>
              <span className="text-xs text-gray-400">Affiché par défaut</span>
              <div className="ml-auto">
                <AiTranslateButton
                  targetLocale="en"
                  fields={{
                    title: form.titleFr,
                    introCopy: form.introCopyFr,
                    pickupInstructions: form.pickupInstructionsFr,
                  }}
                  onResult={(t) => set({
                    titleEn: t.title || form.titleEn,
                    introCopyEn: t.introCopy || form.introCopyEn,
                    pickupInstructionsEn: t.pickupInstructions || form.pickupInstructionsEn,
                  })}
                />
              </div>
            </div>
            <div className="px-6 py-6 space-y-4">
              <Input
                label="Titre"
                isRequired
                value={form.titleFr}
                onChange={(v) => set({ titleFr: v })}
                placeholder="Titre du menu"
                validationState={errors.titleFr ? 'error' : 'default'}
                errorMessage={errors.titleFr}
              />
              <Textarea
                label="Texte d'introduction"
                isRequired
                value={form.introCopyFr}
                onChange={(v) => set({ introCopyFr: v })}
                rows={3}
                placeholder="Texte d'introduction en français"
                validationState={errors.introCopyFr ? 'error' : 'default'}
                errorMessage={errors.introCopyFr}
              />
              <Input
                label="Instructions de cueillette"
                value={form.pickupInstructionsFr}
                onChange={(v) => set({ pickupInstructionsFr: v })}
                placeholder="Instructions en français"
              />
            </div>
          </div>

          {/* English */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
              <span className="text-base">🇬🇧</span>
              <h2 className="text-sm font-semibold text-gray-900">English</h2>
              <div className="ml-auto">
                <AiTranslateButton
                  targetLocale="fr"
                  fields={{
                    title: form.titleEn,
                    introCopy: form.introCopyEn,
                    pickupInstructions: form.pickupInstructionsEn,
                  }}
                  onResult={(t) => set({
                    titleFr: t.title || form.titleFr,
                    introCopyFr: t.introCopy || form.introCopyFr,
                    pickupInstructionsFr: t.pickupInstructions || form.pickupInstructionsFr,
                  })}
                />
              </div>
            </div>
            <div className="px-6 py-6 space-y-4">
              <Input
                label="Title"
                isRequired
                value={form.titleEn}
                onChange={(v) => set({ titleEn: v })}
                placeholder="English title"
                validationState={errors.titleEn ? 'error' : 'default'}
                errorMessage={errors.titleEn}
              />
              <Textarea
                label="Intro Copy"
                isRequired
                value={form.introCopyEn}
                onChange={(v) => set({ introCopyEn: v })}
                rows={3}
                placeholder="English intro copy"
                validationState={errors.introCopyEn ? 'error' : 'default'}
                errorMessage={errors.introCopyEn}
              />
              <Input
                label="Pickup Instructions"
                value={form.pickupInstructionsEn}
                onChange={(v) => set({ pickupInstructionsEn: v })}
                placeholder="English instructions"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Ordering Window */}
        <SectionCard title="Ordering Window" description="When customers can place orders.">
          <div className="grid grid-cols-2 gap-4">
            <AdminDateTimeField
              label="Order Opens"
              value={form.orderOpens}
              onChange={(v) => set({ orderOpens: v })}
              errorMessage={errors.orderOpens}
              isRequired
            />
            <AdminDateTimeField
              label="Order Closes"
              value={form.orderCloses}
              onChange={(v) => set({ orderCloses: v })}
              description="Orders will be rejected after this time"
              errorMessage={errors.orderCloses}
              isRequired
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.allowEarlyOrdering}
              onChange={(e) => set({ allowEarlyOrdering: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Allow ordering before menu open date</span>
              <p className="text-xs text-gray-500 mt-0.5">
                Show this menu on the storefront before the order window opens. Customers will see when ordering becomes available.
              </p>
            </div>
          </label>
        </SectionCard>

        {/* Section 3: Pickup (combined date/location + slots) */}
        <SectionCard title="Pickup" description="Pickup date, location, and time slots.">
          <div className="grid grid-cols-2 gap-4">
            <AdminDateField
              label="Pickup Date"
              value={form.pickupDate}
              onChange={(v) => set({ pickupDate: v })}
              errorMessage={errors.pickupDate}
              isRequired
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
              <select
                value={form.pickupLocationId}
                onChange={(e) => set({ pickupLocationId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                aria-label="Pickup location"
              >
                <option value="">— Select location —</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.internalName}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <AdminTimeField
              label="Start Time"
              value={form.slotStartTime}
              onChange={(v) => set({ slotStartTime: v })}
            />
            <AdminTimeField
              label="End Time"
              value={form.slotEndTime}
              onChange={(v) => set({ slotEndTime: v })}
            />
            <Input
              label="Interval (min)"
              type="number"
              value={form.slotInterval}
              onChange={(v) => set({ slotInterval: v })}
              placeholder="30"
            />
          </div>
          <button
            type="button"
            onClick={generateSlots}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Generate Slots
          </button>

          {form.pickupSlots.length > 0 && (
            <div className="space-y-2 mt-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">{form.pickupSlots.length} slots</p>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Remove all pickup slots?')) {
                      set({ pickupSlots: [] });
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove all
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {form.pickupSlots.map((slot) => (
                  <div key={slot.id} className="flex items-center gap-3 py-1.5 px-3 bg-gray-50 rounded-lg text-sm">
                    <span className="font-mono text-gray-700">{slot.startTime} – {slot.endTime}</span>
                    <input
                      type="number"
                      placeholder="Capacity"
                      value={slot.capacity ?? ''}
                      onChange={(e) => updateSlotCapacity(slot.id, e.target.value)}
                      className="w-20 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                      aria-label={`Capacity for ${slot.startTime} – ${slot.endTime}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeSlot(slot.id)}
                      className="ml-auto text-gray-400 hover:text-red-500 text-xs"
                      aria-label={`Remove slot ${slot.startTime} – ${slot.endTime}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        {/* Section 4: Products in this Menu */}
        <SectionCard title="Products in this Menu" description="Add products and set per-menu overrides.">
          {/* Product quick-add */}
          <ProductPicker
            allProducts={allProducts}
            linkedProductIds={linkedProductIds}
            onAdd={addProduct}
            onAddAll={addAllProducts}
          />

          {/* Linked products list */}
          {linkedProducts.length === 0 ? (
            <p className="text-sm text-gray-500">No products added yet.</p>
          ) : (
            <div className="space-y-1.5">
              {errors.products && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{errors.products}</p>
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">{linkedProducts.length} product{linkedProducts.length !== 1 ? 's' : ''}</p>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Remove all products from this menu?')) {
                      linkedProducts.forEach((lp) => removeProduct(lp.id));
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove all
                </button>
              </div>
              {linkedProducts.map((lp, idx) => (
                <div key={lp.id} className="relative flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-400 w-6">{idx + 1}</span>
                  <span className="text-sm font-medium text-gray-900 flex-1 truncate">{lp.productName}</span>
                  <div className="flex items-center gap-1.5">
                    <label className="sr-only" htmlFor={`min-${lp.id}`}>Min qty</label>
                    <input
                      id={`min-${lp.id}`}
                      type="number"
                      min="0"
                      placeholder="Min"
                      value={lp.minQuantityOverride ?? ''}
                      onChange={(e) => {
                        const val = e.target.value ? parseInt(e.target.value, 10) : null;
                        setLinkedProducts((prev) => prev.map((p) => p.id === lp.id ? { ...p, minQuantityOverride: val } : p));
                      }}
                      className="w-16 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                      title="Min quantity override"
                    />
                    <label className="sr-only" htmlFor={`max-${lp.id}`}>Max qty</label>
                    <input
                      id={`max-${lp.id}`}
                      type="number"
                      min="0"
                      placeholder="Max"
                      value={lp.maxQuantityOverride ?? ''}
                      onChange={(e) => {
                        const val = e.target.value ? parseInt(e.target.value, 10) : null;
                        setLinkedProducts((prev) => prev.map((p) => p.id === lp.id ? { ...p, maxQuantityOverride: val } : p));
                      }}
                      className={`w-16 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                        (lp.maxQuantityOverride != null && lp.maxQuantityOverride === 0) ||
                        (lp.maxQuantityOverride != null && lp.minQuantityOverride != null && lp.maxQuantityOverride < lp.minQuantityOverride)
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-200'
                      }`}
                      title="Max quantity override"
                    />
                    {lp.maxQuantityOverride != null && lp.maxQuantityOverride === 0 && (
                      <span className="text-[10px] text-red-500 absolute -bottom-3.5 right-8">Max can't be 0</span>
                    )}
                    {lp.maxQuantityOverride != null && lp.minQuantityOverride != null && lp.maxQuantityOverride > 0 && lp.maxQuantityOverride < lp.minQuantityOverride && (
                      <span className="text-[10px] text-red-500 absolute -bottom-3.5 right-8">Max &lt; Min</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProduct(lp.id)}
                    className="text-gray-400 hover:text-red-500 text-xs p-1"
                    aria-label={`Remove ${lp.productName}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        </div>{/* end left column */}

        {/* RIGHT COLUMN */}
        <div className="col-span-1 space-y-5">
          {/* Status card */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Status</h2>
            </div>
            <div className="px-6 py-4">
              <select
                value={form.status}
                onChange={(e) => set({ status: e.target.value as FormData['status'] })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                aria-label="Menu status"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>{/* end right column */}

      </div>{/* end grid */}
    </EditPageLayout>
  );
}
