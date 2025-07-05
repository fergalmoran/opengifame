import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Shared style utilities for consistent theming across components
 */

// Common interactive styles
export const sharedStyles = {
  hoverLift: "hover-lift transition-all duration-200",
  glassPanel: "glass-panel border",
  brandGradient: "brand-gradient text-white",
  neonGlow: "neon-glow",
  neonBorder: "neon-border",
  animateFloat: "animate-float",
  brandText: "brand-text",
} as const;

// Component-specific style combinations
export const componentStyles = {
  card: `overflow-hidden ${sharedStyles.hoverLift} ${sharedStyles.glassPanel}`,
  button: {
    primary: `${sharedStyles.brandGradient} font-medium shadow-sm hover:shadow-md ${sharedStyles.hoverLift}`,
    ghost: `hover:bg-accent hover:text-accent-foreground ${sharedStyles.hoverLift}`,
  },
  dialog: `sm:max-w-md ${sharedStyles.glassPanel}`,
  badge: {
    funky: "bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-800 dark:text-purple-200 hover:from-purple-200 hover:to-pink-200 dark:hover:from-purple-800/40 dark:hover:to-pink-800/40 border border-purple-200/50 dark:border-purple-700/50",
    gradient: "bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white hover:from-purple-600 hover:via-pink-600 hover:to-red-600 shadow-lg hover:shadow-xl"
  },
  voting: {
    upvote: `bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white ${sharedStyles.neonGlow} border-0`,
    downvote: `bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white ${sharedStyles.neonGlow} border-0`,
    upvoteOutline: `hover:bg-green-50 hover:text-green-600 hover:border-green-300 dark:hover:bg-green-900/30 ${sharedStyles.neonBorder}`,
    downvoteOutline: `hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-900/30 ${sharedStyles.neonBorder}`,
  }
} as const;
