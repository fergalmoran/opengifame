'use client';

import {Moon, Sun} from 'lucide-react';
import {useTheme} from '@/components/theme-provider';
import {Button} from '@/components/ui/button';
import {useSyncExternalStore} from 'react';

const emptySubscribe = () => () => {
};

export function ThemeToggle() {
  // Returns false during SSR/first render and true once on the client, so the
  // theme-dependent UI only renders after hydration without a setState-in-effect.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const {resolvedTheme, setTheme} = useTheme();

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
        <Sun className="h-4 w-4"/>
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
      className="h-9 w-9 p-0"
    >
      {resolvedTheme === 'light' ? (
        <Moon className="h-4 w-4"/>
      ) : (
        <Sun className="h-4 w-4"/>
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
