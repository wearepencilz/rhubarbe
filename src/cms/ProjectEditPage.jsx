import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ProjectForm from './ProjectForm'
import Button from '../components/ui/Button'
import { API_URL } from '../config'
import buildInfo from '../buildInfo.json'

const ProjectEditPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)
  const isNew = id === 'new'

  useEffect(() => {
    console.log('ProjectEditPage: Loading project, id:', id, 'isNew:', isNew)
    if (isNew) {
      setProject({})
      setLoading(false)
    } else {
      fetch(`${API_URL}/api/projects`)
        .then(res => res.json())
        .then(data => {
          console.log('ProjectEditPage: Fetched projects:', data)
          setProjects(data)
          const found = data.find(p => p.id === parseInt(id))
          console.log('ProjectEditPage: Found project:', found)
          setProject(found || {})
          setLoading(false)
        })
        .catch((error) => {
          console.error('ProjectEditPage: Error fetching projects:', error)
          setLoading(false)
        })
    }
  }, [id, isNew])

  const currentIndex = projects.findIndex(p => p.id === parseInt(id))
  const totalProjects = projects.length
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < totalProjects - 1

  const navigateToProject = (newIndex) => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
        return
      }
    }
    const targetProject = projects[newIndex]
    navigate(`/cms/projects/${targetProject.id}`)
  }

  const handleSave = async (projectData) => {
    try {
      const url = projectData.id 
        ? `${API_URL}/api/projects/${projectData.id}`
        : `${API_URL}/api/projects`
      
      const method = projectData.id ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      })
      
      if (response.ok) {
        const savedData = await response.json()
        setHasChanges(false)
        
        // Update local project state with saved data
        setProject(savedData)
        
        // Refresh projects list
        const projectsResponse = await fetch(`${API_URL}/api/projects`)
        const updatedProjects = await projectsResponse.json()
        setProjects(updatedProjects)
        
        alert('Project saved successfully!')
      } else {
        alert('Failed to save project')
      }
    } catch (error) {
      alert('Error saving project: ' + error.message)
    }
  }

  const handleCancelChanges = () => {
    // Reload the original project data to discard changes
    if (isNew) {
      setProject({})
    } else {
      const original = projects.find(p => p.id === parseInt(id))
      setProject(original || {})
    }
    setHasChanges(false)
  }

  const handleCancel = () => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
        return
      }
    }
    navigate('/cms?section=projects')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
            <div className="h-4 w-px bg-gray-300" />
            <h1 className="text-lg font-semibold text-gray-900">
              {isNew ? 'New Project' : 'Edit Project'}
            </h1>
            
            {/* Navigation arrows and counter */}
            {!isNew && totalProjects > 0 && (
              <>
                <div className="h-4 w-px bg-gray-300" />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateToProject(currentIndex - 1)}
                    disabled={!hasPrev}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Previous project"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                    {currentIndex + 1}/{totalProjects}
                  </span>
                  <button
                    onClick={() => navigateToProject(currentIndex + 1)}
                    disabled={!hasNext}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Next project"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
          
          {/* Save/Cancel actions when changes detected */}
          {hasChanges && (
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancelChanges}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const form = document.querySelector('form')
                  if (form) {
                    form.requestSubmit()
                  }
                }}
              >
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {project && (
          <ProjectForm
            project={project}
            onSave={handleSave}
            onCancel={handleCancel}
            onFormChange={() => setHasChanges(true)}
          />
        )}
      </div>

      {/* Build Info */}
      <div className="fixed bottom-2 left-2 text-[10px] text-gray-400 font-mono select-none pointer-events-none">
        {buildInfo.version} • {new Date(buildInfo.timestamp).toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </div>
    </div>
  )
}

export default ProjectEditPage
