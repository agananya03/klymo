'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

// Error Boundary Component
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);

        // You can log to an error reporting service here
        // logErrorToService(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center space-y-4">
                        <div className="text-6xl">⚠️</div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Something went wrong
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            We're sorry, but something unexpected happened. Please try refreshing the page.
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="text-left mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <summary className="cursor-pointer text-sm font-medium text-red-600 dark:text-red-400">
                                    Error Details (Development Only)
                                </summary>
                                <pre className="mt-2 text-xs text-red-800 dark:text-red-300 overflow-auto">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Error display component
export function ErrorMessage({
    title = 'Error',
    message,
    onRetry
}: {
    title?: string;
    message: string;
    onRetry?: () => void;
}) {
    return (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
                <span className="text-2xl">❌</span>
                <div className="flex-1">
                    <h3 className="font-bold text-red-800 dark:text-red-200">{title}</h3>
                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">{message}</p>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                        >
                            Try Again
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Rate limit error component
export function RateLimitError({
    message,
    retryAfter
}: {
    message: string;
    retryAfter?: number;
}) {
    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${seconds} seconds`;
        const minutes = Math.floor(seconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    };

    return (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-3">
                <span className="text-2xl">⏱️</span>
                <div className="flex-1">
                    <h3 className="font-bold text-yellow-800 dark:text-yellow-200">Rate Limited</h3>
                    <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">{message}</p>
                    {retryAfter && retryAfter > 0 && (
                        <p className="text-xs text-yellow-500 dark:text-yellow-400 mt-2">
                            Try again in {formatTime(retryAfter)}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// Network error component
export function NetworkError({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-start gap-3">
                <span className="text-2xl">📡</span>
                <div className="flex-1">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200">Connection Error</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        Unable to connect to the server. Please check your internet connection.
                    </p>
                    <button
                        onClick={onRetry}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        </div>
    );
}

// API Error handler utility
export class APIError extends Error {
    constructor(
        public status: number,
        public message: string,
        public code?: string
    ) {
        super(message);
        this.name = 'APIError';
    }
}

export async function handleAPIResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const error = await response.json().catch(() => ({
            message: 'An error occurred'
        }));

        throw new APIError(
            response.status,
            error.detail || error.message || 'Request failed',
            error.code
        );
    }

    return response.json();
}

// Error toast helper
export function getErrorMessage(error: unknown): string {
    if (error instanceof APIError) {
        return error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    return 'An unexpected error occurred';
}

// Retry utility
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
            }
        }
    }

    throw lastError!;
}