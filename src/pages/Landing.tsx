import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CheckCircle, DollarSign, Package, Shield, TrendingUp, ArrowRight, Search, MapPin, Clock, UserCheck, MessageSquareText, Zap, Camera, Handshake, CircleDollarSign } from "lucide-react";
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
  fixed_price: number;
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

  useEffect(() => {
    const fetchRecent = async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, title, slug, fixed_price, condition, location_city, location_state, quantity, unit, created_at, listing_images(url), categories(name)")
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
    "@id": "https://loadoutmarketplace.com/#webpage",
    "name": "Loadout Marketplace - Buy & Sell Surplus Construction Materials",
    "description": "Save up to 80% on surplus construction materials. Buy & sell lumber, roofing, tools, hardware from local contractors. Free to list.",
    "url": "https://loadoutmarketplace.com",
    "isPartOf": {
      "@type": "WebSite",
      "@id": "https://loadoutmarketplace.com/#website"
    },
    "about": {
      "@type": "Thing",
      "name": "Surplus Construction Materials Marketplace"
    },
    "mainEntity": {
      "@type": "ItemList",
      "name": "Popular Construction Material Categories",
      "numberOfItems": 6,
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Lumber & Wood", "url": "https://loadoutmarketplace.com/listings?category=lumber" },
        { "@type": "ListItem", "position": 2, "name": "Roofing Materials", "url": "https://loadoutmarketplace.com/listings?category=roofing" },
        { "@type": "ListItem", "position": 3, "name": "Tools & Equipment", "url": "https://loadoutmarketplace.com/listings?category=tools" },
        { "@type": "ListItem", "position": 4, "name": "Hardware & Fasteners", "url": "https://loadoutmarketplace.com/listings?category=hardware" },
        { "@type": "ListItem", "position": 5, "name": "Plumbing Supplies", "url": "https://loadoutmarketplace.com/listings?category=plumbing" },
        { "@type": "ListItem", "position": 6, "name": "Electrical Supplies", "url": "https://loadoutmarketplace.com/listings?category=electrical" }
      ]
    },
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": ["h1", ".hero-description"]
    }
  };

  return (
    <>
      <SEO 
        title="Loadout Marketplace | Buy & Sell Surplus Construction Materials Near You"
        description="Save up to 80% on surplus construction materials. Buy & sell lumber, roofing, tools, hardware from local contractors. Free to list. Trusted by thousands of contractors nationwide."
        keywords="surplus construction materials, building materials marketplace, discount lumber near me, used construction supplies, contractor materials, DIY materials, buy surplus lumber, sell leftover materials, construction deals"
        canonicalUrl="/"
        structuredData={structuredData}
      />
      
      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Hero Section — clean, spacious */}
        <header className="bg-hero-bg text-hero-fg">
          <div className="container max-w-5xl py-24 md:py-36">
            <div className="text-center space-y-8">
              <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.1] tracking-tight">
                Buy & Sell Surplus Construction
                <br />
                Materials <span className="text-primary">Near You</span>
              </h1>
              <p className="hero-description text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Got leftover materials from your last job? Turn them into cash — or save up to 80% on lumber, roofing, tools & hardware. Free to list, no commissions.
              </p>
              <div className="max-w-2xl mx-auto pt-2">
                <div className="flex flex-col sm:flex-row gap-2 bg-background rounded-xl p-2 shadow-lg border border-border/60">
                  <Select value={heroCategory} onValueChange={setHeroCategory}>
                    <SelectTrigger className="sm:w-44 bg-background text-foreground border border-border h-12 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {heroCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="What are you looking for?"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleHeroSearch()}
                    className="flex-1 bg-background text-foreground border border-border h-12 rounded-lg placeholder:text-muted-foreground"
                  />
                  <Button
                    onClick={handleHeroSearch}
                    className="h-12 px-6 bg-cta hover:bg-cta/90 text-cta-foreground rounded-lg"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button asChild className="h-12 px-8 bg-background text-foreground hover:bg-background/90 rounded-lg font-semibold">
                  <Link to="/create-listing">Post a Free Listing</Link>
                </Button>
                <Button asChild variant="outline" className="h-12 px-8 border-background/40 text-hero-fg hover:bg-background/10 rounded-lg font-semibold bg-transparent">
                  <Link to="/listings">Browse Deals</Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground pt-4 font-medium">
                Join 3,800+ contractors already turning surplus into cash.
              </p>
            </div>
          </div>
        </header>

        {/* Category chips */}
        <section className="border-b bg-background py-4">
          <div className="container max-w-5xl overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 min-w-max px-1">
              {[
                "🪵 Lumber", "🏠 Roofing", "⚡ Electrical", "🔧 Plumbing",
                "🛠️ Tools", "🧱 Flooring", "🧤 Insulation", "🔩 Hardware",
                "🪟 Windows & Doors", "🎨 Paint & Finishes"
              ].map((cat) => (
                <Link
                  key={cat}
                  to={`/listings?category=${cat.split(" ").slice(1).join(" ").toLowerCase()}`}
                  className="inline-flex items-center px-4 py-2 rounded-full border border-border bg-background text-sm font-medium text-muted-foreground hover:bg-cta/5 hover:border-cta hover:text-cta transition-colors whitespace-nowrap"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Trust stats */}
        <section className="border-b bg-section-alt">
          <div className="container max-w-5xl">
            <ul className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border list-none" role="list" aria-label="Platform stats">
              {[
                { number: "12,400+", label: "Active Listings" },
                { number: "3,800+", label: "Verified Contractors" },
                { number: "48", label: "States Covered" },
              ].map((stat) => (
                <li key={stat.label} className="flex flex-col items-center py-8 md:py-10 gap-1">
                  <span className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">{stat.number}</span>
                  <span className="text-sm text-muted-foreground font-medium">{stat.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <main>
          {user && <WelcomeStats />}

          {/* Recently Listed Near You */}
          <section className="py-16 md:py-20 bg-background">
            <div className="container max-w-5xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Recently Listed Near You</h2>
                <Link to="/listings" className="text-sm font-semibold text-cta hover:text-cta/80 transition-colors flex items-center gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              {loadingListings ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <div className="h-44 bg-muted animate-pulse" />
                      <CardContent className="p-4 space-y-2">
                        <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                        <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : recentListings.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">No listings yet — be the first to post!</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {recentListings.map((listing) => {
                    const timeAgo = getTimeAgo(listing.created_at);
                    const retailEstimate = listing.fixed_price * 2.5;
                    const pctOff = Math.round((1 - listing.fixed_price / retailEstimate) * 100);

                    return (
                      <Link key={listing.id} to={`/listings/${listing.slug}`}>
                        <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 h-full border-border/60 group rounded-xl">
                          {/* Image / placeholder */}
                          <div className="relative h-44 bg-muted overflow-hidden">
                            {listing.listing_images?.[0]?.url ? (
                              <img
                                src={listing.listing_images[0].url}
                                alt={listing.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-muted">
                                <Package className="h-10 w-10 text-muted-foreground/50" />
                                <span className="text-xs text-muted-foreground">No image</span>
                              </div>
                            )}
                            {/* Category badge — green pill */}
                            {listing.categories && (
                              <Badge className="absolute top-2.5 left-2.5 bg-cta text-cta-foreground hover:bg-cta/90 text-xs font-medium">
                                {listing.categories.name}
                              </Badge>
                            )}
                          </div>

                          <CardContent className="p-4 space-y-3">
                            {/* Title */}
                            <h3 className="font-semibold text-base line-clamp-2 leading-snug">{listing.title}</h3>

                            {/* Location + time */}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {listing.location_city}, {listing.location_state}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {timeAgo}
                              </span>
                            </div>

                            {/* Price row */}
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-bold text-foreground">${listing.fixed_price.toLocaleString()}</span>
                              <span className="text-xs font-semibold text-primary">~{pctOff}% off retail</span>
                            </div>

                            {/* Contact button */}
                            <Button size="sm" variant="outline" className="w-full mt-1 border-cta text-cta hover:bg-cta hover:text-cta-foreground transition-colors">
                              Contact Seller
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

          {/* Platform fee info */}
          <section className="bg-section-alt border-y border-border/60">
            <div className="container max-w-5xl py-6">
              <div className="flex items-center gap-4 justify-center text-center">
                <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cta/10">
                  <Shield className="h-5 w-5 text-cta" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                  <span className="font-semibold text-foreground">Secure checkout powered by Loadout</span> — a small 4% platform fee applies to completed transactions, keeping this marketplace running and fraud-free.
                </p>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="py-20 md:py-28 bg-background" aria-labelledby="how-it-works-heading">
            <div className="container max-w-5xl">
              <div className="text-center mb-16">
                <h2 id="how-it-works-heading" className="text-3xl md:text-4xl font-bold tracking-tight mb-3">How It Works</h2>
                <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                  Three simple steps to buy or sell construction materials.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 md:gap-0 relative">
                {/* Connector lines (desktop only) */}
                <div className="hidden md:block absolute top-8 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0.5 bg-border" />

                {[
                  { icon: Camera, step: "1", title: "Post Your Surplus", desc: "Snap a photo, add details, and your listing goes live in under 2 minutes." },
                  { icon: Handshake, step: "2", title: "Connect with Local Contractors", desc: "Buyers in your area find your listing and reach out through secure messaging." },
                  { icon: CircleDollarSign, step: "3", title: "Get Paid Securely", desc: "Complete the transaction with confidence. Funds are protected until delivery." },
                ].map((item) => (
                  <div key={item.step} className="flex flex-col items-center text-center relative z-10">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-cta/10 border-4 border-background mb-4">
                      <item.icon className="h-7 w-7 text-cta" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-bold text-cta uppercase tracking-wider mb-1">Step {item.step}</span>
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px]">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Why Loadout */}
          <section className="py-20 md:py-28 bg-hero-bg" aria-labelledby="why-loadout-heading">
            <div className="container max-w-5xl">
              <div className="text-center mb-16">
                <h2 id="why-loadout-heading" className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Why Loadout?</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-10 max-w-4xl mx-auto">
                {[
                  { icon: UserCheck, title: "Verified Contractor Profiles", desc: "Every seller is verified. Browse real reviews and track records before you buy." },
                  { icon: MessageSquareText, title: "Secure Messaging & Payments", desc: "Communicate safely and transact with confidence through our protected platform." },
                  { icon: Zap, title: "List in Under 2 Minutes", desc: "Snap a photo, set your price, and your listing is live — it's that fast." },
                ].map((item) => (
                  <article key={item.title} className="text-center">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-cta/10 mb-5">
                      <item.icon className="h-7 w-7 text-cta" aria-hidden="true" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 md:py-28 bg-secondary text-secondary-foreground" aria-labelledby="cta-heading">
            <div className="container max-w-3xl text-center">
              <h2 id="cta-heading" className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-lg mb-10 text-secondary-foreground/70 max-w-md mx-auto">
                Join thousands of contractors buying and selling materials every day.
              </p>
              <nav className="flex flex-col sm:flex-row gap-3 justify-center" aria-label="Get started actions">
                {!user && (
                  <Link to="/auth">
                    <Button size="lg" className="w-full sm:w-auto text-base px-8 h-12">
                      Create Free Account
                    </Button>
                  </Link>
                )}
                <Link to="/listings">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 h-12 bg-transparent border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/5">
                    Browse Materials
                  </Button>
                </Link>
              </nav>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t py-10 bg-background">
          <div className="container max-w-5xl">
            <div className="text-center text-sm text-muted-foreground">
              <p>
                &copy; 2025 Loadout Marketplace. All rights reserved.
                {" · "}
                <a href="/Loadout_Marketplace_Terms_of_Service.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Terms of Service</a>
                {" · "}
                <Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Landing;
