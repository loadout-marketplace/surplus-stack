-- Drop and recreate the profiles_secure view with SECURITY INVOKER
DROP VIEW IF EXISTS public.profiles_secure;

CREATE VIEW public.profiles_secure
WITH (security_invoker = on)
AS
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

COMMENT ON VIEW public.profiles_secure IS 'Secure view of profiles that masks phone numbers unless user is authorized via can_view_phone(). Uses SECURITY INVOKER to respect RLS policies.';