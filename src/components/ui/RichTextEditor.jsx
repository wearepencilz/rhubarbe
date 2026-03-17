import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'

const MenuBar = ({ editor }) => {
  if (!editor) return null

  const addLink = () => {
    const url = window.prompt('Enter URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const addImage = () => {
    const url = window.prompt('Enter image URL:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  return (
    <div className="border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap gap-1">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          editor.isActive('bold')
            ? 'bg-blue-100 text-blue-700'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
        title="Bold (Ctrl+B)"
      >
        B
      </button>
      
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-3 py-1.5 rounded text-sm font-medium italic transition-colors ${
          editor.isActive('italic')
            ? 'bg-blue-100 text-blue-700'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
        title="Italic (Ctrl+I)"
      >
        I
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`px-3 py-1.5 rounded text-sm font-medium line-through transition-colors ${
          editor.isActive('strike')
            ? 'bg-blue-100 text-blue-700'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
        title="Strikethrough"
      >
        S
      </button>

      <div className="w-px h-8 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          editor.isActive('heading', { level: 2 })
            ? 'bg-blue-100 text-blue-700'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
        title="Heading 2"
      >
        H2
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          editor.isActive('heading', { level: 3 })
            ? 'bg-blue-100 text-blue-700'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
        title="Heading 3"
      >
        H3
      </button>

      <div className="w-px h-8 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          editor.isActive('bulletList')
            ? 'bg-blue-100 text-blue-700'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
        title="Bullet List"
      >
        • List
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          editor.isActive('orderedList')
            ? 'bg-blue-100 text-blue-700'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
        title="Numbered List"
      >
        1. List
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          editor.isActive('blockquote')
            ? 'bg-blue-100 text-blue-700'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
        title="Quote"
      >
        " Quote
      </button>

      <div className="w-px h-8 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={addLink}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          editor.isActive('link')
            ? 'bg-blue-100 text-blue-700'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        }`}
        title="Add Link"
      >
        🔗 Link
      </button>

      <button
        type="button"
        onClick={addImage}
        className="px-3 py-1.5 rounded text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 transition-colors"
        title="Add Image"
      >
        🖼️ Image
      </button>

      <div className="w-px h-8 bg-gray-300 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="px-3 py-1.5 rounded text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Undo (Ctrl+Z)"
      >
        ↶ Undo
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="px-3 py-1.5 rounded text-sm font-medium bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Redo (Ctrl+Y)"
      >
        ↷ Redo
      </button>
    </div>
  )
}

const RichTextEditor = ({ 
  value = '', 
  onChange, 
  label, 
  error, 
  helperText,
  placeholder = 'Start typing...',
  minHeight = '200px'
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800'
        }
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded'
        }
      }),
      Placeholder.configure({
        placeholder
      })
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none p-4'
      }
    }
  })

  // Update editor content when value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className={`border rounded-lg overflow-hidden bg-white ${
        error ? 'border-red-300' : 'border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500'
      }`}>
        <MenuBar editor={editor} />
        <div style={{ minHeight }} className="overflow-y-auto">
          <EditorContent editor={editor} />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
}

export default RichTextEditor
