import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Plus, User, LogOut, Menu } from "lucide-react";
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

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2 md:space-x-3">
          <img src={logo} alt="Loadout Marketplace" className="h-7 w-7 md:h-8 md:w-8" />
          <span className="font-bold text-base md:text-xl">Loadout Marketplace</span>
        </Link>

        {isMobile && user ? (
          <div className="flex items-center gap-2">
            <MessagesBadge />
            <NotificationBell />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-4 mt-8">
                  <Link to="/listings" className="w-full">
                    <Button variant="ghost" className="w-full justify-start">
                      <Search className="h-4 w-4 mr-2" />
                      Browse
                    </Button>
                  </Link>
                  <Link to="/listings/new" className="w-full">
                    <Button className="w-full justify-start">
                      <Plus className="h-4 w-4 mr-2" />
                      List Item
                    </Button>
                  </Link>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/dashboard")}>
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => navigate("/orders")}>
                    My Orders
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <div className="flex items-center space-x-2 md:space-x-4">
            <Link to="/listings">
              <Button variant="ghost" size="sm">
                <Search className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Browse</span>
              </Button>
            </Link>

            {user ? (
              <>
                <Link to="/listings/new" className="hidden md:block">
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    List Item
                  </Button>
                </Link>

                <MessagesBadge />

                <NotificationBell />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <User className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">Account</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                      My Listings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/orders")}>
                      My Orders
                    </DropdownMenuItem>
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
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="hidden sm:inline-flex">Get Started</Button>
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
