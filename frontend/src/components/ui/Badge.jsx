const SEGMENT_CLASSES = {
  VIP:     'badge-vip',
  Regular: 'badge-regular',
  New:     'badge-new',
}

const SEGMENT_ICONS = {
  VIP:     '👑',
  Regular: '⭐',
  New:     '🆕',
}

export function SegmentBadge({ segment }) {
  return (
    <span className={SEGMENT_CLASSES[segment] || 'badge bg-gray-700 text-gray-300'}>
      {SEGMENT_ICONS[segment]} {segment}
    </span>
  )
}

export function CategoryBadge({ category }) {
  const colors = {
    Sarees:      'bg-purple-600/20 text-purple-300 border-purple-600/30',
    Lehengas:    'bg-pink-600/20 text-pink-300 border-pink-600/30',
    Kurtis:      'bg-teal-600/20 text-teal-300 border-teal-600/30',
    Blouses:     'bg-orange-600/20 text-orange-300 border-orange-600/30',
    Jewellery:   'bg-yellow-600/20 text-yellow-300 border-yellow-600/30',
    Accessories: 'bg-blue-600/20 text-blue-300 border-blue-600/30',
    Suits:       'bg-green-600/20 text-green-300 border-green-600/30',
  }
  const cls = colors[category] || 'bg-gray-600/20 text-gray-300 border-gray-600/30'
  return <span className={`badge border ${cls}`}>{category}</span>
}

export function PaymentBadge({ method }) {
  return (
    <span className="badge bg-dark-500 text-gray-300 border border-dark-400">
      {method}
    </span>
  )
}
