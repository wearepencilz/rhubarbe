'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SECTION_META, type Section, type SectionType } from '@/lib/types/sections';
import { Trash01, Plus } from '@untitledui/icons';

interface SectionWrapperProps {
  section: Section;
  onDelete: () => void;
  onAddAbove: (type: SectionType) => void;
  onAddBelow: (type: SectionType) => void;
  onOpenLibrary: (position: 'above' | 'below', sectionId: string) => void;
  children: React.ReactNode;
}

export default function SectionWrapper({ section, onDelete, onOpenLibrary, children }: SectionWrapperProps) {
  const [hovered, setHovered] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const meta = SECTION_META[section.type];

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Section outline on hover */}
      {hovered && (
        <div className="absolute inset-0 ring-2 ring-blue-400/60 ring-inset pointer-events-none z-10 rounded" />
      )}

      {/* Top toolbar */}
      {hovered && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-white border border-gray-200 rounded-full shadow-lg px-2 py-1">
          <button {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-700 px-1 text-xs touch-none" title="Drag">⠿</button>
          <span className="text-[10px] text-gray-500 font-medium px-1">{meta.icon} {meta.label}</span>
          <button onClick={() => onOpenLibrary('above', section.id)} className="text-gray-400 hover:text-blue-600 px-0.5" title="Add above"><Plus className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="text-gray-400 hover:text-red-500 px-0.5" title="Delete"><Trash01 className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Add below button */}
      {hovered && (
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20">
          <button
            onClick={() => onOpenLibrary('below', section.id)}
            className="flex items-center gap-1 bg-blue-600 text-white text-[10px] font-medium px-2.5 py-1 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add section
          </button>
        </div>
      )}

      {/* Actual section content */}
      {children}
    </div>
  );
}
