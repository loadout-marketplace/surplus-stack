import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

const playfair: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const montserrat: React.CSSProperties = { fontFamily: "'Montserrat', sans-serif" };
const inputClass = "h-11 rounded-sm border-neutral-200 bg-white text-sm placeholder:text-neutral-300 focus:border-neutral-500 focus:ring-0";
const labelClass = "text-xs font-semibold uppercase tracking-wider text-neutral-500";

const EditProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => { if (!authLoading && !user) { toast.error("Please sign in"); navigate("/auth"); } }, [user, authLoading, navigate]);
  useEffect(() => { if (user) fetchProfile(); }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("profiles").select("company_name, bio, avatar_url").eq("id", user.id).maybeSingle();
    if (error) toast.error("Failed to load profile");
    else if (data) { setCompanyName(data.company_name || ""); setBio(data.bio || ""); setAvatarUrl(data.avatar_url); }
    setLoading(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be less than 5MB"); return; }
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("listing-images").upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("listing-images").getPublicUrl(fileName);
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
      if (updateError) throw updateError;
      setAvatarUrl(publicUrl);
      toast.success("Profile picture updated");
    } catch { toast.error("Failed to upload image"); }
    finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ company_name: companyName.trim() || null, bio: bio.trim() || null }).eq("id", user.id);
    if (error) toast.error("Failed to save profile");
    else toast.success("Profile saved successfully");
    setSaving(false);
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-white"><Navbar /><div className="container max-w-2xl py-16"><div className="animate-pulse space-y-4"><div className="h-8 bg-neutral-100 rounded w-1/3" /><div className="h-64 bg-neutral-100 rounded" /></div></div></div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container max-w-2xl px-6" style={{ paddingTop: "96px", paddingBottom: "80px" }}>

        <div className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-neutral-400 mb-4" style={montserrat}>Account</p>
          <h1 className="text-3xl font-bold text-neutral-900" style={playfair}>Edit Profile</h1>
          <div className="silver-rule max-w-[60px] mx-auto mt-6" />
        </div>

        <div className="bg-white rounded-sm p-8 md:p-10 space-y-8" style={{ border: "1px solid #e8e8e8", boxShadow: "0 2px 24px rgba(0,0,0,0.04)" }}>

          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24" style={{ border: "2px solid #e8e8e8" }}>
                <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                <AvatarFallback className="bg-neutral-100"><User className="h-10 w-10 text-neutral-400" /></AvatarFallback>
              </Avatar>
              <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 p-1.5 rounded-full cursor-pointer transition-colors" style={{ background: "#111" }}>
                {uploading ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" /> : <Camera className="h-3.5 w-3.5 text-white" />}
              </label>
              <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
            </div>
            <p className="text-xs text-neutral-400" style={montserrat}>Click the camera icon to upload a photo</p>
          </div>

          <div className="silver-rule" />

          {/* Fields */}
          <div className="space-y-6">
            <div className="space-y-1.5">
              <Label className={labelClass} style={montserrat}>Business / Company Name</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="ABC Construction LLC" className={inputClass} style={montserrat} />
              <p className="text-xs text-neutral-400" style={montserrat}>Optional — shown on your listings</p>
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass} style={montserrat}>Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell buyers about your business..." rows={4} className="rounded-sm border-neutral-200 text-sm placeholder:text-neutral-300 resize-none" style={montserrat} />
              <p className="text-xs text-neutral-400" style={montserrat}>A short description visible on your seller profile</p>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="w-full h-11 text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors" style={{ ...montserrat, background: saving ? "#666" : "#111" }}>
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
