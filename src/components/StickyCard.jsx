import { motion, useTransform } from 'framer-motion'
import ProjectCard from './ProjectCard'

const StickyCard = ({ project, index, scrollYProgress, totalCards }) => {
  const targetScale = Math.max(0.85, 1 - (totalCards - index - 1) * 0.05)
  const range = [index * 0.25, 1]
  const scale = useTransform(scrollYProgress, range, [1, targetScale])
  
  return (
    <div 
      style={{
        position: 'sticky',
        top: '20px',
        padding: '0 20px',
        marginBottom: '20px'
      }}
    >
      <motion.div
        style={{
          scale,
          top: `${index * 25}px`,
          position: 'relative',
          transformOrigin: 'top',
          width: '100%',
          margin: '0 auto'
        }}
      >
        <ProjectCard project={project} priority={index === 0} />
      </motion.div>
    </div>
  )
}

export default StickyCard
