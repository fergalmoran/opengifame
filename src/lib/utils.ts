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
  hoverFunky: "hover-funky",
  glassPanel: "glass-panel border",
  brandGradient: "brand-gradient text-white",
  brandGradientAnimated: "brand-gradient-animated text-white animate-bg-shift",
  neonGlow: "neon-glow",
  neonBorder: "neon-border",
  animateFloat: "animate-float",
  animateWiggle: "animate-wiggle",
  animatePulseGlow: "animate-pulse-glow",
  animateRainbowBorder: "animate-rainbow-border",
  brandText: "brand-text",
  brandTextAnimated: "brand-text-animated animate-bg-shift",
  cardFunky: "card-funky",
  btnFunky: "btn-funky",
} as const;

// Component-specific style combinations
export const componentStyles = {
  card: `overflow-hidden ${sharedStyles.hoverFunky} ${sharedStyles.cardFunky}`,
  button: {
    primary: `${sharedStyles.btnFunky} font-medium shadow-lg hover:shadow-xl ${sharedStyles.hoverFunky} text-white`,
    secondary: `${sharedStyles.brandGradientAnimated} font-medium shadow-lg hover:shadow-xl ${sharedStyles.hoverFunky}`,
    ghost: `hover:bg-accent hover:text-accent-foreground ${sharedStyles.hoverLift}`,
    funky: `${sharedStyles.brandGradientAnimated} ${sharedStyles.btnFunky} font-bold shadow-lg hover:shadow-2xl transform transition-all duration-300 hover:scale-105`,
  },
  dialog: `sm:max-w-md ${sharedStyles.glassPanel}`,
  badge: {
    funky: "bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-800 dark:text-purple-200 hover:from-purple-200 hover:to-pink-200 dark:hover:from-purple-800/40 dark:hover:to-pink-800/40 border border-purple-200/50 dark:border-purple-700/50",
    gradient: "bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white hover:from-purple-600 hover:via-pink-600 hover:to-red-600 shadow-lg hover:shadow-xl",
    neon: `${sharedStyles.brandGradientAnimated} text-white font-medium px-3 py-1 rounded-full ${sharedStyles.neonGlow} border-0`,
    rainbow: `${sharedStyles.brandGradientAnimated} text-white font-bold px-4 py-2 rounded-full ${sharedStyles.animateRainbowBorder} shadow-lg`,
  },
  voting: {
    upvote: `bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white ${sharedStyles.neonGlow} border-0 ${sharedStyles.hoverFunky}`,
    downvote: `bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white ${sharedStyles.neonGlow} border-0 ${sharedStyles.hoverFunky}`,
    upvoteOutline: `hover:bg-green-50 hover:text-green-600 hover:border-green-300 dark:hover:bg-green-900/30 ${sharedStyles.neonBorder} ${sharedStyles.hoverFunky}`,
    downvoteOutline: `hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-900/30 ${sharedStyles.neonBorder} ${sharedStyles.hoverFunky}`,
  }
} as const;
