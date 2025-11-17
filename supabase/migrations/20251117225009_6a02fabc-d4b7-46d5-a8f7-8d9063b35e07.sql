-- Add auction_end_time column to listings table
ALTER TABLE public.listings 
ADD COLUMN auction_end_time TIMESTAMP WITH TIME ZONE;

-- Add index for efficient querying of expired auctions
CREATE INDEX idx_listings_auction_end 
ON public.listings(auction_end_time, status) 
WHERE price_type = 'auction';