export function VersionBadge({ className = '' }: { className?: string }) {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || 'dev'

  return (
    <span
      className={`inline-flex items-center rounded-full border border-slate-300/70 bg-white/70 px-2 py-1 font-mono text-[11px] text-slate-600 ${className}`.trim()}
    >
      v{version}
    </span>
  )
}
