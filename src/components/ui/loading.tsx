'use client';

import { cn } from '@/lib/utils';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars';
  className?: string;
  label?: string;
}

export function Loading({ 
  size = 'md', 
  variant = 'spinner',
  className,
  label 
}: LoadingProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4';
      case 'lg': return 'w-12 h-12';
      case 'md':
      default: return 'w-8 h-8';
    }
  };

  const renderSpinner = () => (
    <div className={cn(
      'border-2 border-muted border-t-primary rounded-full animate-spin',
      getSizeClasses(),
      className
    )} />
  );

  const renderDots = () => (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-primary rounded-full animate-pulse',
            size === 'sm' ? 'w-1 h-1' : size === 'lg' ? 'w-3 h-3' : 'w-2 h-2'
          )}
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div className={cn(
      'bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-full animate-pulse',
      getSizeClasses(),
      className
    )} />
  );

  const renderBars = () => (
    <div className={cn('flex items-end space-x-1', className)}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-gradient-to-t from-purple-500 to-pink-500 rounded-sm',
            size === 'sm' ? 'w-1' : size === 'lg' ? 'w-2' : 'w-1.5',
            'animate-bounce'
          )}
          style={{ 
            height: size === 'sm' ? '8px' : size === 'lg' ? '24px' : '16px',
            animationDelay: `${i * 0.1}s` 
          }}
        />
      ))}
    </div>
  );

  const renderLoader = () => {
    switch (variant) {
      case 'dots': return renderDots();
      case 'pulse': return renderPulse();
      case 'bars': return renderBars();
      case 'spinner':
      default: return renderSpinner();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      {renderLoader()}
      {label && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
}

// Pre-built loading states
export function LoadingSpinner(props: Omit<LoadingProps, 'variant'>) {
  return <Loading {...props} variant="spinner" />;
}

export function LoadingDots(props: Omit<LoadingProps, 'variant'>) {
  return <Loading {...props} variant="dots" />;
}

export function LoadingPulse(props: Omit<LoadingProps, 'variant'>) {
  return <Loading {...props} variant="pulse" />;
}

export function LoadingBars(props: Omit<LoadingProps, 'variant'>) {
  return <Loading {...props} variant="bars" />;
}

// Full page loading overlay
export function LoadingOverlay({ 
  isVisible = true, 
  label = "Loading...",
  variant = 'spinner',
  size = 'lg'
}: { 
  isVisible?: boolean; 
  label?: string;
  variant?: LoadingProps['variant'];
  size?: LoadingProps['size'];
}) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-effect p-8 rounded-lg border border-border/50 shadow-lg">
        <Loading 
          variant={variant} 
          size={size} 
          label={label}
          className="neon-glow"
        />
      </div>
    </div>
  );
}
