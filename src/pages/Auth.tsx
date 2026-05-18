import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import loadoutLogo from "@/assets/loadout-logo.png";
import { supabase } from "@/integrations/supabase/client";

const playfair: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const montserrat: React.CSSProperties = { fontFamily: "'Montserrat', sans-serif" };

const Auth = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        toast.error(error.message);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to sign in with Google");
      setGoogleLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const emailOrUsername = (formData.get("signin-email") as string).trim();
    const password = formData.get("signin-password") as string;

    if (!emailOrUsername || !password) {
      toast.error("Please enter your email/username and password");
      setLoading(false);
      return;
    }

    const isEmail = emailOrUsername.includes("@");
    let email = emailOrUsername;

    if (!isEmail) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("name", emailOrUsername)
        .maybeSingle();
      if (!profile) {
        toast.error("No account found with that username");
        setLoading(false);
        return;
      }
      const { data: emailData } = await supabase
        .rpc("get_user_email_by_id", { user_id: profile.id })
        .single();
      if (!emailData) {
        toast.error("Could not find account. Try signing in with your email.");
        setLoading(false);
        return;
      }
      email = emailData as string;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    else { toast.success("Welcome back!"); navigate("/"); }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const username = (formData.get("username") as string).trim();
    const email = (formData.get("signup-email") as string).trim();
    const password = formData.get("signup-password") as string;
    const confirm = formData.get("confirm-password") as string;
    const zipcode = (formData.get("zipcode") as string).trim();

    if (password !== confirm) { toast.error("Passwords do not match"); setLoading(false); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); setLoading(false); return; }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { name: username },
      },
    });
    if (error) { toast.error(error.message); setLoading(false); return; }
    if (data.user && zipcode) {
      await supabase.from("profiles").update({ user_zip: zipcode }).eq("id", data.user.id);
    }
    navigate("/confirm-email");
    setLoading(false);
  };

  const isWebView = /LinkedIn|FBAN|FBAV|Instagram|Twitter/i.test(navigator.userAgent);

if (isWebView) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#f7f7f7" }}>
      <div className="w-full max-w-sm bg-white text-center p-10" style={{ border: "1px solid #e5e5e5", borderRadius: "2px", boxShadow: "0 4px 32px rgba(0,0,0,0.07)" }}>
        <img src={loadoutLogo} alt="Loadout Marketplace" className="h-10 w-auto mx-auto mb-6" />
        <h2 className="text-xl font-bold text-neutral-900 mb-3" style={playfair}>Open in Browser to Sign In</h2>
        <p className="text-sm text-neutral-500 mb-6" style={montserrat}>
          Google sign-in doesn't work inside LinkedIn's browser. Tap the menu icon and select "Open in browser" to continue.
        </p>
        <p className="text-xs text-neutral-400" style={montserrat}>loadout-marketplace.com/auth</p>
      </div>
    </div>
  );
}
  
  const inputClass = "h-11 rounded-sm border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-300 focus:border-neutral-500 focus:ring-0";
  const labelClass = "text-xs font-semibold uppercase tracking-wider text-neutral-500";

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#f7f7f7" }}>
      <div className="w-full max-w-md bg-white" style={{ border: "1px solid #e5e5e5", boxShadow: "0 4px 32px rgba(0,0,0,0.07)", borderRadius: "2px" }}>

        <div className="px-10 pt-10 pb-8 text-center" style={{ borderBottom: "1px solid #f0f0f0" }}>
          <img src={loadoutLogo} alt="Loadout Marketplace" className="h-12 w-auto mx-auto mb-5" />
          <h1 className="text-2xl font-bold text-neutral-900 mb-1" style={playfair}>Loadout Marketplace</h1>
          <p className="text-xs text-neutral-400 uppercase tracking-wider" style={montserrat}>Professional Surplus Exchange</p>
        </div>

        <div className="px-10 py-8">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-neutral-100 rounded-sm p-0.5 mb-6">
              <TabsTrigger value="signin" className="rounded-sm text-xs font-semibold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm" style={montserrat}>Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-sm text-xs font-semibold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm" style={montserrat}>Create Account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full h-11 flex items-center justify-center gap-3 rounded-sm border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors mb-5 text-sm font-semibold text-neutral-700"
                style={montserrat}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                {googleLoading ? "Redirecting…" : "Continue with Google"}
              </button>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-neutral-100" />
                <span className="text-xs text-neutral-400 uppercase tracking-wider" style={montserrat}>or</span>
                <div className="flex-1 h-px bg-neutral-100" />
              </div>
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email" className={labelClass} style={montserrat}>Email or Username</Label>
                  <Input id="signin-email" name="signin-email" type="text" placeholder="you@example.com or yourhandle" required className={inputClass} style={montserrat} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-password" className={labelClass} style={montserrat}>Password</Label>
                  <Input id="signin-password" name="signin-password" type="password" placeholder="••••••••" required className={inputClass} style={montserrat} />
                </div>
                <button type="submit" disabled={loading} className="w-full h-11 text-white text-xs font-bold uppercase tracking-wider rounded-sm" style={{ ...montserrat, background: "#111" }}>
                  {loading ? "Signing In…" : "Sign In"}
                </button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full h-11 flex items-center justify-center gap-3 rounded-sm border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors mb-5 text-sm font-semibold text-neutral-700"
                style={montserrat}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                {googleLoading ? "Redirecting…" : "Sign up with Google"}
              </button>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-neutral-100" />
                <span className="text-xs text-neutral-400 uppercase tracking-wider" style={montserrat}>or</span>
                <div className="flex-1 h-px bg-neutral-100" />
              </div>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="username" className={labelClass} style={montserrat}>Username</Label>
                  <Input id="username" name="username" type="text" placeholder="yourhandle" required className={inputClass} style={montserrat} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email" className={labelClass} style={montserrat}>Email</Label>
                  <Input id="signup-email" name="signup-email" type="email" placeholder="you@example.com" required className={inputClass} style={montserrat} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="zipcode" className={labelClass} style={montserrat}>ZIP Code</Label>
                  <Input id="zipcode" name="zipcode" type="text" inputMode="numeric" maxLength={5} placeholder="12345" required className={inputClass} style={montserrat} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password" className={labelClass} style={montserrat}>Password</Label>
                  <Input id="signup-password" name="signup-password" type="password" placeholder="Min. 8 characters" required className={inputClass} style={montserrat} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className={labelClass} style={montserrat}>Confirm Password</Label>
                  <Input id="confirm-password" name="confirm-password" type="password" placeholder="••••••••" required className={inputClass} style={montserrat} />
                </div>
                <button type="submit" disabled={loading} className="w-full h-11 text-white text-xs font-bold uppercase tracking-wider rounded-sm mt-2" style={{ ...montserrat, background: "#111" }}>
                  {loading ? "Creating Account…" : "Create Account"}
                </button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <div className="px-10 pb-8 text-center" style={{ borderTop: "1px solid #f0f0f0", paddingTop: "20px" }}>
          <p className="text-xs text-neutral-400" style={montserrat}>
            By continuing, you agree to our{" "}
            <a href="/Loadout_Marketplace_Terms_of_Service.pdf" target="_blank" rel="noopener noreferrer" className="underline hover:text-neutral-700">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
