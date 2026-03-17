import { motion } from 'framer-motion'
import { useState } from 'react'
import LazyImage from './LazyImage'
import { getImageUrl } from '../utils/imageUrl'

const ProjectCard = ({ project, priority = false }) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleCardClick = () => {
    if (isOpen) {
      setIsOpen(false)
    } else {
      setIsOpen(true)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleCardClick}
      className="relative w-full overflow-hidden group cursor-pointer md:aspect-[2/1] aspect-[4/5]"
      style={{ 
        borderRadius: '20px',
        margin: '20px 0'
      }}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <LazyImage 
          src={getImageUrl(project.image)}
          alt={project.title}
          className="w-full h-full object-cover transition-all duration-500"
          style={{
            filter: isOpen ? 'blur(8px)' : 'blur(0px)'
          }}
          priority={priority}
        />
        {/* Bottom gradient for text readability */}
        <div 
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: '300px',
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.15), transparent)'
          }}
        />
        {/* Blur overlay when open */}
        <div 
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            opacity: isOpen ? 1 : 0,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)'
          }}
        />
      </div>

      {/* Title and Category - Always Visible */}
      <div className="absolute bottom-0 left-0 p-6 z-10 pointer-events-none">
        <h3 className="text-white text-2xl font-bold">{project.title}</h3>
        <p className="text-white/80 text-sm mt-1">/ {project.category}</p>
      </div>

      {/* Slide-in Panel from Right */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? '0%' : '100%' }}
        transition={{ type: 'tween', duration: 0.4, ease: 'easeInOut' }}
        onClick={(e) => e.stopPropagation()}
        className="absolute bg-white p-8 flex flex-col justify-between w-[calc(100%-4px)] md:w-[400px]"
        style={{ 
          borderRadius: '20px',
          top: '2px',
          right: '2px',
          bottom: '2px',
          height: 'calc(100% - 4px)'
        }}
      >
        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(false)
          }}
          className="absolute top-6 right-6 text-gray-500 hover:text-gray-700 text-xl"
        >
          ✕
        </button>

        <div className="mt-8">
          <h3 className="text-3xl font-bold mb-2">{project.title}</h3>
          <p className="text-sm text-gray-500 mb-6">/ {project.category}</p>
          
          <div 
            className="text-gray-700 mb-6 leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: project.description }}
          />

          {project.services && project.services.length > 0 && project.services.some(s => s && s.trim()) && (
            <ul className="space-y-2 mb-6">
              {project.services.filter(s => s && s.trim()).map((service, i) => (
                <li key={i} className="text-sm">• {service}</li>
              ))}
            </ul>
          )}
        </div>

        {project.link && (
          <a 
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline hover:no-underline"
            onClick={(e) => e.stopPropagation()}
          >
            {project.link}
          </a>
        )}
      </motion.div>
    </motion.div>
  )
}

export default ProjectCard
