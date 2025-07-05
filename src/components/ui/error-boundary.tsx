'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-md">
            {/* Animated error icon */}
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 bg-red-100 dark:bg-red-900/30 rounded-full animate-ping" />
              <div className="relative flex items-center justify-center w-24 h-24 bg-red-500/10 rounded-full">
                <AlertTriangle className="w-12 h-12 text-red-500 animate-bounce" />
              </div>
            </div>

            {/* Error message */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold gradient-text">
                Oops! Something went wrong
              </h2>
              <p className="text-muted-foreground">
                We encountered an unexpected error. Don&apos;t worry, it&apos;s not your fault!
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-4 bg-muted rounded-lg text-left">
                  <summary className="cursor-pointer font-medium">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto">
                    {this.state.error.message}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => window.location.reload()}
                className="hover-lift neon-glow"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="hover-lift neon-border"
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </div>

            {/* Funky background elements */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-red-400/10 rounded-full blur-2xl animate-float" />
              <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-orange-400/10 rounded-full blur-xl animate-float stagger-2" />
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional error fallback component for specific use cases
export function ErrorFallback({ 
  error, 
  resetError, 
  title = "Something went wrong",
  description = "An error occurred while loading this content."
}: {
  error?: Error;
  resetError?: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-center p-8 min-h-[200px]">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold gradient-text">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {resetError && (
          <Button
            onClick={resetError}
            size="sm"
            className="hover-lift neon-glow"
          >
            <RefreshCw className="w-3 h-3 mr-2" />
            Try Again
          </Button>
        )}

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4 p-3 bg-muted rounded text-left">
            <summary className="cursor-pointer text-xs font-medium">
              Error Details
            </summary>
            <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
