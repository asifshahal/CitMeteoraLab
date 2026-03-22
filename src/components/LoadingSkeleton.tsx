export default function LoadingSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3 border-b border-border"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          {/* Pool name skeleton */}
          <div className="flex items-center gap-2 w-[200px]">
            <div className="w-5 h-5 rounded-full bg-muted animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--bg-input)) 50%, hsl(var(--muted)) 100%)', backgroundSize: '200% 100%' }} />
            <div className="w-5 h-5 rounded-full bg-muted animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--bg-input)) 50%, hsl(var(--muted)) 100%)', backgroundSize: '200% 100%', animationDelay: '0.1s' }} />
            <div className="h-3.5 w-24 rounded bg-muted animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--bg-input)) 50%, hsl(var(--muted)) 100%)', backgroundSize: '200% 100%', animationDelay: '0.2s' }} />
          </div>
          {/* Data columns skeleton */}
          {Array.from({ length: 6 }).map((_, j) => (
            <div
              key={j}
              className="h-3.5 w-16 rounded bg-muted animate-shimmer flex-1"
              style={{
                backgroundImage: 'linear-gradient(90deg, hsl(var(--muted)) 0%, hsl(var(--bg-input)) 50%, hsl(var(--muted)) 100%)',
                backgroundSize: '200% 100%',
                animationDelay: `${(j + 3) * 0.1}s`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
