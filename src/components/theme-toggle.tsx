'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover-lift">
        <Sun className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="h-9 w-9 p-0 hover-lift relative overflow-hidden group neon-border"
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-orange-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded" />
      
      {/* Icon with transition */}
      <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
        {theme === 'light' ? (
          <Moon className="h-4 w-4 text-blue-600 dark:text-blue-400 transition-colors duration-300" />
        ) : (
          <Sun className="h-4 w-4 text-yellow-600 dark:text-yellow-400 transition-colors duration-300" />
        )}
      </div>
      
      {/* Rotating background */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-yellow-400/10 to-transparent opacity-0 group-hover:opacity-100 animate-spin transition-opacity duration-300 rounded" />
      
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
