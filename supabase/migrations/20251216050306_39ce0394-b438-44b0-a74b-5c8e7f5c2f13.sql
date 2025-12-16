-- Create a secure view for profiles that masks phone numbers
-- Phone is only visible when can_view_phone returns true (own profile, completed order partner, or admin)

CREATE OR REPLACE VIEW public.profiles_secure AS
SELECT 
  id,
  name,
  company_name,
  avatar_url,
  user_zip,
  is_contractor,
  is_verified_business,
  created_at,
  updated_at,
  CASE 
    WHEN public.can_view_phone(id) THEN phone 
    ELSE NULL 
  END as phone
FROM public.profiles;

-- Grant access to the secure view
GRANT SELECT ON public.profiles_secure TO authenticated;
GRANT SELECT ON public.profiles_secure TO anon;

-- Create a function to get a profile with phone properly masked
-- This provides an alternative access method that respects phone visibility rules
CREATE OR REPLACE FUNCTION public.get_profile_secure(profile_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  company_name text,
  avatar_url text,
  phone text,
  user_zip text,
  is_contractor boolean,
  is_verified_business boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.name,
    p.company_name,
    p.avatar_url,
    CASE WHEN can_view_phone(p.id) THEN p.phone ELSE NULL END,
    p.user_zip,
    p.is_contractor,
    p.is_verified_business,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.id = profile_id
    AND (
      -- Apply same visibility rules as profiles RLS
      p.id = auth.uid()
      OR EXISTS (SELECT 1 FROM listings l WHERE l.seller_id = p.id AND l.status = 'active')
      OR EXISTS (
        SELECT 1 FROM message_threads mt 
        WHERE (mt.buyer_id = auth.uid() AND mt.seller_id = p.id) 
           OR (mt.seller_id = auth.uid() AND mt.buyer_id = p.id)
      )
      OR EXISTS (
        SELECT 1 FROM orders o 
        WHERE ((o.buyer_id = auth.uid() AND o.seller_id = p.id) 
           OR (o.seller_id = auth.uid() AND o.buyer_id = p.id))
          AND o.status IN ('paid', 'ready_for_pickup', 'completed')
      )
      OR has_role(auth.uid(), 'admin')
    );
$$;