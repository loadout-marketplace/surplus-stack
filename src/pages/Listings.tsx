import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, Package, User } from "lucide-react";
import { toast } from "sonner";
import zipcodes from "zipcodes";
import { useAuth } from "@/hooks/useAuth";
import { SellerBadges } from "@/components/SellerBadges";

interface Listing {
  id: string;
  title: string;
  slug: string;
  fixed_price: number;
  condition: string;
  location_city: string;
  location_state: string;
  location_zip: string | null;
  quantity: number;
  unit: string;
  created_at: string;
  seller_id: string;
  listing_images: { url: string }[];
  categories: { name: string } | null;
  profiles: { name: string | null; company_name: string | null; is_verified_business: boolean | null } | null;
  sellerRating?: number;
  sellerReviewCount?: number;
  sellerCompletedSales?: number;
}

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

  useEffect(() => {
    fetchCategories();
    fetchListings();
    fetchUserZipCode();
  }, [selectedCategory, user]);

  const fetchUserZipCode = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("user_zip")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching user ZIP code:", error);
    } else if (data?.user_zip) {
      setUserZipCode(data.user_zip);
      // Set as default search ZIP if user hasn't entered one
      if (!searchZipCode) {
        setSearchZipCode(data.user_zip);
      }
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Failed to load categories");
    } else {
      setCategories(data || []);
    }
  };

  const fetchListings = async () => {
    setLoading(true);
    let query = supabase
      .from("listings")
      .select(`
        *,
        listing_images (url),
        categories (name),
        profiles (name, company_name, is_verified_business)
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(50);

    if (selectedCategory && selectedCategory !== "all") {
      query = query.eq("category_id", selectedCategory);
    }

    const { data, error } = await query;

    if (error) {
      toast.error("Failed to load listings");
      console.error(error);
    } else {
      // Fetch seller ratings and completed sales for all listings
      const listingsWithRatings = await Promise.all(
        (data || []).map(async (listing) => {
          // Fetch reviews
          const { data: reviews } = await supabase
            .from("reviews")
            .select("rating")
            .eq("reviewed_user_id", listing.seller_id);

          let sellerRating = 0;
          const sellerReviewCount = reviews?.length || 0;
          if (reviews && reviews.length > 0) {
            sellerRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
          }

          // Fetch completed sales count
          const { count } = await supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("seller_id", listing.seller_id)
            .eq("status", "completed");

          return { 
            ...listing, 
            sellerRating, 
            sellerReviewCount,
            sellerCompletedSales: count || 0 
          };
        })
      );
      
      setListings(listingsWithRatings);
    }
    setLoading(false);
  };

  const calculateDistance = (zip1: string, zip2: string): number => {
    if (!zip1 || !zip2) return Infinity;
    
    const location1 = zipcodes.lookup(zip1);
    const location2 = zipcodes.lookup(zip2);
    
    if (!location1 || !location2) return Infinity;
    
    // Haversine formula to calculate distance in miles
    const R = 3959; // Earth's radius in miles
    const lat1 = location1.latitude * Math.PI / 180;
    const lat2 = location2.latitude * Math.PI / 180;
    const dLat = (location2.latitude - location1.latitude) * Math.PI / 180;
    const dLon = (location2.longitude - location1.longitude) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  };

  const filteredListings = listings
    .map((listing) => {
      const zipToUse = searchZipCode || userZipCode;
      let distance: number | null = null;
      
      if (zipToUse && listing.location_zip) {
        distance = calculateDistance(zipToUse, listing.location_zip);
      }
      
      return { ...listing, distance };
    })
    .filter((listing) => {
      // Filter by search query
      const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by custom category text if "other" is selected
      let matchesCategory = true;
      if (selectedCategory === "other" && customCategory.trim()) {
        const categoryName = listing.categories?.name?.toLowerCase() || "";
        matchesCategory = categoryName.includes(customCategory.toLowerCase().trim());
      }
      
      // Filter by seller name/company
      let matchesSeller = true;
      if (sellerSearch.trim()) {
        const sellerName = listing.profiles?.name?.toLowerCase() || "";
        const companyName = listing.profiles?.company_name?.toLowerCase() || "";
        const searchTerm = sellerSearch.toLowerCase().trim();
        matchesSeller = sellerName.includes(searchTerm) || companyName.includes(searchTerm);
      }
      
      // Filter by distance if user has a ZIP code
      let withinRadius = true;
      if (listing.distance !== null) {
        const radiusToUse = searchRadius === "custom" ? parseInt(customRadius) || 25 : parseInt(searchRadius);
        withinRadius = listing.distance <= radiusToUse;
      }
      
      return matchesSearch && matchesCategory && matchesSeller && withinRadius;
    });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container max-w-7xl py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative w-full md:w-56">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Seller or company name..."
                value={sellerSearch}
                onChange={(e) => setSellerSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {selectedCategory === "other" && (
                <Input
                  type="text"
                  placeholder="Type category to search..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full md:w-64"
                />
              )}
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <Input
                type="text"
                placeholder="ZIP Code"
                value={searchZipCode}
                onChange={(e) => setSearchZipCode(e.target.value)}
                className="w-32"
                maxLength={5}
              />
              <Select value={searchRadius} onValueChange={setSearchRadius}>
                <SelectTrigger className="w-full md:w-48">
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
                <Input
                  type="number"
                  placeholder="Miles"
                  value={customRadius}
                  onChange={(e) => setCustomRadius(e.target.value)}
                  className="w-24"
                  min="1"
                />
              )}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredListings.length} listing{filteredListings.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-48 bg-muted animate-pulse" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No listings found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters
            </p>
            <Link to="/listings/new">
              <Button>Create First Listing</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <Link key={listing.id} to={`/listings/${listing.slug}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                    <div className="relative h-48 bg-muted overflow-hidden">
                        {listing.listing_images?.[0]?.url ? (
                          <img
                            src={listing.listing_images[0].url}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <Badge variant="secondary" className="absolute top-2 right-2 capitalize">
                          {listing.condition.replace("_", " ")}
                        </Badge>
                      </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {listing.title}
                    </h3>

                    {listing.categories && (
                      <Badge variant="outline" className="mb-2">
                        {listing.categories.name}
                      </Badge>
                    )}

                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      {listing.location_city}, {listing.location_state}
                      {listing.distance !== null && (
                        <span className="ml-2 text-xs font-medium text-primary">
                          • {listing.distance.toFixed(1)} mi
                        </span>
                      )}
                    </div>

                    <div
                      className="flex items-center text-sm text-muted-foreground mb-2 hover:text-primary cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.location.href = `/sellers/${listing.seller_id}`;
                      }}
                    >
                      <User className="h-4 w-4 mr-1" />
                      <span className="hover:underline">
                        {listing.profiles?.company_name || listing.profiles?.name || "Unknown Seller"}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Qty: {listing.quantity} {listing.unit}
                    </p>
                  </CardContent>

                  <CardContent className="p-4 pt-0">
                    <SellerBadges
                      completedSales={listing.sellerCompletedSales || 0}
                      averageRating={listing.sellerRating || 0}
                      reviewCount={listing.sellerReviewCount || 0}
                      isVerifiedBusiness={listing.profiles?.is_verified_business || false}
                      variant="compact"
                    />
                  </CardContent>

                  <CardFooter className="p-4 pt-0">
                    <div className="text-2xl font-bold text-primary">
                      ${listing.fixed_price}
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
              </div>
            )}
          </div>
        </div>
      );
    };

export default Listings;
