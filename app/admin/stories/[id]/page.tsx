'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import EditPageLayout from '@/app/admin/components/EditPageLayout';
import ImageUploader from '@/app/admin/components/ImageUploader';
import StoryBlockBuilder, { type StoryBlock } from '@/app/admin/components/StoryBlockBuilder';
import TaxonomySelect from '@/app/admin/components/TaxonomySelect';
import TaxonomyMultiSelect from '@/app/admin/components/TaxonomyMultiSelect';
import ConfirmModal from '@/app/admin/components/ConfirmModal';
import { useToast } from '@/app/admin/components/ToastContainer';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import { Select } from '@/app/admin/components/ui/select';
import { BadgeWithDot } from '@/app/admin/components/ui/nav/badges';

interface Story {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  category: string;
  tags: string[];
  coverImage: string;
  coverImageAlt: string;
  intro: string;
  wordBy: string;
  wordByRole: string;
  linkedFlavourIds: string[];
  blocks: StoryBlock[];
  createdAt?: string;
  updatedAt?: string;
}

const emptyStory: Omit<Story, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '',
  slug: '',
  status: 'draft',
  category: '',
  tags: [],
  coverImage: '',
  coverImageAlt: '',
  intro: '',
  wordBy: '',
  wordByRole: '',
  linkedFlavourIds: [],
  blocks: [],
};

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function StoryEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isNew = id === 'new';
  const toast = useToast();

  const [story, setStory] = useState<Omit<Story, 'id'>>(emptyStory);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [flavours, setFlavours] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/flavours').then((r) => r.json()).then((d) => setFlavours(d.data || d)).catch(() => {});
    if (!isNew) {
      fetch(`/api/stories/${id}`)
        .then((r) => r.json())
        .then((data) => setStory(data))
        .catch(() => router.push('/admin/stories'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const set = useCallback((patch: Partial<typeof story>) => setStory((s) => ({ ...s, ...patch })), []);

  const handleTitleChange = (title: string) => {
    set({ title, ...(!slugTouched ? { slug: slugify(title) } : {}) });
  };

  const handleSave = async () => {
    if (!story.title) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const url = isNew ? '/api/stories' : `/api/stories/${id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(story),
      });
      if (res.ok) {
        const saved = await res.json();
        toast.success(isNew ? 'Story created' : 'Story saved');
        if (isNew) router.push(`/admin/stories/${saved.id}`);
      } else {
        toast.error('Failed to save story');
      }
    } catch {
      toast.error('Failed to save story');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/stories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Story deleted');
        router.push('/admin/stories');
      } else {
        toast.error('Failed to delete story');
      }
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

  return (
    <>
      <EditPageLayout
        title={isNew ? 'New Story' : 'Edit Story'}
        backHref="/admin/stories"
        backLabel="Back to Stories"
        onSave={handleSave}
        onDelete={isNew ? undefined : () => setShowDeleteModal(true)}
        onCancel={() => router.push('/admin/stories')}
        saving={saving}
        deleting={deleting}
        maxWidth="7xl"
      >
        <div className="grid grid-cols-3 gap-6">

          {/* ── Left: main content ── */}
          <div className="col-span-2 space-y-6">

            {/* Cover */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Cover</h2>
                <p className="text-sm text-gray-500 mt-0.5">Hero image shown at the top of the story</p>
              </div>
              <div className="px-6 py-6">
                <ImageUploader
                  value={story.coverImage}
                  onChange={(url) => set({ coverImage: url })}
                  onDelete={() => set({ coverImage: '' })}
                  altText={story.coverImageAlt}
                  onAltTextChange={(v) => set({ coverImageAlt: v })}
                  aspectRatio="16:9"
                  label="Cover image"
                />
              </div>
            </div>

            {/* Title & intro */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Story details</h2>
              </div>
              <div className="px-6 py-6 space-y-5">
                <Input
                  label="Title"
                  isRequired
                  value={story.title}
                  onChange={handleTitleChange}
                  placeholder="The First Strawberries"
                />
                <div>
                  <Input
                    label="Slug"
                    value={story.slug}
                    onChange={(v) => { setSlugTouched(true); set({ slug: slugify(v) }); }}
                    placeholder="the-first-strawberries"
                    helperText={story.slug ? `/stories/${story.slug}` : undefined}
                  />
                </div>
                <Textarea
                  label="Intro line"
                  value={story.intro}
                  onChange={(v) => set({ intro: v })}
                  rows={2}
                  placeholder="A short window, a perfect sweetness."
                  helperText="One or two lines — shown on the card and at the top of the story"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Word by"
                    value={story.wordBy}
                    onChange={(v) => set({ wordBy: v })}
                    placeholder="Yann Bizeul"
                  />
                  <Input
                    label="Role"
                    value={story.wordByRole}
                    onChange={(v) => set({ wordByRole: v })}
                    placeholder="Head of Flavour"
                  />
                </div>
              </div>
            </div>

            {/* Block builder */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 rounded-t-lg">
                <h2 className="text-sm font-semibold text-gray-900">Story body</h2>
                <p className="text-sm text-gray-500 mt-0.5">Build the story with modular blocks — drag to reorder</p>
              </div>
              <div className="px-6 py-6">
                <StoryBlockBuilder
                  blocks={story.blocks}
                  onChange={(blocks) => set({ blocks })}
                />
              </div>
            </div>

          </div>

          {/* ── Right: metadata ── */}
          <div className="col-span-1 space-y-6">

            {/* Status */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Status</h2>
                <BadgeWithDot color={story.status === 'published' ? 'success' : 'gray'}>
                  {story.status}
                </BadgeWithDot>
              </div>
              <div className="px-6 py-5">
                <Select
                  label="Visibility"
                  value={story.status}
                  onChange={(v) => set({ status: v as 'draft' | 'published' })}
                  options={[
                    { id: 'draft', label: 'Draft' },
                    { id: 'published', label: 'Published' },
                  ]}
                />
              </div>
            </div>

            {/* Category & tags */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Taxonomy</h2>
              </div>
              <div className="px-6 py-5 space-y-4">
                <TaxonomySelect
                  label="Category"
                  category="storyCategories"
                  value={story.category}
                  onChange={(v) => set({ category: v })}
                  placeholder="Select category…"
                />
                <TaxonomyMultiSelect
                  label="Tags"
                  category="storyTags"
                  values={story.tags}
                  onChange={(v) => set({ tags: v })}
                  description="Ingredient, place, theme, season"
                />
              </div>
            </div>

            {/* Linked flavours */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">Linked flavours</h2>
                <p className="text-sm text-gray-500 mt-0.5">Connect this story to flavours in the archive</p>
              </div>
              <div className="px-6 py-5">
                <div className="space-y-2">
                  {flavours.map((f) => (
                    <label key={f.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={story.linkedFlavourIds.includes(f.id)}
                        onChange={(e) => {
                          const ids = e.target.checked
                            ? [...story.linkedFlavourIds, f.id]
                            : story.linkedFlavourIds.filter((x) => x !== f.id);
                          set({ linkedFlavourIds: ids });
                        }}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{f.name}</span>
                    </label>
                  ))}
                  {flavours.length === 0 && <p className="text-sm text-gray-400">No flavours yet</p>}
                </div>
              </div>
            </div>

          </div>
        </div>
      </EditPageLayout>

      <ConfirmModal
        isOpen={showDeleteModal}
        variant="danger"
        title="Delete Story"
        message={`Are you sure you want to delete "${story.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
}
