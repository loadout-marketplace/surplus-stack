import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Package, User, Clock } from "lucide-react";
import { toast } from "sonner";
import zipcodes from "zipcodes";
import { useAuth } from "@/hooks/useAuth";
import { SellerBadges } from "@/components/SellerBadges";
import SEO from "@/components/SEO";

interface Listing {
  id: string; title: string; slug: string; fixed_price: number; condition: string;
  location_city: string; location_state: string; location_zip: string | null;
  quantity: number; unit: string; created_at: string; seller_id: string;
  listing_images: { url: string }[];
  categories: { name: string } | null;
  profiles: { name: string | null; company_name: string | null; is_verified_business: boolean | null } | null;
  sellerRating?: number; sellerReviewCount?: number; sellerCompletedSales?: number;
  distance?: number | null;
}

const playfair: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const montserrat: React.CSSProperties = { fontFamily: "'Montserrat', sans-serif" };

const getTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 30 ? `${days}d ago` : `${Math.floor(days / 30)}mo ago`;
};

const Listings = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [searchRadius, setSearchRadius] = useState<string>("25");
  const [customRadius, setCustomRadius] = useState<string>("");
  const [userZipCode, setUserZipCode] = useState<string>("");
  const [searchZipCode, setSearchZipCode] = useState<string>("");
  const [sellerSearch, setSellerSearch] = useState<string>("");

  useEffect(() => { fetchCategories(); fetchListings(); fetchUserZipCode(); }, [selectedCategory, user]);

  const fetchUserZipCode = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("user_zip").eq("id", user.id).single();
    if (data?.user_zip) { setUserZipCode(data.user_zip); if (!searchZipCode) setSearchZipCode(data.user_zip); }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*").order("name");
    if (!error) setCategories(data || []);
  };

  const fetchListings = async () => {
    setLoading(true);
    let query = supabase.from("listings").select(`*, listing_images (url), categories (name), profiles (name, company_name, is_verified_business)`).eq("status", "active").order("created_at", { ascending: false }).limit(50);
    if (selectedCategory && selectedCategory !== "all") query = query.eq("category_id", selectedCategory);
    const { data, error } = await query;
    if (error) { toast.error("Failed to load listings"); setLoading(false); return; }
    const listingsWithRatings = await Promise.all((data || []).map(async (listing) => {
      const { data: reviews } = await supabase.from("reviews").select("rating").eq("reviewed_user_id", listing.seller_id);
      const sellerReviewCount = reviews?.length || 0;
      const sellerRating = reviews && reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
      const { count } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("seller_id", listing.seller_id).eq("status", "completed");
      return { ...listing, sellerRating, sellerReviewCount, sellerCompletedSales: count || 0 };
    }));
    setListings(listingsWithRatings);
    setLoading(false);
  };

  const calculateDistance = (zip1: string, zip2: string): number => {
    if (!zip1 || !zip2) return Infinity;
    const l1 = zipcodes.lookup(zip1); const l2 = zipcodes.lookup(zip2);
    if (!l1 || !l2) return Infinity;
    const R = 3959;
    const lat1 = l1.latitude * Math.PI / 180; const lat2 = l2.latitude * Math.PI / 180;
    const dLat = (l2.latitude - l1.latitude) * Math.PI / 180;
    const dLon = (l2.longitude - l1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const filteredListings = listings.map((listing) => {
    const zipToUse = searchZipCode || userZipCode;
    const distance = zipToUse && listing.location_zip ? calculateDistance(zipToUse, listing.location_zip) : null;
    return { ...listing, distance };
  }).filter((listing) => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesCategory = true;
    if (selectedCategory === "other" && customCategory.trim()) {
      matchesCategory = (listing.categories?.name?.toLowerCase() || "").includes(customCategory.toLowerCase().trim());
    }
    let matchesSeller = true;
    if (sellerSearch.trim()) {
      const term = sellerSearch.toLowerCase().trim();
      matchesSeller = (listing.profiles?.name?.toLowerCase() || "").includes(term) || (listing.profiles?.company_name?.toLowerCase() || "").includes(term);
    }
    let withinRadius = true;
    if (listing.distance !== null && listing.distance !== undefined) {
      const radiusToUse = searchRadius === "custom" ? parseInt(customRadius) || 25 : parseInt(searchRadius);
      withinRadius = listing.distance <= radiusToUse;
    }
    return matchesSearch && matchesCategory && matchesSeller && withinRadius;
  });

  return (
    <>
      <SEO
        title="Browse Surplus Construction Materials | Loadout Marketplace"
        description="Find discounted lumber, tools, roofing, hardware and building supplies from verified local sellers. Save up to 80% off retail on quality construction materials near you."
        keywords="buy construction materials, discount building supplies, surplus lumber for sale, used tools near me"
        canonicalUrl="/listings"
      />
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="container max-w-7xl px-6" style={{ paddingTop: "96px", paddingBottom: "80px" }}>

          {/* Page Header */}
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.22em] text-neutral-400 mb-3" style={montserrat}>
              Surplus Materials
            </p>
            <div className="flex items-baseline justify-between">
              <h1 className="text-3xl font-bold text-neutral-900" style={playfair}>Browse Listings</h1>
              <p className="text-sm text-neutral-400" style={montserrat}>
                {filteredListings.length} listing{filteredListings.length !== 1 ? "s" : ""} found
              </p>
            </div>
            <div className="silver-rule mt-6" />
          </div>

          {/* Filters */}
          <div className="mb-8 p-6 bg-neutral-50 rounded-sm" style={{ border: "1px solid #ebebeb" }}>
            <div className="flex flex-col md:flex-row gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
                <Input type="search" placeholder="Search materials..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-11 rounded-sm border-neutral-200 text-sm" style={montserrat} />
              </div>
              <div className="relative min-w-[180px]">
                <User className="absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
                <Input type="search" placeholder="Seller or company..." value={sellerSearch} onChange={(e) => setSellerSearch(e.target.value)}
                  className="pl-9 h-11 rounded-sm border-neutral-200 text-sm" style={montserrat} />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-11 rounded-sm border-neutral-200 text-sm min-w-[180px]" style={montserrat}>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {selectedCategory === "other" && (
                <Input type="text" placeholder="Type category..." value={customCategory} onChange={(e) => setCustomCategory(e.target.value)}
                  className="h-11 rounded-sm border-neutral-200 text-sm min-w-[160px]" style={montserrat} />
              )}
              <Input type="text" placeholder="ZIP Code" value={searchZipCode} onChange={(e) => setSearchZipCode(e.target.value)}
                className="h-11 rounded-sm border-neutral-200 text-sm w-28" maxLength={5} style={montserrat} />
              <Select value={searchRadius} onValueChange={setSearchRadius}>
                <SelectTrigger className="h-11 rounded-sm border-neutral-200 text-sm min-w-[160px]" style={montserrat}>
                  <SelectValue placeholder="Search Radius" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Within 5 miles</SelectItem>
                  <SelectItem value="10">Within 10 miles</SelectItem>
                  <SelectItem value="25">Within 25 miles</SelectItem>
                  <SelectItem value="50">Within 50 miles</SelectItem>
                  <SelectItem value="100">Within 100 miles</SelectItem>
                  <SelectItem value="custom">Custom distance</SelectItem>
                </SelectContent>
              </Select>
              {searchRadius === "custom" && (
                <Input type="number" placeholder="Miles" value={customRadius} onChange={(e) => setCustomRadius(e.target.value)}
                  className="h-11 rounded-sm border-neutral-200 text-sm w-24" min="1" style={montserrat} />
              )}
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-sm overflow-hidden" style={{ border: "1px solid #e8e8e8" }}>
                  <div className="h-48 bg-neutral-100 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-neutral-100 animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-neutral-100 animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-20">
              <Package className="h-10 w-10 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-neutral-900 mb-2" style={playfair}>No listings found</h3>
              <p className="text-sm text-neutral-500 mb-6" style={montserrat}>Try adjusting your search or filters</p>
              <Link to="/create-listing">
                <button className="h-11 px-8 text-white text-xs font-bold uppercase tracking-wider rounded-sm" style={{ ...montserrat, background: "#111" }}>
                  Post a Listing
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredListings.map((listing) => (
                <Link key={listing.id} to={`/listings/${listing.slug}`}>
                  <div className="card-premium rounded-sm overflow-hidden h-full group bg-white">
                    <div className="relative h-48 bg-neutral-100 overflow-hidden">
                      {listing.listing_images?.[0]?.url ? (
                        <img src={listing.listing_images[0].url} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                          <Package className="h-10 w-10 text-neutral-300" />
                          <span className="text-xs text-neutral-400" style={montserrat}>No image</span>
                        </div>
                      )}
                      {listing.categories && (
                        <span className="absolute top-3 left-3 text-white text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm" style={{ ...montserrat, background: "#111", fontSize: "10px" }}>
                          {listing.categories.name}
                        </span>
                      )}
                      <span className="absolute top-3 right-3 text-neutral-600 text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm capitalize" style={{ ...montserrat, background: "rgba(255,255,255,0.92)", fontSize: "10px" }}>
                        {listing.condition.replace("_", " ")}
                      </span>
                    </div>
                    <div className="p-5 space-y-3">
                      <h3 className="font-bold text-base line-clamp-2 leading-snug text-neutral-900" style={playfair}>{listing.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-neutral-400" style={montserrat}>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{listing.location_city}, {listing.location_state}</span>
                        {listing.distance !== null && listing.distance !== undefined && <span className="font-medium text-neutral-600">{listing.distance.toFixed(1)} mi</span>}
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{getTimeAgo(listing.created_at)}</span>
                      </div>
                      <div
                        className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                        style={montserrat}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/sellers/${listing.seller_id}`; }}
                      >
                        <User className="h-3 w-3" />
                        <span className="hover:underline">{listing.profiles?.company_name || listing.profiles?.name || "Unknown Seller"}</span>
                      </div>
                      <p className="text-xs text-neutral-400" style={montserrat}>Qty: {listing.quantity} {listing.unit}</p>
                      <SellerBadges completedSales={listing.sellerCompletedSales || 0} averageRating={listing.sellerRating || 0} reviewCount={listing.sellerReviewCount || 0} isVerifiedBusiness={listing.profiles?.is_verified_business || false} variant="compact" />
                      <div className="flex items-baseline justify-between pt-1">
                        <span className="text-xl font-bold text-neutral-900" style={playfair}>${listing.fixed_price?.toLocaleString()}</span>
                        <span className="text-xs text-neutral-400 uppercase tracking-wider" style={montserrat}>~{Math.round((1 - listing.fixed_price / (listing.fixed_price * 2.5)) * 100)}% off retail</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default Listings;
