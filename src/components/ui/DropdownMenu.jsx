import { useState, useRef, useEffect } from 'react'

const DropdownMenu = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

const DropdownMenuItem = ({ onClick, children, variant = 'default' }) => {
  const baseClasses = "block w-full text-left px-4 py-2 text-sm"
  const variantClasses = {
    default: "text-gray-700 hover:bg-gray-100",
    destructive: "text-red-600 hover:bg-red-50"
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {children}
    </button>
  )
}

DropdownMenu.Item = DropdownMenuItem

export default DropdownMenu
