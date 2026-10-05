import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { z } from "zod";
import { Sparkles } from "lucide-react";

const sanitizeText = (text: string): string => {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/[<>]/g, '')
    .trim();
};

const listingSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters")
    .refine((val) => !/<script|<img|<iframe|javascript:|on\w+\s*=/i.test(val), { message: "Title contains invalid characters" }),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(5000),
  priceType: z.enum(["fixed", "auction"]),
  fixedPrice: z.number().positive().max(1000000).optional(),
  startingBid: z.number().positive().max(1000000).optional(),
  buyNowPrice: z.number().positive().max(1000000).optional(),
  quantity: z.number().positive().max(10000),
  city: z.string().trim().min(1, "City is required").max(50),
  state: z.string().trim().length(2, "State must be 2 letters"),
  zip: z.string().trim().regex(/^\d{5}$/, "ZIP must be 5 digits"),
}).refine((data) => {
  if (data.priceType === "fixed") return data.fixedPrice !== undefined && data.fixedPrice > 0;
  if (data.priceType === "auction") return data.startingBid !== undefined && data.startingBid > 0;
  return false;
}, { message: "Price is required", path: ["fixedPrice"] });

const playfair: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const montserrat: React.CSSProperties = { fontFamily: "'Montserrat', sans-serif" };

const inputClass = "h-11 rounded-sm border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-300 focus:border-neutral-500 focus:ring-0";
const labelClass = "text-xs font-semibold uppercase tracking-wider text-neutral-500";

const SectionHeader = ({ title }: { title: string }) => (
  <div className="pb-4 mb-6" style={{ borderBottom: "1px solid #f0f0f0" }}>
    <h2 className="text-lg font-bold text-neutral-900" style={playfair}>{title}</h2>
  </div>
);

const CreateListing = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [priceType, setPriceType] = useState<"fixed" | "auction">("fixed");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [customUnit, setCustomUnit] = useState<string>("");
  const [allowPartialQuantity, setAllowPartialQuantity] = useState(false);
  const [minQuantityIncrement, setMinQuantityIncrement] = useState<string>("");
  const [fixedPriceValue, setFixedPriceValue] = useState<string>("");
  const [startingBidValue, setStartingBidValue] = useState<string>("");
  const [titleValue, setTitleValue] = useState<string>("");
  const [descriptionValue, setDescriptionValue] = useState<string>("");
  const [cityValue, setCityValue] = useState<string>("");
  const [stateValue, setStateValue] = useState<string>("");
  const [zipValue, setZipValue] = useState<string>("");
  const [quantityValue, setQuantityValue] = useState<string>("");
  const [stripeConnectLoading, setStripeConnectLoading] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const calculateSellerReceives = (price: string) => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) return null;
    return (numPrice * 0.901).toFixed(2);
  };

  useEffect(() => {
    if (!authLoading && !user) { toast.error("Please sign in to create a listing"); navigate("/auth"); }
  }, [user, authLoading, navigate]);

  useEffect(() => { fetchCategories(); }, []);

  useEffect(() => {
    const checkStripeStatus = async () => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("stripe_account_id, stripe_onboarded").eq("id", user.id).single();
      if (data?.stripe_onboarded) setStripeConnected(true);
    };
    checkStripeStatus();
  }, [user]);

  // Restore form data after Stripe Connect redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe') === 'success') {
      setStripeConnected(true);
      const saved = localStorage.getItem('savedListingDraft');
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.priceType) setPriceType(data.priceType as "fixed" | "auction");
          if (data.selectedUnit) setSelectedUnit(data.selectedUnit);
          if (data.fixedPrice) setFixedPriceValue(data.fixedPrice);
          if (data.startingBid) setStartingBidValue(data.startingBid);
          if (data.title) setTitleValue(data.title);
          if (data.description) setDescriptionValue(data.description);
          if (data.city) setCityValue(data.city);
          if (data.state) setStateValue(data.state);
          if (data.zip) setZipValue(data.zip);
          if (data.quantity) setQuantityValue(data.quantity);
          if (data.categoryId) setSelectedCategoryId(data.categoryId);
          localStorage.removeItem('savedListingDraft');
          toast.success("Bank account connected! Your listing draft has been restored.");
        } catch (e) {
          console.error("Failed to restore draft", e);
        }
      } else {
        toast.success("Bank account connected! You can now publish listings.");
      }
    }
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    setCategories(data || []);
  };

  const handleConnectStripe = async () => {
    if (!user) return;
    setStripeConnectLoading(true);
    try {
      const draft = {
        title: titleValue,
        description: descriptionValue,
        city: cityValue,
        state: stateValue,
        zip: zipValue,
        quantity: quantityValue,
        fixedPrice: fixedPriceValue,
        startingBid: startingBidValue,
        priceType,
        selectedUnit,
        categoryId: selectedCategoryId,
      };
      localStorage.setItem('savedListingDraft', JSON.stringify(draft));

      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("create-connect-account", {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Failed to connect Stripe");
    } finally {
      setStripeConnectLoading(false);
    }
  };

  const handleAnalyzeWithAI = async () => {
    if (uploadedImages.length === 0) {
      toast.error("Upload at least one photo first");
      return;
    }
    setAiAnalyzing(true);
    try {
      const file = uploadedImages[0];
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = (reader.result as string).split(",")[1];
          const { data: { session } } = await supabase.auth.getSession();
          const { data, error } = await supabase.functions.invoke("analyze-listing-image", {
            headers: { Authorization: `Bearer ${session?.access_token}` },
            body: { imageBase64: base64, mimeType: file.type },
          });
          if (error) throw error;
          const listing = data?.listing;
          if (!listing) throw new Error("No analysis returned");

          // Block non-construction-material listings
          if (listing.isConstructionMaterial === false) {
            toast.error("This listing doesn't appear to contain construction materials. Loadout is a marketplace for surplus building materials only.");
            setAiAnalyzing(false);
            return;
          }

          if (listing.title) setTitleValue(listing.title);
          if (listing.description) setDescriptionValue(listing.description);
          if (listing.city) setCityValue(listing.city);
          if (listing.state) setStateValue(listing.state);
          if (listing.zip) setZipValue(listing.zip);
          if (listing.quantity) setQuantityValue(String(listing.quantity));
          if (listing.fixedPrice) setFixedPriceValue(String(listing.fixedPrice));
          if (listing.unit) setSelectedUnit(listing.unit);
          toast.success("AI filled in your listing details. Review before publishing.");
        } catch (err: any) {
          toast.error(err.message || "AI analysis failed");
        } finally {
          setAiAnalyzing(false);
        }
      };
      reader.onerror = () => {
        toast.error("Failed to read image file");
        setAiAnalyzing(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error(err.message || "AI analysis failed");
      setAiAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    // Stripe Connect is optional — seller can connect later when item sells
    // if (!stripeConnected) {
    //   setShowStripeModal(true);
    //   return;
    // }

    setLoading(true);

    // Backend construction material validation on every submit
    try {
      const { data: { session: validationSession } } = await supabase.auth.getSession();
      const { data: validationData, error: validationError } = await supabase.functions.invoke("validate-listing", {
        headers: { Authorization: `Bearer ${validationSession?.access_token}` },
        body: { title: titleValue, description: descriptionValue },
      });
      if (!validationError && validationData?.valid === false) {
        toast.error("This listing doesn't appear to be a construction material. Loadout is for surplus building materials only.");
        setLoading(false);
        return;
      }
    } catch {
      // Fail open — don't block legitimate listings if validation crashes
    }

    try {
      const formData = new FormData(e.currentTarget);
      const title = titleValue;
      const description = descriptionValue;
      const selectedPriceType = priceType;
      const fixedPrice = fixedPriceValue ? parseFloat(fixedPriceValue) : undefined;
      const startingBid = startingBidValue ? parseFloat(startingBidValue) : undefined;
      const buyNowPrice = formData.get("buyNowPrice") ? parseFloat(formData.get("buyNowPrice") as string) : undefined;
      const quantity = parseFloat(quantityValue);
      const city = cityValue;
      const state = stateValue;
      const zip = zipValue;

      const validation = listingSchema.safeParse({ title, description, priceType: selectedPriceType, fixedPrice, startingBid, buyNowPrice, quantity, city, state, zip });
      if (!validation.success) { toast.error(validation.error.errors[0].message); setLoading(false); return; }

      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();
      let auctionEndTime = null;
      if (selectedPriceType === "auction") {
        const durationDays = parseInt(formData.get("auctionDuration") as string);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + durationDays);
        auctionEndTime = endDate.toISOString();
      }

      const minIncrement = allowPartialQuantity && minQuantityIncrement ? parseFloat(minQuantityIncrement) : null;
      if (allowPartialQuantity && minIncrement) {
        if (minIncrement <= 0) { toast.error("Minimum quantity increment must be greater than 0"); setLoading(false); return; }
        if (minIncrement > validation.data.quantity) { toast.error("Minimum increment cannot exceed total quantity"); setLoading(false); return; }
      }

      const listingData = {
        seller_id: user.id, title: validation.data.title, slug, description: validation.data.description,
        category_id: selectedCategoryId || (formData.get("category") as string),
        condition: formData.get("condition") as "new" | "like_new" | "good" | "fair" | "salvage",
        quantity: validation.data.quantity, unit: selectedUnit === "other" ? customUnit : selectedUnit,
        fixed_price: validation.data.priceType === "fixed" ? validation.data.fixedPrice : null,
        starting_bid: validation.data.priceType === "auction" ? validation.data.startingBid : null,
        buy_now_price: validation.data.priceType === "auction" ? validation.data.buyNowPrice : null,
        auction_end_time: auctionEndTime,
        location_city: validation.data.city, location_state: validation.data.state, location_zip: validation.data.zip,
        pickup_only: formData.get("pickupOnly") === "on", shipping_available: formData.get("shippingAvailable") === "on",
        price_type: validation.data.priceType, status: "active" as const, min_quantity_increment: minIncrement,
      };

      const { data: listing, error } = await supabase.from("listings").insert(listingData).select().single();
      if (error) throw error;

      if (uploadedImages.length > 0) {
        const imageUploadPromises = uploadedImages.map(async (file, index) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${listing.id}/${Date.now()}-${index}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('listing-images').upload(fileName, file);
          if (uploadError) throw uploadError;
          const { data: { publicUrl } } = supabase.storage.from('listing-images').getPublicUrl(fileName);
          return { listing_id: listing.id, url: publicUrl, display_order: index };
        });
        const imageRecords = await Promise.all(imageUploadPromises);
        const { error: imagesError } = await supabase.from('listing_images').insert(imageRecords);
        if (imagesError) throw imagesError;
      }

      toast.success("Listing created successfully!");
      navigate(`/listings/${listing.slug}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length > 10) { toast.error("Maximum 10 images allowed"); return; }
      setUploadedImages(files);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container max-w-3xl py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-neutral-100 rounded w-1/3" />
            <div className="h-64 bg-neutral-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container max-w-3xl py-16 px-6">

        <div className="mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-neutral-400 mb-4" style={montserrat}>Sell Your Materials</p>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900" style={playfair}>Create a Listing</h1>
          <div className="silver-rule max-w-[60px] mx-auto mt-6" />
        </div>

        <div className="bg-white" style={{ border: "1px solid #e8e8e8", borderRadius: "2px", boxShadow: "0 2px 24px rgba(0,0,0,0.05)" }}>
          <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-10">

            <div className="space-y-6">
              <SectionHeader title="Basic Information" />
              <div className="space-y-1.5">
                <Label htmlFor="title" className={labelClass} style={montserrat}>Title *</Label>
                <Input id="title" name="title" value={titleValue} onChange={(e) => setTitleValue(e.target.value)} placeholder="e.g., 2x4 Pine Lumber — 100 pieces" required className={inputClass} style={montserrat} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category" className={labelClass} style={montserrat}>Category *</Label>
                <Select name="category" value={selectedCategoryId} onValueChange={setSelectedCategoryId} required>
                  <SelectTrigger className="h-11 rounded-sm border-neutral-200 text-sm" style={montserrat}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} style={montserrat}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="condition" className={labelClass} style={montserrat}>Condition *</Label>
                <Select name="condition" required>
                  <SelectTrigger className="h-11 rounded-sm border-neutral-200 text-sm" style={montserrat}>
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
              <div className="space-y-1.5">
                <Label htmlFor="description" className={labelClass} style={montserrat}>Description *</Label>
                <Textarea id="description" name="description" value={descriptionValue} onChange={(e) => setDescriptionValue(e.target.value)} rows={5} required
                  placeholder="Describe the material, its condition, dimensions, and any other relevant details..."
                  className="rounded-sm border-neutral-200 text-sm placeholder:text-neutral-300 resize-none" style={montserrat} />
              </div>
            </div>

            <div className="space-y-6">
              <SectionHeader title="Quantity & Unit" />
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="quantity" className={labelClass} style={montserrat}>Quantity *</Label>
                  <Input id="quantity" name="quantity" type="number" step="0.01" min="0" value={quantityValue} onChange={(e) => setQuantityValue(e.target.value)} placeholder="100" required className={inputClass} style={montserrat} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass} style={montserrat}>Unit *</Label>
                  <Select name="unit" value={selectedUnit} onValueChange={setSelectedUnit} required>
                    <SelectTrigger className="h-11 rounded-sm border-neutral-200 text-sm" style={montserrat}>
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
                    <Input value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} placeholder="Enter custom unit" className={`${inputClass} mt-2`} style={montserrat} required />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <SectionHeader title="Pricing" />
              <RadioGroup name="priceType" value={priceType} onValueChange={(v: "fixed" | "auction") => setPriceType(v)} className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="fixed" />
                  <Label htmlFor="fixed" className="text-sm font-medium text-neutral-700 cursor-pointer" style={montserrat}>Fixed Price</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="auction" id="auction" />
                  <Label htmlFor="auction" className="text-sm font-medium text-neutral-700 cursor-pointer" style={montserrat}>Auction</Label>
                </div>
              </RadioGroup>

              {priceType === "fixed" && (
                <div className="space-y-1.5">
                  <Label htmlFor="fixedPrice" className={labelClass} style={montserrat}>Price ($) *</Label>
                  <Input id="fixedPrice" name="fixedPrice" type="number" step="0.01" min="0" placeholder="500" value={fixedPriceValue} onChange={(e) => setFixedPriceValue(e.target.value)} required className={inputClass} style={montserrat} />
                  {calculateSellerReceives(fixedPriceValue) && (
                    <p className="text-xs text-neutral-400 mt-1" style={montserrat}>
                      You receive <span className="font-semibold text-neutral-700">${calculateSellerReceives(fixedPriceValue)}</span> after the 9.9% platform fee
                    </p>
                  )}
                </div>
              )}

              {priceType === "auction" && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="startingBid" className={labelClass} style={montserrat}>Starting Bid ($) *</Label>
                      <Input id="startingBid" name="startingBid" type="number" step="0.01" min="0" placeholder="100" value={startingBidValue} onChange={(e) => setStartingBidValue(e.target.value)} required className={inputClass} style={montserrat} />
                      {calculateSellerReceives(startingBidValue) && (
                        <p className="text-xs text-neutral-400" style={montserrat}>You receive <span className="font-semibold text-neutral-700">${calculateSellerReceives(startingBidValue)}</span> after fees</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="buyNowPrice" className={labelClass} style={montserrat}>Buy Now Price ($)</Label>
                      <Input id="buyNowPrice" name="buyNowPrice" type="number" step="0.01" min="0" placeholder="500" className={inputClass} style={montserrat} />
                      <p className="text-xs text-neutral-400" style={montserrat}>Optional instant purchase price</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelClass} style={montserrat}>Auction Duration *</Label>
                    <Select name="auctionDuration" required>
                      <SelectTrigger className="h-11 rounded-sm border-neutral-200 text-sm" style={montserrat}>
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
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <SectionHeader title="Photos" />
              <div className="space-y-1.5">
                <Label htmlFor="images" className={labelClass} style={montserrat}>Upload Images</Label>
                <div className="border border-dashed border-neutral-300 rounded-sm p-6 text-center hover:border-neutral-400 transition-colors relative">
                  <Input id="images" type="file" accept="image/*" multiple onChange={handleImageChange} className="cursor-pointer opacity-0 absolute inset-0 w-full h-full" />
                  <label htmlFor="images" className="cursor-pointer pointer-events-none">
                    <p className="text-sm text-neutral-500" style={montserrat}>Click to upload up to 10 photos</p>
                    <p className="text-xs text-neutral-400 mt-1" style={montserrat}>JPG, PNG, WEBP accepted</p>
                    {uploadedImages.length > 0 && (
                      <p className="text-sm font-semibold text-neutral-800 mt-2" style={montserrat}>{uploadedImages.length} image{uploadedImages.length > 1 ? "s" : ""} selected</p>
                    )}
                  </label>
                </div>

                {/* AI Auto-Fill Button */}
                {uploadedImages.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAnalyzeWithAI}
                    disabled={aiAnalyzing}
                    className="mt-3 w-full h-11 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider rounded-sm border transition-colors"
                    style={{
                      ...montserrat,
                      borderColor: aiAnalyzing ? "#ccc" : "#111",
                      color: aiAnalyzing ? "#999" : "#111",
                      background: "white",
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {aiAnalyzing ? "Analyzing photo..." : "Auto-Fill with AI"}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <SectionHeader title="Location" />
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="city" className={labelClass} style={montserrat}>City *</Label>
                  <Input id="city" name="city" value={cityValue} onChange={(e) => setCityValue(e.target.value)} placeholder="Nashville" required className={inputClass} style={montserrat} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="state" className={labelClass} style={montserrat}>State *</Label>
                  <Input id="state" name="state" value={stateValue} onChange={(e) => setStateValue(e.target.value)} placeholder="TN" maxLength={2} required className={inputClass} style={montserrat} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="zip" className={labelClass} style={montserrat}>ZIP Code *</Label>
                  <Input id="zip" name="zip" value={zipValue} onChange={(e) => setZipValue(e.target.value)} placeholder="37201" maxLength={10} required className={inputClass} style={montserrat} />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <SectionHeader title="Delivery Options" />
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox id="pickupOnly" name="pickupOnly" defaultChecked />
                  <Label htmlFor="pickupOnly" className="text-sm font-medium text-neutral-700 cursor-pointer" style={montserrat}>Pickup only</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox id="shippingAvailable" name="shippingAvailable" />
                  <Label htmlFor="shippingAvailable" className="text-sm font-medium text-neutral-700 cursor-pointer" style={montserrat}>Shipping available</Label>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-white text-xs font-bold uppercase tracking-wider rounded-sm"
              style={{ ...montserrat, background: loading ? "#666" : "#111" }}
              disabled={loading}
            >
              {loading ? "Creating Listing..." : "Publish Listing"}
            </Button>

          </form>
        </div>
      </div>

      {showStripeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-sm p-8 max-w-sm w-full mx-4" style={{ border: "1px solid #e8e8e8", boxShadow: "0 8px 40px rgba(0,0,0,0.12)" }}>
            <h2 className="text-xl font-bold mb-2 text-neutral-900" style={playfair}>Connect Your Bank Account</h2>
            <p className="text-sm text-neutral-500 mb-6" style={montserrat}>
              You need to connect your bank account through Stripe to receive payments before you can list items on Loadout.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStripeModal(false)}
                className="flex-1 h-11 text-neutral-700 text-xs font-bold uppercase tracking-wider rounded-sm"
                style={{ ...montserrat, border: "1px solid #e0e0e0" }}
              >
                Cancel
              </button>
              <button
                onClick={handleConnectStripe}
                disabled={stripeConnectLoading}
                className="flex-1 h-11 text-white text-xs font-bold uppercase tracking-wider rounded-sm"
                style={{ ...montserrat, background: stripeConnectLoading ? "#666" : "#111" }}
              >
                {stripeConnectLoading ? "Connecting..." : "Connect Bank"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateListing;
