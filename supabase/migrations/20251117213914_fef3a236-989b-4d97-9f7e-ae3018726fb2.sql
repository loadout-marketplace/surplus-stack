-- Create a function to check if user should see phone number
CREATE OR REPLACE FUNCTION can_view_phone(profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    -- User viewing their own profile
    auth.uid() = profile_user_id
    -- Or has a completed paid order with this user
    OR EXISTS (
      SELECT 1 FROM orders o
      WHERE (
        (o.buyer_id = auth.uid() AND o.seller_id = profile_user_id)
        OR (o.seller_id = auth.uid() AND o.buyer_id = profile_user_id)
      )
      AND o.status IN ('paid', 'ready_for_pickup', 'completed')
    )
    -- Or is an admin
    OR has_role(auth.uid(), 'admin'::user_role)
  );
$$;

-- Fix site_settings to use allowlist approach
DROP POLICY IF EXISTS "Public can view non-sensitive settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can view all settings" ON site_settings;

CREATE POLICY "Public can view approved settings only"
ON site_settings
FOR SELECT
USING (
  key IN ('site_name', 'contact_email', 'terms_url', 'privacy_url')
);

CREATE POLICY "Admins can view all site settings"
ON site_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role));