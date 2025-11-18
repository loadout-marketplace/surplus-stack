-- Update RLS policy to allow admins to update listings
DROP POLICY IF EXISTS "Sellers can update their own listings" ON listings;

CREATE POLICY "Sellers and admins can update listings"
ON listings FOR UPDATE
USING (auth.uid() = seller_id OR has_role(auth.uid(), 'admin'::user_role));