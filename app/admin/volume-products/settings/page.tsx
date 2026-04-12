'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/app/admin/components/ToastContainer';
import { Button } from '@/app/admin/components/ui/button';
import { Plus } from '@untitledui/icons';

interface PickupLocation {
  id: string;
  internalName: string;
  disabledPickupDays: number[];
  active: boolean;
}

interface LeadTimeTier {
  minQuantity: number;
  leadTimeDays: number;
}

interface CateringTypeConfig {
  label: { en: string; fr: string };
  orderScope: 'variant' | 'order';
  orderMinimum: number;
  variantMinimum: number;
  increment: number;
  unitLabel: 'quantity' | 'people';
  maxAdvanceDays: number | null;
  leadTimeTiers: LeadTimeTier[];
}

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const CATERING_TYPES = ['brunch', 'lunch', 'dinatoire'] as const;

const DEFAULT_CONFIGS: Record<string, CateringTypeConfig> = {
  brunch: { label: { en: 'Buffet', fr: 'Buffet' }, orderScope: 'variant', orderMinimum: 12, variantMinimum: 12, increment: 6, unitLabel: 'quantity', maxAdvanceDays: null, leadTimeTiers: [] },
  lunch: { label: { en: 'Lunch', fr: 'Lunch' }, orderScope: 'order', orderMinimum: 6, variantMinimum: 0, increment: 1, unitLabel: 'people', maxAdvanceDays: null, leadTimeTiers: [] },
  dinatoire: { label: { en: 'Dînatoire', fr: 'Dînatoire' }, orderScope: 'order', orderMinimum: 3, variantMinimum: 0, increment: 1, unitLabel: 'people', maxAdvanceDays: null, leadTimeTiers: [] },
};

export default function CateringSettingsPage() {
  const toast = useToast();
  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [typeConfigs, setTypeConfigs] = useState<Record<string, CateringTypeConfig>>({});
  const [deliveryMinForAnyday, setDeliveryMinForAnyday] = useState<number>(200000); // cents, default $2000
  const [closedPickupDays, setClosedPickupDays] = useState<number[]>([0]); // default Sunday

  useEffect(() => {
    Promise.all([
      fetch('/api/pickup-locations?active=true').then((r) => r.json()),
      fetch('/api/settings').then((r) => r.json()),
    ])
      .then(([locs, settings]) => {
        setLocations(locs);
        setSelectedLocationId(settings.cateringPickupLocationId || '');
        if (settings.deliveryMinForAnyday != null) setDeliveryMinForAnyday(settings.deliveryMinForAnyday);
        if (settings.closedPickupDays) setClosedPickupDays(settings.closedPickupDays);
        // Merge saved configs with defaults
        const saved = (settings.cateringTypeSettings ?? {}) as Record<string, Partial<CateringTypeConfig>>;
        const merged: Record<string, CateringTypeConfig> = {};
        for (const type of CATERING_TYPES) {
          merged[type] = { ...DEFAULT_CONFIGS[type], ...saved[type] };
        }
        setTypeConfigs(merged);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectedLocation = locations.find((l) => l.id === selectedLocationId);
  const disabledDays = selectedLocation?.disabledPickupDays ?? [];

  const handleSave = async () => {
    setSaving(true);
    try {
      const current = await fetch('/api/settings').then((r) => r.json());
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...current,
          cateringPickupLocationId: selectedLocationId || null,
          cateringTypeSettings: typeConfigs,
          deliveryMinForAnyday,
          closedPickupDays,
        }),
      });
      if (res.ok) toast.success('Settings saved');
      else toast.error('Failed to save');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  function updateConfig(type: string, patch: Partial<CateringTypeConfig>) {
    setTypeConfigs((prev) => ({ ...prev, [type]: { ...prev[type], ...patch } }));
  }

  function addTier(type: string) {
    const tiers = typeConfigs[type].leadTimeTiers;
    const lastMin = tiers.length > 0 ? tiers[tiers.length - 1].minQuantity : 0;
    updateConfig(type, { leadTimeTiers: [...tiers, { minQuantity: lastMin + 1, leadTimeDays: 1 }] });
  }

  function updateTier(type: string, index: number, field: keyof LeadTimeTier, value: string) {
    const tiers = [...typeConfigs[type].leadTimeTiers];
    tiers[index] = { ...tiers[index], [field]: parseInt(value) || 0 };
    updateConfig(type, { leadTimeTiers: tiers });
  }

  function removeTier(type: string, index: number) {
    updateConfig(type, { leadTimeTiers: typeConfigs[type].leadTimeTiers.filter((_, i) => i !== index) });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Catering Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Ordering rules, lead times, and pickup configuration per catering type.</p>
        </div>
        <Button variant="primary" onClick={handleSave} isLoading={saving} isDisabled={saving}>
          Save Settings
        </Button>
      </div>

      {/* Pickup Location */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6 mb-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Pickup Location</h2>
          <p className="text-xs text-gray-500 mt-1">Used for all catering orders.</p>
        </div>
        <div>
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
            aria-label="Pickup location for catering"
          >
            <option value="">— No location assigned —</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.internalName}</option>
            ))}
          </select>
        </div>
        {selectedLocation && disabledDays.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Disabled Pickup Days</label>
            <div className="flex flex-wrap gap-2">
              {disabledDays.map((d) => (
                <span key={d} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                  {DAY_LABELS[d]}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Edit disabled days on the <a href={`/admin/pickup-locations/${selectedLocationId}`} className="text-brand-600 underline">pickup location</a>.
            </p>
          </div>
        )}
      </div>

      {/* Delivery & Calendar Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6 mb-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Delivery & Calendar</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Closed pickup days</label>
          <p className="text-xs text-gray-400 mb-2">Days when pickup is not available. These are blocked on the calendar.</p>
          <div className="flex flex-wrap gap-2">
            {DAY_LABELS.map((label, i) => (
              <button key={i} type="button"
                onClick={() => setClosedPickupDays((prev) => prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i])}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${closedPickupDays.includes(i) ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery minimum for any-day delivery ($)</label>
          <p className="text-xs text-gray-400 mb-2">When the cart total exceeds this amount, all days become available (closed days are unblocked).</p>
          <input type="number" min={0} step={1}
            value={deliveryMinForAnyday / 100}
            onChange={(e) => setDeliveryMinForAnyday(Math.round(parseFloat(e.target.value || '0') * 100))}
            className="w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" />
        </div>
      </div>
      {/* Per-type settings */}
      {CATERING_TYPES.map((type) => {
        const config = typeConfigs[type];
        if (!config) return null;
        return (
          <div key={type} className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-900">{config.label.en}</h2>
            </div>
            <div className="px-6 py-5 space-y-6">

              {/* Ordering Rules */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ordering Rules</h3>

                {/* Scope */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Scope</label>
                  <div className="flex gap-2">
                    {(['variant', 'order'] as const).map((s) => (
                      <button key={s} type="button" onClick={() => updateConfig(type, { orderScope: s })}
                        className={`flex-1 py-1.5 text-xs uppercase tracking-widest rounded border transition-colors ${config.orderScope === s ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'}`}>
                        {s === 'variant' ? 'Per Variant' : 'Per Order'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {config.orderScope === 'order' ? 'Order Minimum' : 'Order Min (unused)'}
                    </label>
                    <input type="number" min={0} value={config.orderMinimum} onChange={(e) => updateConfig(type, { orderMinimum: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-400"
                      disabled={config.orderScope === 'variant'} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {config.orderScope === 'variant' ? 'Variant Minimum' : 'Variant Min (unused)'}
                    </label>
                    <input type="number" min={0} value={config.variantMinimum} onChange={(e) => updateConfig(type, { variantMinimum: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-400"
                      disabled={config.orderScope === 'order'} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Increment</label>
                    <input type="number" min={1} value={config.increment} onChange={(e) => updateConfig(type, { increment: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500" />
                  </div>
                </div>
              </div>

              {/* Unit Label */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit Label</h3>
                <div className="flex gap-2">
                  {(['quantity', 'people'] as const).map((opt) => (
                    <button key={opt} type="button" onClick={() => updateConfig(type, { unitLabel: opt })}
                      className={`flex-1 py-1.5 text-xs uppercase tracking-widest rounded border transition-colors ${config.unitLabel === opt ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'}`}>
                      {opt === 'quantity' ? 'Quantity' : 'People'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lead Time Tiers */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lead Time Tiers</h3>
                  <Button variant="secondary" size="sm" onClick={() => addTier(type)} iconLeading={Plus}>
                    Add Tier
                  </Button>
                </div>
                {config.leadTimeTiers.length === 0 ? (
                  <p className="text-sm text-gray-400">No tiers configured.</p>
                ) : (
                  <div className="space-y-1.5">
                    {config.leadTimeTiers.map((tier, index) => (
                      <div key={index} className="flex items-center gap-3 py-1.5 px-3 bg-gray-50 rounded-lg text-sm">
                        <span className="text-xs text-gray-400 w-4">{index + 1}</span>
                        <span className="text-xs text-gray-500">Min qty</span>
                        <input type="number" value={tier.minQuantity.toString()} onChange={(e) => updateTier(type, index, 'minQuantity', e.target.value)}
                          className="w-20 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                          aria-label={`Tier ${index + 1} minimum quantity`} />
                        <span className="text-xs text-gray-500">Lead time</span>
                        <input type="number" value={tier.leadTimeDays.toString()} onChange={(e) => updateTier(type, index, 'leadTimeDays', e.target.value)}
                          className="w-20 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500"
                          aria-label={`Tier ${index + 1} lead time days`} />
                        <span className="text-xs text-gray-500">days</span>
                        <button type="button" onClick={() => removeTier(type, index)}
                          className="ml-auto text-gray-400 hover:text-red-500 text-xs" aria-label={`Remove tier ${index + 1}`}>
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Max advance booking */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Max Advance Booking</h3>
                <div className="flex items-center gap-3">
                  <input type="number" min={0} max={365} value={config.maxAdvanceDays ?? ''} onChange={(e) => updateConfig(type, { maxAdvanceDays: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="No limit"
                    className="w-32 px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500" />
                  <span className="text-sm text-gray-500">days</span>
                </div>
              </div>

            </div>
          </div>
        );
      })}

      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSave} isLoading={saving} isDisabled={saving}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
