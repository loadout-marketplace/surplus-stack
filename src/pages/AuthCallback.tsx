import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    // Listen for the SIGNED_IN event which fires after token exchange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
  subscription.unsubscribe();
  // Check if this is an email confirmation
  const params = new URLSearchParams(window.location.search);
  const isEmailConfirm = params.get('type') === 'signup' || window.location.hash.includes('type=signup');
  if (isEmailConfirm) {
    navigate("/auth?email_confirmed=true", { replace: true });
  } else {
    navigate("/", { replace: true });
  }
}
    });

    // Also check immediately in case session already exists
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe();
        navigate("/", { replace: true });
      }
    });

    // Safety timeout — if nothing happens in 5s, go to auth
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      navigate("/auth", { replace: true });
    }, 5000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div
          className="mx-auto mb-4"
          style={{
            width: "32px",
            height: "32px",
            border: "3px solid #e5e5e5",
            borderTop: "3px solid #111",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "13px", color: "#888" }}>
          Signing you in…
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
