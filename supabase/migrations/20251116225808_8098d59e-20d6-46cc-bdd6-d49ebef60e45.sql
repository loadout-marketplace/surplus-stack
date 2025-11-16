-- Add user_zip column to profiles table
ALTER TABLE public.profiles
ADD COLUMN user_zip text;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.user_zip IS 'User ZIP code for location-based filtering';