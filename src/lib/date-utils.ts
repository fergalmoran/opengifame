import {format, formatDistanceToNow, isToday, isYesterday} from 'date-fns';

/**
 * Utility functions for date formatting
 */

/**
 * Format date in a human-readable way
 */
export function formatHumanDate(date: Date): string {
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (isToday(date)) {
    return formatDistanceToNow(date, {addSuffix: true});
  } else if (isYesterday(date)) {
    return 'yesterday';
  } else if (diffInDays < 7) {
    return formatDistanceToNow(date, {addSuffix: true});
  } else {
    return format(date, 'MMM d, yyyy');
  }
}

/**
 * Format date string consistently for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  // Use a consistent format that works on both server and client
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC', // Force UTC to ensure consistency
  }).format(date);
}
