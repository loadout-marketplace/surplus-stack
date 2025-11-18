-- Drop and recreate the bids_for_sellers view with security_invoker
-- This ensures it respects RLS policies from the underlying bids table
DROP VIEW IF EXISTS bids_for_sellers;

CREATE VIEW bids_for_sellers
WITH (security_invoker = on)
AS
SELECT 
  b.id,
  -- Only show bidder_id if it's the user's own bid
  CASE 
    WHEN b.bidder_id = auth.uid() THEN b.bidder_id
    ELSE NULL
  END as bidder_id,
  b.amount,
  b.created_at,
  b.listing_id,
  (b.bidder_id = auth.uid()) as is_my_bid
FROM bids b
WHERE 
  -- User can see their own bids
  b.bidder_id = auth.uid()
  -- OR user is the seller of the listing
  OR EXISTS (
    SELECT 1 FROM listings l 
    WHERE l.id = b.listing_id 
    AND l.seller_id = auth.uid()
  )
  -- OR user is an admin
  OR has_role(auth.uid(), 'admin'::user_role);