import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Plus, User, LogOut, Menu, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/loadout-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NotificationBell } from "./NotificationBell";
import { MessagesBadge } from "./MessagesBadge";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data: hasAdminRole } = await supabase
        .rpc("has_role", { _user_id: user.id, _role: "admin" });
      setIsAdmin(!!hasAdminRole);
    };
    checkAdminStatus();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 z-50 w-full bg-background border-b border-border">
      <div className="container flex h-16 items-center justify-between px-4 max-w-7xl">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img src={logo} alt="Loadout Marketplace" className="h-8 w-8" />
          <span className="font-bold text-lg tracking-tight text-foreground">Loadout</span>
        </Link>

        {/* Center: Nav links (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/listings" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Browse</Link>
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
          <a href="#for-contractors" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">For Contractors</a>
          <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
        </div>

        {/* Right side */}
        {isMobile && user ? (
          <div className="flex items-center gap-1.5">
            <MessagesBadge />
            <NotificationBell />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 pt-12">
                <div className="flex flex-col gap-1">
                  <Link to="/listings" className="w-full">
                    <Button variant="ghost" className="w-full justify-start h-11 text-base">
                      <Search className="h-4 w-4 mr-3" />
                      Browse
                    </Button>
                  </Link>
                  <Link to="/create-listing" className="w-full">
                    <Button className="w-full justify-start h-11 text-base bg-cta hover:bg-cta/90 text-cta-foreground">
                      <Plus className="h-4 w-4 mr-3" />
                      Post a Listing
                    </Button>
                  </Link>
                  <div className="h-px bg-border my-2" />
                  <Button variant="ghost" className="w-full justify-start h-11 text-base" onClick={() => navigate("/dashboard")}>
                    <User className="h-4 w-4 mr-3" />
                    Dashboard
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-11 text-base" onClick={() => navigate("/profile/edit")}>
                    Edit Profile
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-11 text-base" onClick={() => navigate("/orders")}>
                    My Orders
                  </Button>
                  {isAdmin && (
                    <Button variant="ghost" className="w-full justify-start h-11 text-base" onClick={() => navigate("/admin")}>
                      <Shield className="h-4 w-4 mr-3" />
                      Admin
                    </Button>
                  )}
                  <div className="h-px bg-border my-2" />
                  <Button variant="ghost" className="w-full justify-start h-11 text-base text-destructive" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        ) : isMobile ? (
          <div className="flex items-center gap-1.5">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 pt-12">
                <div className="flex flex-col gap-1">
                  <Link to="/listings" className="w-full">
                    <Button variant="ghost" className="w-full justify-start h-11 text-base">Browse</Button>
                  </Link>
                  <a href="#how-it-works" className="w-full">
                    <Button variant="ghost" className="w-full justify-start h-11 text-base">How It Works</Button>
                  </a>
                  <a href="#for-contractors" className="w-full">
                    <Button variant="ghost" className="w-full justify-start h-11 text-base">For Contractors</Button>
                  </a>
                  <a href="#pricing" className="w-full">
                    <Button variant="ghost" className="w-full justify-start h-11 text-base">Pricing</Button>
                  </a>
                  <div className="h-px bg-border my-2" />
                  <Link to="/create-listing" className="w-full">
                    <Button className="w-full justify-start h-11 text-base bg-cta hover:bg-cta/90 text-cta-foreground">
                      <Plus className="h-4 w-4 mr-3" />
                      Post a Listing
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link to="/create-listing">
                  <Button size="sm" className="bg-cta hover:bg-cta/90 text-cta-foreground">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Post a Listing
                  </Button>
                </Link>

                <MessagesBadge />
                <NotificationBell />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <User className="h-4 w-4 mr-2" />
                      Account
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/profile/edit")}>
                      Edit Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      My Listings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/orders")}>
                      My Orders
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate("/admin")}>
                          <Shield className="h-4 w-4 mr-2" />
                          Admin Panel
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/create-listing">
                  <Button size="sm" className="bg-cta hover:bg-cta/90 text-cta-foreground">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Post a Listing
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
