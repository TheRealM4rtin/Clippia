-- Create checkout_attempts table
CREATE TABLE IF NOT EXISTS public.checkout_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    checkout_url TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('created', 'completed', 'cancelled', 'failed')),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX idx_checkout_attempts_user ON public.checkout_attempts(user_id);
CREATE INDEX idx_checkout_attempts_status ON public.checkout_attempts(status);

-- Add RLS policies
ALTER TABLE public.checkout_attempts ENABLE ROW LEVEL SECURITY;

-- Users can view their own checkout attempts
CREATE POLICY "Users can view their own checkout attempts"
    ON public.checkout_attempts
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only allow system to insert/update checkout attempts
CREATE POLICY "System only modification for checkout attempts"
    ON public.checkout_attempts
    FOR ALL
    USING (false)
    WITH CHECK (false);

-- Function to update checkout attempt status
CREATE OR REPLACE FUNCTION update_checkout_status(
    p_checkout_url TEXT,
    p_status TEXT,
    p_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.checkout_attempts
    SET 
        status = p_status,
        completed_at = COALESCE(p_completed_at, CASE WHEN p_status = 'completed' THEN NOW() ELSE NULL END),
        updated_at = NOW()
    WHERE checkout_url = p_checkout_url;
END;
$$; 