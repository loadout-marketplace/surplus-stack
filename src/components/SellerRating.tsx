import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: {
    name: string;
  } | null;
}

interface SellerRatingProps {
  sellerId: string;
  sellerName: string;
}

export const SellerRating = ({ sellerId, sellerName }: SellerRatingProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [sellerId]);

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        id,
        rating,
        comment,
        created_at,
        profiles!reviews_reviewer_id_fkey (name)
      `)
      .eq("reviewed_user_id", sellerId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!error && data) {
      setReviews(data);
      setTotalReviews(data.length);
      
      if (data.length > 0) {
        const avg = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
        setAverageRating(avg);
      }
    }
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
      <Card>
        <CardHeader>
          <CardTitle>Seller Rating</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/2" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (totalReviews === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seller Rating</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-5 w-5" />
            <p>No reviews yet for this seller</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seller Rating</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Average Rating */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">out of 5</div>
          </div>
          <div className="flex-1">
            {renderStars(averageRating, "lg")}
            <p className="text-sm text-muted-foreground mt-1">
              Based on {totalReviews} review{totalReviews !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <Separator />

        {/* Recent Reviews */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Recent Reviews</h4>
          {reviews.map((review) => (
            <div key={review.id} className="space-y-2">
              <div className="flex items-center justify-between">
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
                <p className="text-sm text-muted-foreground pl-6">{review.comment}</p>
              )}
              <p className="text-xs text-muted-foreground pl-6">
                {new Date(review.created_at).toLocaleDateString()}
              </p>
              <Separator className="mt-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
