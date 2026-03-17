import { useState, useEffect } from 'react'
import Button from '../components/Button'
import { API_URL } from '../config'

const FAQ = () => {
  const [settings, setSettings] = useState({
    companyName: 'Pencilz + Friends',
    email: 'hello@pencilz.works',
    location: 'Montreal'
  })
  const [pageData, setPageData] = useState({
    title: 'FAQ',
    content: ''
  })

  useEffect(() => {
    fetch(`${API_URL}/api/settings`)
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(() => {})
    
    fetch(`${API_URL}/api/pages/faq`)
      .then(res => res.json())
      .then(data => setPageData(data))
      .catch(() => {})
  }, [])

  return (
    <div className="bg-white min-h-screen px-5 py-14">
      <div className="max-w-[1004px]">
        <h1 className="text-[32px] text-[#191919] mb-16">{pageData.title}</h1>

        <div 
          className="text-[32px] text-[#191919] space-y-0"
          dangerouslySetInnerHTML={{ __html: pageData.content }}
        />

        <div className="mt-32 text-center">
          <p className="text-[24px] text-black mb-12">Start a project</p>
          <Button
            href={`mailto:${settings.email}`}
            variant="primary"
            className="min-w-[481px]"
          >
            {settings.email}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default FAQ
