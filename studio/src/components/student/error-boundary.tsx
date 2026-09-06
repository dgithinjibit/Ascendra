/**
 * Error Boundary and Error State Components
 * 
 * Provides consistent error UX across student pages with:
 * - Retry buttons
 * - Clear error messages
 * - Recovery paths
 * - Support contact options
 */

'use client';

import { Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// ═══════════════════════════════════════════════════════════════════════════════
// Error Types
// ═══════════════════════════════════════════════════════════════════════════════

export type ErrorType =
  | 'network'           // Backend unavailable, timeout, connection failed
  | 'authentication'    // Auth token expired, unauthorized
  | 'not-found'         // Resource doesn't exist
  | 'rate-limit'        // Too many requests
  | 'validation'        // Invalid input
  | 'server-error'      // 500, internal error
  | 'unknown';          // Catch-all

export interface ErrorDetails {
  type: ErrorType;
  message: string;
  action?: string;
  canRetry?: boolean;
  showSupport?: boolean;
  context?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Error Classification Helper
// ═══════════════════════════════════════════════════════════════════════════════

export function classifyError(error: unknown): ErrorDetails {
  // Network/Timeout errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: 'network',
      message: 'Unable to connect to the learning server',
      action: 'Check your internet connection and try again',
      canRetry: true,
      showSupport: true,
    };
  }

  // Fetch API errors
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    
    if (msg.includes('timeout') || msg.includes('aborted')) {
      return {
        type: 'network',
        message: 'Request timed out',
        action: 'The server took too long to respond. Try again in a moment.',
        canRetry: true,
      };
    }

    if (msg.includes('401') || msg.includes('unauthorized')) {
      return {
        type: 'authentication',
        message: 'Your session has expired',
        action: 'Please log in again to continue learning',
        canRetry: false,
        showSupport: false,
      };
    }

    if (msg.includes('404') || msg.includes('not found')) {
      return {
        type: 'not-found',
        message: 'Content not found',
        action: 'The requested content is unavailable',
        canRetry: false,
        showSupport: true,
      };
    }

    if (msg.includes('429') || msg.includes('rate limit')) {
      return {
        type: 'rate-limit',
        message: 'Too many requests',
        action: 'Please wait a moment before trying again',
        canRetry: true,
      };
    }

    if (msg.includes('500') || msg.includes('server error')) {
      return {
        type: 'server-error',
        message: 'Server error',
        action: 'Something went wrong on our end. Our team has been notified.',
        canRetry: true,
        showSupport: true,
      };
    }

    // Generic error with message
    return {
      type: 'unknown',
      message: error.message,
      canRetry: true,
      showSupport: true,
    };
  }

  // Default unknown error
  return {
    type: 'unknown',
    message: 'An unexpected error occurred',
    action: 'Please try again or contact support if the problem persists',
    canRetry: true,
    showSupport: true,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Error State Component
// ═══════════════════════════════════════════════════════════════════════════════

interface ErrorStateProps {
  error: ErrorDetails;
  onRetry?: () => void;
  onGoBack?: () => void;
  onGoHome?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ErrorState({
  error,
  onRetry,
  onGoBack,
  onGoHome,
  className = '',
  size = 'md',
}: ErrorStateProps) {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  const supportEmail = 'support@ascendra.ke';
  const supportSubject = `Help: ${error.type} error`;

  return (
    <Card className={`${sizeClasses[size]} ${className}`}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg">{error.message}</CardTitle>
            {error.action && (
              <CardDescription className="mt-1.5">{error.action}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardFooter className="flex flex-col gap-2">
        <div className="flex gap-2 w-full">
          {error.canRetry && onRetry && (
            <Button
              onClick={onRetry}
              className="flex-1 gap-2"
              variant="default"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}

          {onGoHome && (
            <Button
              onClick={onGoHome}
              className="gap-2"
              variant={error.canRetry ? 'outline' : 'default'}
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
          )}

          {onGoBack && !onGoHome && (
            <Button
              onClick={onGoBack}
              className="gap-2"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          )}
        </div>

        {error.showSupport && (
          <a
            href={`mailto:${supportEmail}?subject=${encodeURIComponent(supportSubject)}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 justify-center mt-1"
          >
            <Mail className="h-3.5 w-3.5" />
            Contact Support
          </a>
        )}
      </CardFooter>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Inline Error Alert (for forms, chat, etc.)
// ═══════════════════════════════════════════════════════════════════════════════

interface InlineErrorProps {
  error: ErrorDetails | string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function InlineError({ error, onRetry, onDismiss, className = '' }: InlineErrorProps) {
  const details = typeof error === 'string' 
    ? { type: 'unknown' as ErrorType, message: error, canRetry: true }
    : error;

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm ${className}`}
      role="alert"
    >
      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-amber-900">{details.message}</p>
        {details.action && (
          <p className="mt-0.5 text-amber-700">{details.action}</p>
        )}
      </div>
      <div className="flex gap-1 flex-shrink-0">
        {details.canRetry && onRetry && (
          <button
            onClick={onRetry}
            className="text-amber-600 hover:text-amber-900 font-medium"
            aria-label="Retry"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-amber-600 hover:text-amber-900"
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// React Error Boundary
// ═══════════════════════════════════════════════════════════════════════════════

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class StudentErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      const errorDetails = classifyError(this.state.error);

      return (
        <div className="flex min-h-screen items-center justify-center p-6 bg-slate-50">
          <ErrorState
            error={errorDetails}
            onRetry={this.handleReset}
            onGoHome={() => (window.location.href = '/student')}
            size="lg"
          />
        </div>
      );
    }

    return this.props.children;
  }
}
