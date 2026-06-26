import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null

  const getPages = () => {
    const arr = []
    const delta = 2
    for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) {
      arr.push(i)
    }
    return arr
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-lg hover:bg-dark-600 text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} />
      </button>

      {page > 3 && (
        <>
          <button onClick={() => onPageChange(1)} className="w-8 h-8 rounded-lg text-sm text-gray-400 hover:bg-dark-600 hover:text-gray-200 transition-colors">1</button>
          {page > 4 && <span className="text-gray-600 px-1">…</span>}
        </>
      )}

      {getPages().map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
            ${p === page
              ? 'bg-brand-600 text-white'
              : 'text-gray-400 hover:bg-dark-600 hover:text-gray-200'
            }`}
        >
          {p}
        </button>
      ))}

      {page < pages - 2 && (
        <>
          {page < pages - 3 && <span className="text-gray-600 px-1">…</span>}
          <button onClick={() => onPageChange(pages)} className="w-8 h-8 rounded-lg text-sm text-gray-400 hover:bg-dark-600 hover:text-gray-200 transition-colors">{pages}</button>
        </>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === pages}
        className="p-2 rounded-lg hover:bg-dark-600 text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
