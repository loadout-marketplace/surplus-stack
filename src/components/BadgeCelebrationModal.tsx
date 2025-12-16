import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, ShieldCheck, Award, TrendingUp, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BadgeCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  badgeType: string;
  link?: string;
}

const badgeConfig: Record<string, {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  bgGradient: string;
}> = {
  badge_trusted_seller: {
    icon: Award,
    title: "Trusted Seller",
    subtitle: "5 Sales Milestone!",
    description: "You've proven yourself as a reliable seller. Buyers can now see your Trusted Seller badge!",
    color: "text-green-500",
    bgGradient: "from-green-500/20 to-emerald-500/20",
  },
  badge_power_seller: {
    icon: TrendingUp,
    title: "Power Seller",
    subtitle: "10 Sales Milestone!",
    description: "You're one of our top sellers! The Power Seller badge showcases your success on Loadout.",
    color: "text-purple-500",
    bgGradient: "from-purple-500/20 to-violet-500/20",
  },
  badge_top_rated: {
    icon: Star,
    title: "Top Rated",
    subtitle: "4.5+ Star Rating!",
    description: "Your excellent service has earned you top marks from buyers. Keep up the great work!",
    color: "text-yellow-500",
    bgGradient: "from-yellow-500/20 to-amber-500/20",
  },
  badge_verified_business: {
    icon: ShieldCheck,
    title: "Verified Business",
    subtitle: "Business Verified!",
    description: "Your business has been officially verified. This builds trust with potential buyers.",
    color: "text-blue-500",
    bgGradient: "from-blue-500/20 to-cyan-500/20",
  },
};

export const BadgeCelebrationModal = ({
  isOpen,
  onClose,
  badgeType,
  link,
}: BadgeCelebrationModalProps) => {
  const navigate = useNavigate();
  const config = badgeConfig[badgeType] || badgeConfig.badge_trusted_seller;
  const Icon = config.icon;

  const handleViewProfile = () => {
    onClose();
    if (link) {
      navigate(link);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md overflow-hidden border-none">
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} opacity-50`} />
        
        {/* Sparkle decorations */}
        <div className="absolute top-4 left-4 animate-pulse">
          <Sparkles className="h-6 w-6 text-yellow-400" />
        </div>
        <div className="absolute top-8 right-8 animate-pulse delay-150">
          <Sparkles className="h-4 w-4 text-yellow-400" />
        </div>
        <div className="absolute bottom-12 left-8 animate-pulse delay-300">
          <Sparkles className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="absolute bottom-20 right-4 animate-pulse delay-500">
          <Sparkles className="h-3 w-3 text-yellow-400" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center py-6">
          {/* Confetti animation container */}
          <div className="relative">
            {/* Animated rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-32 h-32 rounded-full border-4 ${config.color.replace('text-', 'border-')} opacity-20 animate-ping`} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-28 h-28 rounded-full border-2 ${config.color.replace('text-', 'border-')} opacity-30 animate-pulse`} />
            </div>
            
            {/* Badge icon */}
            <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${config.bgGradient} flex items-center justify-center animate-scale-in`}>
              <Icon className={`h-12 w-12 ${config.color}`} />
            </div>
          </div>

          {/* Celebration text */}
          <div className="mt-8 space-y-2 animate-fade-in">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              🎉 Congratulations! 🎉
            </p>
            <h2 className={`text-2xl font-bold ${config.color}`}>
              {config.title}
            </h2>
            <p className="text-lg font-semibold text-foreground">
              {config.subtitle}
            </p>
          </div>

          <p className="mt-4 text-muted-foreground max-w-xs animate-fade-in">
            {config.description}
          </p>

          {/* Action buttons */}
          <div className="mt-8 flex gap-3 animate-fade-in">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {link && (
              <Button onClick={handleViewProfile} className={`${config.color.replace('text-', 'bg-').replace('-500', '-600')} hover:opacity-90`}>
                View Profile
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
