import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import LazyImage from './LazyImage'
import { API_URL } from '../config'
import { getImageUrl } from '../utils/imageUrl'

const Footer = () => {
  const [settings, setSettings] = useState({ email: '', logo: '', companyName: '' })

  useEffect(() => {
    fetch(`${API_URL}/api/settings`)
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(() => {})
  }, [])

  return (
    <footer className="bg-white mt-auto w-full">
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '20px' }}>
        {/* Logo - Full Width */}
        <div className="mb-8 w-full">
          <Link to="/">
            {settings.logo ? (
              <LazyImage 
                src={getImageUrl(settings.logo)}
                alt="Pencilz" 
                className="w-full h-auto"
                style={{ display: 'block' }}
                priority={false}
              />
            ) : (
              <h1 className="text-8xl font-black text-center">PENCILZ</h1>
            )}
          </Link>
        </div>

        {/* Footer links - Full Width with Auto Spacing */}
        <div className="w-full flex md:flex-row flex-col md:justify-between md:items-center items-start text-base mb-4 gap-2">
          <Link to="/terms" className="hover:opacity-70">Terms & Conditions</Link>
          <Link to="/privacy" className="hover:opacity-70">Privacy Policy</Link>
          <Link to="/faq" className="hover:opacity-70">Faq</Link>
          <Link to="/" className="text-gray-600 hover:opacity-70">{settings.companyName}</Link>
          {import.meta.env.DEV && (
            <Link to="/tests" className="text-blue-600 hover:opacity-70">Tests</Link>
          )}
        </div>
      </div>
    </footer>
  )
}

export default Footer
