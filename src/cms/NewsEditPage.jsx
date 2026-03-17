import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import NewsForm from './NewsForm'
import Button from '../components/ui/Button'
import { API_URL } from '../config'
import buildInfo from '../buildInfo.json'

const NewsEditPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [newsItem, setNewsItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const isNew = id === 'new'

  useEffect(() => {
    if (isNew) {
      setNewsItem({})
      setLoading(false)
    } else {
      fetch(`${API_URL}/api/news`)
        .then(res => res.json())
        .then(data => {
          const found = data.find(n => n.id === parseInt(id))
          setNewsItem(found || {})
          setLoading(false)
        })
        .catch(() => {
          setLoading(false)
        })
    }
  }, [id, isNew])

  const handleSave = async (data) => {
    try {
      const url = data.id 
        ? `${API_URL}/api/news/${data.id}`
        : `${API_URL}/api/news`
      
      const method = data.id ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
        alert('News article saved successfully!')
        navigate('/cms?section=news')
      } else {
        alert('Failed to save news article')
      }
    } catch (error) {
      alert('Error saving news article: ' + error.message)
    }
  }

  const handleCancel = () => {
    navigate('/cms?section=news')
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
              {isNew ? 'New Article' : 'Edit Article'}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {newsItem && (
          <NewsForm
            newsItem={newsItem}
            onSave={handleSave}
            onCancel={handleCancel}
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

export default NewsEditPage
