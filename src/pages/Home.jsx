import { useState, useEffect, useRef } from 'react'
import { useScroll } from 'framer-motion'
import ProjectCard from '../components/ProjectCard'
import StickyCard from '../components/StickyCard'
import SEO from '../components/SEO'
import Button from '../components/Button'
import LazyImage from '../components/LazyImage'
import { API_URL } from '../config'
import { getImageUrl } from '../utils/imageUrl'

const Home = () => {
  const [projects, setProjects] = useState([])
  const [settings, setSettings] = useState({ email: '', logo: '', companyName: '' })
  const [homePage, setHomePage] = useState({ heroImage: '', heroText: 'Your start up accelerator' })
  const containerRef = useRef(null)
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  })

  useEffect(() => {
    fetch(`${API_URL}/api/projects`)
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(() => setProjects([]))
    
    fetch(`${API_URL}/api/settings`)
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(() => {})
    
    fetch(`${API_URL}/api/pages/home`)
      .then(res => res.json())
      .then(data => setHomePage(data))
      .catch(() => {})
  }, [])

  const emailSubject = encodeURIComponent(
    homePage.emailSubject || "Let's Create Something Amazing Together! 🚀"
  )
  const emailBody = encodeURIComponent(
    homePage.emailBody || `Hi there!\n\nI'm excited to explore the possibility of working together on a project.\n\nHere's what I'm thinking:\n\n[Tell us about your project vision]\n\nLooking forward to bringing this to life!\n\nBest regards`
  )
  const contactEmail = homePage.contactEmail || settings.email

  return (
    <div className="w-full" style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <SEO
        title={homePage.metaTitle || 'Pencilz - Your start up accelerator'}
        description={homePage.metaDescription || 'Shopify builds, marketing, design, and start-up support services'}
        keywords={homePage.metaKeywords || 'shopify, web design, marketing, startup, development'}
        ogImage={homePage.ogImage || homePage.heroImage}
        ogUrl={window.location.href}
      />
      
      {/* Hero Section */}
      <div className="px-5 md:px-[20px] pt-2 md:pt-[10px]">
        <div 
          className="relative w-full overflow-hidden aspect-[4/5] md:aspect-[2/1]"
          style={{ 
            borderRadius: '20px'
          }}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            {homePage.heroImage ? (
              <LazyImage 
                src={getImageUrl(homePage.heroImage)}
                alt="Hero background"
                className="absolute w-full h-full object-cover"
                priority={true}
              />
            ) : (
              <div className="absolute w-full h-full bg-gray-200" />
            )}
          </div>

          {/* Hero Text */}
          <div className="absolute inset-0 flex items-center justify-center md:p-0 p-5">
            <h1 
              className="text-white text-center font-semibold md:text-[96px] text-[50px]"
              style={{ lineHeight: 'normal' }}
            >
              {homePage.heroText || 'Your start up accelerator'}
            </h1>
          </div>

          {/* Service Pills - Desktop Only */}
          <div 
            className="absolute lg:flex hidden flex-row gap-4"
            style={{ 
              bottom: '24px',
              left: '24px',
              right: '24px'
            }}
          >
            {homePage.heroButtons && homePage.heroButtons.map((button) => (
              <Button 
                key={button.id}
                to={button.link.startsWith('http') ? undefined : button.link}
                href={button.link.startsWith('http') ? button.link : undefined}
                icon={button.icon}
                subtext={button.subtext}
                className="flex-1"
                style={{ minHeight: '72px' }}
              >
                {button.text}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Service Pills - Tablet (2-up grid) */}
      <div className="hidden md:grid lg:hidden grid-cols-2 gap-4 px-5 md:px-[20px] mt-5">
        {homePage.heroButtons && homePage.heroButtons.map((button) => (
          <Button 
            key={button.id}
            to={button.link.startsWith('http') ? undefined : button.link}
            href={button.link.startsWith('http') ? button.link : undefined}
            icon={button.icon}
            subtext={button.subtext}
            style={{ minHeight: '72px' }}
          >
            {button.text}
          </Button>
        ))}
      </div>

      {/* Service Pills - Mobile (stacked) */}
      <div className="md:hidden flex flex-col gap-4 px-5 mt-5">
        {homePage.heroButtons && homePage.heroButtons.map((button) => (
          <Button 
            key={button.id}
            to={button.link.startsWith('http') ? undefined : button.link}
            href={button.link.startsWith('http') ? button.link : undefined}
            icon={button.icon}
            subtext={button.subtext}
            style={{ minHeight: '72px' }}
          >
            {button.text}
          </Button>
        ))}
      </div>

      {/* Projects Section - Sticky Stack */}
      {projects.length > 0 && (
        <div 
          ref={containerRef}
          style={{ 
            position: 'relative',
            marginTop: '48px',
            paddingBottom: '30px'
          }}
        >
          {projects.slice(0, 3).map((project, i) => (
            <StickyCard
              key={project.id}
              project={project}
              index={i}
              scrollYProgress={scrollYProgress}
              totalCards={3}
            />
          ))}
        </div>
      )}
      
      {/* Remaining Projects */}
      {projects.length > 3 && (
        <div className="px-5 md:px-[20px]">
          {projects.slice(3).map(project => (
            <div key={project.id} style={{ marginBottom: '20px' }}>
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      )}

      {/* Contact Section */}
      <div 
        className="w-full flex items-center justify-center px-5 md:px-[20px] pt-12 pb-[200px]"
      >
        <div 
          className="flex flex-col items-center gap-6"
          style={{ width: '481px' }}
        >
          <p className="text-2xl text-black text-center w-full">
            {homePage.contactHeading || 'Start a project'}
          </p>
          <Button
            href={`mailto:${contactEmail}?subject=${emailSubject}&body=${emailBody}`}
            variant="primary"
            className="w-full"
            target="_blank"
            rel="noopener noreferrer"
          >
            {homePage.contactButtonText || contactEmail}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Home
