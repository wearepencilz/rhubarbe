import { useState, useEffect } from 'react'
import LazyImage from '../components/LazyImage'
import { API_URL } from '../config'
import { getImageUrl } from '../utils/imageUrl'

const News = () => {
  const [news, setNews] = useState([])

  useEffect(() => {
    fetch(`${API_URL}/api/news`)
      .then(res => res.json())
      .then(data => setNews(data))
      .catch(() => setNews([]))
  }, [])

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">News & Insights</h1>
      <div className="grid gap-8">
        {news.length === 0 ? (
          <p className="text-gray-500">No news articles yet.</p>
        ) : (
          news.map((item, index) => (
            <article key={item.id} className="border-b pb-8">
              {item.image && (
                <LazyImage 
                  src={getImageUrl(item.image)}
                  alt={item.title}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                  priority={index === 0}
                />
              )}
              <div className="flex gap-2 text-sm text-gray-500 mb-2">
                <span>{item.category}</span>
                <span>•</span>
                <span>{item.date}</span>
              </div>
              <h2 className="text-2xl font-bold mb-3">{item.title}</h2>
              <p className="text-gray-600 mb-4">{item.excerpt}</p>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
            </article>
          ))
        )}
      </div>
    </div>
  )
}

export default News
