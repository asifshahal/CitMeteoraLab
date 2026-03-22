import { timeAgo } from '@/lib/formatters';

interface RefreshTimerProps {
  lastUpdated: number | null;
  isFresh: boolean;
}

export default function RefreshTimer({ lastUpdated, isFresh }: RefreshTimerProps) {
  if (!lastUpdated) return null;

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={`w-1.5 h-1.5 rounded-full ${isFresh ? 'bg-primary' : 'bg-muted-foreground'}`} />
      <span className={isFresh ? 'text-primary' : 'text-muted-foreground'}>
        Updated {timeAgo(lastUpdated)}
      </span>
    </div>
  );
}
