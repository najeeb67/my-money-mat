import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'relative p-2.5 rounded-xl bg-secondary hover:bg-muted transition-all duration-300 group active:scale-90 hover:shadow-md overflow-hidden',
        className
      )}
      aria-label="Toggle theme"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-warning/20 via-primary/20 to-warning/20 blur-sm" />
      
      <div className="relative h-5 w-5">
        <Sun className={cn(
          "h-5 w-5 absolute inset-0 transition-all duration-500 text-warning",
          theme === 'dark' ? 'opacity-0 rotate-180 scale-0' : 'opacity-100 rotate-0 scale-100 group-hover:rotate-45'
        )} />
        <Moon className={cn(
          "h-5 w-5 absolute inset-0 transition-all duration-500 text-primary",
          theme === 'dark' ? 'opacity-100 rotate-0 scale-100 group-hover:-rotate-12' : 'opacity-0 -rotate-180 scale-0'
        )} />
      </div>
    </button>
  );
}
