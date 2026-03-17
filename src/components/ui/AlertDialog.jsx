import { useEffect } from 'react'
import Button from './Button'

const AlertDialog = ({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  onConfirm,
  variant = 'danger'
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {description}
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'destructive' : 'primary'}
            onClick={() => {
              onConfirm()
              onOpenChange(false)
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AlertDialog
