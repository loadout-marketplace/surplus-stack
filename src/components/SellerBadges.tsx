import { Badge } from "@/components/ui/badge";
import { Star, ShieldCheck, Award, TrendingUp, Sparkles } from "lucide-react";

interface SellerBadgesProps {
  completedSales: number;
  averageRating: number;
  reviewCount: number;
  isVerifiedBusiness?: boolean;
  isFoundingSeller?: boolean;
  completedPurchases?: number;
  variant?: "compact" | "full";
}

export const SellerBadges = ({
  completedSales,
  averageRating,
  reviewCount,
  isVerifiedBusiness = false,
  isFoundingSeller = false,
  completedPurchases = 0,
  variant = "full",
}: SellerBadgesProps) => {
  const badges = [];

  // Founding Seller badge — early adopter
  if (isFoundingSeller && completedSales < 10) {
    badges.push({
      key: "founding",
      icon: Sparkles,
      label: variant === "compact" ? "Founding" : "Founding Seller",
      className: "bg-amber-500 text-white hover:bg-amber-600",
    });
  }

  // Verified Seller badge (10+ completed sales)
  if (completedSales >= 10) {
    badges.push({
      key: "verified-seller",
      icon: ShieldCheck,
      label: variant === "compact" ? "Verified" : "Verified Seller",
      className: "bg-blue-500 text-white hover:bg-blue-600",
    });
  }
  // Trusted Seller badge (5-9 completed sales)
  else if (completedSales >= 5) {
    badges.push({
      key: "trusted",
      icon: Award,
      label: variant === "compact" ? "Trusted" : "Trusted Seller",
      className: "bg-green-500 text-white hover:bg-green-600",
    });
  }

  // Verified Buyer badge (5+ completed purchases)
  if (completedPurchases >= 5) {
    badges.push({
      key: "verified-buyer",
      icon: ShieldCheck,
      label: variant === "compact" ? "Buyer" : "Verified Buyer",
      className: "bg-indigo-500 text-white hover:bg-indigo-600",
    });
  }

  // Top Rated badge (4.5+ rating with reviews)
  if (averageRating >= 4.5 && reviewCount > 0) {
    badges.push({
      key: "top-rated",
      icon: Star,
      label: "Top Rated",
      className: "bg-yellow-400 text-yellow-900 hover:bg-yellow-500",
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {badges.map(({ key, icon: Icon, label, className }) => (
        <Badge key={key} className={`${className} flex items-center gap-1`}>
          <Icon className="h-3 w-3" />
          {label}
        </Badge>
      ))}
    </div>
  );
};
