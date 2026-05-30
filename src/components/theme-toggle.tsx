'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { sharedStyles } from '@/lib/utils';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className={`h-9 w-9 p-0 ${sharedStyles.hoverFunky} relative overflow-hidden group`}>
        <Sun className="h-4 w-4 group-hover:animate-spin" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className={`h-9 w-9 p-0 ${sharedStyles.hoverFunky} relative overflow-hidden group hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 hover:border-purple-500/20 border border-transparent transition-all duration-300`}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4 group-hover:animate-pulse text-purple-600 group-hover:text-purple-500 transition-colors duration-300" />
      ) : (
        <Sun className="h-4 w-4 group-hover:animate-spin text-yellow-500 group-hover:text-yellow-400 transition-colors duration-300" />
      )}
      <span className="sr-only">Toggle theme</span>
      
      {/* Sparkle effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute top-1 right-1 w-1 h-1 bg-purple-400 rounded-full animate-ping"></div>
        <div className="absolute bottom-1 left-1 w-0.5 h-0.5 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
      </div>
    </Button>
  );
}
