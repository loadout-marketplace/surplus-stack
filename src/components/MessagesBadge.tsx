import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const MessagesBadge = () => {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchPendingCount = async () => {
      const { count, error } = await supabase
        .from("message_threads")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", user.id)
        .eq("status", "pending");

      if (!error && count !== null) {
        setPendingCount(count);
      }
    };

    fetchPendingCount();

    // Set up realtime subscription for pending message requests
    const channel = supabase
      .channel("message_requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_threads",
          filter: `seller_id=eq.${user.id}`,
        },
        () => {
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) return null;

  return (
    <Link to="/messages">
      <Button variant="ghost" size="sm" className="relative">
        <MessageSquare className="h-4 w-4" />
        {pendingCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {pendingCount > 9 ? "9+" : pendingCount}
          </Badge>
        )}
      </Button>
    </Link>
  );
};
