'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/app/admin/components/ui/button';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import { useToast } from '@/app/admin/components/ToastContainer';

interface PageContent {
  title?: string;
  content?: string;
  [key: string]: any;
}

export default function PageEditPage() {
  const router = useRouter();
  const params = useParams();
  const pageName = params?.pageName as string;
  const toast = useToast();

  const [formData, setFormData] = useState<PageContent>({
    title: '',
    content: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPage();
  }, []);

  const fetchPage = async () => {
    try {
      const res = await fetch(`/api/pages/${pageName}`);
      const data = await res.json();
      setFormData(data);
    } catch (error) {
      console.error('Failed to fetch page:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/pages/${pageName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Page saved', `${pageName} page has been updated`);
      } else {
        toast.error('Failed to save page');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('Failed to save page');
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
        <h1 className="text-3xl font-semibold text-gray-900 capitalize">
          Edit {pageName} Page
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <div>
            <Input
              label="Page Title"
              type="text"
              value={formData.title || ''}
              onChange={(value) => setFormData({ ...formData, title: value })}
              placeholder="Enter page title"
            />
          </div>

          <div>
            <Textarea
              label="Content"
              value={formData.content || ''}
              onChange={(value) => setFormData({ ...formData, content: value })}
              rows={12}
              placeholder="Enter page content"
              helperText="You can use HTML or Markdown formatting"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            type="submit"
            variant="primary"
            isLoading={saving}
            isDisabled={saving}
          >
            Save Page
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Back
          </Button>
        </div>
      </form>
    </div>
  );
}
