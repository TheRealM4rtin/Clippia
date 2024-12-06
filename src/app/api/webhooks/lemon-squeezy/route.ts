import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { LEMON_SQUEEZY_CONFIG } from '@/config/lemon-squeezy';
import { verifyWebhookSignature } from '@/lib/lemon-squeezy';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  console.log('🔔 Webhook received');
  
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('x-signature');

    console.log('📝 Webhook headers:', Object.fromEntries(headersList.entries()));
    console.log('📦 Webhook body:', body);

    if (!signature) {
      console.error('❌ No signature in webhook request');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    const webhookSecret = LEMON_SQUEEZY_CONFIG.webhookSecret;
    if (!webhookSecret) {
      console.error('❌ No webhook secret configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const isValid = verifyWebhookSignature(
      body,
      signature,
      webhookSecret
    );

    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    console.log('🎯 Event type:', event.meta.event_name);
    console.log('📄 Event data:', JSON.stringify(event.data, null, 2));
    
    const eventName = event.meta.event_name;
    const userId = event.meta.custom_data?.user_id;

    if (!userId) {
      console.error('❌ No user_id in webhook data:', event);
      return NextResponse.json({ error: 'No user_id provided' }, { status: 400 });
    }

    console.log(`👤 Processing event for user: ${userId}`);

    switch (eventName) {
      case 'order_created': {
        console.log('💰 Processing order_created event');
        
        // First, verify current status
        const { data: currentCheckout, error: checkError } = await supabase
          .from('checkout_attempts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        console.log('Current checkout status:', { currentCheckout, checkError });

        // Update checkout attempt
        const { error: checkoutError, data: checkoutData } = await supabase
          .from('checkout_attempts')
          .update({ 
            completed: true,
            status: 'completed'
          })
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .select();

        console.log('📝 Checkout attempt update:', { 
          checkoutError, 
          checkoutData,
          userId,
          timestamp: new Date().toISOString()
        });

        if (checkoutError) {
          console.error('❌ Error updating checkout attempt:', checkoutError);
          return NextResponse.json({ error: 'Failed to update checkout attempt' }, { status: 500 });
        }

        // For subscription products
        if (event.data.attributes.subscription_id) {
          const { error: subscriptionError, data: subscriptionData } = await supabase
            .from('subscriptions')
            .insert({
              user_id: userId,
              subscription_id: event.data.attributes.subscription_id,
              status: 'active',
              plan: 'pro',
              current_period_end: new Date(event.data.attributes.subscription_ends_at),
            })
            .select();

          console.log('📝 Subscription creation:', { subscriptionError, subscriptionData });
        } else {
          // For one-time purchases
          console.log('ℹ️ One-time purchase, no subscription created');
        }
        break;
      }

      case 'subscription_created':
      case 'subscription_updated':
      case 'subscription_resumed': {
        console.log(`Processing ${eventName} event`);
        const { error: upsertError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            subscription_id: event.data.id,
            status: 'active',
            plan: 'pro',
            current_period_end: new Date(event.data.attributes.ends_at),
          });

        if (upsertError) {
          console.error(`Error upserting subscription for ${eventName}:`, upsertError);
        }
        break;
      }

      case 'subscription_cancelled':
      case 'subscription_expired': {
        console.log(`Processing ${eventName} event`);
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('subscription_id', event.data.id);

        if (updateError) {
          console.error(`Error updating subscription for ${eventName}:`, updateError);
        }
        break;
      }
    }

    console.log('✅ Webhook processed successfully');
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}