-- Fix warn-level security issues

-- Issue 1: Fix function search_path for all functions
-- Recreate handle_updated_at with proper search_path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Issue 2: Fix bids_for_sellers view to use security_invoker
-- This addresses the bidder identity exposure by ensuring proper RLS enforcement
DROP VIEW IF EXISTS public.bids_for_sellers;

CREATE VIEW public.bids_for_sellers
WITH (security_invoker=on)
AS
SELECT 
  b.id,
  b.listing_id,
  b.amount,
  b.created_at,
  -- Hide bidder_id from sellers, show it only to the actual bidder or admins
  CASE 
    WHEN auth.uid() = b.bidder_id OR public.has_role(auth.uid(), 'admin'::user_role) THEN b.bidder_id
    ELSE NULL
  END as bidder_id,
  -- Indicate if this is the current user's bid without revealing bidder
  (auth.uid() = b.bidder_id) as is_my_bid
FROM public.bids b;

-- Ensure proper grants
GRANT SELECT ON public.bids_for_sellers TO authenticated;