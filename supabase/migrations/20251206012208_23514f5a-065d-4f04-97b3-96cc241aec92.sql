-- Add column for minimum bid/purchase quantity increment
ALTER TABLE public.listings 
ADD COLUMN min_quantity_increment numeric DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.listings.min_quantity_increment IS 'Minimum quantity increment for partial bids/purchases. If NULL, full quantity only.';