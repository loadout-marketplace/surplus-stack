import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Edit, Archive } from "lucide-react";
import { toast } from "sonner";

interface Listing {
  id: string;
  title: string;
  slug: string;
  fixed_price: number;
  status: string;
  quantity: number;
  unit: string;
  created_at: string;
  views_count: number;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please sign in to view dashboard");
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchMyListings();
    }
  }, [user]);

  const fetchMyListings = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load listings");
      console.error(error);
    } else {
      setListings(data || []);
    }
    setLoading(false);
  };

  const handleArchive = async (id: string) => {
    const { error } = await supabase
      .from("listings")
      .update({ status: "archived" })
      .eq("id", id);

    if (error) {
      toast.error("Failed to archive listing");
    } else {
      toast.success("Listing archived");
      fetchMyListings();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-6xl py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  const activeListings = listings.filter((l) => l.status === "active");
  const archivedListings = listings.filter((l) => l.status === "archived");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container max-w-6xl py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Link to="/listings/new">
            <Button>Create New Listing</Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Listings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activeListings.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {listings.reduce((sum, l) => sum + (l.views_count || 0), 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Listings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{listings.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Listings Table */}
        <Card>
          <CardHeader>
            <CardTitle>My Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active">
              <TabsList>
                <TabsTrigger value="active">
                  Active ({activeListings.length})
                </TabsTrigger>
                <TabsTrigger value="archived">
                  Archived ({archivedListings.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="mt-4">
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : activeListings.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      You don't have any active listings yet
                    </p>
                    <Link to="/listings/new">
                      <Button>Create Your First Listing</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Views</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeListings.map((listing) => (
                          <TableRow key={listing.id}>
                            <TableCell>
                              <Link
                                to={`/listings/${listing.slug}`}
                                className="font-medium hover:underline"
                              >
                                {listing.title}
                              </Link>
                            </TableCell>
                            <TableCell>${listing.fixed_price}</TableCell>
                            <TableCell>
                              {listing.quantity} {listing.unit}
                            </TableCell>
                            <TableCell>{listing.views_count || 0}</TableCell>
                            <TableCell>
                              {new Date(listing.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleArchive(listing.id)}
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="archived" className="mt-4">
                {archivedListings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No archived listings
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Archived Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {archivedListings.map((listing) => (
                          <TableRow key={listing.id}>
                            <TableCell>{listing.title}</TableCell>
                            <TableCell>${listing.fixed_price}</TableCell>
                            <TableCell>
                              {new Date(listing.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
