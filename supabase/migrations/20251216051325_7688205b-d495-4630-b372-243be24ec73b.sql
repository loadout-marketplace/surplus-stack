-- Add bio column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.bio IS 'User bio/description for their business profile';