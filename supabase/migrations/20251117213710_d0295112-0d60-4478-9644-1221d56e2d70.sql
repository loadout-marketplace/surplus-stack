-- Restrict profiles table - limit phone number and business info exposure
DROP POLICY IF EXISTS "Users can view their own and transaction-related profiles" ON profiles;

CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can view profiles of active sellers"
ON profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM listings l
    WHERE l.seller_id = profiles.id 
    AND l.status = 'active'::listing_status
  )
);

CREATE POLICY "Users can view profiles in their orders"
ON profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE (
      (o.buyer_id = auth.uid() AND o.seller_id = profiles.id)
      OR (o.seller_id = auth.uid() AND o.buyer_id = profiles.id)
    )
    AND o.status IN ('paid', 'ready_for_pickup', 'completed')
  )
);

-- Restrict site_settings to hide sensitive business data
DROP POLICY IF EXISTS "Anyone can view site settings" ON site_settings;

CREATE POLICY "Public can view non-sensitive settings"
ON site_settings
FOR SELECT
USING (
  key NOT IN ('platform_fee_percentage') 
);

CREATE POLICY "Admins can view all settings"
ON site_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role));