import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Package, Shield, ArrowRight, Search, MapPin, Clock,
  UserCheck, MessageSquareText, Zap, Camera, Handshake, CircleDollarSign
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { WelcomeStats } from "@/components/WelcomeStats";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";

const getTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

interface RecentListing {
  id: string;
  title: string;
  slug: string;
  fixed_price: number | null;
  starting_bid: number | null;
  condition: string;
  location_city: string;
  location_state: string;
  quantity: number;
  unit: string;
  created_at: string;
  listing_images: { url: string }[];
  categories: { name: string } | null;
}

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [heroCategory, setHeroCategory] = useState("all");
  const [heroSearch, setHeroSearch] = useState("");
  const [recentListings, setRecentListings] = useState<RecentListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [stats, setStats] = useState({ listings: 0, sellers: 0 });

  useEffect(() => {
    const fetchStats = async () => {
  const { count: listingCount } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");
  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });
  setStats({
    listings: listingCount || 0,
    sellers: userCount || 0,
  });
};
    fetchStats();
  }, []);
  
  useEffect(() => {
    const fetchRecent = async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, title, slug, fixed_price, starting_bid, condition, location_city, location_state, quantity, unit, created_at, listing_images(url), categories(name)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(6);
      setRecentListings((data as RecentListing[]) || []);
      setLoadingListings(false);
    };
    fetchRecent();
  }, []);

  const heroCategories = [
    { value: "all", label: "All Categories" },
    { value: "lumber", label: "Lumber" },
    { value: "roofing", label: "Roofing" },
    { value: "electrical", label: "Electrical" },
    { value: "plumbing", label: "Plumbing" },
    { value: "tools", label: "Tools" },
    { value: "flooring", label: "Flooring" },
    { value: "insulation", label: "Insulation" },
    { value: "hardware", label: "Hardware" },
  ];

  const handleHeroSearch = () => {
    const params = new URLSearchParams();
    if (heroSearch) params.set("q", heroSearch);
    if (heroCategory !== "all") params.set("category", heroCategory);
    navigate(`/listings${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Loadout Marketplace - Buy and Sell Surplus Construction Materials",
    description: "Buy and sell surplus construction materials near you. Free to list.",
    url: "https://loadoutmarketplace.com",
  };

  const playfair: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
  const montserrat: React.CSSProperties = { fontFamily: "'Montserrat', sans-serif" };

  return (
    <>
      <SEO
        title="Loadout Marketplace | Buy and Sell Surplus Construction Materials Near You"
        description="Buy and sell surplus construction materials near you. Free to list. Trusted by contractors and DIYers nationwide."
        keywords="surplus construction materials, building materials marketplace, discount lumber near me, used construction supplies, contractor materials"
        canonicalUrl="/"
        structuredData={structuredData}
      />

      <div className="min-h-screen bg-white pt-16">
        <Navbar />

        {/* ── HERO ──────────────────────────────────────────── */}
        <header style={{ background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
          <div className="container max-w-5xl py-28 md:py-40">
            <div className="text-center space-y-8">
              <p className="animate-fade-in-up text-xs uppercase tracking-[0.22em] text-neutral-400" style={montserrat}>
                The Surplus Marketplace
              </p>
              <h1 className="animate-fade-in-up animate-delay-100 text-4xl md:text-6xl font-bold leading-[1.1] text-neutral-900" style={playfair}>
                Buy and Sell Surplus<br />
                <span style={{ fontStyle: "italic", color: "#444" }}>Construction Materials</span>
              </h1>
              <div className="silver-rule max-w-xs mx-auto animate-fade-in-up animate-delay-200" />
              <p className="animate-fade-in-up animate-delay-200 text-base md:text-lg text-neutral-500 max-w-lg mx-auto leading-relaxed" style={montserrat}>
                Buy directly from contractors and suppliers near you. Free to list.
              </p>

              {/* Search bar */}
              <div className="animate-fade-in-up animate-delay-300 max-w-2xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-2 bg-white p-2 rounded-sm" style={{ border: "1px solid #d8d8d8", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
                  <Select value={heroCategory} onValueChange={setHeroCategory}>
                    <SelectTrigger className="sm:w-48 bg-white border border-neutral-200 h-11 rounded-sm text-sm" style={montserrat}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {heroCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value} style={montserrat}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="What are you looking for?"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleHeroSearch()}
                    className="flex-1 bg-white border border-neutral-200 h-11 rounded-sm text-sm placeholder:text-neutral-400"
                    style={montserrat}
                  />
                  <Button onClick={handleHeroSearch} className="h-11 px-6 text-white text-xs font-semibold uppercase tracking-wider rounded-sm" style={{ ...montserrat, background: "#111", minWidth: "100px" }}>
                    <Search className="h-4 w-4 mr-2" /> Search
                  </Button>
                </div>
              </div>

              {/* Stats row */}
              <div className="animate-fade-in-up animate-delay-400 flex items-center justify-center gap-10 pt-4" style={montserrat}>
                {[
  { n: "139", label: "Members" },
  { n: "Less Waste", label: "Our Mission" },
].map((s, i) => (
  <div key={i} className="text-center">
    <p className="text-2xl font-bold text-neutral-900" style={playfair}>{s.n}</p>
    <p className="text-xs text-neutral-400 uppercase tracking-wider mt-0.5">{s.label}</p>
  </div>
))}
              </div>

              {/* CTA buttons */}
              <div className="animate-fade-in-up animate-delay-400 flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link to="/create-listing">
                  <Button className="h-11 px-8 text-white text-xs font-bold uppercase tracking-[0.12em] rounded-sm btn-shimmer" style={montserrat}>
                    Post a Free Listing
                  </Button>
                </Link>
                <Link to="/listings">
                  <Button variant="outline" className="h-11 px-8 text-xs font-bold uppercase tracking-[0.12em] rounded-sm border-neutral-300 text-neutral-700 hover:bg-neutral-50" style={montserrat}>
                    Browse Deals
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* ── CATEGORY CHIPS ────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid #ebebeb", background: "#fff", padding: "16px 0" }}>
          <div className="container max-w-5xl overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 min-w-max px-1">
              {["Lumber", "Roofing", "Electrical", "Plumbing", "Tools", "Flooring", "Insulation", "Hardware", "Windows & Doors", "Paint & Finishes"].map((cat) => (
                <Link key={cat} to={`/listings?category=${cat.toLowerCase()}`} className="inline-flex items-center px-4 py-2 rounded-sm border text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 hover:border-neutral-400 transition-colors whitespace-nowrap" style={{ ...montserrat, borderColor: "#e0e0e0", background: "#fff" }}>
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── TRUST STATS BAR ───────────────────────────────── */}
        <section style={{ background: "#f7f7f7", borderBottom: "1px solid #ebebeb" }}>
          <div className="container max-w-5xl">
            <ul className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-200 list-none">
              {[
  { number: "139", label: "Members" },
  { number: "Less Waste", label: "Our Mission" },
].map((stat) => (
                <li key={stat.label} className="flex flex-col items-center py-10 gap-1">
                  <span className="text-3xl md:text-4xl font-bold text-neutral-900" style={playfair}>{stat.number}</span>
                  <span className="text-xs text-neutral-400 uppercase tracking-widest" style={montserrat}>{stat.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <main>
          {user && <WelcomeStats />}

          {/* ── RECENT LISTINGS ───────────────────────────── */}
          <section style={{ background: "#fff", padding: "80px 0" }}>
            <div className="container max-w-5xl">
              <div className="flex items-baseline justify-between mb-10">
                <h2 className="text-2xl md:text-3xl font-bold text-neutral-900" style={playfair}>Recently Listed Near You</h2>
                <Link to="/listings" className="text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition-colors" style={montserrat}>
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {loadingListings ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="overflow-hidden rounded-sm">
                      <div className="h-44 bg-neutral-100 animate-pulse" />
                      <CardContent className="p-4 space-y-2">
                        <div className="h-4 bg-neutral-100 animate-pulse rounded w-3/4" />
                        <div className="h-3 bg-neutral-100 animate-pulse rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : recentListings.length === 0 ? (
                <p className="text-neutral-400 text-center py-12 text-sm" style={montserrat}>No listings yet — be the first to post!</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {recentListings.map((listing) => {
                    const price = listing.fixed_price ?? listing.starting_bid ?? 0;
                    const timeAgo = getTimeAgo(listing.created_at);
                    const isAuction = !listing.fixed_price && listing.starting_bid;
                    return (
                      <Link key={listing.id} to={`/listings/${listing.slug}`}>
                        <Card className="card-premium overflow-hidden h-full rounded-sm group" style={{ border: "1px solid #e8e8e8" }}>
                          <div className="relative h-44 bg-neutral-100 overflow-hidden">
                            {listing.listing_images?.[0]?.url ? (
                              <img src={listing.listing_images[0].url} alt={listing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                <Package className="h-10 w-10 text-neutral-300" />
                                <span className="text-xs text-neutral-400" style={montserrat}>No image</span>
                              </div>
                            )}
                            {listing.categories && (
                              <Badge className="absolute top-3 left-3 text-white text-xs font-semibold uppercase tracking-wider rounded-sm px-2 py-0.5" style={{ ...montserrat, background: "#111", fontSize: "10px" }}>
                                {listing.categories.name}
                              </Badge>
                            )}
                          </div>
                          <CardContent className="p-5 space-y-3">
                            <h3 className="font-bold text-base line-clamp-2 leading-snug text-neutral-900" style={playfair}>{listing.title}</h3>
                            <div className="flex items-center gap-3 text-xs text-neutral-400" style={montserrat}>
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{listing.location_city}, {listing.location_state}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo}</span>
                            </div>
                            <div className="flex items-baseline gap-2 pt-1">
                              <span className="text-xl font-bold text-neutral-900" style={playfair}>
                                {isAuction ? `Starting at $${price.toLocaleString()}` : `$${price.toLocaleString()}`}
                              </span>
                              {isAuction && (
                                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider" style={montserrat}>Auction</span>
                              )}
                            </div>
                            <Button size="sm" variant="outline" className="w-full mt-1 rounded-sm border-neutral-300 text-neutral-700 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-all text-xs font-semibold uppercase tracking-wider" style={montserrat}>
                              View Listing
                            </Button>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* ── PLATFORM FEE BANNER ───────────────────────── */}
          <section style={{ background: "#f7f7f7", borderTop: "1px solid #ebebeb", borderBottom: "1px solid #ebebeb" }}>
            <div className="container max-w-5xl py-5">
              <div className="flex items-center gap-4 justify-center text-center">
                <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-200">
                  <Shield className="h-4 w-4 text-neutral-600" />
                </div>
                <p className="text-sm text-neutral-500 max-w-xl" style={montserrat}>
                  <span className="font-semibold text-neutral-800">Secure checkout powered by Stripe</span>
                  {" "}— a small 9.9% platform fee applies to completed transactions, keeping this marketplace running and fraud-free.
                </p>
              </div>
            </div>
          </section>

          {/* ── HOW IT WORKS ──────────────────────────────── */}
          <section style={{ background: "#fff", padding: "100px 0" }} id="how-it-works">
            <div className="container max-w-5xl">
              <div className="text-center mb-16">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-4" style={montserrat}>Simple Process</p>
                <h2 className="text-3xl md:text-4xl font-bold text-neutral-900" style={playfair}>How It Works</h2>
                <div className="silver-rule max-w-[60px] mx-auto mt-6" />
              </div>
              <div className="grid md:grid-cols-3 gap-6 md:gap-0 relative">
                <div className="hidden md:block absolute top-8 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-neutral-200" />
                {[
                  { icon: Camera, step: "01", title: "Post Your Surplus", desc: "Snap a photo, add details, and your listing goes live in under 2 minutes." },
                  { icon: Handshake, step: "02", title: "Connect with Buyers", desc: "Local buyers find your listing and reach out through secure messaging." },
                  { icon: CircleDollarSign, step: "03", title: "Get Paid Securely", desc: "Complete the transaction with confidence. Funds are protected until pickup is confirmed." },
                ].map((item) => (
                  <div key={item.step} className="flex flex-col items-center text-center relative z-10">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-white border-2 border-neutral-200 mb-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                      <item.icon className="h-6 w-6 text-neutral-700" />
                    </div>
                    <span className="text-xs font-bold text-neutral-300 uppercase tracking-[0.2em] mb-2" style={montserrat}>Step {item.step}</span>
                    <h3 className="text-lg font-bold mb-2 text-neutral-900" style={playfair}>{item.title}</h3>
                    <p className="text-sm text-neutral-500 leading-relaxed max-w-[220px]" style={montserrat}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── WHY LOADOUT ───────────────────────────────── */}
          <section style={{ background: "#f7f7f7", borderTop: "1px solid #ebebeb", padding: "100px 0" }} id="for-contractors">
            <div className="container max-w-5xl">
              <div className="text-center mb-16">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-4" style={montserrat}>Built for Professionals</p>
                <h2 className="text-3xl md:text-4xl font-bold text-neutral-900" style={playfair}>Why Loadout?</h2>
                <div className="silver-rule max-w-[60px] mx-auto mt-6" />
              </div>
              <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
                {[
                  { icon: UserCheck, title: "Real Seller Profiles", desc: "Browse seller reviews and transaction history before you buy. Real people, real materials." },
                  { icon: MessageSquareText, title: "Secure Messaging and Payments", desc: "Communicate safely and transact with confidence through our protected platform." },
                  { icon: Zap, title: "List in Under 2 Minutes", desc: "Snap a photo, set your price, and your listing is live. It's that fast." },
                ].map((item) => (
                  <article key={item.title} className="text-center">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white border border-neutral-200 mb-5" style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
                      <item.icon className="h-6 w-6 text-neutral-700" />
                    </div>
                    <h3 className="font-bold text-lg mb-3 text-neutral-900" style={playfair}>{item.title}</h3>
                    <p className="text-sm text-neutral-500 leading-relaxed" style={montserrat}>{item.desc}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* ── CTA SECTION ───────────────────────────────── */}
          <section style={{ background: "#111", padding: "100px 0" }}>
            <div className="container max-w-3xl text-center">
              <p className="text-xs uppercase tracking-[0.22em] text-neutral-400 mb-5" style={montserrat}>Join the Network</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={playfair}>
                Got leftover materials<br />
                <span style={{ fontStyle: "italic", color: "#aaa" }}>from your last job?</span>
              </h2>
              <div className="silver-rule max-w-[60px] mx-auto my-8" />
              <p className="text-base text-neutral-400 mb-10 max-w-md mx-auto" style={montserrat}>
                Join thousands of sellers already turning surplus into cash.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/create-listing">
                  <Button size="lg" className="w-full sm:w-auto text-sm px-10 h-12 font-bold uppercase tracking-wider rounded-sm" style={{ ...montserrat, background: "#fff", color: "#111" }}>
                    Post a Free Listing
                  </Button>
                </Link>
                <Link to="/listings">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-sm px-10 h-12 font-bold uppercase tracking-wider rounded-sm bg-transparent text-white hover:bg-white/10" style={{ ...montserrat, borderColor: "rgba(255,255,255,0.25)" }}>
                    Browse Deals
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </main>

        {/* ── FOOTER ────────────────────────────────────────── */}
        <footer style={{ background: "#fafafa", borderTop: "1px solid #ebebeb", paddingTop: "64px", paddingBottom: "40px" }}>
          <div className="container max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
              <div className="md:col-span-1 space-y-3">
                <Link to="/" className="flex items-center gap-2">
                  <span className="text-xl font-bold text-neutral-900" style={playfair}>Loadout</span>
                </Link>
                <p className="text-xs text-neutral-400 leading-relaxed" style={montserrat}>
                  Sell Your Surplus.<br />Find Deals. Build Smarter.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-800" style={montserrat}>Marketplace</h4>
                <nav className="flex flex-col gap-2.5 text-sm">
                  {[
                    { to: "/listings", label: "Browse Listings" },
                    { to: "/create-listing", label: "Post a Listing" },
                    { to: "/listings?category=lumber", label: "Lumber" },
                    { to: "/listings?category=tools", label: "Tools" },
                  ].map((l) => (
                    <Link key={l.to} to={l.to} className="text-neutral-400 hover:text-neutral-800 transition-colors text-xs" style={montserrat}>{l.label}</Link>
                  ))}
                </nav>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-800" style={montserrat}>Company</h4>
                <nav className="flex flex-col gap-2.5">
                  <a href="/Loadout_Marketplace_Terms_of_Service.pdf" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-neutral-800 transition-colors text-xs" style={montserrat}>Terms of Service</a>
                  <Link to="/privacy-policy" className="text-neutral-400 hover:text-neutral-800 transition-colors text-xs" style={montserrat}>Privacy Policy</Link>
                </nav>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-800" style={montserrat}>Connect</h4>
                <nav className="flex gap-4 text-neutral-400">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-neutral-800 transition-colors">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-neutral-800 transition-colors">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </a>
                  <a href="https://x.com" target="_blank" rel="noopener noreferrer" aria-label="X" className="hover:text-neutral-800 transition-colors">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                </nav>
              </div>
            </div>
            <div className="silver-rule mb-6" />
            <div className="text-center text-xs text-neutral-400" style={montserrat}>
              <p>&copy; {new Date().getFullYear()} Loadout Marketplace. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Landing;
