'use client';

// Generic skeleton component
export function Skeleton({ className = '' }: { className?: string }) {
    return (
        <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}></div>
    );
}

// Chat interface skeleton
export function ChatSkeleton() {
    return (
        <div className="w-full max-w-2xl h-[90vh] md:h-[700px] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Header skeleton */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="w-24 h-4" />
                        <Skeleton className="w-16 h-3" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="w-8 h-8 rounded-lg" />
                </div>
            </div>

            {/* Messages skeleton */}
            <div className="flex-1 p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
                <div className="flex justify-start">
                    <Skeleton className="w-48 h-16 rounded-2xl rounded-bl-sm" />
                </div>
                <div className="flex justify-end">
                    <Skeleton className="w-56 h-20 rounded-2xl rounded-br-sm" />
                </div>
                <div className="flex justify-start">
                    <Skeleton className="w-40 h-12 rounded-2xl rounded-bl-sm" />
                </div>
                <div className="flex justify-end">
                    <Skeleton className="w-64 h-24 rounded-2xl rounded-br-sm" />
                </div>
            </div>

            {/* Input skeleton */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                    <Skeleton className="flex-1 h-12 rounded-full" />
                    <Skeleton className="w-12 h-12 rounded-full" />
                </div>
            </div>
        </div>
    );
}

// Profile form skeleton
export function ProfileFormSkeleton() {
    return (
        <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <Skeleton className="w-48 h-6 mb-2" />
            <Skeleton className="w-full h-4 mb-6" />

            <div className="space-y-4">
                <div>
                    <Skeleton className="w-20 h-3 mb-1" />
                    <Skeleton className="w-full h-12 rounded-lg" />
                </div>
                <div>
                    <Skeleton className="w-24 h-3 mb-1" />
                    <Skeleton className="w-full h-24 rounded-lg" />
                </div>
                <Skeleton className="w-full h-12 rounded-lg mt-4" />
            </div>
        </div>
    );
}

// Matching queue skeleton
export function MatchingQueueSkeleton() {
    return (
        <div className="flex flex-col items-center justify-center space-y-8">
            <div className="relative">
                <Skeleton className="w-24 h-24 rounded-full" />
            </div>
            <div className="text-center space-y-2">
                <Skeleton className="w-48 h-8 mx-auto" />
                <Skeleton className="w-64 h-4 mx-auto" />
            </div>
            <div className="flex gap-4">
                <Skeleton className="w-28 h-12 rounded-full" />
                <Skeleton className="w-28 h-12 rounded-full" />
                <Skeleton className="w-28 h-12 rounded-full" />
            </div>
        </div>
    );
}

// Camera capture skeleton
export function CameraSkeleton() {
    return (
        <div className="flex flex-col items-center gap-6 p-6 border rounded-xl shadow-lg max-w-lg mx-auto bg-white dark:bg-gray-800">
            <Skeleton className="w-48 h-6" />
            <Skeleton className="w-full aspect-video rounded-lg" />
            <Skeleton className="w-full h-12 rounded-xl" />
        </div>
    );
}

// Generic loading spinner
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };

    return (
        <div className={`${sizes[size]} border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin`}></div>
    );
}

// Full page loading
export function PageLoader({ message = 'Loading...' }: { message?: string }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-gray-500 dark:text-gray-400">{message}</p>
        </div>
    );
}

// Button with loading state
export function LoadingButton({
    loading,
    children,
    onClick,
    disabled,
    className = '',
    ...props
}: {
    loading: boolean;
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    [key: string]: any;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`flex items-center justify-center gap-2 ${className} disabled:opacity-50 disabled:cursor-not-allowed`}
            {...props}
        >
            {loading && <LoadingSpinner size="sm" />}
            {children}
        </button>
    );
}

// Card skeleton
export function CardSkeleton() {
    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
            <Skeleton className="w-3/4 h-6" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-5/6 h-4" />
            <Skeleton className="w-2/3 h-4" />
        </div>
    );
}