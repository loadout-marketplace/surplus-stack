import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface BidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  listingTitle: string;
  currentHighestBid: number | null;
  startingBid: number | null;
  onBidPlaced: () => void;
}

export const BidDialog = ({
  open,
  onOpenChange,
  listingId,
  listingTitle,
  currentHighestBid,
  startingBid,
  onBidPlaced,
}: BidDialogProps) => {
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // Calculate minimum bid (5% increment rule)
  const minimumBid =
    currentHighestBid && currentHighestBid >= (startingBid || 0)
      ? currentHighestBid * 1.05
      : startingBid || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const amount = parseFloat(bidAmount);

    if (isNaN(amount) || amount < minimumBid) {
      toast.error(`Bid must be at least $${minimumBid.toFixed(2)}`);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.from("bids").insert({
        listing_id: listingId,
        amount: amount,
        bidder_id: (await supabase.auth.getUser()).data.user?.id,
      });

      if (error) {
        // Extract error message if it's from our trigger
        const errorMessage = error.message.includes("Bid must be at least")
          ? error.message
          : "Failed to place bid";
        toast.error(errorMessage);
      } else {
        toast.success("Bid placed successfully!");
        setBidAmount("");
        onOpenChange(false);
        onBidPlaced();
      }
    } catch (error) {
      console.error("Error placing bid:", error);
      toast.error("Failed to place bid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Place Your Bid</DialogTitle>
          <DialogDescription>
            Bidding on: <span className="font-semibold">{listingTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {currentHighestBid && currentHighestBid >= (startingBid || 0)
                    ? "Current Bid:"
                    : "Starting Bid:"}
                </span>
                <span className="font-semibold">
                  ${currentHighestBid && currentHighestBid >= (startingBid || 0)
                    ? currentHighestBid.toLocaleString()
                    : startingBid?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Minimum Bid:</span>
                <span className="font-semibold text-primary">
                  ${minimumBid.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bidAmount">Your Bid Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="bidAmount"
                  type="number"
                  step="0.01"
                  min={minimumBid}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="pl-7"
                  placeholder={minimumBid.toFixed(2)}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Bids must be at least 5% higher than the current bid
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Placing Bid..." : "Place Bid"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
