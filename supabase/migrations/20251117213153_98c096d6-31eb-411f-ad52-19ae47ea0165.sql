-- Fix search_path for notification functions
ALTER FUNCTION notify_order_status_change() SET search_path = public;
ALTER FUNCTION notify_bid_status() SET search_path = public;
ALTER FUNCTION notify_similar_listings() SET search_path = public;