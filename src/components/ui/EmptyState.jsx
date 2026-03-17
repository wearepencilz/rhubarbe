import Button from './Button'

const EmptyState = ({ 
  icon, 
  title, 
  description, 
  action,
  actionLabel 
}) => {
  return (
    <div className="text-center py-12">
      {icon && (
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {action && actionLabel && (
        <Button onClick={action} variant="solid">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

export default EmptyState
