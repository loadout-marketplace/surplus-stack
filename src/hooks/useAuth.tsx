import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, name?: string, zipCode?: string) => Promise<{ error: any }>;
  signIn: (emailOrUsername: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name?: string, zipCode?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { name: name || '' }
      }
    });
    if (!error && data.user && zipCode) {
      await supabase.from("profiles").update({ user_zip: zipCode }).eq("id", data.user.id);
    }
    return { error };
  };

  const signIn = async (emailOrUsername: string, password: string) => {
    // Check if input looks like an email
    const isEmail = emailOrUsername.includes("@");

    if (isEmail) {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailOrUsername,
        password,
      });
      return { error };
    } else {
      // Look up email by username in profiles table
      const { data: profile, error: lookupError } = await supabase
        .from("profiles")
        .select("id")
        .eq("name", emailOrUsername.trim())
        .maybeSingle();

      if (lookupError || !profile) {
        return { error: { message: "No account found with that username." } };
      }

      // Get email from auth.users via the profile id using a workaround:
      // Sign in attempt will fail with wrong credentials but we need the email.
      // Instead, use the profile id to fetch the user's email via admin or RPC.
      // Fallback: prompt user to use email if username lookup fails at auth level.
      const { data: userData, error: userError } = await supabase
        .rpc("get_user_email_by_id", { user_id: profile.id })
        .single();

      if (userError || !userData) {
        return { error: { message: "Could not find account. Please try signing in with your email." } };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: userData as string,
        password,
      });
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signInWithGoogle, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
