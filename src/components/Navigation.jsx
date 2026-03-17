import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import LazyImage from './LazyImage'
import { API_URL } from '../config'
import { getImageUrl } from '../utils/imageUrl'

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

const Navigation = () => {
  const [settings, setSettings] = useState({})
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [megamenuOpen, setMegamenuOpen] = useState(false)
  const [megamenuContent, setMegamenuContent] = useState(null) // 'services' or 'about'
  const [megamenuStyle, setMegamenuStyle] = useState({})
  const [hoveredService, setHoveredService] = useState(null)
  const [hoveredAbout, setHoveredAbout] = useState(null)
  const [hoveredProject, setHoveredProject] = useState(false)
  const [hidden, setHidden] = useState(false)
  
  const servicesButtonRef = useRef(null)
  const aboutButtonRef = useRef(null)
  const servicesTextRef = useRef(null)
  const aboutTextRef = useRef(null)
  const projectTextRef = useRef(null)
  const closeTimeoutRef = useRef(null)

  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = scrollY.getPrevious() ?? 0
    if (current > previous && current > 150) {
      setHidden(true)
      // Close megamenu when hiding nav
      setMegamenuOpen(false)
      setMegamenuContent(null)
    } else {
      setHidden(false)
    }
  })

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

  useEffect(() => {
    fetch(`${API_URL}/api/settings`)
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error('Error loading settings:', err))
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (megamenuOpen && megamenuContent === 'services') {
        alignMegamenu(servicesButtonRef)
      } else if (megamenuOpen && megamenuContent === 'about') {
        alignMegamenu(aboutButtonRef)
      }
    }
    
    const handleScroll = () => {
      if (megamenuOpen && megamenuContent === 'services') {
        alignMegamenu(servicesButtonRef)
      } else if (megamenuOpen && megamenuContent === 'about') {
        alignMegamenu(aboutButtonRef)
      }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(closeTimeoutRef.current)
    }
  }, [megamenuOpen, megamenuContent])

  return (
    <>
      <motion.nav 
        className="bg-white sticky top-0 z-50 w-full"
        animate={{
          y: hidden ? -100 : 0,
          opacity: hidden ? 0 : 1,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="px-5 md:px-[20px]" style={{ maxWidth: '1600px', margin: '0 auto' }}>
          <div className="flex items-center justify-between">
            {/* Left side - Hamburger on mobile, Desktop menu on desktop */}
            <div className="flex items-center">
              {/* Mobile Hamburger */}
              <button 
                className="md:hidden py-6"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {settings.hamburgerIcon ? (
                  <LazyImage 
                    src={getImageUrl(settings.hamburgerIcon)}
                    alt="Menu" 
                    className="w-6 h-6"
                    priority={true}
                  />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                )}
              </button>
              
              {/* Desktop Menu */}
              <div className="hidden md:flex items-center -mx-3">
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

                <div
                  className="relative py-6 px-3"
                  onMouseEnter={() => setHoveredProject(true)}
                  onMouseLeave={() => setHoveredProject(false)}
                >
                  <Link to="/" className="relative transition-all">
                    <span ref={projectTextRef}>Start a project</span>
                    <LinkDecoration isActive={hoveredProject} textRef={projectTextRef} />
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Right side - Logo on mobile, Company name on desktop */}
            <div className="flex items-center">
              {/* Mobile Logo */}
              {settings.logo && (
                <Link to="/">
                  <LazyImage 
                    src={getImageUrl(settings.logo)}
                    alt="Pencilz" 
                    className="md:hidden h-5"
                    style={{ height: '20px', width: 'auto' }}
                    priority={true}
                  />
                </Link>
              )}
              
              {/* Desktop Company Name */}
              <Link to="/" className="hidden md:block text-right hover:opacity-70">
                <span className="font-bold">{settings.companyName || 'Pencilz + Friends'}</span>
                <span>, {settings.location || 'Montreal'}</span>
              </Link>
            </div>
          </div>
          
          {/* Mobile Menu Dropdown - Combined */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div 
                className="md:hidden bg-white w-full shadow-lg fixed left-0 right-0 z-40 overflow-hidden" 
                style={{ top: '58px' }}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <div className="px-5 py-8">
                  <div className="flex flex-col gap-8">
                    {/* Services Section */}
                    {settings.services && settings.services.length > 0 && (
                      <motion.div 
                        className="flex flex-col gap-4"
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.2 }}
                      >
                        <h3 className="text-[16px] font-medium text-[#8c8c8c] uppercase tracking-wide">Services</h3>
                        <div className="flex flex-col gap-3">
                          {settings.services.map((service, index) => (
                            <motion.div
                              key={service.id}
                              initial={{ x: -10, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.15 + index * 0.05, duration: 0.2 }}
                            >
                              <Link
                                to={service.link}
                                className="text-[24px] text-[#191919] leading-[1.155] hover:opacity-70"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                {service.name}
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* About Section */}
                    {settings.aboutItems && settings.aboutItems.length > 0 && (
                      <motion.div 
                        className="flex flex-col gap-4"
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.2 }}
                      >
                        <h3 className="text-[16px] font-medium text-[#8c8c8c] uppercase tracking-wide">About</h3>
                        <div className="flex flex-col gap-3">
                          {settings.aboutItems.map((item, index) => (
                            <motion.div
                              key={item.id}
                              initial={{ x: -10, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.25 + index * 0.05, duration: 0.2 }}
                            >
                              <Link
                                to={item.link}
                                className="text-[24px] text-[#191919] leading-[1.155] hover:opacity-70"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                {item.name}
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Start a project */}
                    <motion.div
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.2 }}
                    >
                      <Link 
                        to="/" 
                        className="text-[24px] text-[#191919] leading-[1.155] hover:opacity-70 pt-4 border-t border-gray-200 block"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Start a project
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Single Megamenu - Content changes based on state */}
      <AnimatePresence>
        {megamenuOpen && (
          <motion.div
            className="hidden md:block bg-white w-full z-[1000]"
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
                    {/* Services List */}
                    <div className="flex flex-wrap gap-2 text-[32px] leading-[1.155]">
                      {settings.services && settings.services.map((service, index) => (
                        <Link
                          key={service.id}
                          to={service.link}
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
                          {index < settings.services.length - 1 && (
                            <span 
                              className="transition-colors"
                              style={{ 
                                color: hoveredService === service.id ? '#191919' : '#8c8c8c'
                              }}
                            >
                              ,
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>

                    {/* Description */}
                    {settings.servicesDescription && (
                      <p className="text-[32px] text-[#191919] max-w-[1156px] leading-[1.155]">
                        {settings.servicesDescription}
                      </p>
                    )}
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
                    {/* About List */}
                    <div className="flex flex-wrap gap-2 text-[32px] leading-[1.155]">
                      {settings.aboutItems && settings.aboutItems.map((item, index) => (
                        <Link
                          key={item.id}
                          to={item.link}
                          className="flex items-center gap-1"
                          onMouseEnter={() => setHoveredAbout(item.id)}
                          onMouseLeave={() => setHoveredAbout(null)}
                        >
                          <span 
                            className="transition-colors"
                            style={{ 
                              color: hoveredAbout === item.id ? '#191919' : '#8c8c8c'
                            }}
                          >
                            {item.name}
                          </span>
                          {index < settings.aboutItems.length - 1 && (
                            <span 
                              className="transition-colors"
                              style={{ 
                                color: hoveredAbout === item.id ? '#191919' : '#8c8c8c'
                              }}
                            >
                              ,
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>

                    {/* Description */}
                    {settings.aboutDescription && (
                      <p className="text-[32px] text-[#191919] max-w-[1156px] leading-[1.155]">
                        {settings.aboutDescription}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navigation
