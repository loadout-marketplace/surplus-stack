import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle, X, ChevronDown, ChevronUp, Mail } from "lucide-react";

const faqs = [
  {
    q: "How do I post a listing?",
    a: "Click 'Post Listing' in the top navigation. Fill out the details, upload photos, and hit Publish. Your listing goes live instantly."
  },
  {
    q: "Is it free to list?",
    a: "Yes! Listing is 100% free. We only charge a small 4% platform fee on completed transactions."
  },
  {
    q: "How do I contact a seller?",
    a: "Click 'Message Seller' on any listing page. You'll need to be signed in to send messages."
  },
  {
    q: "How do payments work?",
    a: "Payments are processed securely through Stripe. Funds are held safely until the transaction is complete."
  },
  {
    q: "How do I edit or delete a listing?",
    a: "Go to your Dashboard from the Account menu. You can manage all your listings from there."
  },
  {
    q: "What if I have an issue with a transaction?",
    a: "Email us at support@loadout-marketplace.com and we'll resolve it within 24 hours."
  },
];

export const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-[9999]"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl z-[9999] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold">Loadout Support</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              👋 Hi! Find quick answers below or reach out directly.
            </p>

            {faqs.map((faq, i) => (
              <div key={i} className="border rounded-sm overflow-hidden">
                <button
                  className="w-full text-left px-4 py-3 text-sm font-medium flex items-center justify-between hover:bg-neutral-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="h-4 w-4 shrink-0 text-neutral-400" /> : <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" />}
                </button>
                {openFaq === i && (
                  <div className="px-4 py-3 text-sm text-neutral-600 bg-neutral-50 border-t">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-neutral-50 rounded-b-lg">
            
              <a href="mailto:support@loadout-marketplace.com" className="flex items-center justify-center gap-2 w-full h-10 text-xs font-bold uppercase tracking-wider text-white rounded-sm bg-neutral-900 hover:bg-neutral-700 transition-colors">
  <Mail className="h-4 w-4" />
  Email Support
</a>
          </div>
        </Card>
      )}
    </>
  );
};
