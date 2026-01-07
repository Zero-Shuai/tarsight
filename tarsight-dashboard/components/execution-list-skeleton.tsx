export function ExecutionListSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-50 overflow-hidden">
      {/* Header Skeleton */}
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4 h-4 bg-slate-200 rounded animate-pulse" />
          <div className="col-span-2 h-4 bg-slate-200 rounded animate-pulse mx-auto" />
          <div className="col-span-2 h-4 bg-slate-200 rounded animate-pulse mx-auto" />
          <div className="col-span-2 h-4 bg-slate-200 rounded animate-pulse mx-auto" />
          <div className="col-span-2 h-4 bg-slate-200 rounded animate-pulse mx-auto" />
        </div>
      </div>

      {/* Row Skeletons */}
      <div className="divide-y divide-slate-50">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center px-6 py-4">
            {/* Status Bar Skeleton */}
            <div className="w-1 h-16 bg-slate-200 rounded animate-pulse mr-2" />

            {/* Content Skeleton */}
            <div className="grid grid-cols-12 gap-4 items-center flex-1 ml-2">
              {/* Name & Timestamp */}
              <div className="col-span-4 flex items-center gap-3">
                <div className="h-5 w-5 bg-slate-200 rounded-full animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-slate-200 rounded animate-pulse w-1/2" />
                </div>
              </div>

              {/* Total */}
              <div className="col-span-2 text-center">
                <div className="h-6 bg-slate-200 rounded animate-pulse mx-auto w-8" />
              </div>

              {/* Pass */}
              <div className="col-span-2 text-center">
                <div className="h-6 bg-slate-200 rounded animate-pulse mx-auto w-8" />
              </div>

              {/* Fail */}
              <div className="col-span-2 text-center">
                <div className="h-6 bg-slate-200 rounded animate-pulse mx-auto w-8" />
              </div>

              {/* Badge */}
              <div className="col-span-2 flex justify-center">
                <div className="h-6 w-12 bg-slate-200 rounded-full animate-pulse" />
              </div>
            </div>

            {/* Chevron Skeleton */}
            <div className="h-5 w-5 bg-slate-200 rounded animate-pulse ml-4 flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
