-- Add verified business flag to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified_business boolean DEFAULT false;