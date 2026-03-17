import { forwardRef } from 'react'

const Input = forwardRef(({ 
  label, 
  error, 
  helperText, 
  className = '',
  type = 'text',
  ...props 
}, ref) => {
  const inputId = `input-${Math.random().toString(36).substr(2, 9)}`
  
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium mb-1.5 text-gray-900"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        className={`
          w-full px-3 py-2 text-sm
          bg-white border border-gray-300 rounded-md
          placeholder:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:cursor-not-allowed
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
          ${className}
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={
          error ? `${inputId}-error` : 
          helperText ? `${inputId}-helper` : 
          undefined
        }
        {...props}
      />
      {error && (
        <p 
          id={`${inputId}-error`}
          className="text-red-600 text-xs mt-1.5"
        >
          {error}
        </p>
      )}
      {helperText && !error && (
        <p 
          id={`${inputId}-helper`}
          className="text-gray-500 text-xs mt-1.5"
        >
          {helperText}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
