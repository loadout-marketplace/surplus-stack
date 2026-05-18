import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import loadoutLogo from "@/assets/loadout-logo.png";

const playfair: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const montserrat: React.CSSProperties = { fontFamily: "'Montserrat', sans-serif" };

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast.error(error.message);
    else { toast.success("Password updated! Please sign in."); navigate("/auth"); }
    setLoading(false);
  };

  const inputClass = "h-11 rounded-sm border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-300 focus:border-neutral-500 focus:ring-0";
  const labelClass = "text-xs font-semibold uppercase tracking-wider text-neutral-500";

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#f7f7f7" }}>
      <div className="w-full max-w-md bg-white" style={{ border: "1px solid #e5e5e5", boxShadow: "0 4px 32px rgba(0,0,0,0.07)", borderRadius: "2px" }}>
        <div className="px-10 pt-10 pb-8 text-center" style={{ borderBottom: "1px solid #f0f0f0" }}>
          <img src={loadoutLogo} alt="Loadout Marketplace" className="h-12 w-auto mx-auto mb-5" />
          <h1 className="text-2xl font-bold text-neutral-900 mb-1" style={playfair}>Reset Password</h1>
          <p className="text-xs text-neutral-400 uppercase tracking-wider" style={montserrat}>Enter your new password below</p>
        </div>
        <div className="px-10 py-8">
          <form onSubmit={handleReset} className="space-y-5">
            <div className="space-y-1.5">
              <Label className={labelClass} style={montserrat}>New Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" required className={inputClass} style={montserrat} />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass} style={montserrat}>Confirm Password</Label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required className={inputClass} style={montserrat} />
            </div>
            <button type="submit" disabled={loading} className="w-full h-11 text-white text-xs font-bold uppercase tracking-wider rounded-sm" style={{ ...montserrat, background: "#111" }}>
              {loading ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
