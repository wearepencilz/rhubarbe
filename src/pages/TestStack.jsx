import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

// Test data
const testProjects = [
  {
    id: 1,
    title: 'Project 1',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=600&fit=crop',
  },
  {
    id: 2,
    title: 'Project 2',
    image: 'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=800&h=600&fit=crop',
  },
  {
    id: 3,
    title: 'Project 3',
    image: 'https://images.unsplash.com/photo-1618556450991-2f1af64e8191?w=800&h=600&fit=crop',
  },
]

const Card = ({ project, index, progress, range, targetScale }) => {
  const container = useRef(null)
  const scale = useTransform(progress, range, [1, targetScale])

  return (
    <div 
      ref={container}
      style={{
        position: 'sticky',
        top: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh'
      }}
    >
      <motion.div
        style={{
          scale,
          top: `calc(-5vh + ${index * 25}px)`,
          position: 'relative',
          transformOrigin: 'top',
          width: '500px',
          height: '300px',
          borderRadius: '20px',
          overflow: 'hidden',
          backgroundColor: '#fff',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}
      >
        <img 
          src={project.image} 
          alt={project.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '20px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          color: 'white'
        }}>
          <h3 style={{ fontSize: '24px', margin: 0 }}>{project.title}</h3>
        </div>
      </motion.div>
    </div>
  )
}

const TestStack = () => {
  const container = useRef(null)
  
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"]
  })

  return (
    <div style={{ width: '100%', minHeight: '100vh' }}>
      <div style={{ 
        height: '50vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <h1 style={{ fontSize: '48px' }}>Scroll Down to See Card Stack</h1>
      </div>

      <div 
        ref={container}
        style={{
          position: 'relative',
          paddingBottom: '100vh'
        }}
      >
        {testProjects.map((project, i) => {
          const targetScale = Math.max(0.85, 1 - (testProjects.length - i - 1) * 0.05)
          
          return (
            <Card
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

      <div style={{ 
        height: '50vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5'
      }}>
        <h2 style={{ fontSize: '32px' }}>End of Stack Animation</h2>
      </div>
    </div>
  )
}

export default TestStack
