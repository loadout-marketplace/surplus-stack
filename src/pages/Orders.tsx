import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Package, ArrowRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const playfair: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const montserrat: React.CSSProperties = { fontFamily: "'Montserrat', sans-serif" };

const statusStyles: Record<string, { label: string; bg: string; color: string }> = {
  pending_pickup: { label: "Awaiting Pickup", bg: "#fffbeb", color: "#d97706" },
  completed: { label: "Completed", bg: "#f0fdf4", color: "#16a34a" },
  cancelled: { label: "Cancelled", bg: "#fef2f2", color: "#dc2626" },
};

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) { toast.error("Please sign in"); navigate("/auth"); }
  }, [user, authLoading, navigate]);

  useEffect(() => { if (user) fetchOrders(); }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*, listings(title, slug)")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Orders error:", error);
      toast.error("Failed to load orders");
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const handleMarkReceived = async (orderId: string) => {
    setConfirming(orderId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("release-payment", {
        body: { order_id: orderId },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      if (error) throw error;
      toast.success("Pickup confirmed! Payment has been released to the seller.");
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm pickup");
    } finally {
      setConfirming(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white"><Navbar />
        <div className="container max-w-4xl py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-neutral-100 rounded w-1/3" />
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
                    <div>
                      <h3 className="font-bold text-base text-neutral-900 mb-1" style={playfair}>
                        {order.listings?.title || "Listing Unavailable"}
                      </h3>
                      <p className="text-xs text-neutral-400" style={montserrat}>
                        Ordered {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-sm whitespace-nowrap" style={{ ...montserrat, background: status.bg, color: status.color }}>
                      {status.label}
                    </span>
                  </div>

                  {order.status === "pending_pickup" && (
                    <div className="mb-4 p-4 rounded-sm" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                      <p className="text-xs text-amber-700 font-semibold mb-1" style={montserrat}>Action Required</p>
                      <p className="text-xs text-amber-600" style={montserrat}>
                        Your payment is being held securely. Once you pick up your materials, click "Confirm Pickup" below to release payment to the seller.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-lg font-bold text-neutral-900" style={playfair}>${(order.amount || 0).toFixed(2)}</p>
                    <div className="flex items-center gap-2">
                      {order.status === "pending_pickup" && (
                        <button
                          onClick={() => handleMarkReceived(order.id)}
                          disabled={confirming === order.id}
                          className="flex items-center gap-2 h-9 px-4 text-white text-xs font-bold uppercase tracking-wider rounded-sm"
                          style={{ ...montserrat, background: confirming === order.id ? "#666" : "#111" }}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          {confirming === order.id ? "Confirming…" : "Confirm Pickup"}
                        </button>
                      )}
                      {order.listings?.slug && (
                        <button onClick={() => navigate(`/listings/${order.listings.slug}`)}
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
