'use client';

import { cn, sharedStyles, componentStyles } from '@/lib/utils';
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
    funky: componentStyles.badge.funky,
    gradient: componentStyles.badge.gradient
  };

  const animationClasses = animated ? `${sharedStyles.hoverLift} ${sharedStyles.animateFloat}` : sharedStyles.hoverLift;

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
