-- Add bid increment validation function
CREATE OR REPLACE FUNCTION validate_bid_increment()
RETURNS TRIGGER AS $$
DECLARE
  current_highest NUMERIC;
  minimum_bid NUMERIC;
  starting_price NUMERIC;
BEGIN
  -- Get the listing's starting bid and current highest bid
  SELECT starting_bid, current_highest_bid 
  INTO starting_price, current_highest
  FROM listings 
  WHERE id = NEW.listing_id;

  -- Determine the minimum required bid
  IF current_highest IS NULL OR current_highest = 0 THEN
    -- If no bids yet, minimum is the starting bid
    minimum_bid := starting_price;
  ELSE
    -- If there are bids, minimum is 5% higher than current highest
    minimum_bid := current_highest * 1.05;
  END IF;

  -- Validate the new bid amount
  IF NEW.amount < minimum_bid THEN
    RAISE EXCEPTION 'Bid must be at least $% (5%% higher than current bid)', ROUND(minimum_bid, 2);
  END IF;

  -- Update the listing's current_highest_bid
  UPDATE listings 
  SET current_highest_bid = NEW.amount 
  WHERE id = NEW.listing_id AND NEW.amount > COALESCE(current_highest_bid, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to validate bids before insertion
DROP TRIGGER IF EXISTS validate_bid_before_insert ON bids;
CREATE TRIGGER validate_bid_before_insert
  BEFORE INSERT ON bids
  FOR EACH ROW
  EXECUTE FUNCTION validate_bid_increment();