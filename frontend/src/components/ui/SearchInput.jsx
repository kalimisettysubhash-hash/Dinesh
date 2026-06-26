import { Search, X } from 'lucide-react'

export default function SearchInput({ value, onChange, placeholder = 'Search...', onClear }) {
  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-9 pr-8 py-2 text-sm"
      />
      {value && (
        <button
          onClick={() => { onChange(''); onClear?.() }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
