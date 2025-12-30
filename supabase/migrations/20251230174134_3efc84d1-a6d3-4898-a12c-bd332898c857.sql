-- Create a helper function to sanitize text for notifications
CREATE OR REPLACE FUNCTION public.sanitize_notification_text(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    SUBSTRING(
      TRIM(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                COALESCE(input_text, ''),
                '<[^>]*>', '', 'g'  -- Remove HTML tags
              ),
              'javascript:', '', 'gi'  -- Remove javascript: protocol
            ),
            'on\w+\s*=', '', 'gi'  -- Remove event handlers
          ),
          '[<>]', '', 'g'  -- Remove angle brackets
        )
      ),
      1, 100  -- Truncate to 100 chars
    )
$$;

-- Update notify_bid_status function to sanitize listing title
CREATE OR REPLACE FUNCTION public.notify_bid_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  listing_title TEXT;
  listing_slug TEXT;
  safe_title TEXT;
  recent_count INT;
BEGIN
  SELECT title, slug INTO listing_title, listing_slug
  FROM listings
  WHERE id = NEW.listing_id;

  IF listing_slug IS NULL THEN
    RETURN NEW;
  END IF;

  -- Sanitize the title for safe notification display
  safe_title := sanitize_notification_text(listing_title);

  -- Basic throttle: limit bid notifications per user
  SELECT COUNT(*) INTO recent_count
  FROM notifications
  WHERE user_id = NEW.bidder_id
    AND type = 'bid'
    AND created_at > NOW() - INTERVAL '5 minutes';

  IF recent_count >= 20 THEN
    RETURN NEW;
  END IF;

  -- De-dupe: avoid spamming repeated notifications for the same listing within a short window
  IF EXISTS (
    SELECT 1
    FROM notifications
    WHERE user_id = NEW.bidder_id
      AND type = 'bid'
      AND link = '/listings/' || listing_slug
      AND created_at > NOW() - INTERVAL '30 seconds'
  ) THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (
    NEW.bidder_id,
    'Bid Placed Successfully',
    'Your bid of $' || NEW.amount || ' has been placed on: ' || safe_title,
    'bid',
    '/listings/' || listing_slug
  );

  RETURN NEW;
END;
$function$;

-- Update notify_similar_listings function to sanitize listing title
CREATE OR REPLACE FUNCTION public.notify_similar_listings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  interested_user RECORD;
  throttled boolean;
  safe_title TEXT;
BEGIN
  -- Sanitize the title for safe notification display
  safe_title := sanitize_notification_text(NEW.title);

  -- Find users who have bid on or purchased items in the same category
  FOR interested_user IN (
    (
      SELECT DISTINCT buyer_id as user_id
      FROM orders
      WHERE listing_id IN (
        SELECT id FROM listings WHERE category_id = NEW.category_id
      )
      LIMIT 200
    )
    UNION
    (
      SELECT DISTINCT bidder_id as user_id
      FROM bids
      WHERE listing_id IN (
        SELECT id FROM listings WHERE category_id = NEW.category_id
      )
      LIMIT 200
    )
  )
  LOOP
    -- Don't notify the seller about their own listing
    IF interested_user.user_id != NEW.seller_id THEN
      -- Throttle: at most one "listing" notification per user per 6 hours
      SELECT EXISTS (
        SELECT 1
        FROM notifications
        WHERE user_id = interested_user.user_id
          AND type = 'listing'
          AND created_at > NOW() - INTERVAL '6 hours'
      ) INTO throttled;

      IF NOT throttled THEN
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (
          interested_user.user_id,
          'New Similar Item Posted',
          'A new item has been posted in a category you''re interested in: ' || safe_title,
          'listing',
          '/listings/' || NEW.slug
        );
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;