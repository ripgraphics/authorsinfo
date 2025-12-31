'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

/**
 * Error Boundary component to catch and handle React component errors
 * 
 * @example
 * <ErrorBoundary componentName="AdminDashboard">
 *   <AdminDashboard />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState(prev => ({
      errorCount: prev.errorCount + 1,
    }));

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external error tracking service
    if (typeof window !== 'undefined') {
      try {
        // Example: send to Sentry, LogRocket, etc.
        const errorLog = {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          component: this.props.componentName,
        };
        console.error('ErrorBoundary log:', errorLog);
      } catch (e) {
        console.error('Failed to log error:', e);
      }
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      return (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle>Something went wrong</CardTitle>
            </div>
            <CardDescription>
              {this.props.componentName && `Error in ${this.props.componentName}: `}
              {this.state.error.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {process.env.NODE_ENV === 'development' && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer font-mono hover:underline">
                  Error details
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <div className="flex gap-2">
              <Button
                onClick={this.resetError}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </Button>
              {this.state.errorCount > 2 && (
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  size="sm"
                >
                  Reload page
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Async Error Boundary wrapper for promise-based errors
 * Works with React 18+ Suspense and async components
 */
export function AsyncErrorBoundary({
  children,
  fallback,
  onError,
  componentName,
}: Props) {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback(
    (e: Error) => {
      setError(e);
      setHasError(true);
      onError?.(e, { componentStack: '' });
    },
    [onError]
  );

  const reset = React.useCallback(() => {
    setError(null);
    setHasError(false);
  }, []);

  React.useEffect(() => {
    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      handleError(event.reason);
    };

    window.addEventListener('unhandledrejection', handlePromiseRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
    };
  }, [handleError]);

  if (hasError && error) {
    if (fallback) {
      return fallback(error, reset);
    }

    return (
      <Card className="border-destructive bg-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>Async error occurred</CardTitle>
          </div>
          <CardDescription>
            {componentName && `Error in ${componentName}: `}
            {error.message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={reset}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Dismiss
          </Button>
        </CardContent>
      </Card>
    );
  }

  return children;
}
