-- Drop the policy that allows sellers to view bidder identities
DROP POLICY IF EXISTS "Sellers can view bids on their listings" ON public.bids;

-- Create a new policy that allows sellers to view only aggregate bid data (amount, created_at)
-- by using a secure function that returns data without bidder_id exposure
-- Actually, for proper security, sellers should use the bids_for_sellers view instead
-- We'll create a restrictive policy that only allows aggregate queries

-- Create a policy that allows sellers to view bid amounts on their listings
-- but does NOT expose bidder_id (this requires RLS to not allow selecting bidder_id)
-- Since RLS can't restrict columns, we need to remove direct table access for sellers

-- Instead, create a function that returns anonymized bid data for sellers
CREATE OR REPLACE FUNCTION public.get_listing_bids_for_seller(p_listing_id uuid)
RETURNS TABLE(
  id uuid,
  listing_id uuid,
  amount numeric,
  created_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, b.listing_id, b.amount, b.created_at
  FROM bids b
  INNER JOIN listings l ON l.id = b.listing_id
  WHERE b.listing_id = p_listing_id
    AND l.seller_id = auth.uid()
  ORDER BY b.amount DESC;
$$;