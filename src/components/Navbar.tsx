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
    <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b border-border/40 shadow-[0_1px_3px_0_rgb(0_0_0/0.05)]">
      <div className="container flex h-16 items-center justify-between px-4 max-w-7xl">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="Loadout Marketplace" className="h-8 w-8" />
          <span className="font-bold text-lg tracking-tight text-foreground">Loadout Marketplace</span>
        </Link>

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
                  <Link to="/listings/new" className="w-full">
                    <Button className="w-full justify-start h-11 text-base">
                      <Plus className="h-4 w-4 mr-3" />
                      List Item
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
        ) : (
          <div className="flex items-center gap-1">
            <Link to="/listings">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Search className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Browse</span>
              </Button>
            </Link>

            {user ? (
              <>
                <Link to="/listings/new" className="hidden md:block">
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    List Item
                  </Button>
                </Link>

                <MessagesBadge />
                <NotificationBell />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <User className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">Account</span>
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
              <div className="flex items-center gap-2">
                <Link to="/auth">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link to="/listings/new">
                  <Button size="sm" className="bg-cta hover:bg-cta/90 text-cta-foreground">
                    <Plus className="h-4 w-4 mr-1.5" />
                    Post a Listing
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
