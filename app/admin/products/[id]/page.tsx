'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Offering, Format, Flavour, Ingredient } from '@/types';
import ShopifyProductPicker from '../../components/ShopifyProductPicker';
import { computeProductAllergens, formatAllergen, formatDietaryClaim } from '@/lib/product-allergens';
import { Badge } from '@/app/admin/components/ui/nav/badges';
import Link from 'next/link';
import EditPageLayout from '@/app/admin/components/EditPageLayout';
import { Button } from '@/app/admin/components/ui/button';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import { Select } from '@/app/admin/components/ui/select';
import { Checkbox } from '@/app/admin/components/ui/checkbox';
import { useToast } from '@/app/admin/components/ToastContainer';
import ConfirmModal from '@/app/admin/components/ConfirmModal';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [offering, setOffering] = useState<Offering | null>(null);
  const [format, setFormat] = useState<Format | null>(null);
  const [flavours, setFlavours] = useState<Flavour[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [creatingShopifyProduct, setCreatingShopifyProduct] = useState(false);
  const [shopifyConfirmOpen, setShopifyConfirmOpen] = useState(false);
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState({
    internalName: '',
    publicName: '',
    description: '',
    shortCardCopy: '',
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
  });

  useEffect(() => { fetchData(); }, [params.id]);

  async function fetchData() {
    try {
      const [offeringRes, flavoursRes, ingredientsRes] = await Promise.all([
        fetch(`/api/products/${params.id}`),
        fetch('/api/flavours'),
        fetch('/api/ingredients'),
      ]);
      if (offeringRes.ok && flavoursRes.ok && ingredientsRes.ok) {
        const offeringData = await offeringRes.json();
        const flavoursData = await flavoursRes.json();
        const ingredientsData = await ingredientsRes.json();
        setOffering(offeringData);
        setFlavours(flavoursData.data || flavoursData);
        setIngredients(ingredientsData.data || ingredientsData);
        const formatRes = await fetch(`/api/formats/${offeringData.formatId}`);
        if (formatRes.ok) setFormat(await formatRes.json());
        setFormData({
          internalName: offeringData.internalName || '',
          publicName: offeringData.publicName || '',
          description: offeringData.description || '',
          shortCardCopy: offeringData.shortCardCopy || '',
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
        internalName: formData.internalName,
        publicName: formData.publicName,
        description: formData.description,
        shortCardCopy: formData.shortCardCopy,
        price,
        compareAtPrice,
        status: formData.status,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        inventoryTracked: formData.inventoryTracked,
        inventoryQuantity: formData.inventoryQuantity ? parseInt(formData.inventoryQuantity) : undefined,
        onlineOrderable: formData.onlineOrderable,
        pickupOnly: formData.pickupOnly,
        shopifyProductId: formData.shopifyProductId || undefined,
        shopifyProductHandle: formData.shopifyProductHandle || undefined,
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
    if (!offering?.formatId) validationErrors.push('Offering must have a format');
    if (!offering?.primaryFlavourIds || offering.primaryFlavourIds.length === 0) validationErrors.push('Offering must have at least one flavour');
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
      toast.success('Shopify product created', `"${data.shopifyProduct.title}" is now live on Shopify`);
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

  const FLAVOUR_TYPE_COLOR: Record<string, 'blue' | 'purple' | 'success' | 'orange' | 'pink' | 'indigo' | 'gray'> = {
    sorbet: 'blue',
    gelato: 'purple',
    'ice-cream': 'success',
    sherbet: 'orange',
    soft: 'pink',
    granita: 'indigo',
  };
  const BASE_STYLE_COLOR: Record<string, 'gray-blue' | 'orange' | 'pink' | 'indigo' | 'gray'> = {
    fruit: 'orange',
    dairy: 'gray-blue',
    nut: 'indigo',
    chocolate: 'pink',
    floral: 'pink',
    herb: 'indigo',
  };

  const primaryFlavours = flavours.filter(f => offering.primaryFlavourIds.includes(f.id));
  const flavourIngredientIds = primaryFlavours.flatMap(f => f.ingredients?.map(fi => fi.ingredientId) || []);
  const flavourIngredients = ingredients.filter(ing => flavourIngredientIds.includes(ing.id));
  const allergenData = computeProductAllergens(primaryFlavours, flavourIngredients, []);
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

        {/* Left: Product Details */}
        <div className="col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-gray-900">Product details</h2>
              <p className="text-sm text-gray-500 mt-0.5">Update the name, description, pricing and availability.</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Internal Name" type="text" value={formData.internalName} onChange={(v) => setFormData({ ...formData, internalName: v })} isRequired />
                  <Input label="Public Name" type="text" value={formData.publicName} onChange={(v) => setFormData({ ...formData, publicName: v })} isRequired />
                </div>
                <Textarea label="Description" value={formData.description} onChange={(v) => setFormData({ ...formData, description: v })} rows={4} isRequired />
                <Input label="Short Card Copy" type="text" value={formData.shortCardCopy} onChange={(v) => setFormData({ ...formData, shortCardCopy: v })} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Price ($)" type="number" value={formData.price} onChange={(v) => setFormData({ ...formData, price: v })} />
                  <Input label="Compare At Price ($)" type="number" value={formData.compareAtPrice} onChange={(v) => setFormData({ ...formData, compareAtPrice: v })} />
                </div>
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
                <Input label="Tags (comma-separated)" type="text" value={formData.tags} onChange={(v) => setFormData({ ...formData, tags: v })} />
                <div className="flex items-center gap-6">
                  <Checkbox isSelected={formData.inventoryTracked} onChange={(v) => setFormData({ ...formData, inventoryTracked: v })} label="Track Inventory" />
                  <Checkbox isSelected={formData.onlineOrderable} onChange={(v) => setFormData({ ...formData, onlineOrderable: v })} label="Online Orderable" />
                  <Checkbox isSelected={formData.pickupOnly} onChange={(v) => setFormData({ ...formData, pickupOnly: v })} label="Pickup Only" />
                </div>
                {formData.inventoryTracked && (
                  <Input label="Inventory Quantity" type="number" value={formData.inventoryQuantity} onChange={(v) => setFormData({ ...formData, inventoryQuantity: v })} />
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right: Shopify + Composition */}
        <div className="col-span-1 space-y-6">

          {/* Shopify Integration */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Shopify integration</h2>
                <p className="text-sm text-gray-500 mt-0.5">Manage this product's connection to your Shopify store.</p>
              </div>
              {formData.shopifyProductId ? (
                <Badge color="success">Linked</Badge>
              ) : (
                <Badge color="gray">Not linked</Badge>
              )}
            </div>

            {formData.shopifyProductId ? (
              <>
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 font-mono">{formData.shopifyProductHandle}</p>
                      <p className="text-xs text-gray-500 mt-0.5">ID: {formData.shopifyProductId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.shopifyProductHandle && (
                      <a href={`${shopifyAdminBase}/products/${formData.shopifyProductHandle}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" size="sm">
                          View in Shopify
                          <svg className="w-3.5 h-3.5 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Button>
                      </a>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setUnlinkConfirmOpen(true)}
                    >
                      Unlink
                    </Button>
                  </div>
                </div>
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Changes sync to Shopify on save. Manage inventory and variants directly in Shopify Admin.</p>
                </div>
              </>
            ) : (
              <>
                <div className="px-6 py-4 flex items-start justify-between gap-4 border-b border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Create new</p>
                      <p className="text-xs text-gray-500 mt-0.5">Generate from this product's details.</p>
                      {(!formData.price || parseFloat(formData.price) <= 0) && (
                        <p className="text-xs text-amber-600 mt-1">Price required.</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCreateShopifyProduct}
                    isDisabled={creatingShopifyProduct || !formData.price || parseFloat(formData.price) <= 0}
                    isLoading={creatingShopifyProduct}
                    className="flex-shrink-0"
                  >
                    {creatingShopifyProduct ? 'Creating...' : 'Create'}
                  </Button>
                </div>
                <div className="px-6 py-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Link product</p>
                      <p className="text-xs text-gray-500 mt-0.5">Connect to an existing Shopify product.</p>
                    </div>
                  </div>
                  <ShopifyProductPicker
                    selectedProductId={formData.shopifyProductId}
                    selectedProductHandle={formData.shopifyProductHandle}
                    onSelect={(product) => {
                      setFormData({ ...formData, shopifyProductId: product?.id || '', shopifyProductHandle: product?.handle || '' });
                    }}
                    trigger={<Button variant="secondary" size="sm" className="flex-shrink-0">Link</Button>}
                  />
                </div>
              </>
            )}
          </div>

          {/* Product Composition */}
          {format && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Product composition</h2>
                <p className="text-sm text-gray-500 mt-0.5">Format and flavours are fixed at creation time.</p>
              </div>

              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Format</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <Link href={`/admin/formats/${format.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                      {format.name}
                    </Link>
                    {format.description && <p className="text-xs text-gray-500 mt-0.5">{format.description}</p>}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Flavours</p>
                <div className="space-y-3">
                  {primaryFlavours.map((flavour) => (
                    <div key={flavour.id} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <Link href={`/admin/flavours/${flavour.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors">
                          {flavour.name}
                        </Link>
                        {flavour.shortDescription && <p className="text-xs text-gray-500 mt-0.5">{flavour.shortDescription}</p>}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          <Badge color={FLAVOUR_TYPE_COLOR[flavour.type] ?? 'gray'} size="sm">{flavour.type}</Badge>
                          {flavour.baseStyle && <Badge color={BASE_STYLE_COLOR[flavour.baseStyle] ?? 'gray'} size="sm">{flavour.baseStyle}</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Allergens & dietary</p>
                {allergenData.allergens.length > 0 ? (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1.5">Contains allergens</p>
                    <div className="flex flex-wrap gap-1">
                      {allergenData.allergens.map((allergen: string) => (
                        <Badge key={allergen} color="error" size="sm">{formatAllergen(allergen as any)}</Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-3">No allergens detected</p>
                )}
                {allergenData.dietaryClaims.filter((c: string) => !c.startsWith('contains-')).length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">Dietary claims</p>
                    <div className="flex flex-wrap gap-1">
                      {allergenData.dietaryClaims
                        .filter((claim: string) => !claim.startsWith('contains-'))
                        .map((claim: string) => (
                          <Badge key={claim} color="success" size="sm">{formatDietaryClaim(claim as any)}</Badge>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div> {/* end right column */}
      </div> {/* end grid */}

      <ConfirmModal
        isOpen={shopifyConfirmOpen}
        variant="info"
        title="Create Shopify product"
        message="This will generate a new product in your Shopify store from this offering's details. Continue?"
        confirmLabel="Create"
        cancelLabel="Cancel"
        onConfirm={doCreateShopifyProduct}
        onCancel={() => setShopifyConfirmOpen(false)}
      />
      <ConfirmModal
        isOpen={unlinkConfirmOpen}
        variant="warning"
        title="Unlink Shopify product"
        message="This will remove the Shopify connection from this product. The product will not be deleted from Shopify."
        confirmLabel="Unlink"
        cancelLabel="Cancel"
        onConfirm={() => { setFormData({ ...formData, shopifyProductId: '', shopifyProductHandle: '' }); setUnlinkConfirmOpen(false); }}
        onCancel={() => setUnlinkConfirmOpen(false)}
      />
    </EditPageLayout>
  );
}
