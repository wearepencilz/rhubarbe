import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

const LinkDecoration = ({ isActive, textRef }) => {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (textRef?.current) {
      const textWidth = textRef.current.offsetWidth
      // Calculate closest multiple of 9px (center piece width) that fits
      const centerPieceWidth = 9
      const availableWidth = textWidth - 10 // subtract left (5px) and right (5px) caps
      const numCenterPieces = Math.max(0, Math.round(availableWidth / centerPieceWidth))
      const calculatedWidth = numCenterPieces * centerPieceWidth + 10 // add back the caps
      setWidth(calculatedWidth)
    }
  }, [textRef, isActive])

  return (
    <motion.div
      className="absolute flex items-center overflow-hidden pointer-events-none"
      style={{ 
        top: 'calc(100% + 4px)', 
        height: '4px',
        left: 0,
        width: `${width}px`
      }}
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: isActive ? 1 : 0
      }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
      <svg width="5" height="4" viewBox="0 0 5 4" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, width: '5px', height: '4px' }}>
        <path d="M2.33034 1.54656C2.90184 0.858122 3.61419 6.05759e-08 5 0V0.248086V1.37819C4.26155 1.37819 3.90275 1.76582 3.33853 2.44953L3.33529 2.45343C2.7638 3.14187 2.05145 4 0.665628 4C0.296411 4 1.6708e-08 3.69314 0 3.3109C-1.6708e-08 2.92867 0.296411 2.62181 0.665628 2.62181C1.40667 2.62181 1.76288 2.23418 2.3271 1.55047L2.33034 1.54656Z" fill="#7A8F26"/>
      </svg>
      <div 
        className="flex-1" 
        style={{ 
          height: '4px',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='9' height='4' viewBox='0 0 9 4' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2.77629 1.55315C2.18367 0.86137 1.44495 6.31609e-08 6.02428e-08 0L0 1.37819C0.768507 1.37819 1.13921 1.76313 1.7237 2.44685L1.72684 2.45049C2.32162 3.14165 3.06028 4 4.5027 4C5.94765 4 6.6864 3.13863 7.279 2.44685C7.86352 1.76581 8.23149 1.37819 9 1.37819V3.93403e-07C7.55505 3.30242e-07 6.81631 0.86137 6.22371 1.55315C5.63919 2.23419 5.2712 2.62181 4.5027 2.62181C3.73419 2.62181 3.36349 2.23417 2.77629 1.55315Z' fill='%237A8F26'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat-x',
          backgroundSize: '9px 4px'
        }}
      />
      <svg width="5" height="4" viewBox="0 0 5 4" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, width: '5px', height: '4px' }}>
        <path d="M2.66965 1.54656C2.09816 0.858122 1.38581 5.88437e-08 0 0V0.248086V1.37819C0.738448 1.37819 1.09725 1.76582 1.66147 2.44953L1.66471 2.45343C2.2362 3.14187 2.94855 4 4.33437 4C4.70359 4 5 3.69314 5 3.3109C5 2.92867 4.70359 2.62181 4.33437 2.62181C3.59333 2.62181 3.23712 2.23418 2.6729 1.55047L2.66965 1.54656Z" fill="#7A8F26"/>
      </svg>
    </motion.div>
  )
}

const LinkTest = () => {
  const [activeItem, setActiveItem] = useState(null)
  const servicesRef = useRef(null)
  const aboutRef = useRef(null)
  const projectRef = useRef(null)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Link Decoration Test</h1>
        
        <div className="bg-white shadow-sm p-8 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Navigation Menu Simulation</h2>
          
          <div className="flex items-center gap-8 border-b pb-4">
            <div
              className="relative py-6 px-3"
              onMouseEnter={() => setActiveItem('services')}
              onMouseLeave={() => setActiveItem(null)}
            >
              <button className="relative transition-all">
                <span ref={servicesRef}>Services</span>
                <LinkDecoration isActive={activeItem === 'services'} textRef={servicesRef} />
              </button>
            </div>

            <div
              className="relative py-6 px-3"
              onMouseEnter={() => setActiveItem('about')}
              onMouseLeave={() => setActiveItem(null)}
            >
              <button className="relative transition-all">
                <span ref={aboutRef}>About</span>
                <LinkDecoration isActive={activeItem === 'about'} textRef={aboutRef} />
              </button>
            </div>

            <div
              className="relative py-6 px-3"
              onMouseEnter={() => setActiveItem('project')}
              onMouseLeave={() => setActiveItem(null)}
            >
              <button className="relative transition-all">
                <span ref={projectRef}>Start a project</span>
                <LinkDecoration isActive={activeItem === 'project'} textRef={projectRef} />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm p-8 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Debug Info</h2>
          <div className="space-y-2 text-sm font-mono">
            <div>Active Item: {activeItem || 'none'}</div>
            <div>Services Width: {servicesRef.current?.offsetWidth || 0}px</div>
            <div>About Width: {aboutRef.current?.offsetWidth || 0}px</div>
            <div>Project Width: {projectRef.current?.offsetWidth || 0}px</div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Hover over each menu item to see the link decoration</li>
            <li>The decoration should appear 4px below the text</li>
            <li>Width should match the text width (rounded to nearest 9px multiple + 10px for caps)</li>
            <li>Check the debug info to see calculated widths</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default LinkTest
