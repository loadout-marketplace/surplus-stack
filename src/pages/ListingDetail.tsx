import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Package, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { BidDialog } from "@/components/BidDialog";
import { SellerRating } from "@/components/SellerRating";

interface ListingDetail {
  id: string;
  title: string;
  description: string;
  fixed_price: number;
  price_type: string;
  starting_bid: number | null;
  current_highest_bid: number | null;
  auction_end_time: string | null;
  condition: string;
  quantity: number;
  unit: string;
  min_quantity_increment: number | null;
  location_city: string;
  location_state: string;
  location_zip: string;
  pickup_only: boolean;
  shipping_available: boolean;
  seller_id: string;
  status: string;
  created_at: string;
  listing_images: { url: string }[];
  categories: { name: string } | null;
  profiles: { name: string; company_name: string } | null;
}

const ListingDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidsCount, setBidsCount] = useState(0);
  const [highestBid, setHighestBid] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [extending, setExtending] = useState(false);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [contactingSeller, setContactingSeller] = useState(false);

  useEffect(() => {
    fetchListing();
  }, [slug]);

  useEffect(() => {
    if (listing?.price_type === 'auction' && listing.auction_end_time) {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const end = new Date(listing.auction_end_time!).getTime();
        const distance = end - now;

        if (distance < 0) {
          setTimeRemaining("Auction ended");
          clearInterval(timer);
        } else {
          const days = Math.floor(distance / (1000 * 60 * 60 * 24));
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);

          if (days > 0) {
            setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
          } else if (hours > 0) {
            setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
          } else {
            setTimeRemaining(`${minutes}m ${seconds}s`);
          }
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [listing]);

  const fetchListing = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("listings")
      .select(`
        *,
        listing_images (url),
        categories (name),
        profiles (name, company_name)
      `)
      .eq("slug", slug)
      .single();

    if (error) {
      toast.error("Failed to load listing");
      console.error(error);
    } else {
      setListing(data);
      
      // Fetch bids if it's an auction
      if (data?.price_type === 'auction') {
        const { data: bidsData, error: bidsError } = await supabase
          .from("bids")
          .select("amount")
          .eq("listing_id", data.id)
          .order("amount", { ascending: false });

        if (!bidsError && bidsData) {
          setBidsCount(bidsData.length);
          if (bidsData.length > 0) {
            setHighestBid(bidsData[0].amount);
          }
        }
      }
    }
    setLoading(false);
  };

  const handleExtendAuction = async () => {
    if (!listing) return;

    setExtending(true);
    try {
      // Extend by 24 hours
      const newEndTime = new Date(listing.auction_end_time!);
      newEndTime.setHours(newEndTime.getHours() + 24);

      const { error } = await supabase
        .from("listings")
        .update({ auction_end_time: newEndTime.toISOString() })
        .eq("id", listing.id);

      if (error) throw error;

      toast.success("Auction extended by 24 hours");
      fetchListing();
    } catch (error) {
      console.error("Error extending auction:", error);
      toast.error("Failed to extend auction");
    } finally {
      setExtending(false);
    }
  };

  const handleContactSeller = async () => {
    if (!user || !listing) return;
    
    setContactingSeller(true);
    try {
      // Check if user is blocked
      const { data: blockData } = await supabase
        .from("blocked_users")
        .select("id")
        .eq("blocker_id", listing.seller_id)
        .eq("blocked_id", user.id)
        .single();

      if (blockData) {
        toast.error("You are unable to message this seller");
        setContactingSeller(false);
        return;
      }

      // Check if thread already exists
      const { data: existingThread } = await supabase
        .from("message_threads")
        .select("id")
        .eq("listing_id", listing.id)
        .eq("buyer_id", user.id)
        .single();

      if (existingThread) {
        navigate(`/messages/${existingThread.id}`);
      } else {
        // Create new thread with pending status
        const { data: newThread, error } = await supabase
          .from("message_threads")
          .insert({
            listing_id: listing.id,
            buyer_id: user.id,
            seller_id: listing.seller_id,
            status: 'pending'
          })
          .select()
          .single();

        if (error) throw error;

        toast.success("Message request sent to seller");
        navigate(`/messages/${newThread.id}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to send message request");
    } finally {
      setContactingSeller(false);
    }
  };

  const canExtendAuction = () => {
    if (!listing || !user) return false;
    if (listing.seller_id !== user.id) return false;
    if (listing.price_type !== 'auction') return false;
    if (listing.status !== 'active') return false;
    if (!listing.auction_end_time) return false;
    
    const now = new Date().getTime();
    const end = new Date(listing.auction_end_time).getTime();
    if (now >= end) return false;

    // Allow extension if no bids or highest bid is below starting bid
    if (bidsCount === 0) return true;
    if (highestBid && listing.starting_bid && highestBid < listing.starting_bid) return true;

    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-6xl py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-96 bg-muted rounded-lg" />
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-6xl py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Listing not found</h1>
          <Link to="/listings">
            <Button>Browse Listings</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container max-w-6xl py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="rounded-lg overflow-hidden bg-muted h-96">
              {listing.listing_images?.[0]?.url ? (
                <img
                  src={listing.listing_images[0].url}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
              {listing.categories && (
                <Badge variant="outline" className="mb-4">
                  {listing.categories.name}
                </Badge>
              )}
              
              {listing.price_type === 'auction' ? (
                <div className="space-y-2 mb-4">
                  <div className="text-xl font-semibold text-muted-foreground">
                    {highestBid && highestBid >= (listing.starting_bid || 0) ? (
                      <>
                        <div className="text-sm">Current Bid</div>
                        <div className="text-3xl font-bold text-primary">
                          ${highestBid.toLocaleString()}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-sm">Starting Bid</div>
                        <div className="text-3xl font-bold text-primary">
                          ${listing.starting_bid?.toLocaleString()}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant={timeRemaining === "Auction ended" ? "destructive" : "default"}>
                      {timeRemaining || "Calculating..."}
                    </Badge>
                    <span className="text-muted-foreground">
                      {bidsCount} {bidsCount === 1 ? "bid" : "bids"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="text-sm text-muted-foreground">Listed Price</div>
                  <div className="text-2xl font-bold text-primary">
                    ${listing.fixed_price?.toLocaleString()}
                  </div>
                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Sales Tax (9.25%)</span>
                      <span>${((listing.fixed_price || 0) * 0.0925).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="font-semibold">Total</span>
                      <span className="text-xl font-bold text-primary">
                        ${((listing.fixed_price || 0) * 1.0925).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start gap-2">
                  <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Condition</div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {listing.condition.replace("_", " ")}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Quantity</div>
                    <div className="text-sm text-muted-foreground">
                      {listing.quantity} {listing.unit}
                    </div>
                    {listing.min_quantity_increment && (
                      <div className="mt-1">
                        <Badge variant="secondary" className="text-xs">
                          Partial purchases available (min {listing.min_quantity_increment} {listing.unit})
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Location</div>
                    <div className="text-sm text-muted-foreground">
                      {listing.location_city}, {listing.location_state} {listing.location_zip}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {listing.pickup_only && "Pickup only"}
                      {listing.pickup_only && listing.shipping_available && " • "}
                      {listing.shipping_available && "Shipping available"}
                    </div>
                  </div>
                </div>

                {listing.profiles && (
                  <div className="flex items-start gap-2">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Seller</div>
                      <Link
                        to={`/sellers/${listing.seller_id}`}
                        className="text-sm text-muted-foreground hover:text-primary hover:underline"
                      >
                        {listing.profiles.name}
                        {listing.profiles.company_name && ` • ${listing.profiles.company_name}`}
                      </Link>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Listed</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(listing.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {canExtendAuction() && (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={handleExtendAuction}
                  disabled={extending}
                >
                  {extending ? "Extending..." : "Extend Auction by 24 Hours"}
                </Button>
              )}
              
              {user ? (
                <>
                  <Button 
                    size="lg" 
                    className="w-full"
                    variant="outline"
                    onClick={handleContactSeller}
                    disabled={contactingSeller}
                  >
                    {contactingSeller ? 'Sending Request...' : 'Request to Message Seller'}
                  </Button>
                  {listing.price_type === 'auction' ? (
                    <Button 
                      size="lg" 
                      className="w-full"
                      onClick={() => setBidDialogOpen(true)}
                    >
                      Bid / Purchase
                    </Button>
                  ) : (
                    <Button 
                      size="lg" 
                      className="w-full"
                    >
                      Purchase
                    </Button>
                  )}
                </>
              ) : (
                <Link to="/auth">
                  <Button size="lg" className="w-full">
                    Sign In to {listing.price_type === 'auction' ? 'Bid / Purchase' : 'Purchase'}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {listing.description && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Description</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {listing.description}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Seller Rating */}
        <div className="mt-8">
          <SellerRating 
            sellerId={listing.seller_id}
            sellerName={listing.profiles?.name || "Seller"}
          />
        </div>
      </div>

      {/* Bid Dialog */}
      {listing.price_type === 'auction' && (
        <BidDialog
          open={bidDialogOpen}
          onOpenChange={setBidDialogOpen}
          listingId={listing.id}
          listingTitle={listing.title}
          currentHighestBid={highestBid}
          startingBid={listing.starting_bid}
          onBidPlaced={fetchListing}
        />
      )}
    </div>
  );
};

export default ListingDetail;
