import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-timestamp, x-signature',
};

// Sanitize text to prevent XSS in notifications
const sanitizeTitle = (title: string): string => {
  if (!title) return '';
  return title
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, 100) // Truncate to max 100 chars
    .trim();
};

// HMAC signature verification for stronger authentication
const verifySignature = async (
  secret: string,
  timestamp: string,
  signature: string
): Promise<boolean> => {
  try {
    // Check timestamp is within 5 minutes
    const timestampMs = parseInt(timestamp, 10);
    const now = Date.now();
    if (Math.abs(now - timestampMs) > 5 * 60 * 1000) {
      console.error('Request timestamp too old or in future');
      return false;
    }

    // Verify HMAC signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
    
    const message = `${timestamp}`;
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(message)
    );
    
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const expectedSecret = Deno.env.get('AUCTION_CRON_SECRET');
    if (!expectedSecret) {
      console.error('AUCTION_CRON_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for HMAC signature first (more secure)
    const timestamp = req.headers.get('X-Timestamp');
    const signature = req.headers.get('X-Signature');
    
    // Check for Bearer token (legacy/fallback)
    const authHeader = req.headers.get('Authorization');
    
    let authenticated = false;
    
    // Try HMAC authentication first
    if (timestamp && signature) {
      authenticated = await verifySignature(expectedSecret, timestamp, signature);
      if (!authenticated) {
        console.error('HMAC signature verification failed');
      }
    }
    
    // Fall back to Bearer token if HMAC not provided or failed
    if (!authenticated && authHeader) {
      authenticated = authHeader === `Bearer ${expectedSecret}`;
      if (!authenticated) {
        console.error('Bearer token verification failed');
      }
    }
    
    if (!authenticated) {
      console.error('Unauthorized access attempt to process-expired-auctions');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid or missing authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting expired auctions processing...');

    // Find all expired auctions that are still active
    const { data: expiredAuctions, error: fetchError } = await supabase
      .from('listings')
      .select('id, title, slug, seller_id, starting_bid, current_highest_bid, quantity')
      .eq('price_type', 'auction')
      .eq('status', 'active')
      .lt('auction_end_time', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching expired auctions:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredAuctions?.length || 0} expired auctions`);

    if (!expiredAuctions || expiredAuctions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No expired auctions found', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    let processedCount = 0;

    for (const auction of expiredAuctions) {
      // Sanitize title to prevent XSS in notification messages
      const safeTitle = sanitizeTitle(auction.title);
      
      console.log(`Processing auction: ${safeTitle} (${auction.id})`);

      // Get the highest bid for this auction
      const { data: highestBid, error: bidError } = await supabase
        .from('bids')
        .select('bidder_id, amount')
        .eq('listing_id', auction.id)
        .order('amount', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (bidError) {
        console.error(`Error fetching highest bid for auction ${auction.id}:`, bidError);
        continue;
      }

      if (highestBid && highestBid.amount >= (auction.starting_bid || 0)) {
        // There's a winner!
        console.log(`Winner found for auction ${auction.id}: bidder ${highestBid.bidder_id} with bid $${highestBid.amount}`);

        // Update listing status to sold
        const { error: updateError } = await supabase
          .from('listings')
          .update({ status: 'sold' })
          .eq('id', auction.id);

        if (updateError) {
          console.error(`Error updating listing ${auction.id}:`, updateError);
          continue;
        }

        // Create order for the winner
        const { error: orderError } = await supabase
          .from('orders')
          .insert({
            buyer_id: highestBid.bidder_id,
            seller_id: auction.seller_id,
            listing_id: auction.id,
            quantity: auction.quantity,
            total_price: highestBid.amount,
            status: 'pending_payment',
          });

        if (orderError) {
          console.error(`Error creating order for auction ${auction.id}:`, orderError);
          continue;
        }

        // Notify the winner with sanitized title
        const { error: winnerNotifError } = await supabase
          .from('notifications')
          .insert({
            user_id: highestBid.bidder_id,
            title: 'Auction Won! 🎉',
            message: `Congratulations! You won the auction for "${safeTitle}" with a bid of $${highestBid.amount}. Please proceed to payment.`,
            type: 'bid',
            link: `/listings/${auction.slug}`,
          });

        if (winnerNotifError) {
          console.error(`Error creating winner notification:`, winnerNotifError);
        }

        // Notify the seller with sanitized title
        const { error: sellerNotifError } = await supabase
          .from('notifications')
          .insert({
            user_id: auction.seller_id,
            title: 'Auction Ended Successfully',
            message: `Your auction "${safeTitle}" has ended with a winning bid of $${highestBid.amount}.`,
            type: 'listing',
            link: `/dashboard`,
          });

        if (sellerNotifError) {
          console.error(`Error creating seller notification:`, sellerNotifError);
        }

        processedCount++;
      } else {
        // No bids or bids below starting price
        console.log(`No winner for auction ${auction.id}, archiving...`);

        // Update listing status to archived
        const { error: archiveError } = await supabase
          .from('listings')
          .update({ status: 'archived' })
          .eq('id', auction.id);

        if (archiveError) {
          console.error(`Error archiving listing ${auction.id}:`, archiveError);
          continue;
        }

        // Notify the seller with sanitized title
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: auction.seller_id,
            title: 'Auction Ended',
            message: `Your auction "${safeTitle}" has ended with no qualifying bids.`,
            type: 'listing',
            link: `/dashboard`,
          });

        if (notifError) {
          console.error(`Error creating seller notification:`, notifError);
        }

        processedCount++;
      }
    }

    console.log(`Processed ${processedCount} expired auctions successfully`);

    return new Response(
      JSON.stringify({
        message: 'Expired auctions processed successfully',
        processed: processedCount,
        total: expiredAuctions.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error in process-expired-auctions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
