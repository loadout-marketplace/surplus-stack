-- Enforce auction extension rules server-side to prevent sellers from extending auctions with qualifying bids

CREATE OR REPLACE FUNCTION public.validate_auction_extension()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  qualifying_bid_count INT;
  highest_amount NUMERIC;
  is_admin boolean;
BEGIN
  -- Skip validation if not an auction or auction_end_time not being changed
  IF OLD.price_type != 'auction' THEN
    RETURN NEW;
  END IF;
  
  IF OLD.auction_end_time IS NOT DISTINCT FROM NEW.auction_end_time THEN
    RETURN NEW;
  END IF;

  -- Allow system/backend updates without user context
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Admins can do any modification
  is_admin := public.has_role(auth.uid(), 'admin'::public.user_role);
  IF is_admin THEN
    RETURN NEW;
  END IF;

  -- Prevent extension of ended auctions
  IF OLD.auction_end_time IS NOT NULL AND OLD.auction_end_time < NOW() THEN
    RAISE EXCEPTION 'Cannot extend auction that has already ended';
  END IF;

  -- Prevent moving end time backward
  IF NEW.auction_end_time IS NOT NULL AND OLD.auction_end_time IS NOT NULL 
     AND NEW.auction_end_time < OLD.auction_end_time THEN
    RAISE EXCEPTION 'Cannot reduce auction end time';
  END IF;

  -- Count bids at or above starting price
  SELECT COUNT(*), COALESCE(MAX(amount), 0)
  INTO qualifying_bid_count, highest_amount
  FROM bids
  WHERE listing_id = NEW.id
    AND amount >= COALESCE(OLD.starting_bid, 0);

  -- Block extension if qualifying bids exist
  IF qualifying_bid_count > 0 THEN
    RAISE EXCEPTION 'Cannot extend auction with qualifying bids';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_auction_extension ON public.listings;
CREATE TRIGGER trg_validate_auction_extension
BEFORE UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.validate_auction_extension();
