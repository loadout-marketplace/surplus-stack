import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

// Validation schema for messages
const messageSchema = z.object({
  body: z.string().trim().min(1, "Message cannot be empty").max(5000, "Message must be less than 5000 characters"),
});

interface Message {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  sender: {
    name: string;
  };
}

interface Thread {
  id: string;
  listing_id: string;
  listings: {
    title: string;
    slug: string;
  };
  buyer_id: string;
  seller_id: string;
}

const MessageThread = () => {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please sign in to view messages");
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) {
      fetchThread();
      fetchMessages();
    }
  }, [user, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchThread = async () => {
    const { data, error } = await supabase
      .from("message_threads")
      .select("*, listings(title, slug)")
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Failed to load thread");
      console.error(error);
      navigate("/messages");
    } else {
      setThread(data);
    }
    setLoading(false);
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles(name)
      `)
      .eq("thread_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setMessages(data || []);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    // Validate message input
    const validation = messageSchema.safeParse({ body: newMessage });
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setSending(true);
    const { error } = await supabase.from("messages").insert({
      thread_id: id,
      sender_id: user.id,
      body: validation.data.body,
    });

    if (error) {
      toast.error("Failed to send message");
      console.error(error);
    } else {
      setNewMessage("");
      fetchMessages();
      
      // Update thread's updated_at
      await supabase
        .from("message_threads")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", id);
    }
    setSending(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-4xl py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-96 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!thread) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container max-w-4xl py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/messages")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Messages
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="cursor-pointer hover:underline" onClick={() => navigate(`/listings/${thread.listings.slug}`)}>
              {thread.listings.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === user?.id ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_id === user?.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm font-medium mb-1">
                        {message.sender_id === user?.id ? "You" : message.sender.name}
                      </p>
                      <p className="text-sm">{message.body}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="min-h-[80px]"
                disabled={sending}
              />
              <Button type="submit" disabled={sending || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MessageThread;
