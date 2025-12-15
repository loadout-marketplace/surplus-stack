-- Fix warn-level issues: enforce server-side state validation and add throttling to system notifications

-- 1) Orders: prevent unauthorized field changes and enforce valid status transitions
CREATE OR REPLACE FUNCTION public.validate_order_update_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Allow backend/system updates that don't carry a user context
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  is_admin := public.has_role(auth.uid(), 'admin'::public.user_role);
  IF is_admin THEN
    RETURN NEW;
  END IF;

  -- Only buyer or seller may update (defense-in-depth; RLS should already enforce this)
  IF auth.uid() <> NEW.buyer_id AND auth.uid() <> NEW.seller_id THEN
    RAISE EXCEPTION 'Not authorized to update this order';
  END IF;

  -- Prevent mutation of key/financial fields after creation
  IF (OLD.buyer_id IS DISTINCT FROM NEW.buyer_id)
     OR (OLD.seller_id IS DISTINCT FROM NEW.seller_id)
     OR (OLD.listing_id IS DISTINCT FROM NEW.listing_id)
     OR (OLD.quantity IS DISTINCT FROM NEW.quantity)
     OR (OLD.total_price IS DISTINCT FROM NEW.total_price)
     OR (OLD.platform_fee IS DISTINCT FROM NEW.platform_fee)
  THEN
    RAISE EXCEPTION 'Order details cannot be modified after creation';
  END IF;

  -- Validate status transitions
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Buyer transitions
    IF auth.uid() = NEW.buyer_id THEN
      IF (OLD.status = 'ready_for_pickup'::public.order_status AND NEW.status = 'completed'::public.order_status) THEN
        NULL;
      ELSIF (OLD.status = 'pending_payment'::public.order_status AND NEW.status = 'cancelled'::public.order_status) THEN
        NULL;
      ELSE
        RAISE EXCEPTION 'Invalid order status transition';
      END IF;

    -- Seller transitions
    ELSIF auth.uid() = NEW.seller_id THEN
      IF (OLD.status = 'paid'::public.order_status AND NEW.status = 'ready_for_pickup'::public.order_status) THEN
        NULL;
      ELSIF (OLD.status = 'pending_payment'::public.order_status AND NEW.status = 'cancelled'::public.order_status) THEN
        NULL;
      ELSE
        RAISE EXCEPTION 'Invalid order status transition';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_order_update_guard ON public.orders;
CREATE TRIGGER trg_validate_order_update_guard
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.validate_order_update_guard();


-- 2) Message threads: enforce seller-only accept/reject and prevent reopening
CREATE OR REPLACE FUNCTION public.validate_message_thread_update_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Allow backend/system updates that don't carry a user context
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  is_admin := public.has_role(auth.uid(), 'admin'::public.user_role);
  IF is_admin THEN
    RETURN NEW;
  END IF;

  -- Only participants may update (defense-in-depth; RLS should already enforce this)
  IF auth.uid() <> NEW.buyer_id AND auth.uid() <> NEW.seller_id THEN
    RAISE EXCEPTION 'Not authorized to update this thread';
  END IF;

  -- Prevent changing thread participants / listing
  IF (OLD.buyer_id IS DISTINCT FROM NEW.buyer_id)
     OR (OLD.seller_id IS DISTINCT FROM NEW.seller_id)
     OR (OLD.listing_id IS DISTINCT FROM NEW.listing_id)
     OR (OLD.created_at IS DISTINCT FROM NEW.created_at)
  THEN
    RAISE EXCEPTION 'Thread participants and listing cannot be modified';
  END IF;

  -- Validate status transitions
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Only seller can accept/reject a pending request
    IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected') THEN
      IF auth.uid() <> NEW.seller_id THEN
        RAISE EXCEPTION 'Only the seller can accept or reject message requests';
      END IF;
    ELSE
      -- No other transitions allowed for non-admins (prevents reopening/reverting)
      RAISE EXCEPTION 'Invalid thread status transition';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_message_thread_update_guard ON public.message_threads;
CREATE TRIGGER trg_validate_message_thread_update_guard
BEFORE UPDATE ON public.message_threads
FOR EACH ROW
EXECUTE FUNCTION public.validate_message_thread_update_guard();


-- 3) Notification system: add throttling to reduce spam/DoS via trigger-driven inserts
CREATE OR REPLACE FUNCTION public.notify_bid_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  listing_title TEXT;
  listing_slug TEXT;
  recent_count INT;
BEGIN
  SELECT title, slug INTO listing_title, listing_slug
  FROM listings
  WHERE id = NEW.listing_id;

  IF listing_slug IS NULL THEN
    RETURN NEW;
  END IF;

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
    'Your bid of $' || NEW.amount || ' has been placed on: ' || listing_title,
    'bid',
    '/listings/' || listing_slug
  );

  RETURN NEW;
END;
$function$;


CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  recent_count INT;
BEGIN
  IF NEW.status != OLD.status THEN
    -- Basic throttle: limit order notifications per user
    SELECT COUNT(*) INTO recent_count
    FROM notifications
    WHERE user_id = NEW.buyer_id
      AND type = 'order'
      AND created_at > NOW() - INTERVAL '10 minutes';

    IF recent_count < 10 THEN
      -- De-dupe: avoid repeated identical status notifications in a short window
      IF NOT EXISTS (
        SELECT 1
        FROM notifications
        WHERE user_id = NEW.buyer_id
          AND type = 'order'
          AND message = ('Your order status has been updated to: ' || NEW.status)
          AND created_at > NOW() - INTERVAL '2 minutes'
      ) THEN
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (
          NEW.buyer_id,
          'Order Status Update',
          'Your order status has been updated to: ' || NEW.status,
          'order',
          '/dashboard'
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;


CREATE OR REPLACE FUNCTION public.notify_similar_listings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  interested_user RECORD;
  throttled boolean;
BEGIN
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
          'A new item has been posted in a category you''re interested in: ' || NEW.title,
          'listing',
          '/listings/' || NEW.slug
        );
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;
