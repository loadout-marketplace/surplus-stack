-- Function to notify buyer when order status changes
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      NEW.buyer_id,
      'Order Status Update',
      'Your order status has been updated to: ' || NEW.status,
      'order',
      '/dashboard'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for order status changes
CREATE TRIGGER on_order_status_change
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION notify_order_status_change();

-- Function to notify bidder about bid status
CREATE OR REPLACE FUNCTION notify_bid_status()
RETURNS TRIGGER AS $$
DECLARE
  listing_title TEXT;
BEGIN
  SELECT title INTO listing_title FROM listings WHERE id = NEW.listing_id;
  
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (
    NEW.bidder_id,
    'Bid Placed Successfully',
    'Your bid of $' || NEW.amount || ' has been placed on: ' || listing_title,
    'bid',
    '/listings/' || (SELECT slug FROM listings WHERE id = NEW.listing_id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new bids
CREATE TRIGGER on_new_bid
AFTER INSERT ON bids
FOR EACH ROW
EXECUTE FUNCTION notify_bid_status();

-- Function to notify users about similar listings
CREATE OR REPLACE FUNCTION notify_similar_listings()
RETURNS TRIGGER AS $$
DECLARE
  interested_user RECORD;
BEGIN
  -- Find users who have bid on or purchased items in the same category
  FOR interested_user IN (
    SELECT DISTINCT buyer_id as user_id
    FROM orders
    WHERE listing_id IN (
      SELECT id FROM listings WHERE category_id = NEW.category_id
    )
    UNION
    SELECT DISTINCT bidder_id as user_id
    FROM bids
    WHERE listing_id IN (
      SELECT id FROM listings WHERE category_id = NEW.category_id
    )
  )
  LOOP
    -- Don't notify the seller about their own listing
    IF interested_user.user_id != NEW.seller_id THEN
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (
        interested_user.user_id,
        'New Similar Item Posted',
        'A new item has been posted in a category you''re interested in: ' || NEW.title,
        'listing',
        '/listings/' || NEW.slug
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new listings
CREATE TRIGGER on_new_listing
AFTER INSERT ON listings
FOR EACH ROW
EXECUTE FUNCTION notify_similar_listings();