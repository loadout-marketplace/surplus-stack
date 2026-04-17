import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import loadoutLogo from "@/assets/loadout-logo.png";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  confirmPassword: z.string(),
  username: z.string().trim().min(2).max(50),
  zipcode: z.string().regex(/^\d{5}$/, "ZIP code must be 5 digits"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const signInSchema = z.object({
  emailOrUsername: z.string().trim().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

const playfair: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const montserrat: React.CSSProperties = { fontFamily: "'Montserrat', sans-serif" };

const Auth = () => {
  const navigate = useNavigate();
  const { user, signUp, signIn, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      username: formData.get("username") as string,
      email: formData.get("signup-email") as string,
      password: formData.get("signup-password") as string,
      confirmPassword: formData.get("confirm-password") as string,
      zipcode: formData.get("zipcode") as string,
    };
    const v = signUpSchema.safeParse(data);
    if (!v.success) { toast.error(v.error.errors[0].message); setLoading(false); return; }
    const { error } = await signUp(data.email, data.password, data.username, data.zipcode);
    if (error) toast.error(error.message || "Failed to sign up");
    else { toast.success("Account created! Welcome to Loadout."); navigate("/"); }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      emailOrUsername: formData.get("signin-email") as string,
      password: formData.get("signin-password") as string,
    };
    const v = signInSchema.safeParse(data);
    if (!v.success) { toast.error(v.error.errors[0].message); setLoading(false); return; }
    const { error } = await signIn(data.emailOrUsername, data.password);
    if (error) toast.error(error.message || "Failed to sign in");
    else { toast.success("Welcome back!"); navigate("/"); }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) { toast.error(error.message || "Failed to sign in with Google"); setGoogleLoading(false); }
    // On success, Supabase redirects automatically
  };

  const inputClass = "h-11 rounded-sm border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-300 focus:border-neutral-500 focus:ring-0";
  const labelClass = "text-xs font-semibold uppercase tracking-wider text-neutral-500";

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#f7f7f7" }}>
      <div className="w-full max-w-md bg-white" style={{ border: "1px solid #e5e5e5", boxShadow: "0 4px 32px rgba(0,0,0,0.07)", borderRadius: "2px" }}>

        {/* Header */}
        <div className="px-10 pt-10 pb-8 text-center" style={{ borderBottom: "1px solid #f0f0f0" }}>
          <img src={loadoutLogo} alt="Loadout Marketplace" className="h-12 w-auto mx-auto mb-5" />
          <h1 className="text-2xl font-bold text-neutral-900 mb-1" style={playfair}>Loadout Marketplace</h1>
          <p className="text-xs text-neutral-400 uppercase tracking-wider" style={montserrat}>Professional Surplus Exchange</p>
        </div>

        <div className="px-10 py-8">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-neutral-100 rounded-sm p-0.5 mb-6">
              <TabsTrigger value="signin" className="rounded-sm text-xs font-semibold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm text-neutral-400" style={montserrat}>
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-sm text-xs font-semibold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm text-neutral-400" style={montserrat}>
                Create Account
              </TabsTrigger>
            </TabsList>

            {/* Sign In */}
            <TabsContent value="signin">
              {/* Google Sign In */}
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full h-11 flex items-center justify-center gap-3 rounded-sm border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors mb-5 text-sm font-semibold text-neutral-700"
                style={montserrat}
              >
                {/* Google SVG Icon */}
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                {googleLoading ? "Redirecting…" : "Continue with Google"}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-neutral-100" />
                <span className="text-xs text-neutral-400 uppercase tracking-wider" style={montserrat}>or</span>
                <div className="flex-1 h-px bg-neutral-100" />
              </div>

              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email" className={labelClass} style={montserrat}>Email or Username</Label>
                  <Input
                    id="signin-email"
                    name="signin-email"
                    type="text"
                    placeholder="you@example.com or yourhandle"
                    required
                    className={inputClass}
                    style={montserrat}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-password" className={labelClass} style={montserrat}>Password</Label>
                  <Input
                    id="signin-password"
                    name="signin-password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className={inputClass}
                    style={montserrat}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 text-white text-xs font-bold uppercase tracking-wider rounded-sm mt-2"
                  style={{ ...montserrat, background: "#111" }}
                  disabled={loading}
                >
                  {loading ? "Signing In…" : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            {/* Sign Up */}
            <TabsContent value="signup">
              {/* Google Sign Up */}
              <button
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
                  <Input id="signup-password" name="signup-password" type="password" placeholder="Min. 8 chars, 1 uppercase, 1 number" required className={inputClass} style={montserrat} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className={labelClass} style={montserrat}>Confirm Password</Label>
                  <Input id="confirm-password" name="confirm-password" type="password" placeholder="••••••••" required className={inputClass} style={montserrat} />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 text-white text-xs font-bold uppercase tracking-wider rounded-sm mt-2"
                  style={{ ...montserrat, background: "#111" }}
                  disabled={loading}
                >
                  {loading ? "Creating Account…" : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="px-10 pb-8 text-center" style={{ borderTop: "1px solid #f0f0f0", paddingTop: "20px" }}>
          <p className="text-xs text-neutral-400" style={montserrat}>
            By continuing, you agree to our{" "}
            <a href="/Loadout_Marketplace_Terms_of_Service.pdf" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-neutral-700 transition-colors">
              Terms of Service
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
