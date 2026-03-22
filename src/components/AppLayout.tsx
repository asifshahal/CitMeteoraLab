import { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* Main content area — offset by sidebar width */}
      <div className="ml-12 md:ml-[220px] transition-all duration-300">
        {/* Header */}
        <header className="h-[60px] border-b border-border flex items-center px-6 bg-secondary/50 backdrop-blur-sm sticky top-0 z-30">
          <div>
            <h1 className="text-foreground font-semibold text-base leading-tight">{title}</h1>
            {subtitle && <p className="text-muted-foreground text-xs">{subtitle}</p>}
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
