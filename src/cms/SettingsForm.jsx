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

const SettingsForm = ({ onFormChange, onSaveSuccess, onCancelRef }) => {
  const { register, handleSubmit, setValue, watch, reset, formState: { isDirty } } = useForm()
  const [settings, setSettings] = useState({})
  const [services, setServices] = useState([])
  const [aboutItems, setAboutItems] = useState([])
  const [initialServices, setInitialServices] = useState([])
  const [initialAboutItems, setInitialAboutItems] = useState([])
  const [isInitialized, setIsInitialized] = useState(false)
  const logoValue = watch('logo')
  const hamburgerIconValue = watch('hamburgerIcon')
  const buttonIconValue = watch('buttonIcon')

  // Track changes in services and about items
  const servicesChanged = JSON.stringify(services) !== JSON.stringify(initialServices)
  const aboutItemsChanged = JSON.stringify(aboutItems) !== JSON.stringify(initialAboutItems)

  // Expose cancel function to parent
  useEffect(() => {
    if (onCancelRef) {
      onCancelRef.current = () => {
        console.log('SettingsForm: Cancel called, reloading data')
        loadData()
      }
    }
  }, [onCancelRef])

  // Notify parent of changes (only after initialization)
  useEffect(() => {
    if (isInitialized && (isDirty || servicesChanged || aboutItemsChanged) && onFormChange) {
      onFormChange()
    }
  }, [isDirty, servicesChanged, aboutItemsChanged, onFormChange, isInitialized])

  const loadData = () => {
    console.log('SettingsForm: loadData called')
    setIsInitialized(false)
    fetch(`${API_URL}/api/settings`)
      .then(res => res.json())
      .then(data => {
        console.log('SettingsForm: Data loaded from API:', data)
        setSettings(data)
        const formData = {
          email: data.email || '',
          companyName: data.companyName || '',
          location: data.location || '',
          logo: data.logo || '',
          hamburgerIcon: data.hamburgerIcon || '',
          buttonIcon: data.buttonIcon || '',
          servicesDescription: data.servicesDescription || '',
          aboutDescription: data.aboutDescription || ''
        }
        reset(formData)
        console.log('SettingsForm: Form reset with data')
        setServices(data.services || [])
        setAboutItems(data.aboutItems || [])
        setInitialServices(data.services || [])
        setInitialAboutItems(data.aboutItems || [])
        setIsInitialized(true)
      })
  }

  useEffect(() => {
    console.log('SettingsForm: Component mounted/remounted')
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
      console.log('SettingsForm: Upload successful:', data.url)
      return data.url
    } catch (error) {
      console.error('SettingsForm: Upload error:', error)
      alert('Error uploading image: ' + error.message)
      throw error
    }
  }

  const onSave = async (data) => {
    try {
      const payload = {
        ...data,
        services,
        aboutItems
      }
      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (response.ok) {
        const savedData = await response.json()
        setSettings(savedData)
        setServices(savedData.services || [])
        setAboutItems(savedData.aboutItems || [])
        setInitialServices(savedData.services || [])
        setInitialAboutItems(savedData.aboutItems || [])
        // Reset form dirty state
        const formData = {
          email: savedData.email || '',
          companyName: savedData.companyName || '',
          location: savedData.location || '',
          logo: savedData.logo || '',
          hamburgerIcon: savedData.hamburgerIcon || '',
          buttonIcon: savedData.buttonIcon || '',
          servicesDescription: savedData.servicesDescription || '',
          aboutDescription: savedData.aboutDescription || ''
        }
        reset(formData)
        if (onSaveSuccess) {
          onSaveSuccess()
        }
        alert('Settings saved successfully!')
      } else {
        const errorText = await response.text()
        alert('Failed to save settings: ' + errorText)
      }
    } catch (error) {
      alert('Error saving settings: ' + error.message)
    }
  }

  const addService = () => {
    setServices([...services, {
      id: Date.now().toString(),
      name: '',
      link: ''
    }])
  }

  const removeService = (id) => {
    setServices(services.filter(s => s.id !== id))
  }

  const updateService = (id, field, value) => {
    setServices(services.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ))
  }

  const addAboutItem = () => {
    setAboutItems([...aboutItems, {
      id: Date.now().toString(),
      name: '',
      link: ''
    }])
  }

  const removeAboutItem = (id) => {
    setAboutItems(aboutItems.filter(a => a.id !== id))
  }

  const updateAboutItem = (id, field, value) => {
    setAboutItems(aboutItems.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h3 className="text-2xl font-bold mb-6">Site Settings</h3>
      <form onSubmit={handleSubmit(onSave)} className="space-y-6">
        {/* Brand Identity Section */}
        <Card>
          <FormSection title="Brand Identity">
            <FileInput
              label="Logo"
              accept="image/*,image/svg+xml,.svg"
              onUpload={handleImageUpload}
              value={logoValue}
              onChange={(url) => setValue('logo', url)}
              helperText="Upload your logo (SVG, PNG, JPG)"
            />

            <FileInput
              label="Hamburger Menu Icon"
              accept="image/*,image/svg+xml,.svg"
              onUpload={handleImageUpload}
              value={hamburgerIconValue}
              onChange={(url) => setValue('hamburgerIcon', url)}
              helperText="Upload hamburger icon (SVG recommended)"
            />

            <FileInput
              label="Button Arrow Icon (SVG)"
              accept="image/svg+xml,.svg"
              onUpload={handleImageUpload}
              value={buttonIconValue}
              onChange={(url) => setValue('buttonIcon', url)}
              helperText="Upload button icon (SVG only)"
            />
          </FormSection>
        </Card>

        {/* Contact Information Section */}
        <Card>
          <FormSection title="Contact Information">
            <Input
              label="Contact Email"
              type="email"
              {...register('email')}
              required
            />
            <Input
              label="Company Name"
              {...register('companyName')}
              placeholder="e.g., Pencilz + Friends"
            />
            <Input
              label="Location"
              {...register('location')}
              placeholder="e.g., Montreal"
            />
          </FormSection>
        </Card>

        {/* Services Navigation Section */}
        <Card>
          <FormSection title="Services Navigation">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-sm">Menu Items</h4>
              <Button
                type="button"
                onClick={addService}
                variant="secondary"
                size="sm"
              >
                + Add Service
              </Button>
            </div>

            <SortableList
              items={services}
              onReorder={setServices}
              emptyMessage="No services yet. Click 'Add Service' to create one."
              defaultOpen={false}
              getTitleFromItem={(service) => service.name || 'Untitled Service'}
              getHeaderActions={(service) => (
                <div
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    removeService(service.id)
                  }}
                  className="text-red-600 hover:text-red-800 text-xl leading-none px-2 py-1 cursor-pointer select-none"
                  title="Remove service"
                  role="button"
                  tabIndex={0}
                >
                  ×
                </div>
              )}
              renderItem={(service) => (
                <div className="space-y-3">
                  <Input
                    label="Service Name"
                    value={service.name}
                    onChange={(e) => updateService(service.id, 'name', e.target.value)}
                    placeholder="e.g., Shopify builds"
                  />
                  <Input
                    label="Link URL"
                    value={service.link}
                    onChange={(e) => updateService(service.id, 'link', e.target.value)}
                    placeholder="e.g., /services or https://example.com"
                  />
                </div>
              )}
            />

            <Textarea
              label="Services Description"
              {...register('servicesDescription')}
              rows={3}
              placeholder="Description text that appears in the services megamenu"
            />
          </FormSection>
        </Card>

        {/* About Navigation Section */}
        <Card>
          <FormSection title="About Navigation">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-sm">Menu Items</h4>
              <Button
                type="button"
                onClick={addAboutItem}
                variant="secondary"
                size="sm"
              >
                + Add About Item
              </Button>
            </div>

            <SortableList
              items={aboutItems}
              onReorder={setAboutItems}
              emptyMessage="No about items yet. Click 'Add About Item' to create one."
              defaultOpen={false}
              getTitleFromItem={(item) => item.name || 'Untitled Item'}
              getHeaderActions={(item) => (
                <div
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    removeAboutItem(item.id)
                  }}
                  className="text-red-600 hover:text-red-800 text-xl leading-none px-2 py-1 cursor-pointer select-none"
                  title="Remove item"
                  role="button"
                  tabIndex={0}
                >
                  ×
                </div>
              )}
              renderItem={(item) => (
                <div className="space-y-3">
                  <Input
                    label="Item Name"
                    value={item.name}
                    onChange={(e) => updateAboutItem(item.id, 'name', e.target.value)}
                    placeholder="e.g., Our Story"
                  />
                  <Input
                    label="Link URL"
                    value={item.link}
                    onChange={(e) => updateAboutItem(item.id, 'link', e.target.value)}
                    placeholder="e.g., /about or https://example.com"
                  />
                </div>
              )}
            />

            <Textarea
              label="About Description"
              {...register('aboutDescription')}
              rows={3}
              placeholder="Description text that appears in the about megamenu"
            />
          </FormSection>
        </Card>

        <Button type="submit" className="w-full">
          Save Settings
        </Button>
      </form>
    </div>
  )
}

export default SettingsForm
