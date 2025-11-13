-- Add UPDATE policy to message_threads table
-- This allows participants (buyer or seller) to update thread timestamps

CREATE POLICY "Participants can update threads" 
ON public.message_threads
FOR UPDATE 
USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);