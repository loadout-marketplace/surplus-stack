import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Ban } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const messageSchema = z.object({ body: z.string().trim().min(1, "Message cannot be empty").max(5000) });

interface Message { id: string; sender_id: string; body?: string; content?: string; created_at: string; sender: { name: string; avatar_url?: string | null }; }
interface Thread { id: string; listing_id: string; listings: { title: string; slug: string }; buyer_id: string; seller_id: string; status: string; }

const playfair: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const montserrat: React.CSSProperties = { fontFamily: "'Montserrat', sans-serif" };

const MessageThread = () => {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!authLoading && !user) { toast.error("Please sign in"); navigate("/auth"); } }, [user, authLoading, navigate]);
  useEffect(() => { if (user && id) { fetchThread(); fetchMessages(); } }, [user, id]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const fetchThread = async () => {
    const { data, error } = await supabase.from("message_threads").select("*, listings(title, slug)").eq("id", id).single();
    if (error) { toast.error("Failed to load thread"); navigate("/messages"); }
    else setThread(data);
    setLoading(false);
  };

  const fetchMessages = async () => {
    const { data: messagesData } = await supabase.from("messages").select("*").eq("thread_id", id).order("created_at", { ascending: true });

// Fetch sender names separately
const messagesWithSenders = await Promise.all((messagesData || []).map(async (msg) => {
  const { data: profile } = await supabase.from("profiles").select("full_name, name, company_name, avatar_url").eq("id", msg.sender_id).single();
return { ...msg, sender: { name: profile?.company_name || profile?.full_name || profile?.name || "Unknown", avatar_url: profile?.avatar_url } };
}));
setMessages(messagesWithSenders);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !thread) return;
    if (thread.status !== 'accepted' && thread.status !== 'active') { toast.error("Request must be accepted first"); return; }
    const v = messageSchema.safeParse({ body: newMessage });
    if (!v.success) { toast.error(v.error.errors[0].message); return; }
    setSending(true);
    const { error } = await supabase.from("messages").insert({ thread_id: id, sender_id: user.id, content: v.data.body, recipient_id: thread.buyer_id === user.id ? thread.seller_id : thread.buyer_id });
    if (error) toast.error("Failed to send message");
    else { setNewMessage(""); fetchMessages(); await supabase.from("message_threads").update({ updated_at: new Date().toISOString() }).eq("id", id); }
    setSending(false);
  };

  const handleAcceptRequest = async () => {
    if (!thread || !user) return;
    setUpdating(true);
    const { error } = await supabase.from("message_threads").update({ status: 'accepted' }).eq("id", thread.id);
    if (error) toast.error("Failed to accept request");
    else { toast.success("Request accepted"); fetchThread(); }
    setUpdating(false);
  };

  const handleRejectRequest = async () => {
    if (!thread || !user) return;
    setUpdating(true);
    const { error } = await supabase.from("message_threads").update({ status: 'rejected' }).eq("id", thread.id);
    if (error) toast.error("Failed to reject request");
    else { toast.success("Request rejected"); navigate("/messages"); }
    setUpdating(false);
  };

  const handleBlockUser = async () => {
    if (!thread || !user) return;
    const userToBlock = thread.buyer_id === user.id ? thread.seller_id : thread.buyer_id;
    setBlocking(true);
    const { error } = await supabase.from("blocked_users").insert({ blocker_id: user.id, blocked_id: userToBlock });
    if (error) toast.error("Failed to block user");
    else { toast.success("User blocked"); navigate("/messages"); }
    setBlocking(false);
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-white"><Navbar /><div className="container max-w-3xl py-16"><div className="animate-pulse space-y-3"><div className="h-8 bg-neutral-100 rounded w-1/3" /><div className="h-96 bg-neutral-100 rounded" /></div></div></div>;
  }
  if (!thread) return null;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container max-w-3xl px-6" style={{ paddingTop: "96px", paddingBottom: "80px" }}>

        {/* Back */}
        <button onClick={() => navigate("/messages")} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-neutral-700 transition-colors mb-8" style={montserrat}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Messages
        </button>

        {/* Thread Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.22em] text-neutral-400 mb-2" style={montserrat}>Conversation</p>
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold text-neutral-900 cursor-pointer hover:underline flex-1 mr-4" style={playfair} onClick={() => navigate(`/listings/${thread.listings.slug}`)}>
              {thread.listings.title}
            </h1>
            {(thread.status === 'accepted' || thread.status === 'active') && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-red-500 transition-colors" style={montserrat} disabled={blocking}>
                    <Ban className="h-3.5 w-3.5" /> Block
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white rounded-sm" style={{ border: "1px solid #e8e8e8" }}>
                  <AlertDialogHeader>
                    <AlertDialogTitle style={playfair}>Block this user?</AlertDialogTitle>
                    <AlertDialogDescription style={montserrat}>This user will no longer be able to send you message requests.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel style={montserrat}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBlockUser} style={{ ...montserrat, background: "#111" }}>Block User</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <div className="silver-rule mt-6" />
        </div>

        {/* Status Banners */}
        {thread.status === 'pending' && user?.id === thread.seller_id && (
          <div className="mb-6 p-5 rounded-sm" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
            <p className="text-sm font-semibold text-amber-800 mb-3" style={montserrat}>New message request</p>
            <div className="flex gap-3">
              <button onClick={handleAcceptRequest} disabled={updating} className="h-9 px-5 text-white text-xs font-bold uppercase tracking-wider rounded-sm" style={{ ...montserrat, background: "#111" }}>Accept</button>
              <button onClick={handleRejectRequest} disabled={updating} className="h-9 px-5 text-xs font-bold uppercase tracking-wider rounded-sm text-neutral-600" style={{ ...montserrat, border: "1px solid #e0e0e0" }}>Decline</button>
            </div>
          </div>
        )}
        {thread.status === 'pending' && user?.id === thread.buyer_id && (
          <div className="mb-6 p-4 rounded-sm" style={{ background: "#f0f9ff", border: "1px solid #bae6fd" }}>
            <p className="text-sm text-blue-700" style={montserrat}>Your request is pending. The seller will review it shortly.</p>
          </div>
        )}
        {thread.status === 'rejected' && (
          <div className="mb-6 p-4 rounded-sm" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
            <p className="text-sm text-red-600" style={montserrat}>This message request was declined.</p>
          </div>
        )}

        {/* Messages */}
        <div className="bg-white rounded-sm overflow-hidden" style={{ border: "1px solid #e8e8e8" }}>
          {(thread.status === 'accepted' || thread.status === 'active') ? (
            <>
              <div className="p-6 space-y-4 max-h-[480px] overflow-y-auto" style={{ background: "#fafafa" }}>
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-neutral-400 py-10" style={montserrat}>No messages yet. Start the conversation!</p>
                ) : (
                  messages.map((message) => {
                    const isMe = message.sender_id === user?.id;
                    return (
                      <div key={message.id} className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
  {!isMe && (
    <div className="h-8 w-8 rounded-full bg-neutral-200 overflow-hidden shrink-0 mb-5">
      {message.sender.avatar_url ? (
        <img src={message.sender.avatar_url} alt={message.sender.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-500">
          {message.sender.name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  )}
  <div className="max-w-[75%]">
    <p className="text-xs font-semibold uppercase tracking-wider mb-1 px-1" style={{ ...montserrat, color: isMe ? "#111" : "#999" }}>
      {isMe ? "You" : message.sender.name}
    </p>
    <div className="px-4 py-3 rounded-sm" style={{ background: isMe ? "#111" : "#fff", border: isMe ? "none" : "1px solid #e8e8e8" }}>
      <p className="text-sm leading-relaxed" style={{ ...montserrat, color: isMe ? "#fff" : "#333" }}>{message.content || message.body}</p>
    </div>
    <p className="text-xs text-neutral-400 mt-1 px-1" style={montserrat}>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
  </div>
  {isMe && (
    <div className="h-8 w-8 rounded-full bg-neutral-200 overflow-hidden shrink-0 mb-5">
      {message.sender.avatar_url ? (
        <img src={message.sender.avatar_url} alt="You" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-500">
          Y
        </div>
      )}
    </div>
  )}
</div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              <div style={{ borderTop: "1px solid #f0f0f0", padding: "16px" }}>
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <Textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message…" className="min-h-[72px] rounded-sm border-neutral-200 text-sm resize-none" style={montserrat} disabled={sending} />
                  <button type="submit" disabled={sending || !newMessage.trim()} className="h-10 w-10 rounded-sm flex items-center justify-center shrink-0 self-end transition-colors" style={{ background: newMessage.trim() ? "#111" : "#e5e5e5" }}>
                    <Send className="h-4 w-4" style={{ color: newMessage.trim() ? "#fff" : "#aaa" }} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="text-center py-16 text-sm text-neutral-400" style={montserrat}>
              {thread.status === 'pending' ? "Waiting for seller approval to start messaging." : "This conversation is no longer active."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageThread;
