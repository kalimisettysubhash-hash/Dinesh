export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizes[size]} rounded-full border-2 border-dark-500 border-t-brand-500 animate-spin`}
      />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-gray-500 animate-pulse-soft">Loading…</p>
    </div>
  )
}

export function EmptyState({ message = 'No data found', icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon size={40} className="text-gray-600 mb-3" />}
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  )
}
