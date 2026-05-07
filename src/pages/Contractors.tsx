import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { CheckCircle, DollarSign, Clock, Shield, Users, TrendingUp } from "lucide-react";

const playfair: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const montserrat: React.CSSProperties = { fontFamily: "'Montserrat', sans-serif" };

const Contractors = () => {
  return (
    <>
      <SEO
        title="For Contractors | Loadout Marketplace"
        description="Turn your surplus construction materials into cash. Free to list, fast to sell, and you keep 90.1% of every sale."
        canonicalUrl="/contractors"
      />
      <div className="min-h-screen bg-white">
        <Navbar />

        {/* Hero */}
        <section style={{ background: "#111", paddingTop: "120px", paddingBottom: "80px" }}>
          <div className="container max-w-4xl px-6 text-center">
            <p className="text-xs uppercase tracking-[0.22em] text-neutral-400 mb-4" style={montserrat}>Built for the Trade</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6" style={playfair}>
              Turn Surplus Into<br />
              <span style={{ fontStyle: "italic", color: "#aaa" }}>Cash</span>
            </h1>
            <p className="text-base text-neutral-400 max-w-xl mx-auto mb-10" style={montserrat}>
              Every job leaves behind leftover materials. Stop hauling them to the dump. List them free on Loadout and connect with buyers in your area.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/create-listing">
                <button className="h-12 px-10 text-black text-xs font-bold uppercase tracking-wider rounded-sm" style={{ ...montserrat, background: "#fff" }}>
                  Post a Free Listing
                </button>
              </Link>
              <Link to="/listings">
                <button className="h-12 px-10 text-white text-xs font-bold uppercase tracking-wider rounded-sm" style={{ ...montserrat, border: "1px solid rgba(255,255,255,0.25)", background: "transparent" }}>
                  Browse Materials
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section style={{ background: "#f7f7f7", borderBottom: "1px solid #ebebeb" }}>
          <div className="container max-w-4xl px-6">
            <div className="grid grid-cols-3 divide-x divide-neutral-200">
              {[
                { n: "Free", label: "To List" },
                { n: "90.1%", label: "You Keep" },
                { n: "48hrs", label: "Avg Time to Sell" },
              ].map((s) => (
                <div key={s.label} className="py-10 text-center">
                  <p className="text-3xl font-bold text-neutral-900 mb-1" style={playfair}>{s.n}</p>
                  <p className="text-xs uppercase tracking-wider text-neutral-400" style={montserrat}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section style={{ padding: "80px 0" }}>
          <div className="container max-w-4xl px-6">
            <div className="text-center mb-14">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-3" style={montserrat}>Simple Process</p>
              <h2 className="text-3xl font-bold text-neutral-900" style={playfair}>List in Under 3 Minutes</h2>
              <div className="w-12 h-px bg-neutral-300 mx-auto mt-5" />
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { step: "01", icon: Clock, title: "Snap & List", desc: "Take a photo, add a title and price, and your listing is live. No lengthy forms, no approval process." },
                { step: "02", icon: Users, title: "Buyer Reaches Out", desc: "Local contractors and DIYers find your listing and contact you directly through secure messaging." },
                { step: "03", icon: DollarSign, title: "Get Paid", desc: "Complete the sale through Stripe's secure checkout. Funds hit your account within 2 business days." },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="h-14 w-14 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-5">
                    <item.icon className="h-6 w-6 text-neutral-700" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-300 mb-2" style={montserrat}>Step {item.step}</p>
                  <h3 className="text-lg font-bold text-neutral-900 mb-2" style={playfair}>{item.title}</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed" style={montserrat}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section style={{ background: "#f7f7f7", borderTop: "1px solid #ebebeb", padding: "80px 0" }}>
          <div className="container max-w-4xl px-6">
            <div className="text-center mb-14">
              <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-3" style={montserrat}>Why Loadout</p>
              <h2 className="text-3xl font-bold text-neutral-900" style={playfair}>Built for How You Work</h2>
              <div className="w-12 h-px bg-neutral-300 mx-auto mt-5" />
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {[
                { icon: CheckCircle, title: "Free to list", desc: "No listing fees, no monthly subscription. You only pay when you sell." },
                { icon: Shield, title: "Secure payments", desc: "Every transaction runs through Stripe. Your money is protected from day one." },
                { icon: TrendingUp, title: "Local buyers", desc: "Loadout connects you with contractors and DIYers in your area — no shipping headaches." },
                { icon: DollarSign, title: "You keep 90.1%", desc: "A small 9.9% platform fee applies only to completed sales. That's it." },
                { icon: Users, title: "Verified community", desc: "Buyers and sellers are real people in the construction trade — not random strangers." },
                { icon: Clock, title: "List in minutes", desc: "Three minutes from photo to live listing. Faster than posting on Craigslist." },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 p-5 bg-white rounded-sm" style={{ border: "1px solid #e8e8e8" }}>
                  <div className="h-9 w-9 rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                    <item.icon className="h-4 w-4 text-neutral-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 mb-1" style={playfair}>{item.title}</h3>
                    <p className="text-sm text-neutral-500" style={montserrat}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: "#111", padding: "80px 0" }}>
          <div className="container max-w-2xl px-6 text-center">
            <h2 className="text-3xl font-bold text-white mb-4" style={playfair}>Ready to Turn Surplus Into Cash?</h2>
            <p className="text-neutral-400 mb-8 text-sm" style={montserrat}>Join contractors across Middle Tennessee already selling on Loadout.</p>
            <Link to="/create-listing">
              <button className="h-12 px-10 text-black text-xs font-bold uppercase tracking-wider rounded-sm" style={{ ...montserrat, background: "#fff" }}>
                Post a Free Listing
              </button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

export default Contractors;
