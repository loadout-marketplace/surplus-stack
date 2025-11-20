import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Package, ShoppingCart, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Stats {
  activeListings: number;
  activeOrders: number;
  unreadMessages: number;
}

export const WelcomeStats = () => {
  const { user } = useAuth();
  const [userName, setUserName] = useState<string>("");
  const [stats, setStats] = useState<Stats>({
    activeListings: 0,
    activeOrders: 0,
    unreadMessages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        // Fetch user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", user.id)
          .single();

        if (profile?.name) {
          setUserName(profile.name);
        }

        // Fetch active listings count
        const { count: listingsCount } = await supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("seller_id", user.id)
          .eq("status", "active");

        // Fetch active orders count
        const { count: ordersCount } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
          .not("status", "in", "(completed,cancelled)");

        // Fetch unread messages count
        const { data: threads } = await supabase
          .from("message_threads")
          .select("id")
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

        let unreadCount = 0;
        if (threads && threads.length > 0) {
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .in("thread_id", threads.map(t => t.id))
            .eq("is_read", false)
            .neq("sender_id", user.id);
          
          unreadCount = count || 0;
        }

        setStats({
          activeListings: listingsCount || 0,
          activeOrders: ordersCount || 0,
          unreadMessages: unreadCount,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  if (!user || loading) return null;

  return (
    <section className="py-12 bg-muted/30">
      <div className="container max-w-6xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back{userName ? `, ${userName}` : ""}!
          </h2>
          <p className="text-muted-foreground">
            Here's a quick overview of your activity
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeListings}</p>
                  <p className="text-sm text-muted-foreground">Active Listings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeOrders}</p>
                  <p className="text-sm text-muted-foreground">Active Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.unreadMessages}</p>
                  <p className="text-sm text-muted-foreground">Unread Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
