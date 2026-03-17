import { useEffect } from 'react'

const SEO = ({ 
  title, 
  description, 
  keywords, 
  ogImage, 
  ogUrl,
  type = 'website' 
}) => {
  useEffect(() => {
    // Update title
    if (title) {
      document.title = title
    }

    // Update or create meta tags
    const updateMetaTag = (name, content, isProperty = false) => {
      if (!content) return

      const attribute = isProperty ? 'property' : 'name'
      let element = document.querySelector(`meta[${attribute}="${name}"]`)
      
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attribute, name)
        document.head.appendChild(element)
      }
      
      element.setAttribute('content', content)
    }

    // Standard meta tags
    updateMetaTag('description', description)
    updateMetaTag('keywords', keywords)

    // Open Graph tags
    updateMetaTag('og:title', title, true)
    updateMetaTag('og:description', description, true)
    updateMetaTag('og:image', ogImage, true)
    updateMetaTag('og:url', ogUrl, true)
    updateMetaTag('og:type', type, true)

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image')
    updateMetaTag('twitter:title', title)
    updateMetaTag('twitter:description', description)
    updateMetaTag('twitter:image', ogImage)

  }, [title, description, keywords, ogImage, ogUrl, type])

  return null
}

export default SEO
