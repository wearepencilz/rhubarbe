import { useState, useEffect, useRef } from 'react'

/**
 * Lightweight hover intent hook
 * Only triggers hover state after mouse stays over element for specified delay
 * Immediately triggers unhover when mouse leaves
 */
const useHoverIntent = ({ 
  onEnter, 
  onLeave, 
  delay = 150, // milliseconds to wait before triggering hover
  sensitivity = 7 // pixels mouse must move to reset timer
} = {}) => {
  const [isHovering, setIsHovering] = useState(false)
  const timeoutRef = useRef(null)
  const previousMousePos = useRef({ x: 0, y: 0 })
  const elementRef = useRef(null)

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const handleMouseEnter = () => {
    clearTimer()
    
    timeoutRef.current = setTimeout(() => {
      setIsHovering(true)
      if (onEnter) onEnter()
    }, delay)
  }

  const handleMouseMove = (e) => {
    // If already hovering, ignore movement
    if (isHovering) return

    // Calculate distance moved
    const deltaX = Math.abs(e.clientX - previousMousePos.current.x)
    const deltaY = Math.abs(e.clientY - previousMousePos.current.y)
    
    // If mouse moved significantly, reset timer
    if (deltaX > sensitivity || deltaY > sensitivity) {
      clearTimer()
      timeoutRef.current = setTimeout(() => {
        setIsHovering(true)
        if (onEnter) onEnter()
      }, delay)
    }

    previousMousePos.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseLeave = () => {
    clearTimer()
    setIsHovering(false)
    if (onLeave) onLeave()
  }

  useEffect(() => {
    return () => clearTimer()
  }, [])

  const bind = {
    ref: elementRef,
    onMouseEnter: handleMouseEnter,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave
  }

  return [isHovering, bind]
}

export default useHoverIntent
