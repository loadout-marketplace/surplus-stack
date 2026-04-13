import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CheckCircle, DollarSign, Package, Shield, TrendingUp, ArrowRight, Search, MapPin, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { WelcomeStats } from "@/components/WelcomeStats";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";

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
                Save up to 80% on lumber, roofing, tools & hardware. Or turn your leftover materials into cash — free to list, no commissions.
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
                  {recentListings.map((listing) => (
                    <Link key={listing.id} to={`/listings/${listing.slug}`}>
                      <Card className="overflow-hidden hover:shadow-md transition-shadow h-full border-border/60">
                        <div className="relative h-44 bg-muted overflow-hidden">
                          {listing.listing_images?.[0]?.url ? (
                            <img
                              src={listing.listing_images[0].url}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-10 w-10 text-muted-foreground" />
                            </div>
                          )}
                          <Badge variant="secondary" className="absolute top-2 right-2 capitalize text-xs">
                            {listing.condition.replace("_", " ")}
                          </Badge>
                        </div>
                        <CardContent className="p-4 pb-2">
                          <h3 className="font-semibold text-base line-clamp-1 mb-1">{listing.title}</h3>
                          {listing.categories && (
                            <Badge variant="outline" className="text-xs mb-2">{listing.categories.name}</Badge>
                          )}
                          <div className="flex items-center text-xs text-muted-foreground gap-1">
                            <MapPin className="h-3 w-3" />
                            {listing.location_city}, {listing.location_state}
                          </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0">
                          <span className="text-lg font-bold text-primary">${listing.fixed_price}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{listing.quantity} {listing.unit}</span>
                        </CardFooter>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
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

              <div className="grid md:grid-cols-3 gap-10 md:gap-12">
                {[
                  {
                    icon: Package,
                    step: "1",
                    title: "List or Browse",
                    desc: "Sellers create free listings with photos. Buyers search by category, location, and price."
                  },
                  {
                    icon: DollarSign,
                    step: "2",
                    title: "Connect & Deal",
                    desc: "Message sellers directly. Negotiate prices or buy now at fixed prices."
                  },
                  {
                    icon: CheckCircle,
                    step: "3",
                    title: "Complete Transaction",
                    desc: "Arrange pickup or delivery. Leave reviews. Track orders from your dashboard."
                  }
                ].map((item) => (
                  <div key={item.step} className="text-center md:text-left">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent mb-5">
                      <item.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{item.step}. {item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Why Loadout */}
          <section className="py-20 md:py-28 bg-section-alt" aria-labelledby="why-loadout-heading">
            <div className="container max-w-5xl">
              <div className="text-center mb-16">
                <h2 id="why-loadout-heading" className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Why Loadout?</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-10 max-w-4xl mx-auto">
                {[
                  { icon: Shield, title: "Verified Sellers", desc: "All sellers are verified. Reviews ensure trust and quality." },
                  { icon: TrendingUp, title: "Best Prices", desc: "Save up to 80% off retail on quality construction materials." },
                  { icon: Package, title: "Wide Selection", desc: "Lumber, tools, hardware, and more — everything in one place." },
                ].map((item) => (
                  <article key={item.title} className="text-center">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-background border border-border mb-5">
                      <item.icon className="h-7 w-7 text-primary" aria-hidden="true" />
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
