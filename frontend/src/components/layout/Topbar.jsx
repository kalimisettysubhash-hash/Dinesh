import { useLocation } from 'react-router-dom'
import { Menu, Bell } from 'lucide-react'

const titles = {
  '/dashboard': 'Dashboard',
  '/customers': 'Customer Management',
  '/purchases': 'Purchase Management',
  '/segments':  'Customer Segments',
}

export default function Topbar({ onMenuClick }) {
  const { pathname } = useLocation()
  const base = '/' + pathname.split('/')[1]
  const title = titles[base] || 'TanviCRM'

  return (
    <header className="h-16 bg-dark-800 border-b border-dark-500 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-dark-600 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-display font-semibold text-gray-100 text-lg">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-xs text-gray-500 hidden sm:block">
          🌸 Tanvi Boutique
        </div>
      </div>
    </header>
  )
}
