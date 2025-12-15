import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Star, Archive, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please sign in to access admin panel");
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (error || !data) {
      toast.error("Access denied: Admin privileges required");
      navigate("/");
      return;
    }

    setIsAdmin(true);
    fetchData();
  };

  const fetchData = async () => {
    setLoading(true);

    // Fetch all listings
    const { data: listingsData } = await supabase
      .from("listings")
      .select("*, profiles(name)")
      .order("created_at", { ascending: false });

    // Fetch all users with their roles
    const { data: usersData } = await supabase
      .from("profiles")
      .select(`
        *,
        user_roles(role)
      `)
      .order("created_at", { ascending: false });

    setListings(listingsData || []);
    setUsers(usersData || []);
    setLoading(false);
  };

  const toggleFeatured = async (listingId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("listings")
      .update({ is_featured: !currentStatus })
      .eq("id", listingId);

    if (error) {
      toast.error("Failed to update listing");
    } else {
      toast.success(currentStatus ? "Removed from featured" : "Marked as featured");
      fetchData();
    }
  };

  const archiveListing = async (listingId: string) => {
    const { error } = await supabase
      .from("listings")
      .update({ status: "archived" })
      .eq("id", listingId);

    if (error) {
      toast.error("Failed to archive listing");
    } else {
      toast.success("Listing archived");
      fetchData();
    }
  };

  const toggleVerifiedBusiness = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_verified_business: !currentStatus })
      .eq("id", userId);

    if (error) {
      toast.error("Failed to update verification status");
    } else {
      toast.success(currentStatus ? "Removed verified status" : "Marked as Verified Business");
      fetchData();
    }
  };

  if (authLoading || loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-7xl py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container max-w-7xl py-8">
        <div className="flex items-center gap-2 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Panel</h1>
        </div>

        <Tabs defaultValue="listings">
          <TabsList>
            <TabsTrigger value="listings">Listings ({listings.length})</TabsTrigger>
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Listings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Seller</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Featured</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listings.map((listing) => (
                        <TableRow key={listing.id}>
                          <TableCell className="font-medium">{listing.title}</TableCell>
                          <TableCell>{listing.profiles?.name || "Unknown"}</TableCell>
                          <TableCell>
                            {listing.price_type === "fixed"
                              ? `$${listing.fixed_price}`
                              : `Starting $${listing.starting_bid}`}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                listing.status === "active" ? "default" : "secondary"
                              }
                            >
                              {listing.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {listing.is_featured && (
                              <Star className="h-4 w-4 fill-primary text-primary" />
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFeatured(listing.id, listing.is_featured)}
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                            {listing.status === "active" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => archiveListing(listing.id)}
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Verified Business</TableHead>
                        <TableHead>Contractor</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((userData) => (
                        <TableRow key={userData.id}>
                          <TableCell className="font-medium">{userData.name || "N/A"}</TableCell>
                          <TableCell>{userData.company_name || "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={userData.is_verified_business || false}
                                onCheckedChange={() => 
                                  toggleVerifiedBusiness(userData.id, userData.is_verified_business || false)
                                }
                              />
                              {userData.is_verified_business && (
                                <ShieldCheck className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {userData.is_contractor ? (
                              <Badge variant="outline">Contractor</Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {userData.user_roles?.map((ur: any) => (
                                <Badge key={ur.role} variant="secondary">
                                  {ur.role}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(userData.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
