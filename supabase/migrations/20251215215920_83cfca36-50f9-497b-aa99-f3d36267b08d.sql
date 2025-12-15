-- Drop the overly permissive policy that allows unauthenticated access
DROP POLICY IF EXISTS "Users can view profiles of active sellers" ON public.profiles;

-- Create a new policy that requires authentication to view seller profiles
CREATE POLICY "Authenticated users can view profiles of active sellers"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM listings l
    WHERE l.seller_id = profiles.id 
    AND l.status = 'active'::listing_status
  )
);

-- Add policy for message thread participants to view each other's profiles
CREATE POLICY "Users can view profiles in their message threads"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM message_threads mt
    WHERE (mt.buyer_id = auth.uid() AND mt.seller_id = profiles.id)
       OR (mt.seller_id = auth.uid() AND mt.buyer_id = profiles.id)
  )
);