export function ExecutionDetailSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter Header Skeleton */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm px-6 py-4 space-y-4">
        <div className="h-10 bg-slate-200 rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-8 w-20 bg-slate-200 rounded animate-pulse" />
          <div className="h-8 w-20 bg-slate-200 rounded animate-pulse" />
          <div className="h-8 w-20 bg-slate-200 rounded animate-pulse" />
          <div className="h-8 w-20 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Module Group Skeletons */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
          {/* Module Header Skeleton */}
          <div className="px-4 py-3 bg-slate-50">
            <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
          </div>

          {/* Case Row Skeletons */}
          <div className="bg-white">
            {[...Array(5)].map((_, j) => (
              <div key={j} className="flex items-center gap-4 px-4 py-2.5 border-b border-slate-50">
                <div className="w-20 h-4 bg-slate-200 rounded animate-pulse" />
                <div className="w-8 h-4 bg-slate-200 rounded animate-pulse" />
                <div className="flex-1 h-4 bg-slate-200 rounded animate-pulse" />
                <div className="w-32 h-4 bg-slate-200 rounded animate-pulse" />
                <div className="w-24 h-4 bg-slate-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function CaseRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-slate-50">
      <div className="w-20 h-4 bg-slate-200 rounded animate-pulse" />
      <div className="w-8 h-4 bg-slate-200 rounded animate-pulse" />
      <div className="flex-1 h-4 bg-slate-200 rounded animate-pulse" />
      <div className="w-32 h-4 bg-slate-200 rounded animate-pulse" />
      <div className="w-24 h-4 bg-slate-200 rounded animate-pulse" />
      <div className="w-32 h-7 bg-slate-200 rounded animate-pulse" />
    </div>
  )
}
