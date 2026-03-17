'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';

interface RichTextEditorProps {
  label?: string;
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  helperText?: string;
}

export default function RichTextEditor({
  label,
  value = '',
  onChange,
  placeholder = 'Write something…',
  helperText,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'min-h-[100px] px-3 py-2 text-sm text-gray-900 focus:outline-none',
      },
    },
  });

  // Sync external value changes (e.g. after fetch)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium mb-1.5 text-gray-900">
          {label}
        </label>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border border-gray-300 border-b-0 rounded-t-md bg-gray-50">
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBold().run()}
          active={editor?.isActive('bold')}
          title="Bold"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          active={editor?.isActive('italic')}
          title="Italic"
        >
          <em>I</em>
        </ToolbarButton>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          active={editor?.isActive('bulletList')}
          title="Bullet list"
        >
          ≡
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          active={editor?.isActive('orderedList')}
          title="Ordered list"
        >
          1.
        </ToolbarButton>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <ToolbarButton
          onClick={() => editor?.chain().focus().setHardBreak().run()}
          title="Line break"
        >
          ↵
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <div className="border border-gray-300 rounded-b-md bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors">
        <EditorContent editor={editor} />
      </div>

      {helperText && (
        <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
      )}

      <style>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .tiptap ul { list-style: disc; padding-left: 1.25rem; }
        .tiptap ol { list-style: decimal; padding-left: 1.25rem; }
        .tiptap p { margin-bottom: 0.25rem; }
        .tiptap p:last-child { margin-bottom: 0; }
      `}</style>
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick?: () => void;
  active?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2 py-0.5 rounded text-sm font-medium transition-colors ${
        active
          ? 'bg-gray-200 text-gray-900'
          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  );
}
