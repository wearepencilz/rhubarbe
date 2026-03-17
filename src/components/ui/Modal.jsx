import { useEffect } from 'react'

const Modal = ({ 
  open, 
  onOpenChange, 
  title, 
  children,
  size = 'md'
}) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  if (!open) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full mx-4'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Modal */}
      <div className={`relative bg-white rounded-lg shadow-xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto`}>
        {title && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {title}
            </h2>
          </div>
        )}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal
