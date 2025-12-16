-- Function to check and notify seller badge achievements
CREATE OR REPLACE FUNCTION public.check_seller_badge_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seller_id_to_check uuid;
  completed_sales_count integer;
  avg_rating numeric;
  review_count integer;
  existing_notification_count integer;
BEGIN
  -- Determine which seller to check based on trigger source
  IF TG_TABLE_NAME = 'orders' THEN
    seller_id_to_check := NEW.seller_id;
  ELSIF TG_TABLE_NAME = 'reviews' THEN
    seller_id_to_check := NEW.reviewed_user_id;
  ELSE
    RETURN NEW;
  END IF;

  -- Get completed sales count
  SELECT COUNT(*) INTO completed_sales_count
  FROM orders
  WHERE seller_id = seller_id_to_check AND status = 'completed';

  -- Check for Trusted Seller badge (5 sales)
  IF completed_sales_count = 5 THEN
    -- Check if notification already sent
    SELECT COUNT(*) INTO existing_notification_count
    FROM notifications
    WHERE user_id = seller_id_to_check AND type = 'badge_trusted_seller';
    
    IF existing_notification_count = 0 THEN
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (
        seller_id_to_check,
        '🎉 Congratulations! Trusted Seller Badge Earned!',
        'You''ve completed 5 sales and earned the Trusted Seller badge! This badge shows buyers that you''re a reliable seller on Loadout.',
        'badge_trusted_seller',
        '/seller/' || seller_id_to_check
      );
    END IF;
  END IF;

  -- Check for Power Seller badge (10 sales)
  IF completed_sales_count = 10 THEN
    SELECT COUNT(*) INTO existing_notification_count
    FROM notifications
    WHERE user_id = seller_id_to_check AND type = 'badge_power_seller';
    
    IF existing_notification_count = 0 THEN
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (
        seller_id_to_check,
        '🚀 Congratulations! Power Seller Badge Earned!',
        'You''ve completed 10 sales and earned the prestigious Power Seller badge! You''re now recognized as one of our top sellers on Loadout.',
        'badge_power_seller',
        '/seller/' || seller_id_to_check
      );
    END IF;
  END IF;

  -- Check for Top Rated badge (4.5+ rating with at least 1 review)
  IF TG_TABLE_NAME = 'reviews' THEN
    SELECT AVG(rating), COUNT(*) INTO avg_rating, review_count
    FROM reviews
    WHERE reviewed_user_id = seller_id_to_check;
    
    IF avg_rating >= 4.5 AND review_count >= 1 THEN
      SELECT COUNT(*) INTO existing_notification_count
      FROM notifications
      WHERE user_id = seller_id_to_check AND type = 'badge_top_rated';
      
      IF existing_notification_count = 0 THEN
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (
          seller_id_to_check,
          '⭐ Congratulations! Top Rated Badge Earned!',
          'Your excellent service has earned you a 4.5+ star rating! You now have the Top Rated badge, showing buyers your commitment to quality.',
          'badge_top_rated',
          '/seller/' || seller_id_to_check
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Function to notify when verified business status is granted
CREATE OR REPLACE FUNCTION public.check_verified_business_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_notification_count integer;
BEGIN
  -- Only trigger when is_verified_business changes from false/null to true
  IF NEW.is_verified_business = true AND (OLD.is_verified_business IS NULL OR OLD.is_verified_business = false) THEN
    SELECT COUNT(*) INTO existing_notification_count
    FROM notifications
    WHERE user_id = NEW.id AND type = 'badge_verified_business';
    
    IF existing_notification_count = 0 THEN
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (
        NEW.id,
        '✅ Congratulations! Verified Business Badge Earned!',
        'Your business has been verified! You now have the Verified Business badge, which helps build trust with buyers on Loadout.',
        'badge_verified_business',
        '/seller/' || NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for order completions
DROP TRIGGER IF EXISTS check_badge_on_order_complete ON orders;
CREATE TRIGGER check_badge_on_order_complete
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed')
  EXECUTE FUNCTION check_seller_badge_achievements();

-- Create trigger for new reviews
DROP TRIGGER IF EXISTS check_badge_on_review ON reviews;
CREATE TRIGGER check_badge_on_review
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION check_seller_badge_achievements();

-- Create trigger for verified business status changes
DROP TRIGGER IF EXISTS check_verified_business_on_profile_update ON profiles;
CREATE TRIGGER check_verified_business_on_profile_update
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_verified_business_badge();