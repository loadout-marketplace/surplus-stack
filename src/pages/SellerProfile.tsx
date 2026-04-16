import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { MapPin, Package, Star, User, Calendar, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { SellerBadges } from "@/components/SellerBadges";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface SellerData { id: string; name: string | null; company_name: string | null; avatar_url: string | null; bio: string | null; created_at: string; is_verified_business: boolean; }
interface Review { id: string; rating: number; comment: string | null; created_at: string; profiles: { name: string } | null; }
interface Listing { id: string; title: string; slug: string; fixed_price: number; condition: string; location_city: string; location_state: string; quantity: number; unit: string; status: string; created_at: string; listing_images: { url: string }[]; categories: { name: string } | null; }

const playfair: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const montserrat: React.CSSProperties = { fontFamily: "'Montserrat', sans-serif" };

const Stars = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) => {
  const sz = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <Star key={i} className={`${sz} ${i <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-neutral-200"}`} />
      ))}
    </div>
  );
};

const SellerProfile = () => {
  const { id } = useParams();
  const [seller, setSeller] = useState<SellerData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [completedSales, setCompletedSales] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) fetchSellerData(); }, [id]);

  const fetchSellerData = async () => {
    setLoading(true);
    const { data: sellerData, error } = await supabase.from("profiles_secure").select("id, name, company_name, avatar_url, bio, created_at, is_verified_business").eq("id", id).single();
    if (error) { toast.error("Failed to load seller profile"); setLoading(false); return; }
    setSeller(sellerData);
    const { data: reviewsData } = await supabase.from("reviews").select(`id, rating, comment, created_at, profiles!reviews_reviewer_id_fkey (name)`).eq("reviewed_user_id", id).order("created_at", { ascending: false });
    if (reviewsData) { setReviews(reviewsData); if (reviewsData.length > 0) setAverageRating(reviewsData.reduce((s, r) => s + r.rating, 0) / reviewsData.length); }
    const { data: listingsData } = await supabase.from("listings").select(`id, title, slug, fixed_price, condition, location_city, location_state, quantity, unit, status, created_at, listing_images (url), categories (name)`).eq("seller_id", id).eq("status", "active").order("created_at", { ascending: false });
    if (listingsData) setListings(listingsData);
    const { count } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("seller_id", id).eq("status", "completed");
    setCompletedSales(count || 0);
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen bg-white"><Navbar /><div className="container max-w-6xl py-16"><div className="animate-pulse space-y-4"><div className="h-32 bg-neutral-100 rounded" /><div className="h-8 bg-neutral-100 rounded w-1/2" /></div></div></div>;
  if (!seller) return <div className="min-h-screen bg-white"><Navbar /><div className="container max-w-6xl py-16 text-center"><h1 className="text-2xl font-bold mb-4" style={playfair}>Seller not found</h1><Link to="/listings" className="text-sm underline" style={montserrat}>Browse Listings</Link></div></div>;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container max-w-6xl px-6" style={{ paddingTop: "96px", paddingBottom: "80px" }}>

        {/* Seller Header */}
        <div className="mb-10 p-8 rounded-sm bg-white" style={{ border: "1px solid #e8e8e8" }}>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="w-20 h-20 shrink-0" style={{ border: "2px solid #e8e8e8" }}>
              <AvatarImage src={seller.avatar_url || undefined} alt={seller.company_name || seller.name || "Seller"} />
              <AvatarFallback className="bg-neutral-100"><User className="h-9 w-9 text-neutral-400" /></AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-neutral-900 mb-1" style={playfair}>{seller.company_name || seller.name || "Seller"}</h1>
              {seller.company_name && seller.name && <p className="text-sm text-neutral-500 mb-2" style={montserrat}>{seller.name}</p>}
              {seller.bio && <p className="text-sm text-neutral-500 max-w-2xl leading-relaxed mb-4" style={montserrat}>{seller.bio}</p>}
              <div className="flex flex-wrap gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <Stars rating={averageRating} size="lg" />
                  <span className="font-semibold text-sm text-neutral-900" style={montserrat}>{averageRating.toFixed(1)}</span>
                  <span className="text-xs text-neutral-400" style={montserrat}>({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-400" style={montserrat}>
                  <ShoppingBag className="h-3.5 w-3.5" />{completedSales} completed sale{completedSales !== 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-400" style={montserrat}>
                  <Calendar className="h-3.5 w-3.5" />Member since {new Date(seller.created_at).toLocaleDateString()}
                </div>
              </div>
              <SellerBadges completedSales={completedSales} averageRating={averageRating} reviewCount={reviews.length} isVerifiedBusiness={seller.is_verified_business} />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Listings */}
          <div className="lg:col-span-2">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-900" style={playfair}>Active Listings</h2>
              <span className="text-xs text-neutral-400" style={montserrat}>{listings.length} listing{listings.length !== 1 ? "s" : ""}</span>
            </div>
            {listings.length === 0 ? (
              <div className="text-center py-16 rounded-sm" style={{ border: "1px solid #e8e8e8" }}>
                <Package className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-sm text-neutral-400" style={montserrat}>No active listings</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {listings.map((listing) => (
                  <Link key={listing.id} to={`/listings/${listing.slug}`}>
                    <div className="card-premium rounded-sm overflow-hidden group bg-white">
                      <div className="relative h-36 bg-neutral-100 overflow-hidden">
                        {listing.listing_images?.[0]?.url ? (
                          <img src={listing.listing_images[0].url} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package className="h-8 w-8 text-neutral-300" /></div>
                        )}
                        <span className="absolute top-2 right-2 text-neutral-600 text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm capitalize" style={{ ...montserrat, background: "rgba(255,255,255,0.92)", fontSize: "10px" }}>
                          {listing.condition.replace("_", " ")}
                        </span>
                      </div>
                      <div className="p-4 space-y-2">
                        <h3 className="font-bold text-sm line-clamp-2 text-neutral-900" style={playfair}>{listing.title}</h3>
                        {listing.categories && <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400" style={montserrat}>{listing.categories.name}</span>}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-neutral-400" style={montserrat}><MapPin className="h-3 w-3" />{listing.location_city}, {listing.location_state}</div>
                          <span className="text-base font-bold text-neutral-900" style={playfair}>${listing.fixed_price?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Reviews */}
          <div>
            <h2 className="text-xl font-bold text-neutral-900 mb-6" style={playfair}>Reviews</h2>
            <div className="rounded-sm overflow-hidden" style={{ border: "1px solid #e8e8e8" }}>
              {reviews.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="h-8 w-8 text-neutral-300 mx-auto mb-3" />
                  <p className="text-sm text-neutral-400" style={montserrat}>No reviews yet</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-neutral-100 flex items-center justify-center"><User className="h-3 w-3 text-neutral-400" /></div>
                          <span className="text-xs font-semibold text-neutral-700" style={montserrat}>{review.profiles?.name || "Anonymous"}</span>
                        </div>
                        <Stars rating={review.rating} />
                      </div>
                      {review.comment && <p className="text-xs text-neutral-500 leading-relaxed mb-2" style={montserrat}>{review.comment}</p>}
                      <p className="text-xs text-neutral-400" style={montserrat}>{new Date(review.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;
