export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`glass-panel rounded-2xl p-5 animate-pulse ${className}`}>
      <div className="h-3 bg-white/10 rounded-full w-1/3 mb-3" />
      <div className="h-8 bg-white/10 rounded-full w-2/3 mb-2" />
      <div className="h-2 bg-white/5 rounded-full w-full mb-1.5" />
      <div className="h-2 bg-white/5 rounded-full w-4/5" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
      <div className="w-8 h-8 bg-white/10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 bg-white/10 rounded-full w-1/3" />
        <div className="h-2 bg-white/5 rounded-full w-1/2" />
      </div>
      <div className="h-6 w-16 bg-white/8 rounded-xl shrink-0" />
    </div>
  );
}

export function SkeletonGlobe() {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden animate-pulse" style={{ aspectRatio: "16/10" }}>
      <div className="w-full h-full bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center">
        <div className="w-40 h-40 rounded-full border border-white/10 flex items-center justify-center">
          <div className="w-28 h-28 rounded-full border border-white/8 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonKPI() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="glass-panel rounded-xl p-4">
          <div className="h-2 bg-white/8 rounded-full w-1/2 mb-3" />
          <div className="h-7 bg-white/12 rounded-full w-3/4 mb-2" />
          <div className="h-1.5 bg-white/5 rounded-full w-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonNews() {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden animate-pulse">
      <div className="px-5 py-4 border-b border-white/8 flex gap-3">
        <div className="w-5 h-5 bg-white/10 rounded-lg" />
        <div className="flex-1 h-4 bg-white/10 rounded-full w-1/3" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="px-5 py-4 border-b border-white/5 flex gap-3">
          <div className="w-2 h-2 rounded-full bg-white/10 mt-1 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-2.5 bg-white/8 rounded-full w-5/6" />
            <div className="h-2 bg-white/5 rounded-full w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
