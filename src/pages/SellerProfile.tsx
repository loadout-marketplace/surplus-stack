import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Package, Star, User, Calendar, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { SellerBadges } from "@/components/SellerBadges";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface SellerData {
  id: string;
  name: string | null;
  company_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  is_verified_business: boolean;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { name: string } | null;
}

interface Listing {
  id: string;
  title: string;
  slug: string;
  fixed_price: number;
  condition: string;
  location_city: string;
  location_state: string;
  quantity: number;
  unit: string;
  status: string;
  created_at: string;
  listing_images: { url: string }[];
  categories: { name: string } | null;
}

const SellerProfile = () => {
  const { id } = useParams();
  const [seller, setSeller] = useState<SellerData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [completedSales, setCompletedSales] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchSellerData();
    }
  }, [id]);

  const fetchSellerData = async () => {
    setLoading(true);

    // Fetch seller profile
    const { data: sellerData, error: sellerError } = await supabase
      .from("profiles")
      .select("id, name, company_name, avatar_url, bio, created_at, is_verified_business")
      .eq("id", id)
      .single();

    if (sellerError) {
      toast.error("Failed to load seller profile");
      console.error(sellerError);
      setLoading(false);
      return;
    }

    setSeller(sellerData);

    // Fetch reviews for this seller
    const { data: reviewsData, error: reviewsError } = await supabase
      .from("reviews")
      .select(`
        id,
        rating,
        comment,
        created_at,
        profiles!reviews_reviewer_id_fkey (name)
      `)
      .eq("reviewed_user_id", id)
      .order("created_at", { ascending: false });

    if (!reviewsError && reviewsData) {
      setReviews(reviewsData);
      if (reviewsData.length > 0) {
        const avg = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
        setAverageRating(avg);
      }
    }

    // Fetch seller's active listings
    const { data: listingsData, error: listingsError } = await supabase
      .from("listings")
      .select(`
        id,
        title,
        slug,
        fixed_price,
        condition,
        location_city,
        location_state,
        quantity,
        unit,
        status,
        created_at,
        listing_images (url),
        categories (name)
      `)
      .eq("seller_id", id)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (!listingsError && listingsData) {
      setListings(listingsData);
    }

    // Count completed sales
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", id)
      .eq("status", "completed");

    setCompletedSales(count || 0);

    setLoading(false);
  };

  const renderStars = (rating: number, size: "sm" | "lg" = "sm") => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    const starSize = size === "lg" ? "h-5 w-5" : "h-4 w-4";

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className={`${starSize} fill-yellow-400 text-yellow-400`} />
        ))}
        {hasHalfStar && (
          <Star className={`${starSize} fill-yellow-400 text-yellow-400 opacity-50`} />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className={`${starSize} text-muted-foreground`} />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-6xl py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-lg" />
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-6xl py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Seller not found</h1>
          <Link to="/listings">
            <button className="text-primary hover:underline">Browse Listings</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container max-w-6xl py-8">
        {/* Seller Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <Avatar className="w-20 h-20">
                <AvatarImage src={seller.avatar_url || undefined} alt={seller.company_name || seller.name || "Seller"} />
                <AvatarFallback>
                  <User className="h-10 w-10 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-1">
                  {seller.company_name || seller.name || "Seller"}
                </h1>
                {seller.company_name && seller.name && (
                  <p className="text-muted-foreground">{seller.name}</p>
                )}

                {seller.bio && (
                  <p className="text-muted-foreground mt-2 max-w-2xl">{seller.bio}</p>
                )}

                <div className="flex flex-wrap gap-4 mt-4">
                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    {renderStars(averageRating, "lg")}
                    <span className="font-semibold">{averageRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">
                      ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
                    </span>
                  </div>

                  {/* Completed Sales */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ShoppingBag className="h-4 w-4" />
                    <span>{completedSales} completed sale{completedSales !== 1 ? "s" : ""}</span>
                  </div>

                  {/* Member Since */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Member since {new Date(seller.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <SellerBadges
                    completedSales={completedSales}
                    averageRating={averageRating}
                    reviewCount={reviews.length}
                    isVerifiedBusiness={seller.is_verified_business}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Active Listings */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4">Active Listings ({listings.length})</h2>
            {listings.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4" />
                  <p>No active listings</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {listings.map((listing) => (
                  <Link key={listing.id} to={`/listings/${listing.slug}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                      <div className="relative h-36 bg-muted overflow-hidden">
                        {listing.listing_images?.[0]?.url ? (
                          <img
                            src={listing.listing_images[0].url}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-10 w-10 text-muted-foreground" />
                          </div>
                        )}
                        <Badge variant="secondary" className="absolute top-2 right-2 capitalize">
                          {listing.condition.replace("_", " ")}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold line-clamp-2 mb-2">{listing.title}</h3>
                        {listing.categories && (
                          <Badge variant="outline" className="mb-2 text-xs">
                            {listing.categories.name}
                          </Badge>
                        )}
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {listing.location_city}, {listing.location_state}
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-0">
                        <div className="text-xl font-bold text-primary">
                          ${listing.fixed_price}
                        </div>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Reviews</h2>
            <Card>
              <CardContent className="pt-6">
                {reviews.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    <Star className="h-8 w-8 mx-auto mb-2" />
                    <p>No reviews yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {review.profiles?.name || "Anonymous"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {renderStars(review.rating)}
                            <Badge variant="outline" className="text-xs">
                              {review.rating}
                            </Badge>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground mb-1">{review.comment}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                        <Separator className="mt-4" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;
