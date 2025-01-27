import React, { memo } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useWhiteboardManager } from '@/lib/hooks/useWhiteboardManager';
import Whiteboard from '@/components/windows/Whiteboard';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

const WhiteboardFallback = ({ error }: { error: Error }) => (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-6 max-w-sm bg-white rounded-lg shadow-xl">
            <h3 className="text-xl font-semibold text-red-600 mb-2">Error Loading Whiteboard</h3>
            <p className="text-gray-600">{error.message}</p>
            <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
                Retry
            </button>
        </div>
    </div>
);

const WhiteboardContainer = memo(() => {
    const { isLoading, error, initialized } = useWhiteboardManager();

    if (isLoading && !initialized) {
        return <LoadingScreen />;
    }

    if (error) {
        return <WhiteboardFallback error={error} />;
    }

    return (
        <ErrorBoundary FallbackComponent={WhiteboardFallback}>
            <ReactFlowProvider>
                <Whiteboard />
            </ReactFlowProvider>
        </ErrorBoundary>
    );
});

WhiteboardContainer.displayName = 'WhiteboardContainer';

export default WhiteboardContainer;