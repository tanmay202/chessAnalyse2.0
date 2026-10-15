-- Migration: 20261011_saved_analyses.sql
-- Description: Create saved_analyses table with Row Level Security for ChessLab / ChessAnalyzer

CREATE TABLE IF NOT EXISTS public.saved_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Analysis',
    input_type TEXT NOT NULL CHECK (input_type IN ('pgn', 'fen')),
    pgn TEXT,
    fen TEXT,
    analysis_settings JSONB DEFAULT '{}'::jsonb,
    analysis_result JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_saved_analyses_user_id ON public.saved_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_analyses_created_at ON public.saved_analyses(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.saved_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own saved analyses
CREATE POLICY "Users can view own analyses"
    ON public.saved_analyses
    FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert analyses for themselves
CREATE POLICY "Users can insert own analyses"
    ON public.saved_analyses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own analyses
CREATE POLICY "Users can update own analyses"
    ON public.saved_analyses
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own analyses
CREATE POLICY "Users can delete own analyses"
    ON public.saved_analyses
    FOR DELETE
    USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_saved_analyses_updated_at ON public.saved_analyses;
CREATE TRIGGER trigger_saved_analyses_updated_at
    BEFORE UPDATE ON public.saved_analyses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
