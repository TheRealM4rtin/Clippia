export interface LemonSqueezyWebhookData {
    meta: {
        event_name: 'subscription_created' | 'subscription_updated' | 'subscription_payment_success' | 'subscription_payment_failed' | 'subscription_cancelled';
        custom_data?: {
            user_id: string;
        };
    };
    data: {
        id: string;
        attributes: {
            status: string;
            variant_id: string;
            custom_data?: {
                user_id: string;
            };
            current_period_start?: string;
            current_period_end?: string;
            ends_at?: string | null;
        };
    };
} 