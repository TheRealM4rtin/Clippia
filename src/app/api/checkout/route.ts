import { createClient } from '@/lib/utils/supabase/server';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { SubscriptionService } from '@/lib/services/subscription';

export async function POST(request: Request) {
    try {
        // Get the authorization header
        const headersList = headers();
        const authorization = headersList.get('authorization');
        
        if (!authorization?.startsWith('Bearer ')) {
            console.error('No valid authorization header');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse request body
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            console.error('Missing userId');
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Create supabase admin client
        const supabase = createClient();

        // Verify the session
        const { data: { user }, error: authError } = await supabase.auth.getUser(
            authorization.replace('Bearer ', '')
        );

        if (authError || !user) {
            console.error('Auth error:', authError);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user matches
        if (user.id !== userId) {
            console.error('User ID mismatch:', { tokenUserId: user.id, requestUserId: userId });
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Create checkout attempt record
        const { error: checkoutError } = await supabase
            .from('checkout_attempts')
            .insert({
                user_id: userId,
                status: 'pending',
                completed: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        if (checkoutError) {
            console.error('Failed to create checkout attempt:', checkoutError);
            return NextResponse.json({ error: 'Failed to create checkout attempt' }, { status: 500 });
        }

        // Create checkout URL without specifying a tier
        const subscriptionService = SubscriptionService.getInstance();
        const checkoutUrl = await subscriptionService.createCheckoutUrl(
            userId,
            user.email || ''
        );

        if (!checkoutUrl) {
            console.error('Failed to create checkout URL');
            return NextResponse.json({ error: 'Failed to create checkout URL' }, { status: 500 });
        }

        return NextResponse.json({ 
            data: {
                attributes: {
                    url: checkoutUrl
                }
            }
        });
    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
}