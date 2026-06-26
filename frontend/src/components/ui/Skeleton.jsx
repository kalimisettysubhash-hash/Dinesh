export function Skeleton({ className = '' }) {
  return <div className={`bg-dark-600 rounded-2xl animate-pulse ${className}`} />
}

export function TableSkeleton({ rows = 4, columns = 6 }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, cell) => (
            <Skeleton key={cell} className="h-10" />
          ))}
        </div>
      ))}
    </div>
  )
}
