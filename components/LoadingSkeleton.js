export default function LoadingSkeleton({ rows = 4, className = "" }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="rounded-xl border border-jarvis-border bg-jarvis-card p-4">
          <div className="skeleton-shimmer h-4 w-2/5 animate-shimmer rounded-full" />
          <div className="mt-4 space-y-2">
            <div className="skeleton-shimmer h-3 w-full animate-shimmer rounded-full" />
            <div className="skeleton-shimmer h-3 w-4/5 animate-shimmer rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
