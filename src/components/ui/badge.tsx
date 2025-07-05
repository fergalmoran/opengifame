'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'funky' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  href?: string;
  onClick?: () => void;
  animated?: boolean;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
  href,
  onClick,
  animated = false
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full font-medium transition-all duration-200';
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base'
  };

  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    funky: 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-800 dark:text-purple-200 hover:from-purple-200 hover:to-pink-200 dark:hover:from-purple-800/40 dark:hover:to-pink-800/40 border border-purple-200/50 dark:border-purple-700/50',
    gradient: 'bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white hover:from-purple-600 hover:via-pink-600 hover:to-red-600 shadow-lg hover:shadow-xl'
  };

  const animationClasses = animated ? 'hover-lift animate-float' : 'hover-lift';

  const classes = cn(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    animationClasses,
    className
  );

  const content = (
    <span className="relative z-10">
      {children}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {variant === 'funky' && (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-red-500/10 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300" />
        )}
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className={classes}>
        {variant === 'funky' && (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-red-500/10 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300" />
        )}
        {content}
      </button>
    );
  }

  return (
    <span className={classes}>
      {variant === 'funky' && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-red-500/10 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300" />
      )}
      {content}
    </span>
  );
}
