-- Add status field to message_threads table
ALTER TABLE message_threads 
ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected'));

-- Add index for better query performance
CREATE INDEX idx_message_threads_status ON message_threads(status);

-- Update RLS policy for messages to only allow sending when thread is accepted
DROP POLICY IF EXISTS "Users can send messages in their threads" ON messages;

CREATE POLICY "Users can send messages in accepted threads"
ON messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id 
  AND EXISTS (
    SELECT 1 FROM message_threads
    WHERE message_threads.id = messages.thread_id
    AND (message_threads.buyer_id = auth.uid() OR message_threads.seller_id = auth.uid())
    AND message_threads.status = 'accepted'
  )
);