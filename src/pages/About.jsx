import { useState, useEffect } from 'react'
import { API_URL } from '../config'

const About = () => {
  const [page, setPage] = useState({ title: 'About', content: '' })

  useEffect(() => {
    fetch(`${API_URL}/api/pages`)
      .then(res => res.json())
      .then(data => setPage(data.about || page))
      .catch(() => {})
  }, [])

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">{page.title}</h1>
      <div 
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  )
}

export default About
