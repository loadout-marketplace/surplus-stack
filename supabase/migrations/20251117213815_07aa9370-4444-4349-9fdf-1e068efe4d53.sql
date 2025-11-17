-- Add policy for sellers to view bids on their listings
CREATE POLICY "Sellers can view bids on their listings"
ON bids
FOR SELECT
USING (
  listing_id IN (
    SELECT id FROM listings WHERE seller_id = auth.uid()
  )
);

-- Deny all message updates to prevent tampering
CREATE POLICY "Messages cannot be updated"
ON messages
FOR UPDATE
USING (false);

-- Deny all message deletions to preserve conversation history
CREATE POLICY "Messages cannot be deleted"
ON messages
FOR DELETE
USING (false);

-- Allow reviewers to update their own reviews within reasonable timeframe
CREATE POLICY "Reviewers can update their own reviews"
ON reviews
FOR UPDATE
USING (auth.uid() = reviewer_id)
WITH CHECK (auth.uid() = reviewer_id);

-- Allow reviewers to delete their own reviews
CREATE POLICY "Reviewers can delete their own reviews"
ON reviews
FOR DELETE
USING (auth.uid() = reviewer_id);

-- Only admins can delete orders to preserve transaction history
CREATE POLICY "Only admins can delete orders"
ON orders
FOR DELETE
USING (has_role(auth.uid(), 'admin'::user_role));