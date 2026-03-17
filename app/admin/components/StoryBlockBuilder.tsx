'use client';

import { useState, useRef } from 'react';
import { Button } from '@/app/admin/components/ui/button';
import { Input } from '@/app/admin/components/ui/input';
import { Textarea } from '@/app/admin/components/ui/textarea';
import RichTextEditor from '@/app/admin/components/RichTextEditor';
import ImageUploader from '@/app/admin/components/ImageUploader';
import {
  DotsGrid,
  Plus,
  Trash01,
  ChevronUp,
  ChevronDown,
  Image01,
  AlignLeft,
  Film01,
  LayoutGrid01,
  Annotation,
  User01,
  Tag01,
} from '@untitledui/icons';

export type BlockType =
  | 'text'
  | 'image'
  | 'image-grid'
  | 'video'
  | 'quote'
  | 'ingredient-focus'
  | 'word-by'
  | 'divider';

export interface StoryBlock {
  id: string;
  type: BlockType;
  // text
  content?: string;
  // image / image-grid
  images?: { url: string; caption?: string; alt?: string }[];
  layout?: '1-col' | '2-col' | '3-col' | 'full-bleed';
  // video
  videoUrl?: string;
  videoCaption?: string;
  // quote
  quote?: string;
  attribution?: string;
  // ingredient-focus
  ingredient?: string;
  origin?: string;
  season?: string;
  why?: string;
  // word-by
  author?: string;
  role?: string;
}

const BLOCK_TYPES: { type: BlockType; label: string; icon: any; description: string }[] = [
  { type: 'text', label: 'Text', icon: AlignLeft, description: 'Narrative paragraph' },
  { type: 'image', label: 'Image', icon: Image01, description: 'Single or full-bleed image' },
  { type: 'image-grid', label: 'Photo Grid', icon: LayoutGrid01, description: '2 or 3 column photos' },
  { type: 'video', label: 'Video', icon: Film01, description: 'Embed a video URL' },
  { type: 'quote', label: 'Quote', icon: Annotation, description: 'Pull quote or excerpt' },
  { type: 'ingredient-focus', label: 'Ingredient Focus', icon: Tag01, description: 'Ingredient breakout card' },
  { type: 'word-by', label: 'Word by', icon: User01, description: 'Author attribution' },
  { type: 'divider', label: 'Divider', icon: DotsGrid, description: 'Section break' },
];

function newBlock(type: BlockType): StoryBlock {
  const id = `block_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  switch (type) {
    case 'image': return { id, type, images: [{ url: '', caption: '', alt: '' }], layout: '1-col' };
    case 'image-grid': return { id, type, images: [{ url: '', caption: '' }, { url: '', caption: '' }], layout: '2-col' };
    default: return { id, type };
  }
}

interface BlockEditorProps {
  block: StoryBlock;
  onChange: (block: StoryBlock) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function BlockEditor({ block, onChange, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: BlockEditorProps) {
  const set = (patch: Partial<StoryBlock>) => onChange({ ...block, ...patch });

  const renderFields = () => {
    switch (block.type) {
      case 'text':
        return (
          <RichTextEditor
            value={block.content || ''}
            onChange={(v) => set({ content: v })}
            placeholder="Write something…"
          />
        );

      case 'image':
        return (
          <div className="space-y-4">
            <div className="flex gap-3 mb-2">
              {(['1-col', 'full-bleed'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => set({ layout: l })}
                  className={`px-3 py-1 text-xs rounded-md border transition-colors ${block.layout === l ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:border-gray-500'}`}
                >
                  {l === '1-col' ? 'Contained' : 'Full bleed'}
                </button>
              ))}
            </div>
            <ImageUploader
              value={block.images?.[0]?.url || ''}
              onChange={(url) => set({ images: [{ ...block.images?.[0], url }] })}
              aspectRatio="16:9"
              label="Image"
            />
            <Input
              label="Caption (optional)"
              value={block.images?.[0]?.caption || ''}
              onChange={(v) => set({ images: [{ ...block.images?.[0], url: block.images?.[0]?.url || '', caption: v }] })}
              placeholder="A short caption…"
            />
          </div>
        );

      case 'image-grid':
        return (
          <div className="space-y-4">
            <div className="flex gap-3 mb-2">
              {(['2-col', '3-col'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    const count = l === '2-col' ? 2 : 3;
                    const imgs = Array.from({ length: count }, (_, i) => block.images?.[i] || { url: '', caption: '' });
                    set({ layout: l, images: imgs });
                  }}
                  className={`px-3 py-1 text-xs rounded-md border transition-colors ${block.layout === l ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:border-gray-500'}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className={`grid gap-4 ${block.layout === '3-col' ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {(block.images || []).map((img, i) => (
                <div key={i} className="space-y-2">
                  <ImageUploader
                    value={img.url}
                    onChange={(url) => {
                      const imgs = [...(block.images || [])];
                      imgs[i] = { ...imgs[i], url };
                      set({ images: imgs });
                    }}
                    aspectRatio="1:1"
                    label={`Photo ${i + 1}`}
                  />
                  <Input
                    placeholder="Caption…"
                    value={img.caption || ''}
                    onChange={(v) => {
                      const imgs = [...(block.images || [])];
                      imgs[i] = { ...imgs[i], caption: v };
                      set({ images: imgs });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-3">
            <Input
              label="Video URL"
              value={block.videoUrl || ''}
              onChange={(v) => set({ videoUrl: v })}
              placeholder="https://vimeo.com/… or https://youtube.com/…"
            />
            <Input
              label="Caption (optional)"
              value={block.videoCaption || ''}
              onChange={(v) => set({ videoCaption: v })}
              placeholder="A short caption…"
            />
          </div>
        );

      case 'quote':
        return (
          <div className="space-y-3">
            <Textarea
              label="Quote"
              value={block.quote || ''}
              onChange={(v) => set({ quote: v })}
              rows={3}
              placeholder="The words that matter…"
            />
            <Input
              label="Attribution (optional)"
              value={block.attribution || ''}
              onChange={(v) => set({ attribution: v })}
              placeholder="— Name, role"
            />
          </div>
        );

      case 'ingredient-focus':
        return (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ingredient" value={block.ingredient || ''} onChange={(v) => set({ ingredient: v })} placeholder="White Peach" />
            <Input label="Origin" value={block.origin || ''} onChange={(v) => set({ origin: v })} placeholder="Niagara" />
            <Input label="Season" value={block.season || ''} onChange={(v) => set({ season: v })} placeholder="Late August" />
            <div className="col-span-2">
              <Textarea label="Why it matters" value={block.why || ''} onChange={(v) => set({ why: v })} rows={2} placeholder="High sugar, low acidity, floral finish…" />
            </div>
          </div>
        );

      case 'word-by':
        return (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Author name" value={block.author || ''} onChange={(v) => set({ author: v })} placeholder="Yann Bizeul" />
            <Input label="Role (optional)" value={block.role || ''} onChange={(v) => set({ role: v })} placeholder="Head of Flavour" />
          </div>
        );

      case 'divider':
        return <p className="text-sm text-gray-400 italic">Section divider — renders as a thin line</p>;

      default:
        return null;
    }
  };

  const meta = BLOCK_TYPES.find((b) => b.type === block.type);
  const Icon = meta?.icon;

  return (
    <div className="group bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Block header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <div className="text-gray-400 cursor-grab">
          <DotsGrid className="w-4 h-4" />
        </div>
        {Icon && <Icon className="w-4 h-4 text-gray-500" />}
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex-1">{meta?.label}</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onMoveUp} disabled={isFirst} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button type="button" onClick={onMoveDown} disabled={isLast} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button type="button" onClick={onDelete} className="p-1 text-gray-400 hover:text-red-500 transition-colors ml-1">
            <Trash01 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Block content */}
      <div className="p-4">
        {renderFields()}
      </div>
    </div>
  );
}

interface AddBlockMenuProps {
  onAdd: (type: BlockType) => void;
}

function AddBlockMenu({ onAdd }: AddBlockMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add block
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-2 grid grid-cols-2 gap-1">
          {BLOCK_TYPES.map(({ type, label, icon: Icon, description }) => (
            <button
              key={type}
              type="button"
              onClick={() => { onAdd(type); setOpen(false); }}
              className="flex items-start gap-2.5 p-2.5 rounded-md hover:bg-gray-50 text-left transition-colors"
            >
              <Icon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-500">{description}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface StoryBlockBuilderProps {
  blocks: StoryBlock[];
  onChange: (blocks: StoryBlock[]) => void;
}

export default function StoryBlockBuilder({ blocks, onChange }: StoryBlockBuilderProps) {
  const addBlock = (type: BlockType) => {
    onChange([...blocks, newBlock(type)]);
  };

  const updateBlock = (index: number, block: StoryBlock) => {
    const next = [...blocks];
    next[index] = block;
    onChange(next);
  };

  const deleteBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const next = [...blocks];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => (
        <BlockEditor
          key={block.id}
          block={block}
          onChange={(b) => updateBlock(i, b)}
          onDelete={() => deleteBlock(i)}
          onMoveUp={() => moveBlock(i, 'up')}
          onMoveDown={() => moveBlock(i, 'down')}
          isFirst={i === 0}
          isLast={i === blocks.length - 1}
        />
      ))}
      <AddBlockMenu onAdd={addBlock} />
    </div>
  );
}
