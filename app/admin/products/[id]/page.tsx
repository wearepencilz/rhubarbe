'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Offering, Ingredient } from '@/types';

import ShopifyProductPicker from '../../components/ShopifyProductPicker';
import { Badge } from '@/app/admin/components/ui/nav/badges';
import EditPageLayout from '@/app/admin/components/EditPageLayout';
import { Button } from '@/app/admin/components/ui/button';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import { Select } from '@/app/admin/components/ui/select';
import { Checkbox } from '@/app/admin/components/ui/checkbox';
import { useToast } from '@/app/admin/components/ToastContainer';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import FlavourIngredientSelector from '@/app/admin/components/FlavourIngredientSelector';
import TagPicker from '@/app/admin/components/TagPicker';
import ImageUploader from '@/app/admin/components/ImageUploader';
import AiTranslateButton from '@/app/admin/components/AiTranslateButton';
import ProductAvailabilityTab from '@/app/admin/components/ProductAvailabilityTab';
import TaxonomySelect from '@/app/admin/components/TaxonomySelect';
import VariantEditor from '../../components/VariantEditor';
import type { FlavourIngredient, ContentTranslations, ProductVariant } from '@/types';

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

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    shortCardCopy: '',
    category: '',
    price: '',
    compareAtPrice: '',
    status: 'draft',
    tags: '',
    inventoryTracked: false,
    inventoryQuantity: '',
    onlineOrderable: true,
    pickupOnly: false,
    shopifyProductId: '',
    shopifyProductHandle: '',
    image: '',
    keyNotes: [] as string[],
    tastingNotes: '',
    ingredients: [] as FlavourIngredient[],
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
    defaultPickupRequired: false,
    defaultLocationRestriction: '',
    dateSelectionType: 'none',
    slotSelectionType: 'none',
    variantType: 'none' as 'none' | 'flavour' | 'size',
    variants: [] as ProductVariant[],
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
          price: offeringData.price ? (offeringData.price / 100).toFixed(2) : '',
          compareAtPrice: offeringData.compareAtPrice ? (offeringData.compareAtPrice / 100).toFixed(2) : '',
          status: offeringData.status || 'draft',
          tags: (offeringData.tags || []).join(', '),
          inventoryTracked: offeringData.inventoryTracked || false,
          inventoryQuantity: offeringData.inventoryQuantity?.toString() || '',
          onlineOrderable: offeringData.onlineOrderable !== undefined ? offeringData.onlineOrderable : true,
          pickupOnly: offeringData.pickupOnly || false,
          shopifyProductId: offeringData.shopifyProductId || '',
          shopifyProductHandle: offeringData.shopifyProductHandle || '',
          image: offeringData.image || '',
          keyNotes: offeringData.keyNotes || [],
          tastingNotes: offeringData.tastingNotes || '',
          ingredients: offeringData.ingredients || [],
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
          defaultPickupRequired: offeringData.defaultPickupRequired ?? false,
          defaultLocationRestriction: (offeringData.defaultLocationRestriction || []).join(', '),
          dateSelectionType: offeringData.dateSelectionType || 'none',
          slotSelectionType: offeringData.slotSelectionType || 'none',
          variantType: offeringData.variantType || 'none',
          variants: offeringData.variants || [],
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
      const price = formData.price ? Math.round(parseFloat(formData.price) * 100) : 0;
      const compareAtPrice = formData.compareAtPrice ? Math.round(parseFloat(formData.compareAtPrice) * 100) : undefined;
      const payload = {
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        shortCardCopy: formData.shortCardCopy,
        category: formData.category || undefined,
        price,
        compareAtPrice,
        status: formData.status,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        inventoryTracked: formData.inventoryTracked,
        inventoryQuantity: formData.inventoryQuantity ? parseInt(formData.inventoryQuantity) : undefined,
        onlineOrderable: formData.onlineOrderable,
        pickupOnly: formData.pickupOnly,
        shopifyProductId: formData.shopifyProductId || null,
        shopifyProductHandle: formData.shopifyProductHandle || null,
        image: formData.image || undefined,
        keyNotes: formData.keyNotes,
        tastingNotes: formData.tastingNotes,
        ingredients: formData.ingredients,
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
        defaultPickupRequired: formData.defaultPickupRequired,
        defaultLocationRestriction: formData.defaultLocationRestriction
          ? formData.defaultLocationRestriction.split(',').map(s => s.trim()).filter(Boolean)
          : undefined,
        dateSelectionType: formData.dateSelectionType,
        slotSelectionType: formData.slotSelectionType,
        variantType: formData.variantType !== 'none' ? formData.variantType : undefined,
        variants: formData.variantType !== 'none' ? formData.variants : undefined,
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
    const validationErrors: string[] = [];
    const currentPrice = formData.price ? parseFloat(formData.price) : 0;
    if (!currentPrice || currentPrice <= 0) validationErrors.push('Price must be greater than $0 to create a Shopify product');
    if (validationErrors.length > 0) { setErrors(validationErrors); return; }
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

          {/* Pricing, status & options */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Pricing & options</h2>
              <p className="text-sm text-gray-500 mt-0.5">Pricing, status, and inventory settings.</p>
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
              <div className="grid grid-cols-2 gap-4">
                <Input label="Price ($)" type="number" value={formData.price} onChange={(v) => setFormData({ ...formData, price: v })} />
                <Input label="Compare at price ($)" type="number" value={formData.compareAtPrice} onChange={(v) => setFormData({ ...formData, compareAtPrice: v })} />
              </div>
              <Input label="Tags (comma-separated)" value={formData.tags} onChange={(v) => setFormData({ ...formData, tags: v })} />
              <div className="flex items-center gap-6 pt-1">
                <Checkbox isSelected={formData.inventoryTracked} onChange={(v) => setFormData({ ...formData, inventoryTracked: v })} label="Track inventory" />
              </div>
              {formData.inventoryTracked && (
                <Input label="Inventory quantity" type="number" value={formData.inventoryQuantity} onChange={(v) => setFormData({ ...formData, inventoryQuantity: v })} />
              )}
            </div>
          </div>

          {/* Tasting notes */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Variants</h2>
              <p className="text-sm text-gray-500 mt-0.5">Define flavour or size options for this product.</p>
            </div>
            <div className="px-6 py-6">
              <VariantEditor
                variantType={formData.variantType}
                variants={formData.variants}
                basePrice={formData.price}
                onVariantTypeChange={(type) => setFormData({ ...formData, variantType: type })}
                onVariantsChange={(variants) => setFormData({ ...formData, variants })}
              />
            </div>
          </div>

          {/* Tasting notes */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Tasting notes</h2>
              <p className="text-sm text-gray-500 mt-0.5">Flavour tags and optional prose notes.</p>
            </div>
            <div className="px-6 py-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <TagPicker
                  selected={formData.keyNotes}
                  onChange={(tags) => setFormData({ ...formData, keyNotes: tags })}
                  taxonomyCategory="keyNotes"
                  placeholder="Search tags…"
                />
              </div>
              <Textarea
                label="Notes"
                rows={3}
                value={formData.tastingNotes}
                onChange={(v) => setFormData({ ...formData, tastingNotes: v })}
                placeholder="e.g. Sweet and creamy with a long caramel finish..."
              />
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Ingredients</h2>
              <p className="text-sm text-gray-500 mt-0.5">Components and allergen sources for this product.</p>
            </div>
            <div className="px-6 py-6">
              <FlavourIngredientSelector
                selectedIngredients={formData.ingredients}
                onChange={(ing: FlavourIngredient[]) => setFormData({ ...formData, ingredients: ing })}
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
                  defaultPickupRequired: formData.defaultPickupRequired,
                  onlineOrderable: formData.onlineOrderable,
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

        </div>

        {/* Right column */}
        <div className="col-span-1 space-y-6">

          {/* Image */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Image</h2>
              <p className="text-sm text-gray-500 mt-0.5">Product photo shown on the menu.</p>
            </div>
            <div className="px-6 py-6">
              <ImageUploader
                value={formData.image}
                onChange={(url) => setFormData({ ...formData, image: url })}
                aspectRatio="1:1"
                label=""
              />
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
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${shopifyLinkBroken ? 'bg-red-100' : 'bg-gray-100'}`}>
                      <svg className={`w-5 h-5 ${shopifyLinkBroken ? 'text-red-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div>
                      <p className={`text-sm font-medium font-mono ${shopifyLinkBroken ? 'text-red-700 line-through' : 'text-gray-900'}`}>{formData.shopifyProductHandle}</p>
                      <p className="text-xs text-gray-500 mt-0.5">ID: {formData.shopifyProductId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.shopifyProductHandle && !shopifyLinkBroken && (
                      <a href={`${shopifyAdminBase}/products/${formData.shopifyProductHandle}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" size="sm">View in Shopify</Button>
                      </a>
                    )}
                    <Button variant="danger" size="sm" onClick={() => setUnlinkConfirmOpen(true)}>Unlink</Button>
                  </div>
                </div>
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
                    {(!formData.price || parseFloat(formData.price) <= 0) && (
                      <p className="text-xs text-amber-600 mt-1">Price required.</p>
                    )}
                  </div>
                  <Button
                    variant="primary" size="sm"
                    onClick={handleCreateShopifyProduct}
                    isDisabled={creatingShopifyProduct || !formData.price || parseFloat(formData.price) <= 0}
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
                    onSelect={(product) => setFormData({ ...formData, shopifyProductId: product?.id || '', shopifyProductHandle: product?.handle || '' })}
                    trigger={<Button variant="secondary" size="sm" className="flex-shrink-0">Link</Button>}
                  />
                </div>
              </>
            )}
          </div>

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
