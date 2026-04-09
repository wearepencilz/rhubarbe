'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/app/admin/components/ToastContainer';
import { Button } from '@/app/admin/components/ui/button';

interface PickupLocation {
  id: string;
  internalName: string;
  disabledPickupDays: number[];
  active: boolean;
}

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CateringSettingsPage() {
  const toast = useToast();
  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Ordering rules state
  const [orderingRules, setOrderingRules] = useState<Record<string, { minQuantity: number; quantityStep: number; label: { en: string; fr: string } }>>({});
  const [leadTimeDays, setLeadTimeDays] = useState<number>(28);

  useEffect(() => {
    Promise.all([
      fetch('/api/pickup-locations?active=true').then((r) => r.json()),
      fetch('/api/settings').then((r) => r.json()),
    ])
      .then(([locs, settings]) => {
        setLocations(locs);
        setSelectedLocationId(settings.cateringPickupLocationId || '');
        if (settings.cateringOrderingRules) setOrderingRules(settings.cateringOrderingRules);
        if (settings.cateringLeadTimeDays != null) setLeadTimeDays(settings.cateringLeadTimeDays);
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
          cateringOrderingRules: orderingRules,
          cateringLeadTimeDays: leadTimeDays,
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

  function updateRule(type: string, field: 'minQuantity' | 'quantityStep', value: number) {
    setOrderingRules((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Catering Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure pickup location and availability for catering orders.</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Pickup Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
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
          <p className="text-xs text-gray-400 mt-1">
            This location will be used for all catering orders. Disabled pickup days are configured on the location itself.
          </p>
        </div>

        {/* Show disabled days from selected location (read-only) */}
        {selectedLocation && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Disabled Pickup Days</label>
            {disabledDays.length === 0 ? (
              <p className="text-sm text-gray-400">No days disabled at this location.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {disabledDays.map((d) => (
                  <span key={d} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                    {DAY_LABELS[d]}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">
              To change disabled days, edit the <a href={`/admin/pickup-locations/${selectedLocationId}`} className="text-brand-600 underline">pickup location</a>.
            </p>
          </div>
        )}

        <div className="pt-2">
          <Button variant="primary" onClick={handleSave} isLoading={saving} isDisabled={saving}>
            Save Settings
          </Button>
        </div>
      </div>

      {/* Ordering Rules */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6 mt-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Ordering Rules</h2>
          <p className="text-xs text-gray-500 mt-1">Minimum quantity and increment step per catering type.</p>
        </div>

        {Object.entries(orderingRules).map(([type, rule]) => (
          <div key={type} className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
            <span className="text-sm font-medium text-gray-700 w-24">{rule.label?.en || type}</span>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Min</label>
              <input type="number" min={1} value={rule.minQuantity} onChange={(e) => updateRule(type, 'minQuantity', parseInt(e.target.value) || 1)}
                className="w-20 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Step</label>
              <input type="number" min={1} value={rule.quantityStep} onChange={(e) => updateRule(type, 'quantityStep', parseInt(e.target.value) || 1)}
                className="w-20 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-brand-500" />
            </div>
          </div>
        ))}

        {Object.keys(orderingRules).length === 0 && (
          <p className="text-sm text-gray-400">No ordering rules configured. Run the data migration to seed defaults.</p>
        )}
      </div>

      {/* Lead Time */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 mt-6">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Lead Time</h2>
          <p className="text-xs text-gray-500 mt-1">Minimum days in advance for catering orders.</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="number" min={1} max={365} value={leadTimeDays} onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 28)}
            className="w-24 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500" />
          <span className="text-sm text-gray-500">days</span>
        </div>

        <div className="pt-2">
          <Button variant="primary" onClick={handleSave} isLoading={saving} isDisabled={saving}>
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
