import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/", { replace: true });
      } else if (event === "SIGNED_OUT") {
        navigate("/auth", { replace: true });
      }
    });

    // Also handle the hash fragment from OAuth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/", { replace: true });
      } else {
        navigate("/auth", { replace: true });
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto mb-4"></div>
        <p className="text-sm text-neutral-500" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          Signing you in…
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
