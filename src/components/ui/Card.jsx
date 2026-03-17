const Card = ({ children, className = '', padding = 'default' }) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    default: 'p-6'
  }
  
  return (
    <div className={`
      bg-white rounded-lg border border-gray-200 shadow-sm
      ${paddingClasses[padding]}
      ${className}
    `}>
      {children}
    </div>
  )
}

export default Card
