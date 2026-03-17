import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const SortableItem = ({ id, children, isOpen, onToggle, title, headerActions }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        {/* Header with drag handle and toggle */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 border-b rounded-t-lg">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded flex-shrink-0"
            {...attributes}
            {...listeners}
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="flex-1 flex items-center justify-between text-left font-medium text-sm hover:text-blue-600 min-w-0"
          >
            <span className="truncate">{title || `Item ${id}`}</span>
            <svg 
              className={`w-4 h-4 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {headerActions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {headerActions}
            </div>
          )}
        </div>
        
        {/* Collapsible content */}
        {isOpen && (
          <div className="p-4">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

const SortableList = ({ items, onReorder, renderItem, getTitleFromItem, getHeaderActions, emptyMessage = 'No items yet', defaultOpen = false }) => {
  const [openItems, setOpenItems] = useState(new Set(defaultOpen ? items.map(item => item.id) : []))
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id)
      const newIndex = items.findIndex(item => item.id === over.id)
      const newItems = arrayMove(items, oldIndex, newIndex)
      onReorder(newItems)
    }
  }

  const toggleItem = (id) => {
    setOpenItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  if (items.length === 0) {
    return (
      <p className="text-gray-500 text-sm text-center py-4">
        {emptyMessage}
      </p>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map(item => item.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((item, index) => {
          const title = getTitleFromItem ? getTitleFromItem(item, index) : `Item ${index + 1}`
          const headerActions = getHeaderActions ? getHeaderActions(item, index) : null
          return (
            <SortableItem
              key={item.id}
              id={item.id}
              title={title}
              isOpen={openItems.has(item.id)}
              onToggle={() => toggleItem(item.id)}
              headerActions={headerActions}
            >
              {renderItem(item, index)}
            </SortableItem>
          )
        })}
      </SortableContext>
    </DndContext>
  )
}

export default SortableList
