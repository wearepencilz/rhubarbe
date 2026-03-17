import { useForm, Controller } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { API_URL } from '../config'
import FormSection from '../components/ui/FormSection'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import FileInput from '../components/ui/FileInput'
import TagInput from '../components/ui/TagInput'
import Button from '../components/ui/Button'
import RichTextEditor from '../components/ui/RichTextEditor'

const ProjectForm = ({ project = {}, onSave, onCancel, onFormChange }) => {
  const [availableTags, setAvailableTags] = useState([])
  
  // Load taxonomy first
  useEffect(() => {
    fetch(`${API_URL}/api/settings`)
      .then(res => res.json())
      .then(data => {
        setAvailableTags(data.taxonomy || [])
      })
      .catch(err => console.error('Error loading taxonomy:', err))
  }, [])
  
  // Convert project services/category to tag format, filtering out removed tags
  const projectServices = Array.isArray(project.services)
    ? project.services
        .map(s => {
          const tagName = typeof s === 'string' ? s : s.name
          // Only include if tag exists in taxonomy
          const existsInTaxonomy = availableTags.some(t => t.name === tagName)
          if (!existsInTaxonomy && availableTags.length > 0) {
            console.warn(`Tag "${tagName}" no longer exists in taxonomy, filtering out`)
            return null
          }
          return typeof s === 'string' ? { id: s, name: s, link: '' } : s
        })
        .filter(Boolean)
    : []
  
  const projectCategory = project.category 
    ? (() => {
        const categoryName = typeof project.category === 'string' ? project.category : project.category.name
        // Only include if tag exists in taxonomy
        const existsInTaxonomy = availableTags.some(t => t.name === categoryName)
        if (!existsInTaxonomy && availableTags.length > 0) {
          console.warn(`Category "${categoryName}" no longer exists in taxonomy, filtering out`)
          return []
        }
        return [typeof project.category === 'string' ? { id: project.category, name: project.category, link: '' } : project.category]
      })()
    : []

  const { control, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting, isDirty } } = useForm({
    values: {
      id: project.id || undefined,
      title: project.title || '',
      category: projectCategory,
      link: project.link || '',
      description: project.description || '',
      services: projectServices,
      image: project.image || '',
      metaTitle: project.metaTitle || '',
      metaDescription: project.metaDescription || '',
      metaKeywords: project.metaKeywords || '',
      ogImage: project.ogImage || ''
    }
  })

  // Watch the image field to debug
  const imageValue = watch('image')
  console.log('🎨 ProjectForm: Current image value from form:', imageValue)
  console.log('📦 ProjectForm: Project prop:', project)

  // Notify parent of changes
  useEffect(() => {
    if (isDirty && onFormChange) {
      onFormChange()
    }
  }, [isDirty, onFormChange])

  // Reset form when project changes (for cancel/discard)
  useEffect(() => {
    // Only reset if we have taxonomy loaded to properly filter tags
    if (availableTags.length === 0) return
    
    reset({
      id: project.id || undefined,
      title: project.title || '',
      category: projectCategory,
      link: project.link || '',
      description: project.description || '',
      services: projectServices,
      image: project.image || '',
      metaTitle: project.metaTitle || '',
      metaDescription: project.metaDescription || '',
      metaKeywords: project.metaKeywords || '',
      ogImage: project.ogImage || ''
    })
  }, [project, reset, availableTags])

  const handleCreateTag = (name) => {
    const newTag = {
      id: `tag-${Date.now()}`,
      name: name,
      link: '',
      type: 'general',
      usageCount: 0
    }
    setAvailableTags([...availableTags, newTag])
    
    // Save to settings
    fetch(`${API_URL}/api/settings`)
      .then(res => res.json())
      .then(settings => {
        const updated = {
          ...settings,
          taxonomy: [...(settings.taxonomy || []), newTag]
        }
        return fetch(`${API_URL}/api/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        })
      })
      .catch(err => console.error('Error saving new tag:', err))
    
    return newTag
  }

  const handleImageUpload = async (file) => {
    if (!file) return null
    
    console.log('📤 ProjectForm: Starting upload for:', file.name)
    
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
      console.log('✅ ProjectForm: Upload successful, URL:', data.url)
      console.log('📊 ProjectForm: Full response:', data)
      return data.url
    } catch (error) {
      console.error('❌ ProjectForm: Upload error:', error)
      alert('Error uploading image: ' + error.message)
      throw error
    }
  }

  const onSubmit = (data) => {
    // Convert tags back to simple format for storage
    const formattedData = {
      ...data,
      services: Array.isArray(data.services) 
        ? data.services.map(s => s.name)
        : [],
      category: Array.isArray(data.category) && data.category.length > 0
        ? data.category[0].name
        : ''
    }
    onSave(formattedData)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 space-y-8">
          {/* Basic Information Section */}
          <FormSection 
            title="Basic Information"
            description="Essential details about the project"
          >
            <Controller
              name="title"
              control={control}
              rules={{ required: 'Project title is required' }}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Project Title"
                  placeholder="e.g., Humanrace Website Redesign"
                  error={errors.title?.message}
                  helperText="This will be displayed as the main project heading"
                />
              )}
            />
            
            <div className="grid md:grid-cols-2 gap-4">
              <Controller
                name="category"
                control={control}
                rules={{ 
                  required: 'Category is required',
                  validate: value => (Array.isArray(value) && value.length > 0) || 'Category is required'
                }}
                render={({ field }) => (
                  <TagInput
                    label="Category"
                    value={field.value || []}
                    onChange={(tags) => field.onChange(tags.slice(0, 1))} // Only allow one category
                    availableTags={availableTags}
                    onCreateTag={handleCreateTag}
                    placeholder="Select or create category..."
                    error={errors.category?.message}
                    helperText="Select one category (e.g., Shopify Migration, E-commerce)"
                  />
                )}
              />
              
              <Controller
                name="link"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Project Link"
                    type="url"
                    placeholder="https://example.com"
                    helperText="Optional external link to the live project"
                  />
                )}
              />
            </div>
            
            <Controller
              name="description"
              control={control}
              rules={{ required: 'Description is required' }}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  label="Description"
                  placeholder="Describe the project, your role, and key achievements..."
                  error={errors.description?.message}
                  helperText="Provide a compelling overview of the project. Use formatting to make it engaging."
                  minHeight="250px"
                />
              )}
            />
            
            <Controller
              name="services"
              control={control}
              render={({ field }) => (
                <TagInput
                  label="Services Provided"
                  value={field.value || []}
                  onChange={field.onChange}
                  availableTags={availableTags}
                  onCreateTag={handleCreateTag}
                  placeholder="Select or create services..."
                  helperText="Select multiple services (e.g., Design, Development, Branding)"
                />
              )}
            />
          </FormSection>

          {/* Media Section */}
          <FormSection 
            title="Project Media"
            description="Upload images and visual assets"
          >
            <Controller
              name="image"
              control={control}
              rules={{ required: !project.image ? 'Project image is required' : false }}
              render={({ field }) => {
                console.log('🎛️ Controller render - field.value:', field.value)
                return (
                  <FileInput
                    label="Featured Image"
                    accept="image/*"
                    onUpload={handleImageUpload}
                    value={field.value}
                    onChange={(url) => {
                      console.log('🔄 Controller onChange called with:', url)
                      field.onChange(url)
                    }}
                    error={errors.image?.message}
                    helperText="Recommended: 1200x800px, JPG or PNG"
                  />
                )
              }}
            />
          </FormSection>

          {/* SEO & Metadata Section (Collapsible) */}
          <FormSection 
            title="SEO & Metadata"
            description="Optimize for search engines and social sharing"
            collapsible
            defaultOpen={false}
          >
            <Controller
              name="metaTitle"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Meta Title"
                  placeholder="Project title for search engines"
                  maxLength={60}
                  helperText="50-60 characters recommended. Appears in search results and browser tabs."
                />
              )}
            />
            
            <Controller
              name="metaDescription"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  label="Meta Description"
                  rows={2}
                  placeholder="Brief description for search results"
                  maxLength={160}
                  showCount
                  helperText="150-160 characters recommended. Appears below the title in search results."
                />
              )}
            />
            
            <Controller
              name="metaKeywords"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Keywords"
                  placeholder="web design, branding, shopify"
                  helperText="Comma-separated keywords relevant to this project"
                />
              )}
            />
            
            <Controller
              name="ogImage"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Social Share Image (OG Image)"
                  placeholder="Leave blank to use project image"
                  helperText="1200x630px recommended. Used when sharing on social media."
                />
              )}
            />
          </FormSection>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3 rounded-b-lg">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
          >
            {project?.id ? 'Save Changes' : 'Create Project'}
          </Button>
        </div>
      </div>
    </form>
  )
}

export default ProjectForm
