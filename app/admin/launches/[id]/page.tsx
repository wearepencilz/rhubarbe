'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateSlug } from '@/lib/slug';
import EditPageLayout from '@/app/admin/components/EditPageLayout';
import FormatSelectionModal from '@/app/admin/components/FormatSelectionModal';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import { useToast } from '@/app/admin/components/ToastContainer';
import { Button } from '@/app/admin/components/ui/button';
import { Select } from '@/app/admin/components/ui/select';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import { DateRangePicker } from '@/app/admin/components/ui/date-picker/date-range-picker';
import { Checkbox } from '@/app/admin/components/ui/checkbox';
import { Badge, BadgeWithDot } from '@/app/admin/components/ui/nav/badges';
import { stringToDateValue, dateValueToString } from '@/lib/date-utils';
import ImageUploader from '@/app/admin/components/ImageUploader';

interface Launch {
  id: string;
  title: string;
  slug: string;
  status: string;
  heroImage?: string;
  story?: string;
  description?: string;
  activeStart?: string;
  activeEnd?: string;
  featured: boolean;
  featuredFlavourIds: string[];
  featuredProductIds: string[];
}

interface Flavour {
  id: string;
  name: string;
  type: string;
}

interface Product {
  id: string;
  internalName?: string;
  publicName?: string;
  name?: string;
  shopifyProductId?: string;
}

interface Format {
  id: string;
  name: string;
  description?: string;
  eligibleFlavourTypes?: string[];
  minFlavours: number;
  maxFlavours: number;
  allowMixedTypes?: boolean;
}

const STATUS_COLOR: Record<string, 'blue' | 'success' | 'gray' | 'error'> = {
  upcoming: 'blue',
  active: 'success',
  ended: 'gray',
  archived: 'error',
};

export default function EditLaunchPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [launch, setLaunch] = useState<Launch | null>(null);
  const [flavours, setFlavours] = useState<Flavour[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formats, setFormats] = useState<Format[]>([]);
  const [slugTouched, setSlugTouched] = useState(false);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchLaunch();
    fetchFlavours();
    fetchProducts();
    fetchFormats();
  }, [params.id]);

  const fetchLaunch = async () => {
    try {
      const response = await fetch(`/api/launches/${params.id}`);
      if (response.ok) {
        setLaunch(await response.json());
      } else {
        setError('Launch not found');
      }
    } catch {
      setError('Failed to load launch');
    } finally {
      setLoading(false);
    }
  };

  const fetchFlavours = async () => {
    try {
      const response = await fetch('/api/flavours?pageSize=1000');
      if (response.ok) {
        const result = await response.json();
        setFlavours(Array.isArray(result.data) ? result.data : []);
      }
    } catch (err) { console.error('Failed to load flavours', err); }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error('Failed to load products', err); }
  };

  const fetchFormats = async () => {
    try {
      const response = await fetch('/api/formats');
      if (response.ok) {
        const data = await response.json();
        setFormats(Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error('Failed to load formats', err); }
  };

  const handleGenerateProducts = async (selectedFormatIds: string[]) => {
    if (!launch || launch.featuredFlavourIds.length === 0) return;
    setGenerating(true);
    setError('');
    setShowFormatModal(false);
    try {
      const response = await fetch(`/api/launches/${params.id}/generate-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flavourIds: launch.featuredFlavourIds, formatIds: selectedFormatIds }),
      });
      if (response.ok) {
        const data = await response.json();
        alert(data.message || `Successfully generated ${data.created} product(s)`);
        await fetchProducts();
        await fetchLaunch();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to generate products');
      }
    } catch {
      setError('An error occurred while generating products');
    } finally {
      setGenerating(false);
    }
  };

  const toggleFlavour = (flavourId: string) => {
    if (!launch) return;
    const ids = launch.featuredFlavourIds.includes(flavourId)
      ? launch.featuredFlavourIds.filter(id => id !== flavourId)
      : [...launch.featuredFlavourIds, flavourId];
    setLaunch({ ...launch, featuredFlavourIds: ids });
  };

  const toggleProduct = (productId: string) => {
    if (!launch) return;
    const ids = launch.featuredProductIds.includes(productId)
      ? launch.featuredProductIds.filter(id => id !== productId)
      : [...launch.featuredProductIds, productId];
    setLaunch({ ...launch, featuredProductIds: ids });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!launch) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/launches/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(launch),
      });
      if (response.ok) {
        router.push('/admin/launches');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update launch');
      }
    } catch {
      setError('An error occurred while updating the launch');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/launches/${params.id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Launch deleted', `${launch?.title} has been removed`);
        router.push('/admin/launches');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete launch');
        toast.error('Delete failed', data.error || 'Unable to delete launch');
      }
    } catch {
      setError('An error occurred while deleting the launch');
      toast.error('Delete failed', 'Unable to delete launch');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!launch) {
    return (
      <EditPageLayout title="Edit Launch" backHref="/admin/launches" backLabel="Back to Launches"
        onSave={() => {}} onCancel={() => router.push('/admin/launches')} error={error || 'Launch not found'}>
        <div />
      </EditPageLayout>
    );
  }

  return (
    <EditPageLayout
      title="Edit Launch"
      backHref="/admin/launches"
      backLabel="Back to Launches"
      onSave={() => handleSubmit(new Event('submit') as any)}
      onDelete={() => setShowDeleteModal(true)}
      onCancel={() => router.push('/admin/launches')}
      saving={saving}
      deleting={deleting}
      error={error}
      maxWidth="7xl"
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-3 gap-6">

          {/* Left column */}
          <div className="col-span-2 space-y-6">

            {/* Launch details */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Launch details</h2>
                <p className="text-sm text-gray-500 mt-0.5">Title, slug, description and story.</p>
              </div>
              <div className="px-6 py-6 space-y-5">
                <Input
                  label="Title"
                  isRequired
                  value={launch.title}
                  onChange={(v) => {
                    setLaunch({ ...launch, title: v, slug: slugTouched ? launch.slug : generateSlug(v) });
                  }}
                />
                <div>
                  <Input
                    label="Slug"
                    value={launch.slug}
                    onChange={(v) => { setSlugTouched(true); setLaunch({ ...launch, slug: generateSlug(v) }); }}
                  />
                  <p className="mt-1 text-xs text-gray-500">Auto-generated from title</p>
                </div>
                <Textarea
                  label="Description"
                  rows={3}
                  value={launch.description || ''}
                  onChange={(v) => setLaunch({ ...launch, description: v })}
                  placeholder="Short description shown in listings"
                />
                <Textarea
                  label="Story"
                  rows={6}
                  value={launch.story || ''}
                  onChange={(v) => setLaunch({ ...launch, story: v })}
                  placeholder="Editorial story for this launch..."
                />
              </div>
            </div>

            {/* Featured flavours */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Featured flavours</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {launch.featuredFlavourIds.length} selected
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (launch.featuredFlavourIds.length === 0) {
                      alert('Please select at least one flavour first');
                      return;
                    }
                    setShowFormatModal(true);
                  }}
                  isDisabled={generating || launch.featuredFlavourIds.length === 0}
                  isLoading={generating}
                >
                  Generate products
                </Button>
              </div>
              <div className="px-6 py-4 max-h-72 overflow-y-auto divide-y divide-gray-50">
                {flavours.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4">No flavours available</p>
                ) : (
                  flavours.map((flavour) => (
                    <div key={flavour.id} className="flex items-center justify-between py-2.5">
                      <Checkbox
                        isSelected={launch.featuredFlavourIds.includes(flavour.id)}
                        onChange={() => toggleFlavour(flavour.id)}
                        label={flavour.name}
                      />
                      <Badge color="gray" size="sm">{flavour.type}</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right column */}
          <div className="col-span-1 space-y-6">

            {/* Status & settings */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Status</h2>
                <BadgeWithDot color={STATUS_COLOR[launch.status] ?? 'gray'}>
                  {launch.status}
                </BadgeWithDot>
              </div>
              <div className="px-6 py-5 space-y-5">
                <Select
                  label="Status"
                  value={launch.status}
                  onChange={(v) => setLaunch({ ...launch, status: v })}
                  options={[
                    { id: 'upcoming', label: 'Upcoming' },
                    { id: 'active', label: 'Active' },
                    { id: 'ended', label: 'Ended' },
                    { id: 'archived', label: 'Archived' },
                  ]}
                />
                <Checkbox
                  isSelected={launch.featured}
                  onChange={(v) => setLaunch({ ...launch, featured: v })}
                  label="Featured on homepage"
                />
              </div>
            </div>

            {/* Active period */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Active period</h2>
                <p className="text-sm text-gray-500 mt-0.5">When this launch is visible to customers.</p>
              </div>
              <div className="px-6 py-5">
                <DateRangePicker
                  value={
                    launch.activeStart && launch.activeEnd
                      ? { start: stringToDateValue(launch.activeStart)!, end: stringToDateValue(launch.activeEnd)! }
                      : null
                  }
                  onChange={(range) => {
                    setLaunch({
                      ...launch,
                      activeStart: range ? dateValueToString(range.start) : undefined,
                      activeEnd: range ? dateValueToString(range.end) : undefined,
                    });
                  }}
                />
              </div>
            </div>

            {/* Hero image */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Hero image</h2>
                <p className="text-sm text-gray-500 mt-0.5">16:9 banner shown at the top of the launch page.</p>
              </div>
              <div className="px-6 py-5">
                <ImageUploader
                  label=""
                  value={launch.heroImage || ''}
                  onChange={(url) => setLaunch({ ...launch, heroImage: url })}
                  aspectRatio="16:9"
                />
              </div>
            </div>

            {/* Featured products */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Featured products</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {launch.featuredProductIds?.length || 0} selected
                </p>
              </div>
              <div className="px-6 py-4 max-h-72 overflow-y-auto divide-y divide-gray-50">
                {products.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4">No products available</p>
                ) : (
                  products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between py-2.5">
                      <Checkbox
                        isSelected={launch.featuredProductIds?.includes(product.id) || false}
                        onChange={() => toggleProduct(product.id)}
                        label={product.publicName || product.internalName || product.name || 'Unnamed'}
                      />
                      {product.shopifyProductId && (
                        <Badge color="success" size="sm">Shopify</Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </form>

      <FormatSelectionModal
        isOpen={showFormatModal}
        onClose={() => setShowFormatModal(false)}
        onConfirm={handleGenerateProducts}
        formats={formats}
        selectedFlavours={flavours.filter(f => launch.featuredFlavourIds.includes(f.id))}
        isGenerating={generating}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        variant="danger"
        title="Delete Launch"
        message={`Are you sure you want to delete "${launch?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </EditPageLayout>
  );
}
