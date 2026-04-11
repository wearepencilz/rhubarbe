'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import EditPageLayout from '@/app/admin/components/EditPageLayout';
import AdminLocaleSwitcher from '@/app/admin/components/AdminLocaleSwitcher';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import { Badge } from '@/app/admin/components/ui/nav/badges';
import { Button } from '@/app/admin/components/ui/button';
import { useToast } from '@/app/admin/components/ToastContainer';
import { useAllergenOptions } from '@/app/admin/hooks/useAllergenOptions';
import { useTaxonomyOptions } from '@/app/admin/hooks/useTaxonomyOptions';
import ShopifyProductPicker from '@/app/admin/components/ShopifyProductPicker';
import ShopifyVariantsDisplay from '@/app/admin/components/ShopifyVariantsDisplay';
import ImageUploader from '@/app/admin/components/ImageUploader';
import AiTranslateButton from '@/app/admin/components/AiTranslateButton';
import TaxShippingSection from '@/app/admin/components/TaxShippingSection';
import { DatePicker } from '@/app/admin/components/ui/date-picker/date-picker';
import { parseDate } from '@internationalized/date';
import { Plus } from '@untitledui/icons';

interface VolumeProduct {
  id: string;
  name: string;
  slug: string;
  title: string | null;
  image: string | null;
  description: string | null;
  shortCardCopy: string | null;
  status: string | null;
  price: number | null;
  translations: Record<string, Record<string, string>> | null;
  taxBehavior: string;
  taxThreshold: number;
  taxUnitCount: number;
  volumeEnabled: boolean;
  shopifyProductId: string | null;
  shopifyProductHandle: string | null;
  cateringType: string | null;
  cateringEndDate: string | null;
  allergens: string[] | null;
  dietaryTags: string[] | null;
  temperatureTags: string[] | null;
  volumeVariants: Array<{
    id?: string;
    label: { en: string; fr: string };
    shopifyVariantId?: string | null;
    sortOrder?: number;
    active?: boolean;
    description?: { en: string; fr: string } | null;
  }>;
}

function SectionCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        {action && <div className="flex-shrink-0 ml-4">{action}</div>}
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

export default function EditVolumeProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<VolumeProduct | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [isDirty, setIsDirty] = useState(false);
  const [disableConfirmOpen, setDisableConfirmOpen] = useState(false);

  // Form state
  const [volumeEnabled, setVolumeEnabled] = useState(false);
  const [volumeVariants, setVolumeVariantsState] = useState<Array<{
    label: { en: string; fr: string };
    shopifyVariantId?: string | null;
    sortOrder?: number;
    active?: boolean;
    description: { en: string; fr: string };
  }>>([]);

  // Catering-specific state
  const [cateringType, setCateringType] = useState('');
  const [allergens, setAllergens] = useState<string[]>([]);
  const [dietaryTags, setDietaryTags] = useState<string[]>([]);
  const [temperatureTags, setTemperatureTags] = useState<string[]>([]);
  const [cateringEndDate, setCateringEndDate] = useState('');

  const allergenOptions = useAllergenOptions();
  const temperatureOptions = useTaxonomyOptions('cateringTemperature');
  const dietaryOptions = useTaxonomyOptions('cateringDietary');

  // Core product fields
  const [productName, setProductName] = useState('');
  const [productSlug, setProductSlug] = useState('');
  const [productImage, setProductImage] = useState('');
  const [productTitle, setProductTitle] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productShortCardCopy, setProductShortCardCopy] = useState('');
  const [productStatus, setProductStatus] = useState('draft');
  const [shopifyProductId, setShopifyProductId] = useState('');
  const [shopifyProductHandle, setShopifyProductHandle] = useState('');
  const [taxBehavior, setTaxBehavior] = useState('always_taxable');
  const [taxThreshold, setTaxThreshold] = useState(6);
  const [taxUnitCount, setTaxUnitCount] = useState(1);
  const [titleFr, setTitleFr] = useState('');
  const [prodDescriptionFr, setProdDescriptionFr] = useState('');
  const [shortCardCopyFr, setShortCardCopyFr] = useState('');
  const shopifyPickerOpenRef = useRef<(() => void) | null>(null);
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  async function fetchProduct() {
    try {
      setLoading(true);
      const res = await fetch(`/api/volume-products/${params.id}`);
      if (!res.ok) {
        setError('Catering product not found');
        return;
      }
      const data: VolumeProduct = await res.json();
      setProduct(data);
      setVolumeEnabled(data.volumeEnabled);
      setVolumeVariantsState(
        (data.volumeVariants || []).map((v) => ({
          label: v.label || { en: '', fr: '' },
          shopifyVariantId: v.shopifyVariantId ?? null,
          sortOrder: v.sortOrder ?? 0,
          active: v.active ?? true,
          description: v.description || { en: '', fr: '' },
        }))
      );
      // Catering fields
      setCateringType(data.cateringType ?? '');
      setAllergens(data.allergens ?? []);
      setDietaryTags(data.dietaryTags ?? []);
      setTemperatureTags(data.temperatureTags ?? []);
      setCateringEndDate(data.cateringEndDate ? data.cateringEndDate.split('T')[0] : '');

      // Core product fields
      setProductName(data.name ?? '');
      setProductSlug(data.slug ?? '');
      setProductImage(data.image ?? '');
      setProductTitle(data.title ?? data.name ?? '');
      setProductDescription(data.description ?? '');
      setProductShortCardCopy(data.shortCardCopy ?? '');
      setProductStatus(data.status ?? 'draft');
      setShopifyProductId(data.shopifyProductId ?? '');
      setShopifyProductHandle(data.shopifyProductHandle ?? '');
      setTaxBehavior(data.taxBehavior ?? 'always_taxable');
      setTaxThreshold(data.taxThreshold ?? 6);
      setTaxUnitCount(data.taxUnitCount ?? 1);
      setTitleFr(data.translations?.fr?.title ?? '');
      setProdDescriptionFr(data.translations?.fr?.description ?? '');
      setShortCardCopyFr(data.translations?.fr?.shortCardCopy ?? '');

      // Auto-sync from Shopify
      if (data.shopifyProductId) {
        fetch(`/api/products/${params.id}/sync-shopify-status`)
          .then((r) => r.ok ? r.json() : null)
          .then((synced) => {
            if (synced) {
              if (synced.status) setProductStatus(synced.status);
              if (synced.image) setProductImage(synced.image);
              if (synced.name) setProductName(synced.name);
              if (synced.slug) setProductSlug(synced.slug);
            }
          }).catch(() => {});
      }
    } catch {
      setError('Failed to load catering product');
    } finally {
      setLoading(false);
    }
  }

  const markDirty = useCallback(() => setIsDirty(true), []);

  // --- Catering toggle ---
  function handleToggleVolume(checked: boolean) {
    if (!checked && volumeEnabled) {
      setDisableConfirmOpen(true);
      return;
    }
    setVolumeEnabled(checked);
    markDirty();
  }

  function confirmDisable() {
    setVolumeEnabled(false);
    setDisableConfirmOpen(false);
    markDirty();
  }

  // --- Variants ---
  function addVariant() {
    setVolumeVariantsState((prev) => [
      ...prev,
      { label: { en: '', fr: '' }, description: { en: '', fr: '' }, active: true, sortOrder: prev.length },
    ]);
    markDirty();
  }

  function updateVariantLabel(index: number, locale: 'en' | 'fr', value: string) {
    setVolumeVariantsState((prev) =>
      prev.map((v, i) => (i === index ? { ...v, label: { ...v.label, [locale]: value } } : v))
    );
    markDirty();
  }

  function updateVariantDescription(index: number, locale: 'en' | 'fr', value: string) {
    setVolumeVariantsState((prev) =>
      prev.map((v, i) => (i === index ? { ...v, description: { ...v.description, [locale]: value } } : v))
    );
    markDirty();
  }

  function removeVariant(index: number) {
    setVolumeVariantsState((prev) => prev.filter((_, i) => i !== index));
    markDirty();
  }

  // --- Save ---
  async function handleSave() {
    setError(undefined);
    setSaving(true);
    try {
      // Save core product fields
      await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: productName, title: productTitle, slug: productSlug,
          image: productImage || null, description: productDescription || null,
          shortCardCopy: productShortCardCopy || null, status: productStatus,
          allergens, taxBehavior, taxThreshold, taxUnitCount,
          translations: (titleFr || prodDescriptionFr || shortCardCopyFr)
            ? { fr: { title: titleFr || undefined, description: prodDescriptionFr || undefined, shortCardCopy: shortCardCopyFr || undefined } }
            : undefined,
        }),
      });

      // Save catering-specific fields
      const payload = {
        volumeEnabled,
        cateringType: cateringType || null,
        cateringEndDate: cateringEndDate || null,
        allergens,
        dietaryTags,
        temperatureTags,
        volumeVariants: volumeVariants.map((v, idx) => ({
          label: v.label,
          shopifyVariantId: v.shopifyVariantId ?? null,
          sortOrder: idx,
          active: v.active ?? true,
          description: (v.description.en || v.description.fr) ? v.description : null,
        })),
      };

      const res = await fetch(`/api/volume-products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        setProduct(updated);
        setIsDirty(false);
        toast.success('Saved', 'Catering product configuration updated');
      } else {
        const err = await res.json();
        const msg = err.details || err.error || 'Failed to save';
        setError(msg);
        toast.error('Save failed', msg);
      }
    } catch {
      setError('An unexpected error occurred');
      toast.error('Save failed', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.push('/admin/volume-products');
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/products/${params.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/volume-products');
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to delete');
      }
    } catch {
      setError('Failed to delete product');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <EditPageLayout
        title="Catering Product"
        backHref="/admin/volume-products"
        backLabel="Back to Catering Products"
        onSave={() => {}}
        onCancel={handleCancel}
        error={error || 'Product not found'}
      >
        <div />
      </EditPageLayout>
    );
  }

  const shopifyAdminUrl = shopifyProductId
    ? `https://admin.shopify.com/store/${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.replace('.myshopify.com', '')}/products/${shopifyProductId.replace('gid://shopify/Product/', '')}`
    : null;

  return (
    <EditPageLayout
      title={product.name}
      backHref="/admin/volume-products"
      backLabel="Back to Catering Products"
      onSave={handleSave}
      onDelete={handleDelete}
      onCancel={handleCancel}
      saving={saving}
      error={error}
      isDirty={isDirty}
      maxWidth="7xl"
    >
      <div className="flex justify-end mb-6">
        <AdminLocaleSwitcher />
      </div>

      <div className="grid grid-cols-3 gap-6 items-start">

        {/* Left column */}
        <div className="col-span-2 space-y-6">

        {/* Bilingual product content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
              <span className="text-base">🇫🇷</span>
              <h2 className="text-sm font-semibold text-gray-900">Français</h2>
              <div className="ml-auto">
                <AiTranslateButton targetLocale="en"
                  fields={{ title: titleFr, description: prodDescriptionFr, shortCardCopy: shortCardCopyFr }}
                  onResult={(t) => { if (t.title) setProductTitle(t.title); if (t.description) setProductDescription(t.description); if (t.shortCardCopy) setProductShortCardCopy(t.shortCardCopy); markDirty(); }} />
              </div>
            </div>
            <div className="px-6 py-6 space-y-4">
              <Input label="Titre" value={titleFr} onChange={(v) => { setTitleFr(v); markDirty(); }} placeholder={productTitle || 'Titre'} />
              <Textarea label="Description" value={prodDescriptionFr} onChange={(v) => { setProdDescriptionFr(v); markDirty(); }} rows={4} placeholder="Description en français" />
              <Input label="Texte carte" value={shortCardCopyFr} onChange={(v) => { setShortCardCopyFr(v); markDirty(); }} placeholder="Texte court" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
              <span className="text-base">🇬🇧</span>
              <h2 className="text-sm font-semibold text-gray-900">English</h2>
              <div className="ml-auto">
                <AiTranslateButton targetLocale="fr"
                  fields={{ title: productTitle, description: productDescription, shortCardCopy: productShortCardCopy }}
                  onResult={(t) => { if (t.title) setTitleFr(t.title); if (t.description) setProdDescriptionFr(t.description); if (t.shortCardCopy) setShortCardCopyFr(t.shortCardCopy); markDirty(); }} />
              </div>
            </div>
            <div className="px-6 py-6 space-y-4">
              <Input label="Title" value={productTitle} onChange={(v) => { setProductTitle(v); markDirty(); }} isRequired />
              <Textarea label="Description" value={productDescription} onChange={(v) => { setProductDescription(v); markDirty(); }} rows={4} />
              <Input label="Short card copy" value={productShortCardCopy} onChange={(v) => { setProductShortCardCopy(v); markDirty(); }} />
            </div>
          </div>
        </div>

        {/* Product Details */}
        <SectionCard title="Product Details" description="Name and slug sync from Shopify when linked.">
          <div className="grid grid-cols-2 gap-4">
            {shopifyProductId ? (
              <>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><p className="text-sm text-gray-900 py-2">{productName} <span className="text-xs text-gray-400">(from Shopify)</span></p></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Slug</label><p className="text-sm text-gray-900 py-2 font-mono">{productSlug} <span className="text-xs text-gray-400">(from Shopify)</span></p></div>
              </>
            ) : (
              <>
                <Input label="Name" value={productName} onChange={(v) => { setProductName(v); markDirty(); }} isRequired />
                <Input label="Slug" value={productSlug} onChange={(v) => { setProductSlug(v); markDirty(); }} isRequired />
              </>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            {shopifyProductId ? (
              <p className="text-sm text-gray-600 py-2">{productStatus} <span className="text-xs text-gray-400">(managed in Shopify)</span></p>
            ) : (
              <select value={productStatus} onChange={(e) => { setProductStatus(e.target.value); markDirty(); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500">
                <option value="draft">Draft</option><option value="active">Active</option><option value="sold-out">Sold Out</option><option value="archived">Archived</option>
              </select>
            )}
          </div>
        </SectionCard>

        {/* Catering Display */}
        <SectionCard title="Catering Display">
          <div>
            <DatePicker
              aria-label="End Date"
              value={cateringEndDate ? parseDate(cateringEndDate) : null}
              onChange={(date) => { setCateringEndDate(date ? date.toString() : ''); markDirty(); }}
            />
            <p className="text-xs text-gray-400 mt-1">Leave empty if this product has no end date.</p>
          </div>
        </SectionCard>

        {/* Allergens */}
        <SectionCard title="Allergens">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Allergens</label>
            <div className="flex flex-wrap gap-2">
              {allergenOptions.map((a: string) => (
                <button key={a} type="button" onClick={() => { setAllergens(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]); markDirty(); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${allergens.includes(a) ? 'bg-red-50 border-red-300 text-red-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Filters */}
        <SectionCard title="Filters" description="Temperature and dietary filters for the catering menu.">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Temperature</label>
            <div className="flex flex-wrap gap-2">
              {temperatureOptions.map((t) => (
                <button key={t} type="button" onClick={() => { setTemperatureTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]); markDirty(); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${temperatureTags.includes(t) ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dietary</label>
            <div className="flex flex-wrap gap-2">
              {dietaryOptions.map((d) => (
                <button key={d} type="button" onClick={() => { setDietaryTags(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]); markDirty(); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${dietaryTags.includes(d) ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Variants */}
        <SectionCard
          title="Variants"
          description="Catering variants with bilingual labels and descriptions."
          action={
            <Button variant="secondary" size="sm" onClick={addVariant} iconLeading={Plus}>
              Add Variant
            </Button>
          }
        >
          {volumeVariants.length === 0 ? (
            <p className="text-sm text-gray-500">No variants configured.</p>
          ) : (
            <div className="space-y-4">
              {volumeVariants.map((variant, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Variant {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-gray-400 hover:text-red-500 text-xs"
                      aria-label={`Remove variant ${index + 1}`}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Label (EN)"
                      value={variant.label.en}
                      onChange={(v) => updateVariantLabel(index, 'en', v)}
                      placeholder="English label"
                      size="sm"
                    />
                    <Input
                      label="Label (FR)"
                      value={variant.label.fr}
                      onChange={(v) => updateVariantLabel(index, 'fr', v)}
                      placeholder="Libellé en français"
                      size="sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Description (EN)"
                      value={variant.description.en}
                      onChange={(v) => updateVariantDescription(index, 'en', v)}
                      placeholder="English description"
                      size="sm"
                    />
                    <Input
                      label="Description (FR)"
                      value={variant.description.fr}
                      onChange={(v) => updateVariantDescription(index, 'fr', v)}
                      placeholder="Description en français"
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        </div>

        {/* Right column */}
        <div className="col-span-1 space-y-6">

          {/* Image */}
          <SectionCard title="Image" description={shopifyProductId ? 'Managed by Shopify.' : 'Product photo.'}>
            {shopifyProductId ? (
              productImage ? <img src={productImage} alt={productName} className="w-full aspect-square object-cover rounded-lg" />
              : <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center"><span className="text-sm text-gray-400">No image</span></div>
            ) : (
              <ImageUploader value={productImage} onChange={(url) => { setProductImage(url); markDirty(); }} aspectRatio="1:1" label="" />
            )}
          </SectionCard>

          {/* Shopify integration */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Shopify</h2>
              {shopifyProductId ? <Badge color="success">Linked</Badge> : <Badge color="gray">Not linked</Badge>}
            </div>
            {shopifyProductId ? (
              <>
                <div className="px-6 py-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium font-mono text-gray-900 truncate">{shopifyProductHandle}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">ID: {shopifyProductId}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {shopifyAdminUrl && <a href={shopifyAdminUrl} target="_blank" rel="noopener noreferrer"><Button variant="secondary" size="sm">View</Button></a>}
                    <Button variant="danger" size="sm" onClick={() => setUnlinkConfirmOpen(true)}>Unlink</Button>
                  </div>
                </div>
                <ShopifyVariantsDisplay shopifyProductId={shopifyProductId} />
              </>
            ) : (
              <div className="px-6 py-4 flex items-start justify-between gap-4">
                <div><p className="text-sm font-medium text-gray-900">Link existing</p><p className="text-xs text-gray-500 mt-0.5">Connect to a Shopify product.</p></div>
                <ShopifyProductPicker onSelect={(p) => { if (p) { setShopifyProductId(p.id); setShopifyProductHandle(p.handle); if (p.featuredImage?.url) setProductImage(p.featuredImage.url); markDirty(); } }} onOpenRef={shopifyPickerOpenRef} />
                <Button variant="secondary" size="sm" onClick={() => shopifyPickerOpenRef.current?.()}>Link</Button>
              </div>
            )}
          </div>

          {/* Catering Type */}
          <SectionCard title="Catering Type">
            <select value={cateringType} onChange={(e) => { setCateringType(e.target.value); markDirty(); }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500">
              <option value="">Select type…</option>
              <option value="brunch">Brunch</option><option value="lunch">Lunch</option><option value="dinatoire">Dînatoire</option>
            </select>
            {!cateringType && <p className="text-xs text-warning-600 mt-1">Type required to apply ordering rules from settings</p>}
          </SectionCard>

          {/* Tax */}
          <TaxShippingSection
            data={{ taxBehavior, taxThreshold, taxUnitCount }}
            onChange={(tax) => { setTaxBehavior(tax.taxBehavior ?? taxBehavior); setTaxThreshold(tax.taxThreshold ?? taxThreshold); setTaxUnitCount(tax.taxUnitCount ?? taxUnitCount); markDirty(); }}
            shopifyProductId={shopifyProductId || undefined}
          />

        </div>
      </div>

      {/* Unlink Shopify confirmation */}
      <ConfirmModal isOpen={unlinkConfirmOpen} variant="warning" title="Unlink Shopify product"
        message="This will remove the Shopify connection. The product will not be deleted from Shopify."
        confirmLabel="Unlink" cancelLabel="Cancel"
        onConfirm={async () => { setUnlinkConfirmOpen(false); await fetch(`/api/products/${params.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shopifyProductId: null, shopifyProductHandle: null }) }); setShopifyProductId(''); setShopifyProductHandle(''); toast.success('Unlinked'); markDirty(); }}
        onCancel={() => setUnlinkConfirmOpen(false)}
      />
    </EditPageLayout>
  );
}
