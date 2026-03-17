'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/app/admin/components/ui/button';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import { DatePicker } from '@/app/admin/components/ui/date-picker/date-picker';
import { parseDate } from '@internationalized/date';
import { useToast } from '@/app/admin/components/ToastContainer';

interface NewsItem {
  id?: number;
  title: string;
  content: string;
  date: string;
  image?: string;
}

export default function NewsEditPage() {
  const router = useRouter();
  const params = useParams();
  const isNew = params?.id === 'new';
  const toast = useToast();

  const [formData, setFormData] = useState<NewsItem>({
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    image: '',
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isNew) {
      fetchNews();
    }
  }, []);

  const fetchNews = async () => {
    try {
      const res = await fetch('/api/news');
      const newsItems = await res.json();
      const item = newsItems.find((n: NewsItem) => n.id === parseInt(params?.id as string));
      if (item) {
        setFormData(item);
      }
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setFormData((prev) => ({ ...prev, image: data.url }));
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = isNew ? '/api/news' : `/api/news/${params?.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(isNew ? 'Article created' : 'Article saved');
        router.push('/admin/news');
      } else {
        toast.error('Failed to save article');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">
          {isNew ? 'New Article' : 'Edit Article'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-900">
              Date
            </label>
            <DatePicker
              value={formData.date ? parseDate(formData.date) : null}
              onChange={(date) => setFormData({ ...formData, date: date ? date.toString() : '' })}
              isRequired
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-900">
              Title
            </label>
            <Input
              value={formData.title}
              onChange={(value) => setFormData({ ...formData, title: value })}
              isRequired
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-900">
              Content
            </label>
            <Textarea
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
              rows={8}
              isRequired
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-900">
              Image (Optional)
            </label>
            {formData.image && (
              <img
                src={formData.image}
                alt="Preview"
                className="w-full h-48 object-cover rounded-md mb-3"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            type="submit"
            variant="primary"
            isDisabled={saving}
            isLoading={saving}
          >
            {saving ? 'Saving...' : 'Save Article'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
