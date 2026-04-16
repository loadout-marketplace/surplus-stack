import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Package, CheckCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { ReviewDialog } from "@/components/ReviewDialog";

interface Order {
  id: string; status: string; total_price: number; quantity: number;
  created_at: string; listing_id: string; seller_id: string;
  listings: { title: string; slug: string } | null;
  profiles: { name: string } | null;
  reviews: { id: string }[];
}

const playfair: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const montserrat: React.CSSProperties = { fontFamily: "'Montserrat', sans-serif" };

const statusStyles: Record<string, { label: string; bg: string; color: string }> = {
  pending_payment: { label: "Pending Payment", bg: "#fafafa", color: "#999" },
  paid: { label: "Paid", bg: "#f0fdf4", color: "#16a34a" },
  ready_for_pickup: { label: "Ready for Pickup", bg: "#eff6ff", color: "#2563eb" },
  completed: { label: "Completed", bg: "#f0fdf4", color: "#16a34a" },
  cancelled: { label: "Cancelled", bg: "#fef2f2", color: "#dc2626" },
};

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { toast.error("Please sign in to view orders"); navigate("/auth"); }
  }, [user, authLoading, navigate]);

  useEffect(() => { if (user) fetchOrders(); }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("orders")
      .select(`*, listings (title, slug), profiles!orders_seller_id_fkey (name), reviews (id)`)
      .eq("buyer_id", user.id).order("created_at", { ascending: false });
    if (error) toast.error("Failed to load orders");
    else setOrders(data || []);
    setLoading(false);
  };

  const handleMarkReceived = async (orderId: string) => {
    const { error } = await supabase.from("orders").update({ status: "completed" }).eq("id", orderId);
    if (error) toast.error("Failed to update order status");
    else { toast.success("Order marked as received!"); fetchOrders(); }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white"><Navbar />
        <div className="container max-w-4xl py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-neutral-100 rounded w-1/3" />
            <div className="h-32 bg-neutral-100 rounded" />
            <div className="h-32 bg-neutral-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container max-w-4xl px-6" style={{ paddingTop: "96px", paddingBottom: "80px" }}>

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.22em] text-neutral-400 mb-2" style={montserrat}>Purchases</p>
          <h1 className="text-3xl font-bold text-neutral-900" style={playfair}>My Orders</h1>
          <div className="silver-rule mt-6" />
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-10 w-10 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-neutral-900 mb-2" style={playfair}>No orders yet</h3>
            <p className="text-sm text-neutral-500 mb-8" style={montserrat}>Start shopping to see your purchases here</p>
            <button onClick={() => navigate("/listings")} className="h-11 px-8 text-white text-xs font-bold uppercase tracking-wider rounded-sm" style={{ ...montserrat, background: "#111" }}>
              Browse Listings
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusStyles[order.status] || { label: order.status, bg: "#fafafa", color: "#999" };
              return (
                <div key={order.id} className="bg-white rounded-sm p-6" style={{ border: "1px solid #e8e8e8" }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 mr-4">
                      <h3 className="font-bold text-base text-neutral-900 mb-1" style={playfair}>
                        {order.listings?.title || "Listing Unavailable"}
                      </h3>
                      <p className="text-xs text-neutral-400" style={montserrat}>
                        Seller: {order.profiles?.name || "Unknown"} · Ordered {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-sm whitespace-nowrap" style={{ ...montserrat, background: status.bg, color: status.color }}>
                      {status.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-6 text-sm" style={montserrat}>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-neutral-400 mb-0.5">Quantity</p>
                        <p className="font-semibold text-neutral-900">{order.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-neutral-400 mb-0.5">Total</p>
                        <p className="font-semibold text-neutral-900">${order.total_price.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.status === "ready_for_pickup" && (
                        <button onClick={() => handleMarkReceived(order.id)}
                          className="flex items-center gap-2 h-9 px-4 text-white text-xs font-bold uppercase tracking-wider rounded-sm"
                          style={{ ...montserrat, background: "#111" }}>
                          <CheckCircle className="h-3.5 w-3.5" /> Mark Received
                        </button>
                      )}
                      {order.status === "completed" && order.reviews.length === 0 && (
                        <ReviewDialog orderId={order.id} sellerId={order.seller_id} sellerName={order.profiles?.name || "Seller"} onReviewSubmitted={fetchOrders} />
                      )}
                      {order.status === "completed" && order.reviews.length > 0 && (
                        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 px-3 py-1 rounded-sm" style={{ ...montserrat, background: "#f7f7f7" }}>
                          Reviewed ✓
                        </span>
                      )}
                      {order.listings?.slug && (
                        <button onClick={() => navigate(`/listings/${order.listings!.slug}`)}
                          className="flex items-center gap-1 h-9 px-4 text-xs font-semibold uppercase tracking-wider rounded-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                          style={{ ...montserrat, border: "1px solid #e0e0e0" }}>
                          View <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
