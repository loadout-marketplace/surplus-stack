import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Package, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface ListingDetail {
  id: string;
  title: string;
  description: string;
  fixed_price: number;
  condition: string;
  quantity: number;
  unit: string;
  location_city: string;
  location_state: string;
  location_zip: string;
  pickup_only: boolean;
  shipping_available: boolean;
  created_at: string;
  listing_images: { url: string }[];
  categories: { name: string } | null;
  profiles: { name: string; company_name: string } | null;
}

const ListingDetail = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListing();
  }, [slug]);

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
    }
    setLoading(false);
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
              <div className="text-3xl font-bold text-primary mb-4">
                ${listing.fixed_price}
              </div>
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
                      <div className="text-sm text-muted-foreground">
                        {listing.profiles.name}
                        {listing.profiles.company_name && ` • ${listing.profiles.company_name}`}
                      </div>
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

            {user ? (
              <Button size="lg" className="w-full">
                Contact Seller
              </Button>
            ) : (
              <Link to="/auth">
                <Button size="lg" className="w-full">
                  Sign In to Contact Seller
                </Button>
              </Link>
            )}
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
      </div>
    </div>
  );
};

export default ListingDetail;
