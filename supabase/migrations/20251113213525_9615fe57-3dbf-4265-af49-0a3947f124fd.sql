-- Fix 1: Ensure has_role function has proper search_path (even though it should already be set)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Fix 2: Protect bidder identities from sellers during active auctions

-- Create a view that shows bids with anonymized bidder info for sellers
CREATE OR REPLACE VIEW public.bids_for_sellers AS
SELECT 
  b.id,
  b.listing_id,
  b.amount,
  b.created_at,
  -- Hide bidder_id from sellers, show it only to the actual bidder or admins
  CASE 
    WHEN auth.uid() = b.bidder_id OR has_role(auth.uid(), 'admin') THEN b.bidder_id
    ELSE NULL
  END as bidder_id,
  -- Indicate if this is the current user's bid without revealing bidder
  (auth.uid() = b.bidder_id) as is_my_bid
FROM public.bids b;

-- Update the bids RLS policy to be more restrictive
-- Drop the existing policy that exposes bidder_id to sellers
DROP POLICY IF EXISTS "Users can view bids on their listings or their own bids" ON public.bids;

-- Create new policy: users can only see their own bids
-- Sellers cannot see individual bids or bidder identities during active auctions
CREATE POLICY "Users can view only their own bids"
ON public.bids
FOR SELECT
USING (auth.uid() = bidder_id);

-- Sellers can view bid counts and highest bid amount via the listings table
-- (current_highest_bid field), but not individual bidders

-- Admins can see all bids
CREATE POLICY "Admins can view all bids"
ON public.bids
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Grant access to the view
GRANT SELECT ON public.bids_for_sellers TO authenticated;