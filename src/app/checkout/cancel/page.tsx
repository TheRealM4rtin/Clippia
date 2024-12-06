'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckoutCancelPage() {
    const router = useRouter();

    useEffect(() => {
        // Wait a moment to show message
        const timer = setTimeout(() => {
            router.push('/');
        }, 3000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Checkout Cancelled</h1>
            <p>Your checkout was cancelled. Redirecting you back...</p>
        </div>
    );
} 