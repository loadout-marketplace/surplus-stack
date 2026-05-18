import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Mail } from "lucide-react";

const playfair: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const montserrat: React.CSSProperties = { fontFamily: "'Montserrat', sans-serif" };

const ConfirmEmail = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container max-w-md px-6 flex flex-col items-center justify-center" style={{ paddingTop: "160px", paddingBottom: "80px" }}>
        <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center mb-6">
          <Mail className="h-8 w-8 text-neutral-700" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-3 text-center" style={playfair}>Check your email</h1>
        <p className="text-sm text-neutral-500 text-center mb-8 leading-relaxed" style={montserrat}>
          We sent a confirmation link to your email address. Click it to activate your account before signing in.
        </p>
        <div className="p-4 rounded-sm w-full mb-8" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <p className="text-xs text-green-600 text-center" style={montserrat}>
            Once confirmed, come back here and sign in to start listing or browsing materials.
          </p>
        </div>
        <Link to="/auth">
          <button className="h-11 px-8 text-white text-xs font-bold uppercase tracking-wider rounded-sm" style={{ ...montserrat, background: "#111" }}>
            Go to Sign In
          </button>
        </Link>
      </div>
    </div>
  );
};

export default ConfirmEmail;
