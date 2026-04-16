import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { MessageSquare, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface MessageThread {
  id: string; listing_id: string; buyer_id: string; seller_id: string;
  created_at: string; status: string;
  listings: { title: string; slug: string };
  buyer_profile: { name: string };
  seller_profile: { name: string };
}

const playfair: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const montserrat: React.CSSProperties = { fontFamily: "'Montserrat', sans-serif" };

const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { toast.error("Please sign in to view messages"); navigate("/auth"); }
  }, [user, authLoading, navigate]);

  useEffect(() => { if (user) fetchThreads(); }, [user]);

  const fetchThreads = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("message_threads")
      .select(`*, listings(title, slug), buyer_profile:profiles!message_threads_buyer_id_fkey(name), seller_profile:profiles!message_threads_seller_id_fkey(name)`)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });
    if (error) toast.error("Failed to load messages");
    else setThreads(data || []);
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white"><Navbar />
        <div className="container max-w-3xl py-16">
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-neutral-100 rounded w-1/3" />
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-neutral-100 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  const statusLabel: Record<string, { label: string; color: string }> = {
    pending: { label: "Pending", color: "#f59e0b" },
    approved: { label: "Active", color: "#16a34a" },
    rejected: { label: "Rejected", color: "#dc2626" },
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container max-w-3xl px-6" style={{ paddingTop: "96px", paddingBottom: "80px" }}>

        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.22em] text-neutral-400 mb-2" style={montserrat}>Inbox</p>
          <h1 className="text-3xl font-bold text-neutral-900" style={playfair}>Messages</h1>
          <div className="silver-rule mt-6" />
        </div>

        {threads.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="h-10 w-10 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-neutral-900 mb-2" style={playfair}>No messages yet</h3>
            <p className="text-sm text-neutral-500" style={montserrat}>When you contact a seller, your conversations will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((thread) => {
              const otherUser = thread.buyer_id === user?.id ? thread.seller_profile : thread.buyer_profile;
              const role = thread.buyer_id === user?.id ? "Buying" : "Selling";
              const status = statusLabel[thread.status] || { label: thread.status, color: "#999" };
              return (
                <div
                  key={thread.id}
                  className="flex items-center justify-between p-5 bg-white cursor-pointer hover:bg-neutral-50 transition-colors rounded-sm"
                  style={{ border: "1px solid #e8e8e8" }}
                  onClick={() => navigate(`/messages/${thread.id}`)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-4 w-4 text-neutral-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-neutral-900 truncate" style={playfair}>
                        {thread.listings?.title || "Unknown Listing"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-neutral-400" style={montserrat}>With: {otherUser?.name || "Unknown"}</p>
                        <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm" style={{ ...montserrat, background: "#f5f5f5", color: "#888", fontSize: "10px" }}>{role}</span>
                        <span className="text-xs font-semibold" style={{ ...montserrat, color: status.color, fontSize: "10px" }}>{status.label}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-300 shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
