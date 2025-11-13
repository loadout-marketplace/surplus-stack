-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create a more restrictive policy that only allows users to view:
-- 1. Their own profile
-- 2. Profiles of users they're transacting with (via message threads or orders)
CREATE POLICY "Users can view their own and transaction-related profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id
  OR EXISTS (
    -- Can view profiles of users in their message threads (as buyer or seller)
    SELECT 1 FROM message_threads mt
    WHERE (mt.buyer_id = auth.uid() AND (mt.seller_id = profiles.id OR mt.buyer_id = profiles.id))
       OR (mt.seller_id = auth.uid() AND (mt.buyer_id = profiles.id OR mt.seller_id = profiles.id))
  )
  OR EXISTS (
    -- Can view profiles of users in their orders (as buyer or seller)
    SELECT 1 FROM orders o
    WHERE (o.buyer_id = auth.uid() AND (o.seller_id = profiles.id OR o.buyer_id = profiles.id))
       OR (o.seller_id = auth.uid() AND (o.buyer_id = profiles.id OR o.seller_id = profiles.id))
  )
  OR EXISTS (
    -- Can view profiles of sellers whose active listings they're viewing
    SELECT 1 FROM listings l
    WHERE l.seller_id = profiles.id AND l.status = 'active'
  )
);