import { useState, useRef } from 'react'
import Button from './Button'
import { getImageUrl } from '../../utils/imageUrl'

const FileInput = ({ 
  label, 
  accept = 'image/*', 
  onUpload, 
  value, 
  onChange, 
  disabled, 
  helperText, 
  error 
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  console.log('🔵 FileInput render - value:', value)

  const handleFileSelect = async (file) => {
    if (!file || !onUpload) {
      console.log('⚠️ No file or onUpload handler')
      return
    }
    
    console.log('📤 Starting upload:', file.name)
    setIsUploading(true)
    
    try {
      const uploadedUrl = await onUpload(file)
      console.log('✅ Upload complete:', uploadedUrl)
      
      if (onChange) {
        onChange(uploadedUrl)
        console.log('🔄 Called onChange with:', uploadedUrl)
      }
    } catch (error) {
      console.error('❌ Upload failed:', error)
      alert('Failed to upload image: ' + error.message)
    } finally {
      setIsUploading(false)
      // Clear the file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !isUploading) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (disabled || isUploading) return
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDelete = () => {
    console.log('🗑️ Delete clicked')
    if (onChange) {
      onChange('')
      console.log('🔄 Called onChange with empty string')
    }
  }

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-1.5 text-gray-900">
          {label}
        </label>
      )}
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {/* Show preview if we have a saved value */}
      {value && value !== 'Preview' && value.trim() !== '' ? (
        <div className="relative">
          <div className="flex items-center justify-center bg-white border border-gray-300 rounded-md p-4">
            <img 
              src={getImageUrl(value)}
              alt="Preview" 
              className="max-h-48 w-auto object-contain"
              onError={(e) => {
                console.error('❌ Image failed to load:', value)
                console.error('❌ Attempted URL:', getImageUrl(value))
                e.target.style.display = 'none'
                const errorDiv = e.target.parentElement.querySelector('.error-placeholder')
                if (errorDiv) errorDiv.style.display = 'flex'
              }}
              onLoad={(e) => {
                console.log('✅ Image loaded successfully:', value)
                console.log('✅ Full URL:', getImageUrl(value))
              }}
            />
            <div 
              className="error-placeholder hidden flex-col items-center justify-center text-gray-500"
              style={{ display: 'none', minHeight: '12rem' }}
            >
              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="mt-2 text-sm">Failed to load image</p>
              <p className="text-xs text-gray-400 mt-1 max-w-xs truncate">{value}</p>
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || isUploading}
              onClick={handleClick}
            >
              {isUploading ? 'Uploading...' : 'Change Image'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || isUploading}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      ) : (
        /* Show dropzone if no value */
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border border-dashed rounded-md p-6 text-center transition-colors cursor-pointer
            ${error ? 'border-red-500' : isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
            ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
            bg-white
          `}
        >
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                {isUploading ? 'Uploading...' : 'Click to upload'}
              </span>
              {!isUploading && ' or drag and drop'}
            </div>
            <p className="text-xs text-gray-500">
              {accept === 'image/svg+xml,.svg' ? 'SVG only' : 'PNG, JPG, GIF, SVG up to 10MB'}
            </p>
          </div>
          
          {isUploading && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-600">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading...
            </div>
          )}
        </div>
      )}
      
      {error && (
        <p className="text-red-600 text-xs mt-1.5">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-gray-500 text-xs mt-1.5">{helperText}</p>
      )}
    </div>
  )
}

export default FileInput
