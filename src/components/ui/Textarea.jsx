import { forwardRef } from 'react'

const Textarea = forwardRef(({ 
  label, 
  error, 
  helperText,
  maxLength,
  showCount = false,
  className = '',
  ...props 
}, ref) => {
  const textareaId = `textarea-${Math.random().toString(36).substr(2, 9)}`
  const currentLength = props.value?.length || 0
  
  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={textareaId}
          className="block text-sm font-medium mb-1.5 text-gray-900"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        maxLength={maxLength}
        className={`
          w-full px-3 py-2 text-sm
          bg-white border border-gray-300 rounded-md
          placeholder:text-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:text-gray-500 disabled:border-gray-200 disabled:cursor-not-allowed
          resize-y
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
          ${className}
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={
          error ? `${textareaId}-error` : 
          helperText ? `${textareaId}-helper` : 
          undefined
        }
        {...props}
      />
      <div className="flex justify-between items-start mt-1.5">
        <div className="flex-1">
          {error && (
            <p 
              id={`${textareaId}-error`}
              className="text-red-600 text-xs"
            >
              {error}
            </p>
          )}
          {helperText && !error && (
            <p 
              id={`${textareaId}-helper`}
              className="text-gray-500 text-xs"
            >
              {helperText}
            </p>
          )}
        </div>
        {(showCount || maxLength) && (
          <p className="text-gray-400 text-xs ml-2 flex-shrink-0">
            {currentLength}{maxLength ? `/${maxLength}` : ''}
          </p>
        )}
      </div>
    </div>
  )
})

Textarea.displayName = 'Textarea'

export default Textarea
