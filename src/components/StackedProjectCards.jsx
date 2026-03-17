import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import ProjectCard from './ProjectCard'

const StickyProjectCard = ({ project, index, progress, range, targetScale }) => {
  const container = useRef(null)
  const scale = useTransform(progress, range, [1, targetScale])

  return (
    <div ref={container} style={{ position: 'sticky', top: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <motion.div
        style={{
          scale,
          top: `calc(-5vh + ${index * 25}px)`,
          position: 'relative',
          transformOrigin: 'top',
        }}
      >
        <ProjectCard project={project} />
      </motion.div>
    </div>
  )
}

const StackedProjectCards = ({ projects }) => {
  const container = useRef(null)
  
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  })

  if (!projects || projects.length === 0) return null
  
  const stackedProjects = projects.slice(0, 3)
  const remainingProjects = projects.slice(3)
  
  return (
    <>
      <div 
        ref={container} 
        style={{ 
          position: 'relative',
          width: '100%',
          paddingBottom: '100vh',
          padding: '20px'
        }}
      >
        {stackedProjects.map((project, i) => {
          const targetScale = Math.max(0.85, 1 - (stackedProjects.length - i - 1) * 0.05)
          
          return (
            <StickyProjectCard
              key={project.id}
              project={project}
              index={i}
              progress={scrollYProgress}
              range={[i * 0.25, 1]}
              targetScale={targetScale}
            />
          )
        })}
      </div>
      
      {/* Remaining projects */}
      <div style={{ padding: '20px' }}>
        {remainingProjects.map(project => (
          <div key={project.id} style={{ marginBottom: '20px' }}>
            <ProjectCard project={project} />
          </div>
        ))}
      </div>
    </>
  )
}

export default StackedProjectCards
