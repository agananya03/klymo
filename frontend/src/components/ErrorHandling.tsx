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
                <div className="min-h-screen flex items-center justify-center p-4 bg-yellow-50">
                    <div className="max-w-md w-full bg-white border-[3px] border-black shadow-hard p-6 text-center space-y-4">
                        <div className="text-6xl">⚠️</div>
                        <h2 className="text-2xl font-black uppercase bg-black text-white p-2 transform -rotate-1">
                            Something went wrong
                        </h2>
                        <p className="font-bold border-[3px] border-black p-4 bg-gray-100">
                            We're sorry, but something unexpected happened. Please try refreshing the page.
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="text-left mt-4 p-4 bg-red-100 border-[3px] border-black">
                                <summary className="cursor-pointer text-sm font-black text-red-600 uppercase">
                                    Error Details (DEV)
                                </summary>
                                <pre className="mt-2 text-xs font-mono overflow-auto">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full px-6 py-3 bg-blue-600 border-[3px] border-black text-white font-black uppercase shadow-hard hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all active:bg-blue-700"
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
        <div className="p-4 bg-red-100 border-[3px] border-black shadow-hard">
            <div className="flex items-start gap-3">
                <span className="text-2xl">❌</span>
                <div className="flex-1">
                    <h3 className="font-black uppercase text-red-600">{title}</h3>
                    <p className="text-sm font-bold mt-1">{message}</p>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="mt-3 px-4 py-2 bg-white border-[3px] border-black text-sm font-black uppercase hover:bg-gray-100 transition shadow-[2px_2px_0px_#000]"
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
        <div className="p-4 bg-yellow-100 border-[3px] border-black shadow-hard">
            <div className="flex items-start gap-3">
                <span className="text-2xl">⏱️</span>
                <div className="flex-1">
                    <h3 className="font-black uppercase text-yellow-800">Rate Limited</h3>
                    <p className="text-sm font-bold mt-1">{message}</p>
                    {retryAfter && retryAfter > 0 && (
                        <p className="text-xs font-black uppercase bg-white border-2 border-black px-2 py-1 inline-block mt-2">
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
        <div className="p-4 bg-gray-100 border-[3px] border-black shadow-hard">
            <div className="flex items-start gap-3">
                <span className="text-2xl">📡</span>
                <div className="flex-1">
                    <h3 className="font-black uppercase">Connection Error</h3>
                    <p className="text-sm font-bold mt-1">
                        Unable to connect to the server. Please check your internet connection.
                    </p>
                    <button
                        onClick={onRetry}
                        className="mt-3 px-4 py-2 bg-blue-500 border-[3px] border-black text-white text-sm font-black uppercase hover:bg-blue-600 transition shadow-[2px_2px_0px_#000]"
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