import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/utils/supabase/client';
import { User } from '@supabase/supabase-js';

interface Subscription {
    id: string;
    user_id: string | null;
    subscription_id: string;
    plan: 'basic' | 'pro' | 'enterprise';
    status: string;
    created_at: string | null;
    updated_at: string | null;
    current_period_end: string | null;
}

interface UpgradeButtonProps {
    user: User | null;
    isLoading: boolean;
    onClick: () => void;
}

const UpgradeButton: React.FC<UpgradeButtonProps> = ({ user, isLoading, onClick }) => {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isBeating, setIsBeating] = useState(false);
    const supabase = createClient();

    // Fetch subscription status
    useEffect(() => {
        const fetchSubscription = async () => {
            if (!user) return;

            try {
                const { data, error } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('status', 'active')
                    .single();

                if (error) {
                    console.error('Error fetching subscription:', error);
                    return;
                }

                if (data) {
                    setSubscription(data as Subscription);
                }
            } catch (error) {
                console.error('Failed to fetch subscription:', error);
            }
        };

        fetchSubscription();
    }, [user, supabase]);

    // Beating animation timer
    useEffect(() => {
        if (!user || subscription) return;

        const beatInterval = setInterval(() => {
            setIsBeating(true);
            setTimeout(() => setIsBeating(false), 1000);
        }, 10000); // 10 seconds

        return () => clearInterval(beatInterval);
    }, [user, subscription]);

    // Styles for different states
    const baseStyles = "relative px-4 py-2 font-medium transition-all duration-200 ease-in-out";

    const subscriberStyles = `
        ${baseStyles}
        bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500
        hover:from-yellow-400 hover:via-yellow-500 hover:to-yellow-600
        text-black border-2 border-yellow-600
        shadow-lg
    `;

    const nonSubscriberStyles = `
        ${baseStyles}
        bg-blue-500 hover:bg-blue-600 text-white
        transform ${isBeating ? 'scale-110' : 'scale-100'}
        ${isBeating ? 'animate-pulse' : ''}
    `;

    if (subscription) {
        return (
            <button
                className={subscriberStyles}
                disabled={true}
                type="button"
                aria-label={`Current plan: ${subscription.plan}`}
            >
                {subscription.plan.toUpperCase()} Plan ✨
            </button>
        );
    }

    return (
        <button
            onClick={onClick}
            disabled={isLoading}
            className={`${nonSubscriberStyles} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            type="button"
            aria-label="Upgrade subscription"
        >
            {isLoading ? 'Processing...' : '✨ Upgrade Now ✨'}
        </button>
    );
};

export default UpgradeButton;