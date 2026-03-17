import { useForm, Controller } from 'react-hook-form'
import { API_URL } from '../config'
import FormSection from '../components/ui/FormSection'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import FileInput from '../components/ui/FileInput'
import Button from '../components/ui/Button'
import RichTextEditor from '../components/ui/RichTextEditor'

const NewsForm = ({ newsItem = {}, onSave, onCancel }) => {
  const { register, handleSubmit, control, watch, formState: { isSubmitting, errors } } = useForm({
    values: {
      id: newsItem.id || undefined,
      title: newsItem.title || '',
      category: newsItem.category || '',
      date: newsItem.date || new Date().toISOString().split('T')[0],
      excerpt: newsItem.excerpt || '',
      content: newsItem.content || '',
      image: newsItem.image || ''
    }
  })
  const imageValue = watch('image')
  console.log('🎨 NewsForm: Current image value from form:', imageValue)
  console.log('📦 NewsForm: NewsItem prop:', newsItem)

  // No need for useEffect - using 'values' instead of 'defaultValues'

  const handleImageUpload = async (file) => {
    if (!file) return null
    
    console.log('📤 NewsForm: Starting upload for:', file.name)
    
    try {
      const formData = new FormData()
      formData.append('image', file)
      
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Upload failed: ${error}`)
      }
      
      const data = await response.json()
      console.log('✅ NewsForm: Upload successful, URL:', data.url)
      console.log('📊 NewsForm: Full response:', data)
      return data.url
    } catch (error) {
      console.error('❌ NewsForm: Upload error:', error)
      alert('Error uploading image: ' + error.message)
      throw error
    }
  }

  return (
    <form onSubmit={handleSubmit(onSave)}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 space-y-6">
          <FormSection title="Basic Information">
            <Input
              label="Title"
              {...register('title')}
              required
            />
            <Input
              label="Category"
              {...register('category')}
              placeholder="Insights, News, Updates"
              required
            />
            <Input
              label="Date"
              type="date"
              {...register('date')}
              required
            />
          </FormSection>

          <FormSection title="Content">
            <Textarea
              label="Excerpt"
              {...register('excerpt')}
              rows={2}
              placeholder="Short description"
              required
            />
            <Controller
              name="content"
              control={control}
              rules={{ required: 'Content is required' }}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  label="Content"
                  placeholder="Write your article content here..."
                  error={errors.content?.message}
                  helperText="Format your article with headings, lists, links, and images"
                  minHeight="400px"
                />
              )}
            />
          </FormSection>

          <FormSection title="Featured Image">
            <Controller
              name="image"
              control={control}
              rules={{ required: !newsItem.image ? 'Featured image is required' : false }}
              render={({ field }) => {
                console.log('🎛️ NewsForm Controller render - field.value:', field.value)
                return (
                  <FileInput
                    label="Upload Image"
                    accept="image/*"
                    onUpload={handleImageUpload}
                    value={field.value}
                    onChange={(url) => {
                      console.log('🔄 NewsForm Controller onChange called with:', url)
                      field.onChange(url)
                    }}
                    error={errors.image?.message}
                    helperText="Recommended: 1200x800px, JPG or PNG"
                  />
                )
              }}
            />
          </FormSection>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {newsItem?.id ? 'Save Changes' : 'Create Article'}
          </Button>
        </div>
      </div>
    </form>
  )
}

export default NewsForm
