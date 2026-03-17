import { useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { API_URL } from '../config'
import Card from '../components/ui/Card'
import FormSection from '../components/ui/FormSection'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import FileInput from '../components/ui/FileInput'
import Button from '../components/ui/Button'
import SortableList from '../components/ui/SortableList'

const HomePageForm = ({ onFormChange, onSaveSuccess, onCancelRef }) => {
  const { register, handleSubmit, reset, setValue, watch, formState: { isDirty } } = useForm()
  const [homePage, setHomePage] = useState({})
  const [heroButtons, setHeroButtons] = useState([])
  const [initialHeroButtons, setInitialHeroButtons] = useState([])
  const [isInitialized, setIsInitialized] = useState(false)
  const heroImageValue = watch('heroImage')

  // Track changes in hero buttons
  const heroButtonsChanged = JSON.stringify(heroButtons) !== JSON.stringify(initialHeroButtons)

  // Expose cancel function to parent
  useEffect(() => {
    console.log('HomePageForm: Setting up cancel ref, onCancelRef:', onCancelRef)
    if (onCancelRef) {
      onCancelRef.current = () => {
        console.log('HomePageForm: Cancel called, reloading data')
        loadData()
      }
      console.log('HomePageForm: Cancel ref set successfully')
    } else {
      console.log('HomePageForm: onCancelRef is null/undefined')
    }
  }, [onCancelRef])

  // Notify parent of changes (only after initialization)
  useEffect(() => {
    if (isInitialized && (isDirty || heroButtonsChanged) && onFormChange) {
      onFormChange()
    }
  }, [isDirty, heroButtonsChanged, onFormChange, isInitialized])

  const loadData = () => {
    console.log('HomePageForm: loadData called')
    setIsInitialized(false)
    fetch(`${API_URL}/api/pages/home`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
        console.log('HomePageForm: Data loaded from API:', data)
        setHomePage(data)
        const formData = {
          heroImage: data.heroImage || '',
          heroText: data.heroText || '',
          contactHeading: data.contactHeading || '',
          contactButtonText: data.contactButtonText || '',
          contactEmail: data.contactEmail || '',
          emailSubject: data.emailSubject || '',
          emailBody: data.emailBody || '',
          metaTitle: data.metaTitle || '',
          metaDescription: data.metaDescription || '',
          metaKeywords: data.metaKeywords || '',
          ogImage: data.ogImage || ''
        }
        reset(formData)
        console.log('HomePageForm: Form reset with data')
        setHeroButtons(data.heroButtons || [])
        setInitialHeroButtons(data.heroButtons || [])
        // Mark as initialized after a delay to avoid false positives
        setTimeout(() => {
          setIsInitialized(true)
          console.log('HomePageForm: Initialized set to true')
        }, 100)
      })
      .catch(error => {
        console.error('Error loading home page:', error)
      })
  }

  useEffect(() => {
    console.log('HomePageForm: Component mounted/remounted')
    loadData()
  }, [])

  const handleImageUpload = async (file) => {
    if (!file) return null
    
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
      console.log('HomePageForm: Upload successful:', data.url)
      return data.url
    } catch (error) {
      console.error('HomePageForm: Upload error:', error)
      alert('Error uploading image: ' + error.message)
      throw error
    }
  }

  const onSave = async (data) => {
    try {
      const payload = {
        ...data,
        heroButtons
      }
      
      const response = await fetch(`${API_URL}/api/pages/home`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (response.ok) {
        const savedData = await response.json()
        setHomePage(savedData)
        setHeroButtons(savedData.heroButtons || [])
        setInitialHeroButtons(savedData.heroButtons || [])
        // Reset form dirty state
        const formData = {
          heroImage: savedData.heroImage || '',
          heroText: savedData.heroText || '',
          contactHeading: savedData.contactHeading || '',
          contactButtonText: savedData.contactButtonText || '',
          contactEmail: savedData.contactEmail || '',
          emailSubject: savedData.emailSubject || '',
          emailBody: savedData.emailBody || '',
          metaTitle: savedData.metaTitle || '',
          metaDescription: savedData.metaDescription || '',
          metaKeywords: savedData.metaKeywords || '',
          ogImage: savedData.ogImage || ''
        }
        reset(formData)
        if (onSaveSuccess) {
          onSaveSuccess()
        }
        alert('Home page settings saved successfully!')
      } else {
        const errorText = await response.text()
        alert('Failed to save home page settings: ' + errorText)
      }
    } catch (error) {
      alert('Error saving home page settings: ' + error.message)
    }
  }

  const addHeroButton = () => {
    setHeroButtons([...heroButtons, {
      id: Date.now().toString(),
      text: '',
      subtext: '',
      icon: '',
      link: ''
    }])
  }

  const removeHeroButton = (id) => {
    setHeroButtons(heroButtons.filter(btn => btn.id !== id))
  }

  const updateHeroButton = (id, field, value) => {
    setHeroButtons(heroButtons.map(btn => 
      btn.id === id ? { ...btn, [field]: value } : btn
    ))
  }

  const handleButtonIconUpload = async (file) => {
    if (!file) return null
    
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
      console.log('HomePageForm: Button icon upload successful:', data.url)
      return data.url
    } catch (error) {
      console.error('HomePageForm: Button icon upload error:', error)
      alert('Error uploading icon: ' + error.message)
      throw error
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h3 className="text-2xl font-bold mb-6">Home Page Settings</h3>
      <form onSubmit={handleSubmit(onSave)} className="space-y-6">
        {/* Hero Section */}
        <Card>
          <FormSection title="Hero Section">
            <FileInput
              label="Hero Background Image"
              accept="image/*"
              onUpload={handleImageUpload}
              value={heroImageValue}
              onChange={(url) => setValue('heroImage', url, { shouldDirty: true })}
              helperText="Recommended: 1920x1080px, JPG or PNG"
            />
            <Textarea
              label="Hero Text"
              {...register('heroText')}
              rows={2}
              placeholder="e.g., Your start up accelerator"
            />
          </FormSection>
        </Card>

        {/* Hero Buttons Section */}
        <Card>
          <FormSection title="Hero Call-to-Actions">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-sm">CTA Buttons</h4>
              <Button
                type="button"
                onClick={addHeroButton}
                variant="secondary"
                size="sm"
              >
                + Add Button
              </Button>
            </div>

            <SortableList
              items={heroButtons}
              onReorder={setHeroButtons}
              emptyMessage="No hero buttons yet. Click 'Add Button' to create one."
              defaultOpen={false}
              getTitleFromItem={(button) => button.text || 'Untitled Button'}
              getHeaderActions={(button) => (
                <div
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    removeHeroButton(button.id)
                  }}
                  className="text-red-600 hover:text-red-800 text-xl leading-none px-2 py-1 cursor-pointer select-none"
                  title="Remove button"
                  role="button"
                  tabIndex={0}
                >
                  ×
                </div>
              )}
              renderItem={(button) => (
                <div className="space-y-3">
                  <Input
                    label="Button Text"
                    value={button.text}
                    onChange={(e) => updateHeroButton(button.id, 'text', e.target.value)}
                    placeholder="e.g., Shopify builds"
                  />
                  <Input
                    label="Subtext (optional)"
                    value={button.subtext}
                    onChange={(e) => updateHeroButton(button.id, 'subtext', e.target.value)}
                    placeholder="e.g., Starter packs available"
                  />
                  <Input
                    label="Link URL"
                    value={button.link}
                    onChange={(e) => updateHeroButton(button.id, 'link', e.target.value)}
                    placeholder="e.g., /services or https://example.com"
                  />
                  <FileInput
                    label="Icon (SVG)"
                    accept="image/svg+xml,.svg"
                    onUpload={handleButtonIconUpload}
                    value={button.icon}
                    onChange={(url) => updateHeroButton(button.id, 'icon', url)}
                    helperText="Upload SVG icon"
                  />
                </div>
              )}
            />
          </FormSection>
        </Card>

        {/* Contact Section */}
        <Card>
          <FormSection title="Contact Section">
            <Input
              label="Contact Heading"
              {...register('contactHeading')}
              placeholder="e.g., Start a project"
              helperText="The heading text above the contact button"
            />
            <Input
              label="Contact Button Text"
              {...register('contactButtonText')}
              placeholder="Leave blank to use email address"
              helperText="The text shown on the contact button. Defaults to the contact email below."
            />
            <Input
              label="Contact Email"
              type="email"
              {...register('contactEmail')}
              placeholder="Leave blank to use email from Site Settings"
              helperText="The email address where contact requests are sent. Defaults to your main email from Site Settings."
            />
            <Input
              label="Email Subject"
              {...register('emailSubject')}
              placeholder="e.g., Let's Create Something Amazing Together! 🚀"
              helperText="The subject line for the email"
            />
            <Textarea
              label="Email Body"
              {...register('emailBody')}
              rows={6}
              placeholder="Hi there!&#10;&#10;I'm excited to explore the possibility of working together on a project.&#10;&#10;Here's what I'm thinking:&#10;&#10;[Tell us about your project vision]&#10;&#10;Looking forward to bringing this to life!&#10;&#10;Best regards"
              helperText="The pre-filled email body text. Use line breaks for formatting."
            />
          </FormSection>
        </Card>

        {/* SEO Section */}
        <Card>
          <FormSection title="SEO & Metadata" collapsible defaultOpen={false}>
            <Input
              label="Meta Title"
              {...register('metaTitle')}
              placeholder="Pencilz - Your start up accelerator"
              maxLength={60}
              helperText="Recommended: 50-60 characters. This appears in search results and browser tabs."
            />
            <Textarea
              label="Meta Description"
              {...register('metaDescription')}
              rows={2}
              placeholder="Brief description of your services and what makes you unique"
              maxLength={160}
              helperText="Recommended: 150-160 characters. This appears in search results below the title."
            />
            <Input
              label="Keywords"
              {...register('metaKeywords')}
              placeholder="shopify, web design, marketing, startup"
              helperText="Comma-separated keywords relevant to your business."
            />
            <Input
              label="Social Share Image (OG Image)"
              {...register('ogImage')}
              placeholder="Leave blank to use hero image"
              helperText="Recommended: 1200x630px. Used when sharing on social media. Defaults to hero image if empty."
            />
          </FormSection>
        </Card>

        <Button type="submit" className="w-full">
          Save Home Page Settings
        </Button>
      </form>
    </div>
  )
}

export default HomePageForm
