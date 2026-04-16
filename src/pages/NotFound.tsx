import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";

const playfair: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const montserrat: React.CSSProperties = { fontFamily: "'Montserrat', sans-serif" };

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <p className="text-xs uppercase tracking-[0.22em] text-neutral-400 mb-6" style={montserrat}>
          Page Not Found
        </p>
        <h1 className="text-[120px] font-bold leading-none text-neutral-900 mb-4" style={playfair}>
          404
        </h1>
        <div className="silver-rule max-w-[60px] mx-auto mb-8" />
        <p className="text-base text-neutral-500 mb-10 max-w-sm" style={montserrat}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center h-11 px-8 text-white text-xs font-bold uppercase tracking-wider rounded-sm"
          style={{ ...montserrat, background: "#111" }}
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
