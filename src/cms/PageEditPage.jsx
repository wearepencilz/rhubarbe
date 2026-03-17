import { useParams, useNavigate } from 'react-router-dom'
import PageEditor from './PageEditor'
import Button from '../components/ui/Button'
import buildInfo from '../buildInfo.json'

const PageEditPage = () => {
  const { pageName } = useParams()
  const navigate = useNavigate()

  const handleClose = () => {
    navigate('/cms?section=pages')
  }

  const pageNames = {
    about: 'About',
    services: 'Services',
    faq: 'FAQ',
    terms: 'Terms',
    privacy: 'Privacy'
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
              onClick={handleClose}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Button>
            <div className="h-4 w-px bg-gray-300" />
            <h1 className="text-lg font-semibold text-gray-900">
              Edit {pageNames[pageName] || pageName} Page
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <PageEditor
          pageName={pageName}
          onClose={handleClose}
        />
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

export default PageEditPage
