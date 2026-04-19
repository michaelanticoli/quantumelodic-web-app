CREATE TABLE public.cosmic_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  birth_data JSONB NOT NULL,
  chart_data JSONB NOT NULL,
  musical_mode TEXT NOT NULL,
  unlock_status TEXT NOT NULL DEFAULT 'preview' CHECK (unlock_status IN ('preview', 'unlocked')),
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cosmic_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cosmic readings"
ON public.cosmic_readings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cosmic readings"
ON public.cosmic_readings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preview readings"
ON public.cosmic_readings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_cosmic_readings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_cosmic_readings_updated_at
BEFORE UPDATE ON public.cosmic_readings
FOR EACH ROW
EXECUTE FUNCTION public.set_cosmic_readings_updated_at();
