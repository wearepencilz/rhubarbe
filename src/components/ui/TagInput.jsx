import { useState, useRef, useEffect } from 'react'

const TagInput = ({ 
  label, 
  value = [], 
  onChange, 
  availableTags = [], 
  onCreateTag,
  placeholder = 'Type to add tags...',
  helperText,
  error 
}) => {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredTags, setFilteredTags] = useState([])
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    // Filter tags based on input value
    const filtered = availableTags.filter(tag => 
      tag.name.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.some(v => v.id === tag.id)
    )
    setFilteredTags(filtered)
  }, [inputValue, availableTags, value])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAddTag = (tag) => {
    if (!value.some(v => v.id === tag.id)) {
      onChange([...value, tag])
    }
    setInputValue('')
    inputRef.current?.focus()
  }

  const handleCreateNew = () => {
    const trimmedValue = inputValue.trim()
    if (trimmedValue && onCreateTag) {
      const newTag = onCreateTag(trimmedValue)
      if (newTag) {
        handleAddTag(newTag)
      }
    }
  }

  const handleRemoveTag = (tagId) => {
    onChange(value.filter(v => v.id !== tagId))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredTags.length > 0) {
        handleAddTag(filteredTags[0])
      } else if (inputValue.trim() && onCreateTag) {
        handleCreateNew()
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      handleRemoveTag(value[value.length - 1].id)
    }
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-1.5 text-gray-900">
          {label}
        </label>
      )}
      
      <div ref={containerRef} className="relative">
        <div className={`
          min-h-[42px] w-full px-3 py-2 border rounded-md bg-white
          flex flex-wrap gap-2 items-center
          ${error ? 'border-red-500' : 'border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500'}
        `}>
          {value.map(tag => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
            >
              {tag.name}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleRemoveTag(tag.id)
                }}
                className="hover:text-blue-600 text-lg leading-none"
              >
                ×
              </button>
            </span>
          ))}
          
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onClick={() => setShowSuggestions(true)}
            placeholder={value.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] outline-none text-sm"
          />
        </div>

        {showSuggestions && (filteredTags.length > 0 || (inputValue.trim() && onCreateTag)) && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredTags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleAddTag(tag)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between"
              >
                <span>{tag.name}</span>
                {tag.link && (
                  <span className="text-xs text-gray-500">→ {tag.link}</span>
                )}
              </button>
            ))}
            
            {inputValue.trim() && !filteredTags.some(t => t.name.toLowerCase() === inputValue.toLowerCase()) && onCreateTag && (
              <button
                type="button"
                onClick={handleCreateNew}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-blue-600 ${filteredTags.length > 0 ? 'border-t border-gray-200' : ''}`}
              >
                + Create "{inputValue}"
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-600 text-xs mt-1.5">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-gray-500 text-xs mt-1.5">{helperText}</p>
      )}
    </div>
  )
}

export default TagInput
