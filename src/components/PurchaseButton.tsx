'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function PurchaseButton() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const handlePurchase = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
            });
            const data = await response.json();

            if (data.error) {
                setError(data.error);
                return;
            }

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            setError('Failed to create checkout session');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div className="fixed bottom-8 right-8 z-50">
            <div className="flex flex-col items-end space-y-4">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg">
                        {error}
                    </div>
                )}
                <button
                    onClick={handlePurchase}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 
                             text-white font-bold py-4 px-8 rounded-full shadow-lg transform hover:scale-105 
                             transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <span>Upgrade to Pro</span>
                            <span className="text-sm opacity-75">✨ Special Launch Offer</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
} 