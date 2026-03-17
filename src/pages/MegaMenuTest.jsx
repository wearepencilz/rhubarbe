import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const LinkDecoration = ({ isActive, textRef }) => {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (textRef?.current) {
      const textWidth = textRef.current.offsetWidth
      const centerPieceWidth = 9
      const availableWidth = textWidth - 10
      const numCenterPieces = Math.max(0, Math.round(availableWidth / centerPieceWidth))
      const calculatedWidth = numCenterPieces * centerPieceWidth + 10
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

const MegaMenuTest = () => {
  const [megamenuOpen, setMegamenuOpen] = useState(false)
  const [megamenuContent, setMegamenuContent] = useState(null)
  const [megamenuStyle, setMegamenuStyle] = useState({})
  const [hoveredService, setHoveredService] = useState(null)
  
  const servicesButtonRef = useRef(null)
  const aboutButtonRef = useRef(null)
  const servicesTextRef = useRef(null)
  const aboutTextRef = useRef(null)
  const closeTimeoutRef = useRef(null)

  const services = [
    { id: 1, name: 'Brand Strategy', link: '/services/brand' },
    { id: 2, name: 'Web Design', link: '/services/web' },
    { id: 3, name: 'Development', link: '/services/dev' },
    { id: 4, name: 'Marketing', link: '/services/marketing' }
  ]

  const aboutItems = [
    { id: 1, name: 'Our Story', link: '/about/story' },
    { id: 2, name: 'Team', link: '/about/team' },
    { id: 3, name: 'Careers', link: '/about/careers' }
  ]

  const alignMegamenu = (buttonRef) => {
    if (buttonRef.current) {
      const navElement = buttonRef.current.closest('nav')
      if (navElement) {
        const rect = navElement.getBoundingClientRect()
        setMegamenuStyle({
          position: 'fixed',
          left: 0,
          right: 0,
          top: `${rect.bottom}px`,
        })
      }
    }
  }

  const handleServicesEnter = () => {
    clearTimeout(closeTimeoutRef.current)
    alignMegamenu(servicesButtonRef)
    setMegamenuContent('services')
    if (!megamenuOpen) {
      setTimeout(() => setMegamenuOpen(true), 100)
    }
  }

  const handleAboutEnter = () => {
    clearTimeout(closeTimeoutRef.current)
    alignMegamenu(aboutButtonRef)
    setMegamenuContent('about')
    if (!megamenuOpen) {
      setTimeout(() => setMegamenuOpen(true), 100)
    }
  }

  const handleMegamenuLeave = () => {
    clearTimeout(closeTimeoutRef.current)
    closeTimeoutRef.current = setTimeout(() => {
      setMegamenuOpen(false)
      setMegamenuContent(null)
    }, 150)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white sticky top-0 z-50 w-full">
        <div className="px-5 md:px-[20px]" style={{ maxWidth: '1600px', margin: '0 auto' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center -mx-3">
                {/* Services */}
                <div
                  className="relative py-6 px-3"
                  onMouseEnter={handleServicesEnter}
                  onMouseLeave={handleMegamenuLeave}
                >
                  <button 
                    ref={servicesButtonRef}
                    className="relative transition-all"
                  >
                    <span ref={servicesTextRef}>Services</span>
                    <LinkDecoration isActive={megamenuContent === 'services'} textRef={servicesTextRef} />
                  </button>
                </div>

                {/* About */}
                <div
                  className="relative py-6 px-3"
                  onMouseEnter={handleAboutEnter}
                  onMouseLeave={handleMegamenuLeave}
                >
                  <button 
                    ref={aboutButtonRef}
                    className="relative transition-all"
                  >
                    <span ref={aboutTextRef}>About</span>
                    <LinkDecoration isActive={megamenuContent === 'about'} textRef={aboutTextRef} />
                  </button>
                </div>

                <a href="#" className="relative transition-all py-6 px-3">
                  Start a project
                </a>
              </div>
            </div>
            
            <div className="flex items-center">
              <span className="font-bold">Pencilz + Friends</span>
              <span>, Montreal</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Megamenu */}
      <AnimatePresence>
        {megamenuOpen && (
          <motion.div
            className="bg-white w-full z-[1000]"
            style={{
              ...megamenuStyle,
              boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={() => clearTimeout(closeTimeoutRef.current)}
            onMouseLeave={handleMegamenuLeave}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div 
              className="px-5 md:px-[20px] py-8" 
              style={{ maxWidth: '1600px', margin: '0 auto' }}
            >
              <AnimatePresence mode="wait">
                {megamenuContent === 'services' && (
                  <motion.div 
                    key="services"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="flex flex-col gap-8"
                  >
                    <div className="flex flex-wrap gap-2 text-[32px] leading-[1.155]">
                      {services.map((service, index) => (
                        <a
                          key={service.id}
                          href={service.link}
                          className="flex items-center gap-1"
                          onMouseEnter={() => setHoveredService(service.id)}
                          onMouseLeave={() => setHoveredService(null)}
                        >
                          <span 
                            className="transition-colors"
                            style={{ 
                              color: hoveredService === service.id ? '#191919' : '#8c8c8c'
                            }}
                          >
                            {service.name}
                          </span>
                          {index < services.length - 1 && (
                            <span 
                              className="transition-colors"
                              style={{ 
                                color: hoveredService === service.id ? '#191919' : '#8c8c8c'
                              }}
                            >
                              ,
                            </span>
                          )}
                        </a>
                      ))}
                    </div>
                    <p className="text-[32px] text-[#191919] max-w-[1156px] leading-[1.155]">
                      We help brands tell their story through strategic design and development.
                    </p>
                  </motion.div>
                )}

                {megamenuContent === 'about' && (
                  <motion.div 
                    key="about"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="flex flex-col gap-8"
                  >
                    <div className="flex flex-wrap gap-2 text-[32px] leading-[1.155]">
                      {aboutItems.map((item, index) => (
                        <a
                          key={item.id}
                          href={item.link}
                          className="flex items-center gap-1"
                        >
                          <span className="transition-colors text-[#8c8c8c] hover:text-[#191919]">
                            {item.name}
                          </span>
                          {index < aboutItems.length - 1 && (
                            <span className="transition-colors text-[#8c8c8c]">,</span>
                          )}
                        </a>
                      ))}
                    </div>
                    <p className="text-[32px] text-[#191919] max-w-[1156px] leading-[1.155]">
                      A creative studio based in Montreal, working with clients worldwide.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Content */}
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h1 className="text-3xl font-bold mb-4">Mega Menu Test</h1>
          <p className="text-gray-600 mb-4">
            Hover over "Services" or "About" in the navigation to see the mega menu.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h3 className="font-semibold mb-2">What to check:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>The mega menu has a light blue background so you can see its position</li>
              <li>Check if the dropdown is positioned correctly below the nav</li>
              <li>Verify there's no gap or overlap between nav and dropdown</li>
              <li>The link decoration should appear 2px below the text</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold mb-4">Sample Content</h2>
          <p className="text-gray-600 mb-4">
            This is sample content to show how the page looks with the sticky navigation.
          </p>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <p key={i} className="text-gray-500">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MegaMenuTest
