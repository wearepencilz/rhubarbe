import { useState } from 'react'

const FormSection = ({ 
  title, 
  description, 
  children, 
  collapsible = false, 
  defaultOpen = true 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  if (!collapsible) {
    return (
      <div className="space-y-4">
        {(title || description) && (
          <div className="border-b border-gray-200 pb-3">
            {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
            {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
          </div>
        )}
        <div className="space-y-4">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between text-left"
        >
          <div>
            {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
            {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      {isOpen && (
        <div className="space-y-4">
          {children}
        </div>
      )}
    </div>
  )
}

export default FormSection
