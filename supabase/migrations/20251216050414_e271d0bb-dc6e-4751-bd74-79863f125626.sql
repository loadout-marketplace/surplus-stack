-- Drop the SECURITY DEFINER view to address linter warning
-- The get_profile_secure function already provides secure phone access
DROP VIEW IF EXISTS public.profiles_secure;

-- Add a comment to document the phone visibility approach
COMMENT ON FUNCTION public.get_profile_secure IS 
'Returns profile data with phone masked unless can_view_phone returns true. 
Phone is only visible to: (1) the profile owner, (2) users with completed paid orders with this user, (3) admins.
Use this function instead of directly selecting phone from profiles.';