-- Fix notifications INSERT policy - only system/triggers should insert
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

CREATE POLICY "Only service role can insert notifications"
ON notifications
FOR INSERT
WITH CHECK (false); -- This prevents direct inserts from users
-- Triggers and backend functions will still work because they use SECURITY DEFINER

-- Add admin policies for content moderation
CREATE POLICY "Admins can update any review"
ON reviews
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can delete any review"
ON reviews
FOR DELETE
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can delete any listing image"
ON listing_images
FOR DELETE
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can delete message threads"
ON message_threads
FOR DELETE
USING (has_role(auth.uid(), 'admin'::user_role));

-- Allow users to delete their own threads
CREATE POLICY "Users can delete their own message threads"
ON message_threads
FOR DELETE
USING (auth.uid() IN (buyer_id, seller_id));