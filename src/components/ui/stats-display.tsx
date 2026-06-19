'use client';

import {cn} from '@/lib/utils';
import {Minus, TrendingDown, TrendingUp} from 'lucide-react';

interface StatsDisplayProps {
  value: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showTrend?: boolean;
  animated?: boolean;
  className?: string;
}

export function StatsDisplay({
                               value,
                               label,
                               size = 'md',
                               showTrend = true,
                               className
                             }: StatsDisplayProps) {
  const getVariantClasses = () => {
    if (value > 0) {
      return 'text-primary bg-primary/10 border-primary/20';
    } else if (value < 0) {
      return 'text-destructive bg-destructive/10 border-destructive/20';
    } else {
      return 'text-muted-foreground bg-muted border-border';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1';
      case 'lg':
        return 'text-base px-4 py-2';
      case 'md':
      default:
        return 'text-sm px-3 py-1.5';
    }
  };

  const getIcon = () => {
    if (!showTrend) return null;

    if (value > 0) {
      return <TrendingUp className="w-3 h-3"/>;
    } else if (value < 0) {
      return <TrendingDown className="w-3 h-3"/>;
    } else {
      return <Minus className="w-3 h-3"/>;
    }
  };

  const formatValue = (val: number) => {
    if (val === 0) return '0';
    return val > 0 ? `+${val}` : val.toString();
  };

  const classes = cn(
    'inline-flex items-center space-x-1 rounded-full border font-medium transition-colors',
    getSizeClasses(),
    getVariantClasses(),
    className
  );

  return (
    <div className={classes}>
      {showTrend && getIcon()}
      <span className="font-semibold">
        {formatValue(value)}
      </span>
      {label && (
        <span className="opacity-75">
          {label}
        </span>
      )}
    </div>
  );
}

// Specialized components for common use cases
export function ScoreDisplay({score, ...props}: { score: number } & Omit<StatsDisplayProps, 'value'>) {
  return <StatsDisplay value={score} label="score" {...props} />;
}

export function VoteDisplay({votes, ...props}: {
  votes: number;
  type?: 'up' | 'down'
} & Omit<StatsDisplayProps, 'value'>) {
  return (
    <StatsDisplay
      value={votes}
      showTrend={false}
      {...props}
    />
  );
}

export function CommentDisplay({count, ...props}: { count: number } & Omit<StatsDisplayProps, 'value'>) {
  return <StatsDisplay value={count} label={count === 1 ? 'comment' : 'comments'} showTrend={false} {...props} />;
}
