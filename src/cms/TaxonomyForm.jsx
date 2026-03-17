import { useState, useEffect } from 'react'
import { API_URL } from '../config'
import Card from '../components/ui/Card'
import FormSection from '../components/ui/FormSection'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import SortableList from '../components/ui/SortableList'
import AlertDialog from '../components/ui/AlertDialog'

const TaxonomyForm = ({ onFormChange, onSaveSuccess, onCancelRef }) => {
  const [taxonomy, setTaxonomy] = useState([])
  const [initialTaxonomy, setInitialTaxonomy] = useState([])
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, tag: null })

  // Track changes
  const taxonomyChanged = JSON.stringify(taxonomy) !== JSON.stringify(initialTaxonomy)

  // Expose cancel function to parent
  useEffect(() => {
    if (onCancelRef) {
      onCancelRef.current = () => {
        console.log('TaxonomyForm: Cancel called, reloading data')
        loadTaxonomy()
      }
    }
  }, [onCancelRef])

  // Notify parent of changes (only after initialization)
  useEffect(() => {
    if (isInitialized && taxonomyChanged && onFormChange) {
      onFormChange()
    }
  }, [taxonomyChanged, onFormChange, isInitialized])

  useEffect(() => {
    console.log('TaxonomyForm: Component mounted/remounted')
    loadTaxonomy()
  }, [])

  const loadTaxonomy = async () => {
    console.log('TaxonomyForm: loadTaxonomy called')
    setIsInitialized(false)
    try {
      const response = await fetch(`${API_URL}/api/settings`)
      const data = await response.json()
      console.log('TaxonomyForm: Data loaded from API:', data.taxonomy)
      setTaxonomy(data.taxonomy || [])
      setInitialTaxonomy(data.taxonomy || [])
      setIsInitialized(true)
    } catch (error) {
      console.error('Error loading taxonomy:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveTaxonomy = async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings`)
      const currentSettings = await response.json()

      const updatedSettings = {
        ...currentSettings,
        taxonomy: taxonomy
      }

      const saveResponse = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      })

      if (saveResponse.ok) {
        setInitialTaxonomy(taxonomy)
        if (onSaveSuccess) {
          onSaveSuccess()
        }
        alert('Taxonomy saved successfully!')
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Error saving taxonomy:', error)
      alert('Error saving taxonomy: ' + error.message)
    }
  }

  const addTag = () => {
    setTaxonomy([...taxonomy, {
      id: `tag-${Date.now()}`,
      name: '',
      link: '',
      type: 'general',
      usageCount: 0
    }])
  }

  const updateTag = (id, field, value) => {
    setTaxonomy(taxonomy.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    ))
  }

  const removeTag = async (id) => {
    const tag = taxonomy.find(t => t.id === id)
    
    if (!tag) {
      return
    }
    
    if (tag.usageCount > 0) {
      // Show confirmation dialog
      setDeleteConfirm({ show: true, tag })
      return
    }
    
    // If not in use, delete immediately
    await performDelete(tag)
  }

  const performDelete = async (tag) => {
    if (tag.usageCount > 0) {
      // Remove tag from all projects that use it
      try {
        const projectsResponse = await fetch(`${API_URL}/api/projects`)
        const projects = await projectsResponse.json()
        
        // Update each project that uses this tag
        const updatePromises = projects
          .filter(project => {
            const hasInServices = Array.isArray(project.services) && project.services.includes(tag.name)
            const hasInCategory = project.category === tag.name
            return hasInServices || hasInCategory
          })
          .map(async project => {
            const updatedProject = {
              ...project,
              services: Array.isArray(project.services) 
                ? project.services.filter(s => s !== tag.name)
                : [],
              category: project.category === tag.name ? '' : project.category
            }
            
            return fetch(`${API_URL}/api/projects/${project.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedProject)
            })
          })
        
        await Promise.all(updatePromises)
      } catch (error) {
        console.error('Error cleaning up project references:', error)
        alert('Error removing tag from projects: ' + error.message)
        return
      }
    }
    
    const updatedTaxonomy = taxonomy.filter(t => t.id !== tag.id)
    setTaxonomy(updatedTaxonomy)
    
    // Auto-save after removing
    await saveUpdatedTaxonomy(updatedTaxonomy)
  }

  const saveUpdatedTaxonomy = async (taxonomyToSave) => {
    try {
      const response = await fetch(`${API_URL}/api/settings`)
      const currentSettings = await response.json()

      const updatedSettings = {
        ...currentSettings,
        taxonomy: taxonomyToSave
      }

      const saveResponse = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      })
      
      if (!saveResponse.ok) {
        const errorText = await saveResponse.text()
        throw new Error('Failed to save taxonomy: ' + errorText)
      }
      
      // Update initial state after successful save
      setInitialTaxonomy(taxonomyToSave)
    } catch (error) {
      console.error('Error auto-saving taxonomy:', error)
      alert('Error saving taxonomy: ' + error.message)
      throw error
    }
  }

  const mergeTag = (sourceId, targetId) => {
    const source = taxonomy.find(t => t.id === sourceId)
    const target = taxonomy.find(t => t.id === targetId)
    
    if (!source || !target) return
    
    // Update target usage count
    const updatedTaxonomy = taxonomy.map(t => 
      t.id === targetId 
        ? { ...t, usageCount: t.usageCount + source.usageCount }
        : t
    ).filter(t => t.id !== sourceId)
    
    setTaxonomy(updatedTaxonomy)
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto px-4 py-6">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h3 className="text-2xl font-bold mb-6">Tags & Taxonomy</h3>
      <div className="space-y-6">
        <Card>
          <FormSection title="Project Tags">
            <p className="text-sm text-gray-600 mb-4">
              Manage all tags used for services and categories. These tags can be used on projects and will be linkable to filtered pages. Changes here will update all projects using these tags.
            </p>
            
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-sm">All Tags</h4>
              <Button
                type="button"
                onClick={addTag}
                variant="secondary"
                size="sm"
              >
                + Add Tag
              </Button>
            </div>

            <SortableList
              items={taxonomy}
              onReorder={setTaxonomy}
              emptyMessage="No tags yet. Click 'Add Tag' to create one."
              defaultOpen={false}
              getTitleFromItem={(tag) => tag.name || 'Untitled Tag'}
              getHeaderActions={(tag) => (
                <div
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    removeTag(tag.id)
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  className="text-red-600 hover:text-red-800 text-xl leading-none px-2 py-1 cursor-pointer select-none"
                  title="Remove tag"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      e.stopPropagation()
                      removeTag(tag.id)
                    }
                  }}
                >
                  ×
                </div>
              )}
              renderItem={(tag) => (
                <div className="space-y-3">
                  <Input
                    label="Tag Name"
                    value={tag.name}
                    onChange={(e) => updateTag(tag.id, 'name', e.target.value)}
                    placeholder="e.g., Design, Development, Shopify Migration"
                  />
                  <Input
                    label="Link (optional)"
                    value={tag.link || ''}
                    onChange={(e) => updateTag(tag.id, 'link', e.target.value)}
                    placeholder="e.g., /work/design or /services/shopify"
                    helperText="Optional link to a page about this tag or filtered projects"
                  />
                </div>
              )}
            />
          </FormSection>
        </Card>

        <Button onClick={saveTaxonomy} className="w-full">
          Save Taxonomy
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirm.show}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDeleteConfirm({ show: false, tag: null })
          }
        }}
        title="Delete Tag"
        description={
          deleteConfirm.tag
            ? `"${deleteConfirm.tag.name}" is used in ${deleteConfirm.tag.usageCount} project(s). Deleting this tag will remove it from all projects. This action cannot be undone.`
            : ''
        }
        confirmText="Delete Tag"
        cancelText="Cancel"
        onConfirm={async () => {
          if (deleteConfirm.tag) {
            await performDelete(deleteConfirm.tag)
          }
        }}
        variant="danger"
      />
    </div>
  )
}

export default TaxonomyForm
