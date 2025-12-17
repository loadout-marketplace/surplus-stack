-- Create a secure view for profiles that masks the phone field
-- This view uses the existing can_view_phone function to conditionally expose phone numbers

CREATE OR REPLACE VIEW public.profiles_secure AS
SELECT 
  id,
  name,
  company_name,
  avatar_url,
  bio,
  user_zip,
  is_contractor,
  is_verified_business,
  created_at,
  updated_at,
  -- Only expose phone if user is authorized via can_view_phone function
  CASE 
    WHEN public.can_view_phone(id) THEN phone 
    ELSE NULL 
  END AS phone
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.profiles_secure TO authenticated;
GRANT SELECT ON public.profiles_secure TO anon;

-- Add comment explaining the view
COMMENT ON VIEW public.profiles_secure IS 'Secure view of profiles that masks phone numbers unless user is authorized via can_view_phone(). Use this view for public profile access.';