import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { ReviewDialog } from "@/components/ReviewDialog";

interface Order {
  id: string;
  status: string;
  total_price: number;
  quantity: number;
  created_at: string;
  listing_id: string;
  seller_id: string;
  listings: {
    title: string;
    slug: string;
  } | null;
  profiles: {
    name: string;
  } | null;
  reviews: { id: string }[];
}

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please sign in to view orders");
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        listings (title, slug),
        profiles!orders_seller_id_fkey (name),
        reviews (id)
      `
      )
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load orders");
      console.error(error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const handleMarkReceived = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "completed" })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update order status");
      console.error(error);
    } else {
      toast.success("Order marked as received!");
      fetchOrders();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      pending_payment: { label: "Pending Payment", variant: "outline" },
      paid: { label: "Paid", variant: "secondary" },
      ready_for_pickup: { label: "Ready for Pickup", variant: "secondary" },
      completed: { label: "Completed", variant: "default" },
      cancelled: { label: "Cancelled", variant: "outline" },
    };

    const statusInfo = variants[status] || { label: status, variant: "outline" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (authLoading || loading) {
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container max-w-6xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground">
            Track your purchases and leave reviews
          </p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-4">
                Start shopping to see your orders here
              </p>
              <Button onClick={() => navigate("/listings")}>
                Browse Listings
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg mb-1">
                        {order.listings?.title || "Listing Unavailable"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Seller: {order.profiles?.name || "Unknown"}
                      </p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Quantity:</span> {order.quantity}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Total:</span> ${order.total_price.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Ordered on {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      {order.status === "ready_for_pickup" && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkReceived(order.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Received
                        </Button>
                      )}

                      {order.status === "completed" && order.reviews.length === 0 && (
                        <ReviewDialog
                          orderId={order.id}
                          sellerId={order.seller_id}
                          sellerName={order.profiles?.name || "Seller"}
                          onReviewSubmitted={fetchOrders}
                        />
                      )}

                      {order.status === "completed" && order.reviews.length > 0 && (
                        <Badge variant="secondary">Review Submitted</Badge>
                      )}

                      {order.listings?.slug && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/listings/${order.listings.slug}`)}
                        >
                          View Listing
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
