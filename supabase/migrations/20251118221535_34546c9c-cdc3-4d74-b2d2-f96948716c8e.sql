-- Update RLS policy for reviews to ensure buyers can only review completed orders
DROP POLICY IF EXISTS "Users can create reviews for completed orders" ON reviews;

CREATE POLICY "Users can create reviews for completed orders"
ON reviews FOR INSERT
WITH CHECK (
  auth.uid() = reviewer_id
  AND EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = reviews.order_id
    AND orders.buyer_id = auth.uid()
    AND orders.status = 'completed'
  )
);