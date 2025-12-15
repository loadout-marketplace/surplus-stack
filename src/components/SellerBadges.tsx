import { Badge } from "@/components/ui/badge";
import { Star, ShieldCheck, Award, TrendingUp } from "lucide-react";

interface SellerBadgesProps {
  completedSales: number;
  averageRating: number;
  reviewCount: number;
  isVerifiedBusiness?: boolean;
  variant?: "compact" | "full";
}

export const SellerBadges = ({
  completedSales,
  averageRating,
  reviewCount,
  isVerifiedBusiness = false,
  variant = "full",
}: SellerBadgesProps) => {
  const badges = [];

  // Verified Business badge
  if (isVerifiedBusiness) {
    badges.push({
      key: "verified",
      icon: ShieldCheck,
      label: variant === "compact" ? "Verified" : "Verified Business",
      className: "bg-blue-500 text-white hover:bg-blue-600",
    });
  }

  // Power Seller badge (10+ completed sales)
  if (completedSales >= 10) {
    badges.push({
      key: "power",
      icon: TrendingUp,
      label: variant === "compact" ? "Power" : "Power Seller",
      className: "bg-purple-500 text-white hover:bg-purple-600",
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
