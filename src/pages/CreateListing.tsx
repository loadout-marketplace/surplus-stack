import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { z } from "zod";

// Validation schema for listing creation
const listingSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(5000, "Description must be less than 5000 characters"),
  priceType: z.enum(["fixed", "auction"]),
  fixedPrice: z.number().positive("Price must be positive").max(1000000, "Price seems unrealistic").optional(),
  startingBid: z.number().positive("Starting bid must be positive").max(1000000, "Starting bid seems unrealistic").optional(),
  buyNowPrice: z.number().positive("Buy now price must be positive").max(1000000, "Buy now price seems unrealistic").optional(),
  quantity: z.number().positive("Quantity must be positive").int("Quantity must be a whole number").max(10000, "Quantity seems unrealistic"),
  city: z.string().trim().min(1, "City is required").max(50, "City name too long"),
  state: z.string().trim().length(2, "State must be 2 letters"),
  zip: z.string().trim().regex(/^\d{5}$/, "ZIP must be 5 digits"),
}).refine((data) => {
  if (data.priceType === "fixed") {
    return data.fixedPrice !== undefined && data.fixedPrice > 0;
  }
  if (data.priceType === "auction") {
    return data.startingBid !== undefined && data.startingBid > 0;
  }
  return false;
}, {
  message: "Price is required",
  path: ["fixedPrice"],
});

const CreateListing = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [priceType, setPriceType] = useState<"fixed" | "auction">("fixed");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [customUnit, setCustomUnit] = useState<string>("");
  const [allowPartialQuantity, setAllowPartialQuantity] = useState(false);
  const [minQuantityIncrement, setMinQuantityIncrement] = useState<string>("");
  const [fixedPriceValue, setFixedPriceValue] = useState<string>("");
  const [startingBidValue, setStartingBidValue] = useState<string>("");

  const calculateSellerReceives = (price: string) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) return null;
    return (numPrice * 0.9).toFixed(2);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please sign in to create a listing");
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    setCategories(data || []);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const selectedPriceType = formData.get("priceType") as "fixed" | "auction";
      const fixedPrice = formData.get("fixedPrice") ? parseFloat(formData.get("fixedPrice") as string) : undefined;
      const startingBid = formData.get("startingBid") ? parseFloat(formData.get("startingBid") as string) : undefined;
      const buyNowPrice = formData.get("buyNowPrice") ? parseFloat(formData.get("buyNowPrice") as string) : undefined;
      const quantity = parseFloat(formData.get("quantity") as string);
      const city = formData.get("city") as string;
      const state = formData.get("state") as string;
      const zip = formData.get("zip") as string;

      // Validate input data
      const validation = listingSchema.safeParse({
        title,
        description,
        priceType: selectedPriceType,
        fixedPrice,
        startingBid,
        buyNowPrice,
        quantity,
        city,
        state,
        zip,
      });

      if (!validation.success) {
        const firstError = validation.error.errors[0];
        toast.error(firstError.message);
        setLoading(false);
        return;
      }

      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();

      // Calculate auction end time if it's an auction
      let auctionEndTime = null;
      if (selectedPriceType === "auction") {
        const durationDays = parseInt(formData.get("auctionDuration") as string);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + durationDays);
        auctionEndTime = endDate.toISOString();
      }

      // Validate partial quantity increment if enabled
      const minIncrement = allowPartialQuantity && minQuantityIncrement 
        ? parseFloat(minQuantityIncrement) 
        : null;
      
      if (allowPartialQuantity && minIncrement) {
        if (minIncrement <= 0) {
          toast.error("Minimum quantity increment must be greater than 0");
          setLoading(false);
          return;
        }
        if (minIncrement > validation.data.quantity) {
          toast.error("Minimum increment cannot exceed total quantity");
          setLoading(false);
          return;
        }
      }

      const listingData = {
        seller_id: user.id,
        title: validation.data.title,
        slug,
        description: validation.data.description,
        category_id: formData.get("category") as string,
        condition: formData.get("condition") as "new" | "like_new" | "good" | "fair" | "salvage",
        quantity: validation.data.quantity,
        unit: selectedUnit === "other" ? customUnit : selectedUnit,
        fixed_price: validation.data.priceType === "fixed" ? validation.data.fixedPrice : null,
        starting_bid: validation.data.priceType === "auction" ? validation.data.startingBid : null,
        buy_now_price: validation.data.priceType === "auction" ? validation.data.buyNowPrice : null,
        auction_end_time: auctionEndTime,
        location_city: validation.data.city,
        location_state: validation.data.state,
        location_zip: validation.data.zip,
        pickup_only: formData.get("pickupOnly") === "on",
        shipping_available: formData.get("shippingAvailable") === "on",
        price_type: validation.data.priceType,
        status: "active" as const,
        min_quantity_increment: minIncrement,
      };

      const { data: listing, error } = await supabase
        .from("listings")
        .insert(listingData)
        .select()
        .single();

      if (error) throw error;

      // Upload images if any
      if (uploadedImages.length > 0) {
        const imageUploadPromises = uploadedImages.map(async (file, index) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${listing.id}/${Date.now()}-${index}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('listing-images')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('listing-images')
            .getPublicUrl(fileName);

          return {
            listing_id: listing.id,
            url: publicUrl,
            display_order: index,
          };
        });

        const imageRecords = await Promise.all(imageUploadPromises);

        const { error: imagesError } = await supabase
          .from('listing_images')
          .insert(imageRecords);

        if (imagesError) throw imagesError;
      }

      toast.success("Listing created successfully!");
      navigate(`/listings/${listing.slug}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create listing");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length > 10) {
        toast.error("Maximum 10 images allowed");
        return;
      }
      setUploadedImages(files);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-3xl py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container max-w-3xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create New Listing</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., 2x4 Pine Lumber - 100 pieces"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the materials, condition, and any relevant details..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select name="category" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="condition">Condition *</Label>
                  <Select name="condition" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="like_new">Like New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="salvage">Salvage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quantity & Unit */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="100"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="unit">Unit *</Label>
                  <Select 
                    name="unit" 
                    value={selectedUnit}
                    onValueChange={setSelectedUnit}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">Pieces</SelectItem>
                      <SelectItem value="linear_ft">Linear Feet</SelectItem>
                      <SelectItem value="sq_ft">Square Feet</SelectItem>
                      <SelectItem value="tons">Tons</SelectItem>
                      <SelectItem value="lbs">Pounds</SelectItem>
                      <SelectItem value="pallets">Pallets</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedUnit === "other" && (
                    <Input
                      id="customUnit"
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      placeholder="Enter custom unit (e.g., yards, boxes)"
                      className="mt-2"
                      required
                    />
                  )}
                </div>
              </div>

              {/* Partial Quantity Option */}
              <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="allowPartialQuantity" 
                    checked={allowPartialQuantity}
                    onCheckedChange={(checked) => setAllowPartialQuantity(checked === true)}
                  />
                  <Label htmlFor="allowPartialQuantity" className="font-normal cursor-pointer">
                    Allow bids/purchases on partial quantities
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enable this to let buyers bid on or purchase a portion of your total quantity
                </p>
                
                {allowPartialQuantity && (
                  <div>
                    <Label htmlFor="minQuantityIncrement">Minimum Quantity Increment *</Label>
                    <Input
                      id="minQuantityIncrement"
                      type="number"
                      step="0.01"
                      min="1"
                      value={minQuantityIncrement}
                      onChange={(e) => setMinQuantityIncrement(e.target.value)}
                      placeholder="e.g., 5 (buyers can bid on 5, 10, 15... units)"
                      required
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Buyers can bid/purchase in multiples of this amount
                    </p>
                  </div>
                )}
              </div>

              {/* Pricing Type */}
              <div className="space-y-4">
                <h3 className="font-semibold">Pricing</h3>
                <RadioGroup 
                  name="priceType" 
                  value={priceType} 
                  onValueChange={(value: "fixed" | "auction") => setPriceType(value)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed" className="font-normal cursor-pointer">
                      Fixed Price
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auction" id="auction" />
                    <Label htmlFor="auction" className="font-normal cursor-pointer">
                      Auction
                    </Label>
                  </div>
                </RadioGroup>

                {priceType === "fixed" && (
                  <div>
                    <Label htmlFor="fixedPrice">Price ($) *</Label>
                    <Input
                      id="fixedPrice"
                      name="fixedPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="500"
                      value={fixedPriceValue}
                      onChange={(e) => setFixedPriceValue(e.target.value)}
                      required
                    />
                    {calculateSellerReceives(fixedPriceValue) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Seller receives <span className="font-semibold text-foreground">${calculateSellerReceives(fixedPriceValue)}</span> after fees
                      </p>
                    )}
                  </div>
                )}

                {priceType === "auction" && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startingBid">Starting Bid ($) *</Label>
                        <Input
                          id="startingBid"
                          name="startingBid"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="100"
                          value={startingBidValue}
                          onChange={(e) => setStartingBidValue(e.target.value)}
                          required
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Minimum price to start bidding
                        </p>
                        {calculateSellerReceives(startingBidValue) && (
                          <p className="text-sm text-muted-foreground">
                            Seller receives <span className="font-semibold text-foreground">${calculateSellerReceives(startingBidValue)}</span> after fees
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="buyNowPrice">Buy Now Price ($)</Label>
                        <Input
                          id="buyNowPrice"
                          name="buyNowPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="500"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Optional instant purchase price
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="auctionDuration">Auction Duration *</Label>
                      <Select name="auctionDuration" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Day</SelectItem>
                          <SelectItem value="3">3 Days</SelectItem>
                          <SelectItem value="5">5 Days</SelectItem>
                          <SelectItem value="7">7 Days</SelectItem>
                          <SelectItem value="14">14 Days</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground mt-1">
                        How long the auction will run
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Images */}
              <div>
                <Label htmlFor="images">Images</Label>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Upload up to 10 images (JPG, PNG, WEBP)
                </p>
                {uploadedImages.length > 0 && (
                  <p className="text-sm text-primary mt-1">
                    {uploadedImages.length} image(s) selected
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Provide details about the material, its condition, dimensions, and any other relevant information..."
                  rows={6}
                  required
                />
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="font-semibold">Location</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input id="city" name="city" placeholder="Chicago" required />
                  </div>

                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      placeholder="IL"
                      maxLength={2}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="zip">ZIP Code *</Label>
                    <Input
                      id="zip"
                      name="zip"
                      placeholder="60601"
                      maxLength={10}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Options */}
              <div className="space-y-4">
                <h3 className="font-semibold">Delivery Options</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="pickupOnly" name="pickupOnly" defaultChecked />
                    <Label htmlFor="pickupOnly" className="font-normal">
                      Pickup only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="shippingAvailable" name="shippingAvailable" />
                    <Label htmlFor="shippingAvailable" className="font-normal">
                      Shipping available
                    </Label>
                  </div>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Creating..." : "Create Listing"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateListing;
