import { useState, useEffect, useRef } from 'react'

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  style = {},
  priority = false,
  placeholder = 'blur',
  onLoad,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const imgRef = useRef(null)

  useEffect(() => {
    // If priority, load immediately
    if (priority) {
      setIsInView(true)
      return
    }

    // Set up Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current)
      }
    }
  }, [priority])

  const handleLoad = () => {
    setIsLoaded(true)
    if (onLoad) onLoad()
  }

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      {/* Placeholder */}
      {!isLoaded && placeholder === 'blur' && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ 
            backdropFilter: 'blur(10px)',
            backgroundColor: '#f3f4f6'
          }}
        />
      )}

      {/* Actual Image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          style={style}
          onLoad={handleLoad}
          loading={priority ? 'eager' : 'lazy'}
          fetchpriority={priority ? 'high' : 'auto'}
          {...props}
        />
      )}
    </div>
  )
}

export default LazyImage
