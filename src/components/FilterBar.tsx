import { Search } from 'lucide-react';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  poolCount: number;
}

export default function FilterBar({ searchQuery, onSearchChange, poolCount }: FilterBarProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-4 animate-fade-in">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by token name or pool address..."
            className="w-full bg-muted border border-border rounded-md pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
          />
        </div>

        {/* Pool count */}
        <span className="text-sm text-muted-foreground font-medium">
          Active Pools <span className="text-primary font-mono-numbers">({poolCount})</span>
        </span>
      </div>
    </div>
  );
}
