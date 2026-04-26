'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Offering, Ingredient } from '@/types';

import ShopifyProductPicker from '../../components/ShopifyProductPicker';
import { Badge } from '@/app/admin/components/ui/nav/badges';
import EditPageLayout from '@/app/admin/components/EditPageLayout';
import { Button } from '@/app/admin/components/ui/button';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import { Select } from '@/app/admin/components/ui/select';
import { useToast } from '@/app/admin/components/ToastContainer';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import FlavourIngredientSelector from '@/app/admin/components/FlavourIngredientSelector';
import TagPicker from '@/app/admin/components/TagPicker';
import ImageUploader from '@/app/admin/components/ImageUploader';
import AiTranslateButton from '@/app/admin/components/AiTranslateButton';
import ProductAvailabilityTab from '@/app/admin/components/ProductAvailabilityTab';
import TaxShippingSection from '../../components/TaxShippingSection';
import ShopifyVariantsDisplay from '../../components/ShopifyVariantsDisplay';
import TaxonomySelect from '@/app/admin/components/TaxonomySelect';
import VariantEditor from '@/app/admin/components/VariantEditor';
import type { FlavourIngredient, ContentTranslations, ProductVariant } from '@/types';
import { useAllergenOptions } from '@/app/admin/hooks/useAllergenOptions';

/** Convert a UTC ISO string to a local date value (YYYY-MM-DD) */
function toLocalDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [offering, setOffering] = useState<Offering | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [creatingShopifyProduct, setCreatingShopifyProduct] = useState(false);
  const [shopifyConfirmOpen, setShopifyConfirmOpen] = useState(false);
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);
  const [shopifyLinkBroken, setShopifyLinkBroken] = useState(false);
  const [verifyingShopifyLink, setVerifyingShopifyLink] = useState(false);
  const toast = useToast();
  const allergenOptions = useAllergenOptions();

  const [volumeEnabled, setVolumeEnabled] = useState(false);
  const [cakeEnabled, setCakeEnabled] = useState(false);
  const [enablingVolume, setEnablingVolume] = useState(false);
  const [enablingCake, setEnablingCake] = useState(false);
  const [disablingVolume, setDisablingVolume] = useState(false);
  const [disablingCake, setDisablingCake] = useState(false);
  const [removeConfirmType, setRemoveConfirmType] = useState<'catering' | 'cake' | null>(null);
  const shopifyPickerOpenRef = useRef<(() => void) | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    shortCardCopy: '',
    category: '',
    status: 'draft',
    tags: '',
    pickupOnly: false,
    shopifyProductId: '',
    shopifyProductHandle: '',
    image: '',
    keyNotes: [] as string[],
    ingredients: [] as FlavourIngredient[],
    allergens: [] as string[],
    titleFr: '',
    descriptionFr: '',
    shortCardCopyFr: '',
    // Availability fields
    availabilityMode: 'always_available',
    assignedAvailabilityPattern: '',
    defaultMinQuantity: 1,
    defaultQuantityStep: 1,
    defaultMaxQuantity: '',
    inventoryMode: '',
    capMode: '',
    defaultLocationRestriction: '',
    dateSelectionType: 'none',
    slotSelectionType: 'none',
    variantType: 'none' as 'none' | 'flavour' | 'size',
    variants: [] as ProductVariant[],
    taxBehavior: 'always_taxable',
    taxThreshold: 6,
    taxUnitCount: 1,
    // Ordering fields
    nextAvailableDate: '',
    servesPerUnit: '',
  });

  useEffect(() => { fetchData(); }, [params.id]);

  async function verifyShopifyLink(shopifyProductId: string) {
    if (!shopifyProductId) return;
    setVerifyingShopifyLink(true);
    try {
      const res = await fetch(`/api/shopify/products/verify?id=${encodeURIComponent(shopifyProductId)}`);
      if (res.ok) {
        const data = await res.json();
        setShopifyLinkBroken(!data.exists);
      }
    } catch {
      // Network error — don't flag as broken, just skip
    } finally {
      setVerifyingShopifyLink(false);
    }
  }

  async function fetchData() {
    try {
      const [offeringRes, ingredientsRes] = await Promise.all([
        fetch(`/api/products/${params.id}`),
        fetch('/api/ingredients'),
      ]);
      if (offeringRes.ok && ingredientsRes.ok) {
        const offeringData = await offeringRes.json();
        const ingredientsData = await ingredientsRes.json();
        setOffering(offeringData);
        setIngredients(ingredientsData.data || ingredientsData);
        setVolumeEnabled(offeringData.volumeEnabled ?? false);
        setCakeEnabled(offeringData.cakeEnabled ?? false);

        // Verify Shopify link if product is linked
        if (offeringData.shopifyProductId) {
          verifyShopifyLink(offeringData.shopifyProductId);
        } else {
          setShopifyLinkBroken(false);
        }

        setFormData({
          title: offeringData.title || offeringData.publicName || offeringData.internalName || offeringData.name || '',
          slug: offeringData.slug || '',
          description: offeringData.description || '',
          shortCardCopy: offeringData.shortCardCopy || '',
          category: offeringData.category || '',
          status: offeringData.status || 'draft',
          tags: (offeringData.tags || []).join(', '),
          pickupOnly: offeringData.pickupOnly || false,
          shopifyProductId: offeringData.shopifyProductId || '',
          shopifyProductHandle: offeringData.shopifyProductHandle || '',
          image: offeringData.image || '',
          keyNotes: offeringData.keyNotes || [],
          ingredients: offeringData.ingredients || [],
          allergens: offeringData.allergens || [],
          titleFr: offeringData.translations?.fr?.title || '',
          descriptionFr: offeringData.translations?.fr?.description || '',
          shortCardCopyFr: offeringData.translations?.fr?.shortCardCopy || '',
          availabilityMode: offeringData.availabilityMode || 'always_available',
          assignedAvailabilityPattern: offeringData.assignedAvailabilityPattern || '',
          defaultMinQuantity: offeringData.defaultMinQuantity ?? 1,
          defaultQuantityStep: offeringData.defaultQuantityStep ?? 1,
          defaultMaxQuantity: offeringData.defaultMaxQuantity != null ? String(offeringData.defaultMaxQuantity) : '',
          inventoryMode: offeringData.inventoryMode || '',
          capMode: offeringData.capMode || '',
          defaultLocationRestriction: (offeringData.defaultLocationRestriction || []).join(', '),
          dateSelectionType: offeringData.dateSelectionType || 'none',
          slotSelectionType: offeringData.slotSelectionType || 'none',
          variantType: offeringData.variantType || 'none',
          variants: offeringData.variants || [],
          taxBehavior: offeringData.taxBehavior || 'always_taxable',
          taxThreshold: offeringData.taxThreshold ?? 6,
          taxUnitCount: offeringData.taxUnitCount ?? 1,
          nextAvailableDate: offeringData.nextAvailableDate ? toLocalDate(offeringData.nextAvailableDate) : '',
          servesPerUnit: offeringData.servesPerUnit != null ? String(offeringData.servesPerUnit) : '',
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors([]);
    try {
      const payload = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        shortCardCopy: formData.shortCardCopy,
        category: formData.category || undefined,
        status: formData.status,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        pickupOnly: formData.pickupOnly,
        shopifyProductId: formData.shopifyProductId || null,
        shopifyProductHandle: formData.shopifyProductHandle || null,
        image: formData.image || undefined,
        keyNotes: formData.keyNotes,
        ingredients: formData.ingredients,
        allergens: formData.allergens,
        translations: (formData.titleFr || formData.descriptionFr || formData.shortCardCopyFr)
          ? { fr: { title: formData.titleFr || undefined, description: formData.descriptionFr || undefined, shortCardCopy: formData.shortCardCopyFr || undefined } }
          : undefined,
        // Availability fields
        availabilityMode: formData.availabilityMode,
        assignedAvailabilityPattern: formData.assignedAvailabilityPattern || undefined,
        defaultMinQuantity: formData.defaultMinQuantity,
        defaultQuantityStep: formData.defaultQuantityStep,
        defaultMaxQuantity: formData.defaultMaxQuantity ? parseInt(formData.defaultMaxQuantity) : undefined,
        inventoryMode: formData.inventoryMode || undefined,
        capMode: formData.capMode || undefined,
        defaultLocationRestriction: formData.defaultLocationRestriction
          ? formData.defaultLocationRestriction.split(',').map(s => s.trim()).filter(Boolean)
          : undefined,
        dateSelectionType: formData.dateSelectionType,
        slotSelectionType: formData.slotSelectionType,
        variantType: formData.variantType !== 'none' ? formData.variantType : undefined,
        variants: formData.variantType !== 'none' ? formData.variants : undefined,
        taxBehavior: formData.taxBehavior,
        taxThreshold: formData.taxThreshold,
        taxUnitCount: formData.taxUnitCount,
        nextAvailableDate: formData.nextAvailableDate || null,
        servesPerUnit: formData.servesPerUnit ? parseInt(formData.servesPerUnit) : null,
      };
      const response = await fetch(`/api/products/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setOffering(await response.json());
        toast.success('Product saved', 'Your changes have been saved successfully');
      } else {
        const error = await response.json();
        setErrors([error.error || 'Failed to update product']);
        toast.error('Save failed', error.error || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setErrors(['Failed to update product']);
      toast.error('Save failed', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      const response = await fetch(`/api/products/${params.id}`, { method: 'DELETE' });
      if (response.ok) {
        router.push('/admin/products');
      } else {
        const error = await response.json();
        setErrors([error.error || 'Failed to delete product']);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      setErrors(['Failed to delete product']);
    }
  }

  async function handleCreateShopifyProduct() {
    setShopifyConfirmOpen(true);
  }

  async function doCreateShopifyProduct() {
    setShopifyConfirmOpen(false);
    setCreatingShopifyProduct(true);
    setErrors([]);
    try {
      const response = await fetch(`/api/products/${params.id}/create-shopify-product`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        const msg = data.details
          ? `${data.error}: ${typeof data.details === 'string' ? data.details : JSON.stringify(data.details)}`
          : data.error || 'Failed to create Shopify product';
        throw new Error(msg);
      }
      setFormData(prev => ({ ...prev, shopifyProductId: data.shopifyProduct.id, shopifyProductHandle: data.shopifyProduct.handle }));
      if (offering) {
        setOffering({ ...offering, shopifyProductId: data.shopifyProduct.id, shopifyProductHandle: data.shopifyProduct.handle, syncStatus: 'synced', lastSyncedAt: data.offering.lastSyncedAt });
      }
      await fetchData();
      if (data.warning) {
        toast.showToast({ variant: 'warning', title: 'Shopify product created — action needed', message: data.warning, duration: 15000 });
      } else {
        toast.success('Shopify product created', `"${data.shopifyProduct.title}" is now live on Shopify`);
      }
    } catch (error) {
      console.error('Error creating Shopify product:', error);
      const msg = error instanceof Error ? error.message : 'Failed to create Shopify product';
      setErrors([msg]);
      toast.error('Shopify error', msg);
    } finally {
      setCreatingShopifyProduct(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!offering) {
    return (
      <EditPageLayout title="Edit Product" backHref="/admin/products" backLabel="Back to Products" onSave={() => {}} onCancel={() => router.push('/admin/products')} error="Product not found" maxWidth="7xl">
        <div />
      </EditPageLayout>
    );
  }

  const shopifyAdminBase = `https://admin.shopify.com/store/${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.replace('.myshopify.com', '')}`;

  return (
    <EditPageLayout
      title="Edit Product"
      backHref="/admin/products"
      backLabel="Back to Products"
      onSave={() => handleSubmit(new Event('submit') as any)}
      onDelete={handleDelete}
      onCancel={() => router.push('/admin/products')}
      saving={saving}
      error={errors.length > 0 ? errors.join(', ') : undefined}
      maxWidth="7xl"
    >
      <div className="grid grid-cols-3 gap-6">

        {/* Left column */}
        <div className="col-span-2 space-y-6">

          {/* Product details — side-by-side translations */}
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
                      title: formData.titleFr,
                      description: formData.descriptionFr,
                      shortCardCopy: formData.shortCardCopyFr,
                    }}
                    onResult={(t) => setFormData((prev) => ({
                      ...prev,
                      title: t.title || prev.title,
                      description: t.description || prev.description,
                      shortCardCopy: t.shortCardCopy || prev.shortCardCopy,
                    }))}
                  />
                </div>
              </div>
              <div className="px-6 py-6 space-y-4">
                <Input
                  label="Titre"
                  value={formData.titleFr}
                  onChange={(v) => setFormData({ ...formData, titleFr: v })}
                  placeholder={formData.title || 'Titre du produit'}
                />
                <Textarea
                  label="Description"
                  value={formData.descriptionFr}
                  onChange={(v) => setFormData({ ...formData, descriptionFr: v })}
                  rows={4}
                  placeholder={formData.description || 'Description en français'}
                />
                <Input
                  label="Texte carte"
                  value={formData.shortCardCopyFr}
                  onChange={(v) => setFormData({ ...formData, shortCardCopyFr: v })}
                  placeholder={formData.shortCardCopy || 'Texte court'}
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
                      title: formData.title,
                      description: formData.description,
                      shortCardCopy: formData.shortCardCopy,
                    }}
                    onResult={(t) => setFormData((prev) => ({
                      ...prev,
                      titleFr: t.title || prev.titleFr,
                      descriptionFr: t.description || prev.descriptionFr,
                      shortCardCopyFr: t.shortCardCopy || prev.shortCardCopyFr,
                    }))}
                  />
                </div>
              </div>
              <div className="px-6 py-6 space-y-4">
                <Input label="Title" value={formData.title} onChange={(v) => setFormData({ ...formData, title: v })} isRequired />
                <Textarea label="Description" value={formData.description} onChange={(v) => setFormData({ ...formData, description: v })} rows={4} isRequired />
                <Input label="Short card copy" value={formData.shortCardCopy} onChange={(v) => setFormData({ ...formData, shortCardCopy: v })} />
              </div>
            </div>
          </div>

          {/* Product details */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Product details</h2>
              <p className="text-sm text-gray-500 mt-0.5">Slug, status, category, and tags.</p>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Slug" value={formData.slug} onChange={(v) => setFormData({ ...formData, slug: v })} isRequired />
                <Select
                  label="Status"
                  value={formData.status}
                  onChange={(v) => setFormData({ ...formData, status: v })}
                  options={[
                    { id: 'draft', label: 'Draft' },
                    { id: 'scheduled', label: 'Scheduled' },
                    { id: 'active', label: 'Active' },
                    { id: 'sold-out', label: 'Sold Out' },
                    { id: 'archived', label: 'Archived' },
                  ]}
                />
              </div>
              <TaxonomySelect
                category="productCategories"
                value={formData.category}
                onChange={(v) => setFormData({ ...formData, category: v })}
                label="Category"
                description="Used to group products on the order page"
                placeholder="Select a category"
              />
              <Input label="Tags (comma-separated)" value={formData.tags} onChange={(v) => setFormData({ ...formData, tags: v })} />
            </div>
          </div>

          {/* Allergens */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Allergens</h2>
              <p className="text-sm text-gray-500 mt-0.5">Directly assigned allergens for this product.</p>
            </div>
            <div className="px-6 py-6">
              <div className="flex flex-wrap gap-2">
                {allergenOptions.map((a) => {
                  const selected = (formData as any).allergens?.includes(a) ?? false;
                  return (
                    <button key={a} type="button"
                      onClick={() => {
                        const current: string[] = (formData as any).allergens ?? [];
                        setFormData({ ...formData, allergens: selected ? current.filter((x: string) => x !== a) : [...current, a] } as any);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selected ? 'bg-red-50 border-red-300 text-red-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {a}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Variants</h2>
              <p className="text-sm text-gray-500 mt-0.5">Size or flavour options. Set units per item for tax threshold calculations.</p>
            </div>
            <div className="px-6 py-6">
              <VariantEditor
                variantType={formData.variantType}
                variants={formData.variants}
                basePrice={offering?.price != null ? (offering.price / 100).toString() : ''}
                onVariantTypeChange={(type) => setFormData({ ...formData, variantType: type })}
                onVariantsChange={(variants) => setFormData({ ...formData, variants })}
              />
            </div>
          </div>

        </div>

        {/* Right column */}
        <div className="col-span-1 space-y-6">

          {/* Image */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Image</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {formData.shopifyProductId ? 'Managed by Shopify. Updates automatically.' : 'Product photo shown on the menu.'}
              </p>
            </div>
            <div className="px-6 py-6">
              {formData.shopifyProductId ? (
                formData.image ? (
                  <img
                    src={formData.image}
                    alt={formData.title || 'Product image'}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm text-gray-400">No image</span>
                  </div>
                )
              ) : (
                <ImageUploader
                  value={formData.image}
                  onChange={(url) => setFormData({ ...formData, image: url })}
                  aspectRatio="1:1"
                  label=""
                />
              )}
            </div>
          </div>

          {/* Shopify integration */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Shopify integration</h2>
                <p className="text-sm text-gray-500 mt-0.5">Manage this product's Shopify connection.</p>
              </div>
              {formData.shopifyProductId ? (
                shopifyLinkBroken ? (
                  <Badge color="error">Broken link</Badge>
                ) : (
                  <Badge color="success">Linked</Badge>
                )
              ) : (
                <Badge color="gray">Not linked</Badge>
              )}
            </div>
            {formData.shopifyProductId ? (
              <>
                {shopifyLinkBroken && (
                  <div className="px-6 py-3 bg-red-50 border-b border-red-200 flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-800">Shopify product not found</p>
                      <p className="text-xs text-red-600 mt-0.5">The linked product may have been deleted from Shopify. Unlink to clean up or link a new product.</p>
                    </div>
                    <Button variant="danger" size="sm" className="flex-shrink-0" onClick={() => setUnlinkConfirmOpen(true)}>Unlink</Button>
                  </div>
                )}
                {verifyingShopifyLink && !shopifyLinkBroken && (
                  <div className="px-6 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400" />
                    <p className="text-xs text-gray-500">Verifying Shopify link…</p>
                  </div>
                )}
                <div className="px-6 py-4 flex items-center justify-between gap-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${shopifyLinkBroken ? 'bg-red-100' : 'bg-gray-100'}`}>
                      <svg className={`w-5 h-5 ${shopifyLinkBroken ? 'text-red-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium font-mono truncate ${shopifyLinkBroken ? 'text-red-700 line-through' : 'text-gray-900'}`}>{formData.shopifyProductHandle}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">ID: {formData.shopifyProductId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {formData.shopifyProductId && !shopifyLinkBroken && (
                      <a href={`${shopifyAdminBase}/products/${formData.shopifyProductId.replace('gid://shopify/Product/', '')}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" size="sm">View</Button>
                      </a>
                    )}
                    <Button variant="danger" size="sm" onClick={() => setUnlinkConfirmOpen(true)}>Unlink</Button>
                  </div>
                </div>
                {!shopifyLinkBroken && (
                  <ShopifyVariantsDisplay shopifyProductId={formData.shopifyProductId} />
                )}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs text-gray-500">{shopifyLinkBroken ? 'Unlink this product to re-enable Shopify sync.' : 'Changes sync to Shopify on save.'}</p>
                </div>
              </>
            ) : (
              <>
                <div className="px-6 py-4 flex items-start justify-between gap-4 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Create new</p>
                    <p className="text-xs text-gray-500 mt-0.5">Generate from this product's details.</p>
                    <p className="text-xs text-gray-400 mt-1">Created with a default $10 price. Update in Shopify after.</p>
                  </div>
                  <Button
                    variant="primary" size="sm"
                    onClick={handleCreateShopifyProduct}
                    isDisabled={creatingShopifyProduct}
                    isLoading={creatingShopifyProduct}
                    className="flex-shrink-0"
                  >
                    {creatingShopifyProduct ? 'Creating...' : 'Create'}
                  </Button>
                </div>
                <div className="px-6 py-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Link existing</p>
                    <p className="text-xs text-gray-500 mt-0.5">Connect to an existing Shopify product.</p>
                  </div>
                  <ShopifyProductPicker
                    selectedProductId={formData.shopifyProductId}
                    selectedProductHandle={formData.shopifyProductHandle}
                    onSelect={(product) => setFormData({ ...formData, shopifyProductId: product?.id || '', shopifyProductHandle: product?.handle || '', image: product?.featuredImage?.url || formData.image })}
                    onOpenRef={shopifyPickerOpenRef}
                  />
                  <Button variant="secondary" size="sm" className="flex-shrink-0" onClick={() => shopifyPickerOpenRef.current?.()}>Link</Button>
                </div>
              </>
            )}
          </div>

          {/* Tax rules */}
          <TaxShippingSection
            data={{
              taxBehavior: formData.taxBehavior,
              taxThreshold: formData.taxThreshold,
              taxUnitCount: formData.taxUnitCount,
            }}
            onChange={(tax) => setFormData({ ...formData, ...tax })}
            shopifyProductId={formData.shopifyProductId || undefined}
          />

          {/* Ordering */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Ordering</h2>
              <p className="text-sm text-gray-500 mt-0.5">Availability date and serving information.</p>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next available date</label>
                <input
                  type="date"
                  value={formData.nextAvailableDate}
                  onChange={(e) => setFormData({ ...formData, nextAvailableDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                  aria-label="Next available date"
                />
                <p className="text-xs text-gray-500 mt-1">Shown on sold-out products to indicate when they'll be back.</p>
              </div>
              <Input
                label="Serves per unit"
                type="number"
                value={formData.servesPerUnit}
                onChange={(v) => setFormData({ ...formData, servesPerUnit: v })}
                placeholder="e.g. 4"
                helperText="Used to calculate serving estimates in catering orders."
              />
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Availability</h2>
              <p className="text-sm text-gray-500 mt-0.5">Selling mode, order rules, pickup configuration, and scheduling windows.</p>
            </div>
            <div className="px-6 py-6">
              <ProductAvailabilityTab
                productId={params.id}
                data={{
                  defaultMinQuantity: formData.defaultMinQuantity,
                  defaultQuantityStep: formData.defaultQuantityStep,
                  defaultMaxQuantity: formData.defaultMaxQuantity ? parseInt(formData.defaultMaxQuantity) : null,
                  pickupOnly: formData.pickupOnly,
                }}
                onChange={(avail) => {
                  const { defaultMaxQuantity, ...rest } = avail as any;
                  setFormData({
                    ...formData,
                    ...rest,
                    ...(defaultMaxQuantity !== undefined
                      ? { defaultMaxQuantity: defaultMaxQuantity != null ? String(defaultMaxQuantity) : '' }
                      : {}),
                  });
                }}
              />
            </div>
          </div>

          {/* Order types — read-only, managed in their respective sections */}
          {(volumeEnabled || cakeEnabled) && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Order types</h2>
                <p className="text-sm text-gray-500 mt-0.5">Managed in their respective sections.</p>
              </div>
              <div className="divide-y divide-gray-100">
                {volumeEnabled && (
                  <div className="px-6 py-4 flex items-center gap-3">
                    <span className="text-sm">🍽️</span>
                    <span className="text-sm font-medium text-gray-900 flex-1">Catering</span>
                    <Badge color="success">Active</Badge>
                    <a href={`/admin/volume-products/${params.id}`}>
                      <Button variant="secondary" size="sm">Configure</Button>
                    </a>
                  </div>
                )}
                {cakeEnabled && (
                  <div className="px-6 py-4 flex items-center gap-3">
                    <span className="text-sm">🎂</span>
                    <span className="text-sm font-medium text-gray-900 flex-1">Cake</span>
                    <Badge color="success">Active</Badge>
                    <a href={`/admin/cake-products/${params.id}`}>
                      <Button variant="secondary" size="sm">Configure</Button>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      <ConfirmModal
        isOpen={shopifyConfirmOpen}
        variant="info"
        title="Create Shopify product"
        message="This will generate a new product in your Shopify store. Continue?"
        confirmLabel="Create"
        cancelLabel="Cancel"
        onConfirm={doCreateShopifyProduct}
        onCancel={() => setShopifyConfirmOpen(false)}
      />
      <ConfirmModal
        isOpen={unlinkConfirmOpen}
        variant="warning"
        title="Unlink Shopify product"
        message="This will remove the Shopify connection. The product will not be deleted from Shopify."
        confirmLabel="Unlink"
        cancelLabel="Cancel"
        onConfirm={async () => {
          setUnlinkConfirmOpen(false);
          try {
            const res = await fetch(`/api/products/${params.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ shopifyProductId: null, shopifyProductHandle: null, syncStatus: 'not_linked', lastSyncedAt: null, syncError: null }),
            });
            if (res.ok) {
              setFormData(prev => ({ ...prev, shopifyProductId: '', shopifyProductHandle: '' }));
              setShopifyLinkBroken(false);
              setOffering(await res.json());
              toast.success('Unlinked', 'Shopify connection removed');
            } else {
              const err = await res.json();
              toast.error('Unlink failed', err.error || 'Could not unlink product');
            }
          } catch {
            toast.error('Unlink failed', 'An unexpected error occurred');
          }
        }}
        onCancel={() => setUnlinkConfirmOpen(false)}
      />
    </EditPageLayout>
  );
}
