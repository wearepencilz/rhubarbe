'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/app/admin/components/ui/button';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import { Select } from '@/app/admin/components/ui/select';
import { Checkbox } from '@/app/admin/components/ui/checkbox';

interface Format {
  id: string;
  name: string;
}

export default function NewModifierPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formats, setFormats] = useState<Format[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'topping',
    description: '',
    image: '',
    price: '',
    allergens: [] as string[],
    dietaryFlags: [] as string[],
    availableForFormatIds: [] as string[],
    status: 'active',
  });

  useEffect(() => {
    fetchFormats();
  }, []);

  const fetchFormats = async () => {
    try {
      const response = await fetch('/api/formats');
      if (response.ok) {
        const data = await response.json();
        setFormats(data.data || data);
      }
    } catch (error) {
      console.error('Error fetching formats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/modifiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: formData.price ? Math.round(parseFloat(formData.price) * 100) : 0,
        }),
      });

      if (response.ok) {
        const modifier = await response.json();
        router.push(`/admin/modifiers/${modifier.id}`);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create modifier');
      }
    } catch (err) {
      setError('An error occurred while creating the modifier');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleFormatToggle = (formatId: string) => {
    setFormData(prev => ({
      ...prev,
      availableForFormatIds: prev.availableForFormatIds.includes(formatId)
        ? prev.availableForFormatIds.filter(id => id !== formatId)
        : [...prev.availableForFormatIds, formatId]
    }));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/modifiers" className="text-blue-600 hover:text-blue-800 text-sm">
          ← Back to Modifiers
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Create New Modifier</h1>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <Input
              label="Name *"
              type="text"
              name="name"
              isRequired
              value={formData.name}
              onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
            />
          </div>

          <div>
            <Input
              label="Slug"
              type="text"
              name="slug"
              value={formData.slug}
              onChange={(value) => setFormData(prev => ({ ...prev, slug: value }))}
              placeholder="Auto-generated from name if left empty"
            />
          </div>

          <div>
            <Select
              label="Type *"
              value={formData.type}
              onChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              isRequired
              options={[
                { id: 'topping', label: 'Topping' },
                { id: 'sauce', label: 'Sauce' },
                { id: 'crunch', label: 'Crunch' },
                { id: 'drizzle', label: 'Drizzle' },
                { id: 'premium-addon', label: 'Premium Add-on' },
                { id: 'pack-in', label: 'Pack-in' },
              ]}
            />
          </div>

          <div>
            <Textarea
              label="Description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
            />
          </div>

          <div>
            <Input
              label="Price ($)"
              type="number"
              name="price"
              isRequired
              value={String(formData.price)}
              onChange={(value) => setFormData(prev => ({ ...prev, price: value }))}
              placeholder="0.00"
            />
          </div>

          <div>
            <Input
              label="Image URL"
              type="text"
              name="image"
              value={formData.image}
              onChange={(value) => setFormData(prev => ({ ...prev, image: value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available for Formats
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {formats.map((format) => (
                <Checkbox
                  key={format.id}
                  isSelected={formData.availableForFormatIds.includes(format.id)}
                  onChange={() => handleFormatToggle(format.id)}
                  label={format.name}
                />
              ))}
            </div>
          </div>

          <div>
            <Select
              label="Status"
              value={formData.status}
              onChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              options={[
                { id: 'active', label: 'Active' },
                { id: 'archived', label: 'Archived' },
              ]}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              isDisabled={loading}
              className="flex-1"
            >
              Create Modifier
            </Button>
            <Link
              href="/admin/modifiers"
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
