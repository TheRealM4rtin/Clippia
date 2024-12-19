-- Create whiteboards table
CREATE TABLE IF NOT EXISTS public.whiteboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    data TEXT NOT NULL, -- Compressed JSON string of nodes, edges, and viewport
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS whiteboards_user_id_idx ON public.whiteboards(user_id);
CREATE INDEX IF NOT EXISTS whiteboards_updated_at_idx ON public.whiteboards(updated_at);

-- Add RLS policies
ALTER TABLE public.whiteboards ENABLE ROW LEVEL SECURITY;

-- Users can view their own whiteboards
CREATE POLICY "Users can view own whiteboards" ON public.whiteboards
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own whiteboards
CREATE POLICY "Users can insert own whiteboards" ON public.whiteboards
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own whiteboards
CREATE POLICY "Users can update own whiteboards" ON public.whiteboards
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own whiteboards
CREATE POLICY "Users can delete own whiteboards" ON public.whiteboards
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add function to clean up old versions
CREATE OR REPLACE FUNCTION clean_old_whiteboard_versions()
RETURNS trigger AS $$
BEGIN
    -- Keep only the latest 5 versions per whiteboard
    DELETE FROM public.whiteboards
    WHERE id = NEW.id
    AND updated_at < (
        SELECT updated_at
        FROM public.whiteboards
        WHERE id = NEW.id
        ORDER BY updated_at DESC
        OFFSET 5
        LIMIT 1
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for cleanup
CREATE TRIGGER cleanup_whiteboard_versions
    AFTER INSERT OR UPDATE ON public.whiteboards
    FOR EACH ROW
    EXECUTE FUNCTION clean_old_whiteboard_versions(); 