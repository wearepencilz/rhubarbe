import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SettingsForm from './SettingsForm'
import HomePageForm from './HomePageForm'
import TaxonomyForm from './TaxonomyForm'
import Button from '../components/ui/Button'
import Table from '../components/ui/Table'
import DropdownMenu from '../components/ui/DropdownMenu'
import AlertDialog from '../components/ui/AlertDialog'
import EmptyState from '../components/ui/EmptyState'
import { API_URL } from '../config'
import { getImageUrl } from '../utils/imageUrl'
import buildInfo from '../buildInfo.json'

const CMSDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const section = searchParams.get('section') || 'projects'
  const [activeSection, setActiveSection] = useState(section)
  const [projects, setProjects] = useState([])
  const [news, setNews] = useState([])
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, type: null })
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const formCancelRef = useRef(null)
  const { logout } = useAuth()
  const navigate = useNavigate()

  // Update URL when section changes
  const handleSectionChange = (sectionId) => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
        return
      }
    }
    setHasUnsavedChanges(false)
    setActiveSection(sectionId)
    setSearchParams({ section: sectionId })
  }

  // Sync activeSection with URL on mount and URL changes
  useEffect(() => {
    const urlSection = searchParams.get('section') || 'projects'
    setActiveSection(urlSection)
  }, [searchParams])

  const navigation = [
    { id: 'projects', label: 'Projects', icon: '📁' },
    { id: 'news', label: 'News', icon: '📰' },
    { id: 'pages', label: 'Pages', icon: '📄' },
    { id: 'home', label: 'Home Page', icon: '🏠' },
    { id: 'taxonomy', label: 'Tags & Taxonomy', icon: '🏷️' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ]

  const loadProjects = () => {
    fetch(`${API_URL}/api/projects`)
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(() => setProjects([]))
  }

  const loadNews = () => {
    fetch(`${API_URL}/api/news`)
      .then(res => res.json())
      .then(data => setNews(data))
      .catch(() => setNews([]))
  }

  useEffect(() => {
    loadProjects()
    loadNews()
  }, [])

  const handleLogout = () => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
        return
      }
    }
    logout()
    // Use replace to prevent going back to CMS after logout
    navigate('/cms/login', { replace: true })
  }

  const handleSaveChanges = () => {
    const form = document.querySelector('form')
    if (form) {
      form.requestSubmit()
    }
  }

  const handleCancelChanges = () => {
    console.log('handleCancelChanges called!')
    // Immediately cancel without confirmation
    setHasUnsavedChanges(false)
    if (formCancelRef.current) {
      console.log('Calling formCancelRef.current()')
      formCancelRef.current()
    } else {
      console.log('formCancelRef.current is null!')
    }
  }

  const confirmDelete = async () => {
    try {
      if (deleteDialog.type === 'project') {
        const response = await fetch(`${API_URL}/api/projects/${deleteDialog.id}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          loadProjects()
        }
      } else if (deleteDialog.type === 'news') {
        const response = await fetch(`${API_URL}/api/news/${deleteDialog.id}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          loadNews()
        }
      }
    } catch (error) {
      alert('Error deleting item: ' + error.message)
    }
    setDeleteDialog({ open: false, id: null, type: null })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900">Pencilz CMS</h1>
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-1">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={`
                    px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                    ${activeSection === item.id 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className="mr-1.5">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Save/Cancel actions when changes detected */}
            {hasUnsavedChanges && (
              <>
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
                  onClick={handleSaveChanges}
                >
                  Save Changes
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Projects Section */}
        {activeSection === 'projects' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
                <p className="text-sm text-gray-600 mt-1">Manage your portfolio projects</p>
              </div>
              <Button onClick={() => navigate('/cms/projects/new')}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Project
              </Button>
            </div>

            {projects.length === 0 ? (
              <EmptyState
                icon={
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                title="No projects yet"
                description="Get started by creating your first project"
                action={() => navigate('/cms/projects/new')}
                actionLabel="Create Project"
              />
            ) : (
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.Head>Project</Table.Head>
                    <Table.Head>Category</Table.Head>
                    <Table.Head>Link</Table.Head>
                    <Table.Head className="w-20"></Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {projects.map(project => (
                    <Table.Row 
                      key={project.id}
                      onClick={() => navigate(`/cms/projects/${project.id}`)}
                    >
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          {project.image && (
                            <img 
                              src={getImageUrl(project.image)}
                              alt={project.title}
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{project.title}</div>
                            <div 
                              className="text-xs text-gray-500 line-clamp-1"
                              dangerouslySetInnerHTML={{ 
                                __html: project.description?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '' 
                              }}
                            />
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {project.category || 'Uncategorized'}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        {project.link && (
                          <a 
                            href={project.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                          >
                            View
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <DropdownMenu
                          trigger={
                            <button 
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>
                          }
                        >
                          <DropdownMenu.Item onClick={() => navigate(`/cms/projects/${project.id}`)}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </DropdownMenu.Item>
                          <DropdownMenu.Item 
                            variant="danger"
                            onClick={() => setDeleteDialog({ open: true, id: project.id, type: 'project' })}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </DropdownMenu.Item>
                        </DropdownMenu>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            )}
          </div>
        )}

        {/* News Section */}
        {activeSection === 'news' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">News & Insights</h2>
                <p className="text-sm text-gray-600 mt-1">Manage your news articles and blog posts</p>
              </div>
              <Button onClick={() => navigate('/cms/news/new')}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Article
              </Button>
            </div>

            {news.length === 0 ? (
              <EmptyState
                icon={
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                }
                title="No news articles yet"
                description="Start sharing insights and updates with your audience"
                action={() => navigate('/cms/news/new')}
                actionLabel="Create Article"
              />
            ) : (
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.Head>Article</Table.Head>
                    <Table.Head>Category</Table.Head>
                    <Table.Head>Date</Table.Head>
                    <Table.Head className="w-20"></Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {news.map(item => (
                    <Table.Row 
                      key={item.id}
                      onClick={() => navigate(`/cms/news/${item.id}`)}
                    >
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <img 
                              src={getImageUrl(item.image)}
                              alt={item.title}
                              className="w-10 h-10 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{item.title}</div>
                            <div className="text-xs text-gray-500 line-clamp-1">{item.excerpt}</div>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {item.category}
                        </span>
                      </Table.Cell>
                      <Table.Cell className="text-gray-600">
                        {new Date(item.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </Table.Cell>
                      <Table.Cell>
                        <DropdownMenu
                          trigger={
                            <button 
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                            >
                              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                              </svg>
                            </button>
                          }
                        >
                          <DropdownMenu.Item onClick={() => navigate(`/cms/news/${item.id}`)}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </DropdownMenu.Item>
                          <DropdownMenu.Item 
                            variant="danger"
                            onClick={() => setDeleteDialog({ open: true, id: item.id, type: 'news' })}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </DropdownMenu.Item>
                        </DropdownMenu>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            )}
          </div>
        )}

        {/* Pages Section */}
        {activeSection === 'pages' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Pages</h2>
              <p className="text-sm text-gray-600 mt-1">Edit static page content</p>
            </div>

            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Page Name</Table.Head>
                  <Table.Head>Description</Table.Head>
                  <Table.Head className="w-32"></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {[
                  { id: 'about', name: 'About', description: 'Company information and story' },
                  { id: 'services', name: 'Services', description: 'Services and offerings' },
                  { id: 'faq', name: 'FAQ', description: 'Frequently asked questions' },
                  { id: 'terms', name: 'Terms', description: 'Terms of service' },
                  { id: 'privacy', name: 'Privacy', description: 'Privacy policy' }
                ].map(page => (
                  <Table.Row 
                    key={page.id}
                    onClick={() => navigate(`/cms/pages/${page.id}`)}
                  >
                    <Table.Cell>
                      <div className="font-medium text-gray-900">{page.name}</div>
                    </Table.Cell>
                    <Table.Cell className="text-gray-600">
                      {page.description}
                    </Table.Cell>
                    <Table.Cell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/cms/pages/${page.id}`)
                        }}
                      >
                        Edit Content
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}

        {/* Home Page Section */}
        {activeSection === 'home' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Home Page</h2>
              <p className="text-sm text-gray-600 mt-1">Customize your homepage content</p>
            </div>
            <HomePageForm 
              key={`home-form-${formKey}`}
              onFormChange={() => setHasUnsavedChanges(true)}
              onSaveSuccess={() => setHasUnsavedChanges(false)}
              onCancelRef={formCancelRef}
            />
          </div>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
              <p className="text-sm text-gray-600 mt-1">Configure global site settings</p>
            </div>
            <SettingsForm 
              key={`settings-form-${formKey}`}
              onFormChange={() => setHasUnsavedChanges(true)}
              onSaveSuccess={() => setHasUnsavedChanges(false)}
              onCancelRef={formCancelRef}
            />
          </div>
        )}

        {/* Taxonomy Section */}
        {activeSection === 'taxonomy' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Tags & Taxonomy</h2>
              <p className="text-sm text-gray-600 mt-1">Manage reusable tags for projects</p>
            </div>
            <TaxonomyForm 
              key={`taxonomy-form-${formKey}`}
              onFormChange={() => setHasUnsavedChanges(true)}
              onSaveSuccess={() => setHasUnsavedChanges(false)}
              onCancelRef={formCancelRef}
            />
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialog({ open: false, id: null, type: null })}
        variant="danger"
      />

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

export default CMSDashboard
