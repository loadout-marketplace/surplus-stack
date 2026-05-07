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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) { setIsAdmin(false); return; }
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

  const navLinkClass =
    "text-xs font-semibold uppercase tracking-widest text-neutral-500 hover:text-neutral-900 transition-colors duration-200";

  return (
    <nav
      className="fixed top-0 z-50 w-full bg-white"
      style={{
        borderBottom: "1px solid #e8e8e8",
        boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.06)" : "none",
        transition: "box-shadow 0.3s ease",
      }}
    >
      <div className="container flex h-16 items-center justify-between px-6 max-w-7xl">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img src={logo} alt="Loadout Marketplace" className="h-7 w-7" />
          <span
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 700,
              fontSize: "1.2rem",
              letterSpacing: "-0.01em",
              color: "#111",
            }}
          >
            Loadout
          </span>
        </Link>

        {/* Center nav */}
        <div className="hidden md:flex items-center gap-10">
          <Link to="/listings" className={navLinkClass}>Browse</Link>
          <a href="#how-it-works" className={navLinkClass}>How It Works</a>
          <a href="/contractors" className={navLinkClass}>Contractors</a>
          <a href="/pricing" className={navLinkClass}>Pricing</a>
        </div>

        {/* Right side */}
        {isMobile && user ? (
          <div className="flex items-center gap-1.5">
            <MessagesBadge />
            <NotificationBell />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 pt-12 bg-white">
                <div className="flex flex-col gap-1">
                  <Link to="/listings" className="w-full">
                    <Button variant="ghost" className="w-full justify-start h-11 text-sm font-medium">
                      <Search className="h-4 w-4 mr-3" /> Browse
                    </Button>
                  </Link>
                  <Link to="/create-listing" className="w-full">
                    <Button
                      className="w-full justify-start h-11 text-sm font-semibold text-white"
                      style={{ background: "#111", borderRadius: "4px" }}
                    >
                      <Plus className="h-4 w-4 mr-3" /> Post a Listing
                    </Button>
                  </Link>
                  <div className="h-px bg-neutral-100 my-2" />
                  <Button variant="ghost" className="w-full justify-start h-11 text-sm" onClick={() => navigate("/dashboard")}>
                    <User className="h-4 w-4 mr-3" /> Dashboard
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-11 text-sm" onClick={() => navigate("/profile/edit")}>
                    Edit Profile
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-11 text-sm" onClick={() => navigate("/orders")}>
                    My Orders
                  </Button>
                  {isAdmin && (
                    <Button variant="ghost" className="w-full justify-start h-11 text-sm" onClick={() => navigate("/admin")}>
                      <Shield className="h-4 w-4 mr-3" /> Admin
                    </Button>
                  )}
                  <div className="h-px bg-neutral-100 my-2" />
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-11 text-sm text-red-500"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-3" /> Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        ) : isMobile ? (
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-xs font-semibold uppercase tracking-wider">
                Sign In
              </Button>
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 pt-12 bg-white">
                <div className="flex flex-col gap-1">
                  <Link to="/listings" className="w-full">
                    <Button variant="ghost" className="w-full justify-start h-11 text-sm">Browse</Button>
                  </Link>
                  <a href="#how-it-works" className="w-full">
                    <Button variant="ghost" className="w-full justify-start h-11 text-sm">How It Works</Button>
                  </a>
                  <div className="h-px bg-neutral-100 my-2" />
                  <Link to="/create-listing" className="w-full">
                    <Button
                      className="w-full justify-start h-11 text-sm font-semibold text-white"
                      style={{ background: "#111", borderRadius: "4px" }}
                    >
                      <Plus className="h-4 w-4 mr-3" /> Post a Listing
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/create-listing">
                  <Button
                    size="sm"
                    className="text-white text-xs font-semibold uppercase tracking-wider px-5"
                    style={{ background: "#111", borderRadius: "4px", height: "36px" }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Post Listing
                  </Button>
                </Link>
                <MessagesBadge />
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs font-semibold uppercase tracking-wider text-neutral-600 hover:text-neutral-900"
                    >
                      <User className="h-3.5 w-3.5 mr-2" /> Account
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white border border-neutral-200 shadow-lg rounded-sm">
                    <DropdownMenuItem className="text-sm" onClick={() => navigate("/dashboard")}>Dashboard</DropdownMenuItem>
                    <DropdownMenuItem className="text-sm" onClick={() => navigate("/profile/edit")}>Edit Profile</DropdownMenuItem>
                    <DropdownMenuItem className="text-sm" onClick={() => navigate("/dashboard")}>My Listings</DropdownMenuItem>
                    <DropdownMenuItem className="text-sm" onClick={() => navigate("/orders")}>My Orders</DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-sm" onClick={() => navigate("/admin")}>
                          <Shield className="h-3.5 w-3.5 mr-2" /> Admin Panel
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-sm text-red-500" onClick={handleSignOut}>
                      <LogOut className="h-3.5 w-3.5 mr-2" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-semibold uppercase tracking-wider text-neutral-600 hover:text-neutral-900"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/create-listing">
                  <Button
                    size="sm"
                    className="text-white text-xs font-semibold uppercase tracking-wider px-5"
                    style={{ background: "#111", borderRadius: "4px", height: "36px" }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Post Listing
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
