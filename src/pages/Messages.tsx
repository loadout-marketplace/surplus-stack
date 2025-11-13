import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface MessageThread {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  listings: {
    title: string;
    slug: string;
  };
  buyer_profile: {
    name: string;
  };
  seller_profile: {
    name: string;
  };
  latest_message?: {
    body: string;
    created_at: string;
  };
}

const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please sign in to view messages");
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchThreads();
    }
  }, [user]);

  const fetchThreads = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("message_threads")
      .select(`
        *,
        listings(title, slug),
        buyer_profile:profiles!message_threads_buyer_id_fkey(name),
        seller_profile:profiles!message_threads_seller_id_fkey(name)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (error) {
      toast.error("Failed to load messages");
      console.error(error);
    } else {
      setThreads(data || []);
    }
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-4xl py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container max-w-4xl py-8">
        <h1 className="text-3xl font-bold mb-8">Messages</h1>

        {threads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No messages yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => {
              const otherUser = thread.buyer_id === user?.id 
                ? thread.seller_profile 
                : thread.buyer_profile;
              const role = thread.buyer_id === user?.id ? "buyer" : "seller";

              return (
                <Card
                  key={thread.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => navigate(`/messages/${thread.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{thread.listings.title}</h3>
                          <Badge variant="outline">
                            {role === "buyer" ? "Buying" : "Selling"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          With: {otherUser.name || "Unknown"}
                        </p>
                      </div>
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
