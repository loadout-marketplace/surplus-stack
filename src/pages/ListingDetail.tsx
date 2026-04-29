import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { MapPin, Package, Calendar, User, Truck, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { BidDialog } from "@/components/BidDialog";
import { SellerRating } from "@/components/SellerRating";
import SEO from "@/components/SEO";

interface ListingDetail {
  id: string; title: string; description: string; fixed_price: number; price_type: string;
  starting_bid: number | null; current_highest_bid: number | null; auction_end_time: string | null;
  condition: string; quantity: number; unit: string; min_quantity_increment: number | null;
  location_city: string; location_state: string; location_zip: string;
  pickup_only: boolean; shipping_available: boolean; seller_id: string; status: string; created_at: string;
  listing_images: { url: string }[];
  categories: { name: string } | null;
  profiles: { name: string; company_name: string } | null;
}

const playfair: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const montserrat: React.CSSProperties = { fontFamily: "'Montserrat', sans-serif" };

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
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => { fetchListing(); }, [slug]);

  useEffect(() => {
    if (listing?.price_type === 'auction' && listing.auction_end_time) {
      const timer = setInterval(() => {
        const distance = new Date(listing.auction_end_time!).getTime() - Date.now();
        if (distance < 0) { setTimeRemaining("Auction ended"); clearInterval(timer); return; }
        const d = Math.floor(distance / 86400000);
        const h = Math.floor((distance % 86400000) / 3600000);
        const m = Math.floor((distance % 3600000) / 60000);
        const s = Math.floor((distance % 60000) / 1000);
        setTimeRemaining(d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [listing]);

  const handlePurchase = async () => {
  if (!user || !listing) return;
  setPurchasing(true);
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: {
        listing_id: listing.id,
        amount: listing.fixed_price,
        seller_id: listing.seller_id,
        title: listing.title,
        success_url: `${window.location.origin}/orders?success=true`,
        cancel_url: window.location.href,
      },
      headers: { Authorization: `Bearer ${session?.access_token}` }
    });
    if (error) throw error;
    if (data?.url) {
      window.location.href = data.url;
    } else {
      throw new Error("No checkout URL returned");
    }
  } catch (error: any) {
    toast.error(error.message || "Failed to start checkout");
    setPurchasing(false);
  }
};
  const fetchListing = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("listings").select(`*, listing_images (url), categories (name), profiles (name, company_name)`).eq("slug", slug).single();
    if (error) { toast.error("Failed to load listing"); }
    else {
      setListing(data);
      if (data?.price_type === 'auction') {
        const { data: bidsData } = await supabase.rpc("get_listing_bids_for_seller", { p_listing_id: data.id });
        if (bidsData) { setBidsCount(bidsData.length); if (bidsData.length > 0) setHighestBid(bidsData[0].amount); }
      }
    }
    setLoading(false);
  };

  const handleExtendAuction = async () => {
    if (!listing) return;
    setExtending(true);
    try {
      const newEnd = new Date(listing.auction_end_time!);
      newEnd.setHours(newEnd.getHours() + 24);
      const { error } = await supabase.from("listings").update({ auction_end_time: newEnd.toISOString() }).eq("id", listing.id);
      if (error) throw error;
      toast.success("Auction extended by 24 hours"); fetchListing();
    } catch { toast.error("Failed to extend auction"); }
    finally { setExtending(false); }
  };

  const handleRelist = async () => {
  if (!listing) return;
  setRelisting(true);
  try {
    const newEnd = new Date();
    newEnd.setDate(newEnd.getDate() + 7);
    const { error } = await supabase
      .from("listings")
      .update({
        auction_end_time: newEnd.toISOString(),
        status: "active",
      })
      .eq("id", listing.id);
    if (error) throw error;
    toast.success("Listing re-listed for 7 days!");
    fetchListing();
  } catch {
    toast.error("Failed to re-list");
  } finally {
    setRelisting(false);
  }
};
  
  const handleContactSeller = async () => {
    if (!user || !listing) return;
    setContactingSeller(true);
    try {
      const { data: blockData } = await supabase.from("blocked_users").select("id").eq("blocker_id", listing.seller_id).eq("blocked_id", user.id).single();
      if (blockData) { toast.error("You are unable to message this seller"); return; }
      const { data: existing } = await supabase.from("message_threads").select("id").eq("listing_id", listing.id).eq("buyer_id", user.id).single();
      if (existing) { navigate(`/messages/${existing.id}`); return; }
      const { data: newThread, error } = await supabase.from("message_threads").insert({ listing_id: listing.id, buyer_id: user.id, seller_id: listing.seller_id, status: 'pending' }).select().single();
      if (error) throw error;
      toast.success("Message request sent to seller"); navigate(`/messages/${newThread.id}`);
    } catch { toast.error("Failed to send message request"); }
    finally { setContactingSeller(false); }
  };

  const canExtendAuction = () => {
    if (!listing || !user || listing.seller_id !== user.id || listing.price_type !== 'auction' || listing.status !== 'active' || !listing.auction_end_time) return false;
    if (Date.now() >= new Date(listing.auction_end_time).getTime()) return false;
    return bidsCount === 0 || (highestBid !== null && listing.starting_bid !== null && highestBid < listing.starting_bid);
  };

  if (loading) return (
    <div className="min-h-screen bg-white"><Navbar />
      <div className="container max-w-6xl py-16">
        <div className="animate-pulse grid md:grid-cols-2 gap-10">
          <div className="h-96 bg-neutral-100 rounded-sm" />
          <div className="space-y-4"><div className="h-8 bg-neutral-100 rounded w-3/4" /><div className="h-4 bg-neutral-100 rounded w-1/2" /><div className="h-32 bg-neutral-100 rounded" /></div>
        </div>
      </div>
    </div>
  );

  if (!listing) return (
    <div className="min-h-screen bg-white"><Navbar />
      <div className="container max-w-6xl py-16 text-center">
        <h1 className="text-2xl font-bold mb-4" style={playfair}>Listing not found</h1>
        <Link to="/listings" className="text-sm underline" style={montserrat}>Browse Listings</Link>
      </div>
    </div>
  );

  const retailEstimate = listing.fixed_price ? listing.fixed_price * 2.5 : 0;
  const pctOff = retailEstimate ? Math.round((1 - listing.fixed_price / retailEstimate) * 100) : 0;
  const tax = ((listing.fixed_price || 0) * 0.0925);
  const total = ((listing.fixed_price || 0) * 1.0925);

  return (
    <>
      <SEO
        title={`${listing.title} for Sale | ${listing.location_city}, ${listing.location_state} | Loadout`}
        description={listing.description?.slice(0, 150) || `Buy ${listing.title} — ${listing.condition.replace("_", " ")} condition, ${listing.quantity} ${listing.unit} available in ${listing.location_city}, ${listing.location_state}.`}
        canonicalUrl={`/listings/${slug}`}
        ogType="product"
      />
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="container max-w-6xl px-6" style={{ paddingTop: "96px", paddingBottom: "80px" }}>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-neutral-400 mb-8" style={montserrat}>
            <Link to="/" className="hover:text-neutral-700 transition-colors">Home</Link>
            <span>/</span>
            <Link to="/listings" className="hover:text-neutral-700 transition-colors">Listings</Link>
            {listing.categories && <><span>/</span><span>{listing.categories.name}</span></>}
          </nav>

          <div className="grid md:grid-cols-2 gap-10">
            {/* Images */}
            <div>
              <div className="rounded-sm overflow-hidden bg-neutral-100 mb-3" style={{ border: "1px solid #e8e8e8", height: "400px" }}>
                {listing.listing_images?.[activeImage]?.url ? (
                  <img src={listing.listing_images[activeImage].url} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                    <Package className="h-14 w-14 text-neutral-300" />
                    <p className="text-xs text-neutral-400" style={montserrat}>No image available</p>
                  </div>
                )}
              </div>
              {listing.listing_images?.length > 1 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {listing.listing_images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(i)} className="shrink-0 w-16 h-16 rounded-sm overflow-hidden transition-opacity" style={{ border: i === activeImage ? "2px solid #111" : "1px solid #e8e8e8", opacity: i === activeImage ? 1 : 0.6 }}>
                      <img src={img.url} alt={`${listing.title} ${i+1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-6">
              {/* Title & Category */}
              <div>
                {listing.categories && (
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2" style={montserrat}>{listing.categories.name}</p>
                )}
                <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-1" style={playfair}>{listing.title}</h1>
                <p className="text-xs text-neutral-400 uppercase tracking-wider" style={montserrat}>
                  {listing.condition.replace("_", " ")} condition · Listed {new Date(listing.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Price */}
              {listing.price_type === 'auction' ? (
                <div className="p-5 rounded-sm" style={{ background: "#fafafa", border: "1px solid #ebebeb" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1" style={montserrat}>
                    {highestBid && highestBid >= (listing.starting_bid || 0) ? "Current Bid" : "Starting Bid"}
                  </p>
                  <p className="text-3xl font-bold text-neutral-900 mb-2" style={playfair}>
                    ${(highestBid && highestBid >= (listing.starting_bid || 0) ? highestBid : listing.starting_bid)?.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-sm" style={{ ...montserrat, background: timeRemaining === "Auction ended" ? "#fef2f2" : "#f0fdf4", color: timeRemaining === "Auction ended" ? "#dc2626" : "#16a34a" }}>
                      <Clock className="h-3 w-3" />{timeRemaining || "Calculating…"}
                    </span>
                    <span className="text-xs text-neutral-400" style={montserrat}>{bidsCount} {bidsCount === 1 ? "bid" : "bids"}</span>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-sm" style={{ background: "#fafafa", border: "1px solid #ebebeb" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1" style={montserrat}>Price</p>
                  <div className="flex items-baseline gap-3 mb-3">
                    <p className="text-3xl font-bold text-neutral-900" style={playfair}>${listing.fixed_price?.toLocaleString()}</p>
                    <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider" style={montserrat}>~{pctOff}% off retail</span>
                  </div>
                  <div className="silver-rule mb-3" />
                  <div className="space-y-1 text-xs" style={montserrat}>
                    <div className="flex justify-between text-neutral-400"><span>Sales Tax (9.25%)</span><span>${tax.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-neutral-900"><span>Total</span><span>${total.toFixed(2)}</span></div>
                  </div>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Package, label: "Quantity", value: `${listing.quantity} ${listing.unit}` },
                  { icon: MapPin, label: "Location", value: `${listing.location_city}, ${listing.location_state}` },
                  { icon: Truck, label: "Delivery", value: listing.pickup_only ? "Pickup only" : listing.shipping_available ? "Shipping available" : "Pickup only" },
                  { icon: User, label: "Seller", value: listing.profiles?.company_name || listing.profiles?.name || "Seller", link: `/sellers/${listing.seller_id}` },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-sm" style={{ border: "1px solid #f0f0f0" }}>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1" style={montserrat}>
                      <item.icon className="h-3 w-3" />{item.label}
                    </div>
                    {item.link ? (
                      <Link to={item.link} className="text-sm font-semibold text-neutral-900 hover:underline" style={playfair}>{item.value}</Link>
                    ) : (
                      <p className="text-sm font-semibold text-neutral-900" style={montserrat}>{item.value}</p>
                    )}
                  </div>
                ))}
              </div>
              {listing.min_quantity_increment && (
                <p className="text-xs text-neutral-500 px-1" style={montserrat}>Partial purchases available — minimum {listing.min_quantity_increment} {listing.unit}</p>
              )}

              {/* Actions */}
              <div className="space-y-2">
                {canExtendAuction() && (
                  <button onClick={handleExtendAuction} disabled={extending} className="w-full h-11 text-neutral-700 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors hover:bg-neutral-50" style={{ ...montserrat, border: "1px solid #e0e0e0" }}>
                    {extending ? "Extending…" : "Extend Auction 24 Hours"}
                  </button>
                )}
                {user && user.id === listing.seller_id && 
 listing.price_type === 'auction' && 
 listing.status === 'active' &&
 listing.auction_end_time &&
 Date.now() >= new Date(listing.auction_end_time).getTime() &&
 (bidsCount === 0 || (highestBid !== null && listing.starting_bid !== null && highestBid < listing.starting_bid)) && (
  <button
    onClick={handleRelist}
    disabled={relisting}
    className="w-full h-11 text-neutral-700 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors hover:bg-neutral-50"
    style={{ ...montserrat, border: "1px solid #e0e0e0" }}
  >
    {relisting ? "Re-listing…" : "Re-list This Item"}
  </button>
)}
                {user && user.id !== listing.seller_id ? (
                  <>
                    <button onClick={handleContactSeller} disabled={contactingSeller} className="w-full h-11 text-neutral-700 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors hover:bg-neutral-50" style={{ ...montserrat, border: "1px solid #e0e0e0" }}>
                      {contactingSeller ? "Sending…" : "Message Seller"}
                    </button>
                    {listing.price_type === 'auction' ? (
                      <button onClick={() => setBidDialogOpen(true)} className="w-full h-11 text-white text-xs font-bold uppercase tracking-wider rounded-sm" style={{ ...montserrat, background: "#111" }}>
                        Bid / Purchase
                      </button>
                    ) : (
                      <button
  onClick={handlePurchase}
  disabled={purchasing}
  className="w-full h-11 text-white text-xs font-bold uppercase tracking-wider rounded-sm"
  style={{ ...montserrat, background: purchasing ? "#666" : "#111" }}
>
  {purchasing ? "Redirecting to Checkout…" : "Purchase"}
</button>
                    )}
                  </>
                ) : user && user.id === listing.seller_id ? (
                  <Link to="/dashboard">
                    <button className="w-full h-11 text-neutral-700 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors hover:bg-neutral-50" style={{ ...montserrat, border: "1px solid #e0e0e0" }}>
                      Manage Your Listing
                    </button>
                  </Link>
                ) : (
                  <Link to="/auth">
                    <button className="w-full h-11 text-white text-xs font-bold uppercase tracking-wider rounded-sm" style={{ ...montserrat, background: "#111" }}>
                      Sign In to {listing.price_type === 'auction' ? 'Bid / Purchase' : 'Purchase'}
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="mt-14">
              <h2 className="text-xl font-bold text-neutral-900 mb-5" style={playfair}>Description</h2>
              <div className="silver-rule mb-6" />
              <p className="whitespace-pre-wrap text-sm text-neutral-600 leading-relaxed max-w-3xl" style={montserrat}>{listing.description}</p>
            </div>
          )}

          {/* Seller Rating */}
          <div className="mt-14">
            <h2 className="text-xl font-bold text-neutral-900 mb-5" style={playfair}>About the Seller</h2>
            <div className="silver-rule mb-6" />
            <SellerRating sellerId={listing.seller_id} sellerName={listing.profiles?.name || "Seller"} />
          </div>
        </main>

        {listing.price_type === 'auction' && (
          <BidDialog open={bidDialogOpen} onOpenChange={setBidDialogOpen} listingId={listing.id} listingTitle={listing.title} currentHighestBid={highestBid} startingBid={listing.starting_bid} onBidPlaced={fetchListing} />
        )}
      </div>
    </>
  );
};

export default ListingDetail;
