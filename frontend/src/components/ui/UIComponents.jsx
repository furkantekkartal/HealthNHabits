// Shared UI Components for Diet Tracker

// Loading Spinner Component
export function LoadingSpinner({ size = 'md', className = '' }) {
    const sizeClasses = {
        sm: 'w-5 h-5',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className={`${sizeClasses[size]} border-3 border-gray-200 border-t-primary rounded-full animate-spin`}></div>
        </div>
    );
}

// Full Page Loading
export function PageLoading({ message = 'Loading...' }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-500 font-medium">{message}</p>
        </div>
    );
}

// Empty State Component
export function EmptyState({ icon, title, description, action }) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-gray-400 text-3xl">{icon}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
            <p className="text-sm text-gray-500 mb-4 max-w-[250px]">{description}</p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-4 py-2 bg-primary text-black font-medium rounded-lg hover:bg-[#0fd60f] transition-colors"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}

// Error State Component
export function ErrorState({ message, onRetry }) {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Something went wrong</h3>
            <p className="text-sm text-gray-500 mb-4 max-w-[250px]">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-primary text-black font-medium rounded-lg hover:bg-[#0fd60f] transition-colors flex items-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">refresh</span>
                    Try Again
                </button>
            )}
        </div>
    );
}

// Toast Notification (simple version)
export function Toast({ message, type = 'success', onClose }) {
    const typeStyles = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };

    const icons = {
        success: 'check_circle',
        error: 'error',
        info: 'info'
    };

    return (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 ${typeStyles[type]} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slide-up z-50`}>
            <span className="material-symbols-outlined text-xl">{icons[type]}</span>
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 hover:opacity-70">
                <span className="material-symbols-outlined text-lg">close</span>
            </button>
        </div>
    );
}

// Skeleton Loader for cards
export function CardSkeleton() {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gray-200"></div>
                <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
            </div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
        </div>
    );
}
