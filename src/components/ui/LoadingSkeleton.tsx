export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  )
}

export function MenuItemSkeleton() {
  return (
    <div className="bg-neutral-900/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-pulse">
      <div className="h-56 bg-neutral-800/50"></div>
      <div className="p-6">
        <div className="h-5 bg-neutral-800 rounded mb-3"></div>
        <div className="h-5 bg-neutral-800 rounded w-3/4 mb-4"></div>
        <div className="h-8 bg-neutral-800 rounded w-1/2"></div>
      </div>
    </div>
  )
}

export function CartItemSkeleton() {
  return (
    <div className="bg-neutral-900/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl p-6 flex items-center gap-6 animate-pulse">
      <div className="w-28 h-28 bg-neutral-800/50 rounded-xl"></div>
      <div className="flex-1">
        <div className="h-6 bg-neutral-800 rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-neutral-800 rounded w-1/2 mb-4"></div>
        <div className="h-5 bg-neutral-800 rounded w-20"></div>
      </div>
      <div className="h-10 bg-neutral-800 rounded-full w-32"></div>
    </div>
  )
}

