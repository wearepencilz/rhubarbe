'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateSlug } from '@/lib/slug';
import { Button } from '@/app/admin/components/ui/button';
import { Select } from '@/app/admin/components/ui/select';
import { DateRangePicker } from '@/app/admin/components/ui/date-picker/date-range-picker';
import { Checkbox } from '@/app/admin/components/ui/checkbox';
import { stringToDateValue, dateValueToString } from '@/lib/date-utils';
import ImageUploader from '@/app/admin/components/ImageUploader';

interface Flavour {
  id: string;
  name: string;
}

interface Product {
  id: string;
  internalName?: string;
  publicName?: string;
  name?: string; // Legacy field for backwards compatibility
  shopifyProductId?: string;
}

export default function NewLaunchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');
  const [flavours, setFlavours] = useState<Flavour[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [slugTouched, setSlugTouched] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    status: 'upcoming',
    heroImage: '',
    story: '',
    description: '',
    activeStart: '',
    activeEnd: '',
    featured: false,
    featuredFlavourIds: [] as string[],
    featuredProductIds: [] as string[],
  });

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchFlavours(), fetchProducts()]);
      setDataLoading(false);
    };
    fetchData();
  }, []);

  const fetchFlavours = async () => {
    try {
      const response = await fetch('/api/flavours?pageSize=1000');
      if (response.ok) {
        const result = await response.json();
        // Flavours API returns paginated response: { data: [], total, page, pageSize }
        setFlavours(Array.isArray(result.data) ? result.data : []);
      }
    } catch (err) {
      console.error('Failed to load flavours', err);
      setFlavours([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        // Products API returns plain array
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load products', err);
      setProducts([]);
    }
  };

  const toggleFlavour = (flavourId: string) => {
    const ids = formData.featuredFlavourIds.includes(flavourId)
      ? formData.featuredFlavourIds.filter(id => id !== flavourId)
      : [...formData.featuredFlavourIds, flavourId];
    setFormData(prev => ({ ...prev, featuredFlavourIds: ids }));
  };

  const toggleProduct = (productId: string) => {
    const ids = formData.featuredProductIds.includes(productId)
      ? formData.featuredProductIds.filter(id => id !== productId)
      : [...formData.featuredProductIds, productId];
    setFormData(prev => ({ ...prev, featuredProductIds: ids }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/launches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const launch = await response.json();
        router.push(`/admin/launches/${launch.id}`);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create launch');
      }
    } catch (err) {
      setError('An error occurred while creating the launch');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Auto-generate slug from title if slug hasn't been manually edited
    if (name === 'title' && !slugTouched) {
      setFormData(prev => ({
        ...prev,
        title: value,
        slug: generateSlug(value)
      }));
    } else if (name === 'slug') {
      setSlugTouched(true);
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/launches" className="text-blue-600 hover:text-blue-800 text-sm">
          ← Back to Launches
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Create New Launch</h1>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
              Slug
            </label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="auto-generated-from-title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Auto-generated from title, but you can edit it
            </p>
          </div>

          <div>
            <Select
              label="Status"
              value={formData.status}
              onChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              options={[
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'active', label: 'Active' },
                { id: 'ended', label: 'Ended' },
                { id: 'archived', label: 'Archived' },
              ]}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="story" className="block text-sm font-medium text-gray-700 mb-2">
              Story
            </label>
            <textarea
              id="story"
              name="story"
              rows={6}
              value={formData.story}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Active Period
            </label>
            <DateRangePicker
              value={
                formData.activeStart && formData.activeEnd
                  ? {
                      start: stringToDateValue(formData.activeStart)!,
                      end: stringToDateValue(formData.activeEnd)!,
                    }
                  : null
              }
              onChange={(range) => {
                if (range) {
                  setFormData({
                    ...formData,
                    activeStart: dateValueToString(range.start),
                    activeEnd: dateValueToString(range.end),
                  });
                } else {
                  setFormData({
                    ...formData,
                    activeStart: '',
                    activeEnd: '',
                  });
                }
              }}
            />
            <p className="mt-2 text-sm text-gray-600">
              When this launch will be active and visible to customers
            </p>
          </div>

          <div>
            <ImageUploader
              label="Hero Image"
              value={formData.heroImage}
              onChange={(url) => setFormData(prev => ({ ...prev, heroImage: url }))}
              aspectRatio="16:9"
            />
          </div>

          <Checkbox
            isSelected={formData.featured}
            onChange={(v) => setFormData(prev => ({ ...prev, featured: v }))}
            label="Featured on homepage"
          />

          {/* Flavours Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Featured Flavours</h3>
            <p className="text-sm text-gray-600 mb-3">
              Select flavours to feature in this launch. After creating the launch, you can auto-generate products from selected flavours.
            </p>
            {dataLoading ? (
              <div className="border border-gray-300 rounded-lg p-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                {flavours.length === 0 ? (
                  <p className="text-sm text-gray-500">No flavours available</p>
                ) : (
                  <div className="space-y-2">
                    {flavours.map((flavour) => (
                      <div key={flavour.id} className="p-2 hover:bg-gray-50 rounded">
                        <Checkbox
                          isSelected={formData.featuredFlavourIds.includes(flavour.id)}
                          onChange={() => toggleFlavour(flavour.id)}
                          label={flavour.name}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {formData.featuredFlavourIds.length} flavour(s) selected
            </p>
          </div>

          {/* Products Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Featured Products</h3>
            <p className="text-sm text-gray-600 mb-3">
              Select products to feature in this launch.
            </p>
            {dataLoading ? (
              <div className="border border-gray-300 rounded-lg p-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                {products.length === 0 ? (
                  <p className="text-sm text-gray-500">No products available</p>
                ) : (
                  <div className="space-y-2">
                    {products.map((product) => (
                      <div key={product.id} className="p-2 hover:bg-gray-50 rounded">
                        <Checkbox
                          isSelected={formData.featuredProductIds.includes(product.id)}
                          onChange={() => toggleProduct(product.id)}
                          label={`${product.publicName || product.internalName || product.name || 'Unnamed Product'}${product.shopifyProductId ? ' (Shopify)' : ''}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {formData.featuredProductIds.length} product(s) selected
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={() => router.push('/admin/launches')}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isDisabled={loading}
              isLoading={loading}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Create Launch'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
