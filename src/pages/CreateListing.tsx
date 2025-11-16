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
import { toast } from "sonner";
import { z } from "zod";

// Validation schema for listing creation
const listingSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(5000, "Description must be less than 5000 characters"),
  price: z.number().positive("Price must be positive").max(1000000, "Price seems unrealistic"),
  quantity: z.number().positive("Quantity must be positive").int("Quantity must be a whole number").max(10000, "Quantity seems unrealistic"),
  city: z.string().trim().min(1, "City is required").max(50, "City name too long"),
  state: z.string().trim().length(2, "State must be 2 letters"),
  zip: z.string().trim().regex(/^\d{5}$/, "ZIP must be 5 digits"),
});

const CreateListing = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);

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
      const price = parseFloat(formData.get("price") as string);
      const quantity = parseFloat(formData.get("quantity") as string);
      const city = formData.get("city") as string;
      const state = formData.get("state") as string;
      const zip = formData.get("zip") as string;

      // Validate input data
      const validation = listingSchema.safeParse({
        title,
        description,
        price,
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

      const listingData = {
        seller_id: user.id,
        title: validation.data.title,
        slug,
        description: validation.data.description,
        category_id: formData.get("category") as string,
        condition: formData.get("condition") as "new" | "like_new" | "good" | "fair" | "salvage",
        quantity: validation.data.quantity,
        unit: formData.get("unit") as string,
        fixed_price: validation.data.price,
        location_city: validation.data.city,
        location_state: validation.data.state,
        location_zip: validation.data.zip,
        pickup_only: formData.get("pickupOnly") === "on",
        shipping_available: formData.get("shippingAvailable") === "on",
        price_type: "fixed" as const,
        status: "active" as const,
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

              {/* Quantity & Pricing */}
              <div className="grid md:grid-cols-3 gap-4">
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
                  <Select name="unit" required>
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
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="500"
                    required
                  />
                </div>
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
