-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.has_active_subscription(uuid);
DROP FUNCTION IF EXISTS public.get_subscription_tier(uuid);
DROP FUNCTION IF EXISTS public.process_subscription_webhook(jsonb);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'basic', 'pro', 'enterprise')),
    status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'unpaid', 'cancelled', 'expired')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    lemon_squeezy_customer_id TEXT,
    lemon_squeezy_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Create webhook_events table for logging
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create subscription_features table
CREATE TABLE IF NOT EXISTS public.subscription_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tier TEXT NOT NULL,
    feature_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(tier, feature_key)
);

-- RLS Policies
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_features ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "System only modification for subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admin only webhook events" ON public.webhook_events;
DROP POLICY IF EXISTS "Public read for subscription features" ON public.subscription_features;

-- Recreate policies
CREATE POLICY "Users can view their own subscription"
    ON public.subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System only modification for subscriptions"
    ON public.subscriptions
    FOR ALL
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Admin only webhook events"
    ON public.webhook_events
    FOR ALL
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Public read for subscription features"
    ON public.subscription_features
    FOR SELECT
    TO PUBLIC
    USING (true);

-- Function to check if a user has an active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.subscriptions
        WHERE subscriptions.user_id = user_id
        AND status = 'active'
        AND current_period_end > NOW()
    );
END;
$$;

-- Function to get user's subscription tier
CREATE OR REPLACE FUNCTION public.get_subscription_tier(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tier TEXT;
BEGIN
    SELECT tier INTO v_tier
    FROM public.subscriptions
    WHERE subscriptions.user_id = user_id
    AND status = 'active'
    AND current_period_end > NOW();
    
    RETURN COALESCE(v_tier, 'free');
END;
$$;

-- Function to process Lemon Squeezy webhook
CREATE OR REPLACE FUNCTION public.process_subscription_webhook(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_event_id UUID;
    v_user_id UUID;
    v_subscription_id TEXT;
    v_customer_id TEXT;
    v_status TEXT;
    v_tier TEXT;
BEGIN
    -- Log webhook event
    INSERT INTO public.webhook_events (event_type, payload)
    VALUES (payload->>'type', payload)
    RETURNING id INTO v_event_id;

    -- Extract data from payload
    v_subscription_id := payload->'data'->'attributes'->>'subscription_id';
    v_customer_id := payload->'data'->'attributes'->>'customer_id';
    v_status := payload->'data'->'attributes'->>'status';
    
    -- Get user_id from custom data
    v_user_id := (payload->'data'->'meta'->'custom_data'->>'user_id')::UUID;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No user ID in webhook data';
    END IF;

    -- Determine tier based on variant_id
    v_tier := CASE (payload->'data'->'attributes'->>'variant_id')
        WHEN '1' THEN 'basic'
        WHEN '2' THEN 'pro'
        WHEN '3' THEN 'enterprise'
        ELSE 'free'
    END;

    -- Update subscription
    INSERT INTO public.subscriptions (
        user_id,
        tier,
        status,
        current_period_start,
        current_period_end,
        lemon_squeezy_customer_id,
        lemon_squeezy_subscription_id
    )
    VALUES (
        v_user_id,
        v_tier,
        CASE WHEN v_status = 'active' THEN 'active' ELSE 'expired' END,
        NOW(),
        (NOW() + INTERVAL '1 month'),
        v_customer_id,
        v_subscription_id
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
        tier = EXCLUDED.tier,
        status = EXCLUDED.status,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        updated_at = NOW();

    -- Mark webhook as processed
    UPDATE public.webhook_events
    SET processed = true,
        processed_at = NOW()
    WHERE id = v_event_id;

    RETURN jsonb_build_object(
        'success', true,
        'event_id', v_event_id,
        'user_id', v_user_id
    );
END;
$$; 