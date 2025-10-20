import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  resetOnPropsChange?: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Auto-retry after 5 seconds for network-related errors
    if (this.isNetworkError(error)) {
      this.resetTimeoutId = window.setTimeout(() => {
        this.handleReset();
      }, 5000);
    }

    // Report error to error tracking service (e.g., Sentry)
    this.reportError(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when props change (useful for navigation)
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.handleReset();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private isNetworkError(error: Error): boolean {
    const networkErrorPatterns = [
      /network/i,
      /fetch/i,
      /connection/i,
      /timeout/i,
      /cors/i,
      /load/i
    ];
    return networkErrorPatterns.some(pattern => pattern.test(error.message));
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // In production, send to error tracking service
    const errorReport = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      errorId: this.state.errorId
    };

    // Example: Send to error tracking service
    // Sentry.captureException(error, { extra: errorReport });
    console.log('Error Report:', errorReport);
  }

  private handleReset = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private getErrorCategory(error: Error): string {
    if (this.isNetworkError(error)) return 'Network Error';
    if (error.name === 'ChunkLoadError') return 'Loading Error';
    if (error.message.includes('wallet')) return 'Wallet Error';
    if (error.message.includes('API')) return 'API Error';
    return 'Application Error';
  }

  private getErrorSolution(error: Error): string {
    if (this.isNetworkError(error)) {
      return 'Check your internet connection and try again.';
    }
    if (error.name === 'ChunkLoadError') {
      return 'Refresh the page to load the latest version.';
    }
    if (error.message.includes('wallet')) {
      return 'Try reconnecting your wallet or switching to a different wallet.';
    }
    if (error.message.includes('API')) {
      return 'API service may be temporarily unavailable. Please try again in a moment.';
    }
    return 'Please refresh the page or contact support if the issue persists.';
  }

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails = false } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      const errorCategory = this.getErrorCategory(error);
      const errorSolution = this.getErrorSolution(error);
      const isNetworkError = this.isNetworkError(error);

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full p-6">
            <div className="text-center space-y-4">
              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="rounded-full bg-destructive/10 p-4">
                  <AlertTriangle className="h-12 w-12 text-destructive" />
                </div>
              </div>

              {/* Error Title */}
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  {errorCategory}
                </h1>
                <p className="text-lg text-muted-foreground">
                  Something went wrong while loading this page
                </p>
              </div>

              {/* Error Message */}
              <Alert className="text-left">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">{error.message}</p>
                    <p className="text-sm text-muted-foreground">
                      {errorSolution}
                    </p>
                    {isNetworkError && (
                      <p className="text-xs text-muted-foreground">
                        ⏳ Auto-retry in progress...
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={this.handleReset} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={this.handleReload} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
                <Button variant="outline" onClick={this.handleGoHome} className="gap-2">
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </div>

              {/* Error Details (Development) */}
              {showDetails && errorInfo && (
                <details className="text-left mt-6">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                    <div className="flex items-center gap-2">
                      <Bug className="h-4 w-4" />
                      Technical Details
                    </div>
                  </summary>
                  <div className="mt-3 p-4 bg-muted rounded-lg">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm mb-1">Error Stack:</h4>
                        <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-32">
                          {error.stack}
                        </pre>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-1">Component Stack:</h4>
                        <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-32">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Error ID: {this.state.errorId}
                      </div>
                    </div>
                  </div>
                </details>
              )}

              {/* Help Text */}
              <div className="text-xs text-muted-foreground">
                If this problem continues, please{' '}
                <a 
                  href="mailto:support@tradefi.com" 
                  className="underline hover:text-foreground"
                >
                  contact support
                </a>{' '}
                with error ID: {this.state.errorId}
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;