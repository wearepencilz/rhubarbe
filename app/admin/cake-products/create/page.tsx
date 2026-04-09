'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EditPageLayout from '@/app/admin/components/EditPageLayout';
import { Input } from '@/app/admin/components/ui/input';
import { Select } from '@/app/admin/components/ui/select';
import { useToast } from '@/app/admin/components/ToastContainer';

const PRODUCT_TYPE_OPTIONS = [
  { id: 'cake-xxl', label: 'Large Format (XXL)' },
  { id: 'sheet-cake', label: 'Sheet Cake' },
  { id: 'croquembouche', label: 'Croquembouche' },
  { id: 'wedding-cake-tiered', label: 'Tiered Wedding Cake' },
  { id: 'wedding-cake-tasting', label: 'Wedding Cake Tasting' },
];

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function CreateCakeProductPage() {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [cakeProductType, setCakeProductType] = useState('');
  const [descEn, setDescEn] = useState('');
  const [descFr, setDescFr] = useState('');

  const isDirty = !!name;

  function handleNameChange(v: string) {
    setName(v);
    if (!slug || slug === slugify(name)) setSlug(slugify(v));
  }

  async function handleSave() {
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/cake-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || slugify(name),
          cakeProductType: cakeProductType || null,
          cakeDescription: (descEn || descFr) ? { en: descEn, fr: descFr } : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create product');
      }
      const product = await res.json();
      toast.success('Created', 'Cake product created successfully');
      router.push(`/admin/cake-products/${product.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <EditPageLayout
      title="Create Cake Product"
      backHref="/admin/cake-products"
      backLabel="Back to Cake Products"
      onSave={handleSave}
      onCancel={() => router.push('/admin/cake-products')}
      saving={saving}
      error={error}
      isDirty={isDirty}
    >
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Basics</h2>
          <Input label="Product Name" value={name} onChange={handleNameChange} isRequired placeholder="e.g. Gâteau Pistache" />
          <Input label="Slug" value={slug} onChange={setSlug} placeholder="auto-generated" />
          <Select label="Product Type" value={cakeProductType} onChange={setCakeProductType} options={PRODUCT_TYPE_OPTIONS} placeholder="Select type…" />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Description</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="English" value={descEn} onChange={setDescEn} placeholder="Description for customers" />
            <Input label="Français" value={descFr} onChange={setDescFr} placeholder="Description pour les clients" />
          </div>
        </div>
      </div>
    </EditPageLayout>
  );
}
