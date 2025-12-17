import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, DollarSign, Package, Shield, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { WelcomeStats } from "@/components/WelcomeStats";
import SEO from "@/components/SEO";

const Landing = () => {
  const { user } = useAuth();

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
      
      <div className="min-h-screen">
        <Navbar />

        {/* Hero Section */}
        <header className="bg-hero-bg text-hero-fg py-20 md:py-32">
          <div className="container max-w-6xl">
            <div className="text-center space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Sell Your Surplus. Find Deals. Build Smarter.
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                Find deals up to 80% off retail. Buy and sell surplus construction materials.
              </p>
              <nav className="flex flex-col sm:flex-row gap-4 justify-center pt-4" aria-label="Primary actions">
                <Link to="/listings">
                  <Button size="lg" className="w-full sm:w-auto">
                    Browse Listings
                  </Button>
                </Link>
                <Link to="/listings/new">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent text-hero-fg border-hero-fg hover:bg-hero-fg/10">
                    List Your Surplus
                  </Button>
                </Link>
              </nav>
            </div>

            {/* Features */}
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto list-none" role="list" aria-label="Key features">
              <li className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h2 className="font-semibold text-lg">Verified Sellers</h2>
              </li>
              <li className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Package className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h2 className="font-semibold text-lg">Local Pickup or Shipping</h2>
              </li>
              <li className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h2 className="font-semibold text-lg">Fast, Secure Transactions</h2>
              </li>
            </ul>
          </div>
        </header>

        <main>
          {/* Welcome Stats for logged-in users */}
          {user && <WelcomeStats />}

          {/* How It Works */}
          <section className="py-20 bg-background" aria-labelledby="how-it-works-heading">
            <div className="container max-w-6xl">
              <div className="text-center mb-12">
                <h2 id="how-it-works-heading" className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Simple process to buy or sell construction materials
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <Card>
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Package className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">1. List or Browse</h3>
                    <p className="text-muted-foreground">
                      Sellers: Create a free listing with photos and details. Buyers: Search by category, location, and price.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <DollarSign className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">2. Connect & Deal</h3>
                    <p className="text-muted-foreground">
                      Message sellers directly. Negotiate prices. Buy now at fixed prices or bid on auction items.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <CheckCircle className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">3. Complete Transaction</h3>
                    <p className="text-muted-foreground">
                      Arrange pickup or delivery. Leave reviews. Track your orders and manage listings in your dashboard.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Trust Section */}
          <section className="py-20 bg-muted/30" aria-labelledby="why-loadout-heading">
            <div className="container max-w-6xl">
              <div className="text-center mb-12">
                <h2 id="why-loadout-heading" className="text-3xl md:text-4xl font-bold mb-4">Why Loadout?</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <article className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold mb-2">Verified Sellers</h3>
                  <p className="text-sm text-muted-foreground">
                    All sellers are verified. Review system ensures trust and quality.
                  </p>
                </article>

                <article className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold mb-2">Best Prices</h3>
                  <p className="text-sm text-muted-foreground">
                    Save up to 80% off retail on quality construction materials.
                  </p>
                </article>

                <article className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold mb-2">Wide Selection</h3>
                  <p className="text-sm text-muted-foreground">
                    Lumber, tools, hardware, and more. Everything you need in one place.
                  </p>
                </article>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 bg-primary text-primary-foreground" aria-labelledby="cta-heading">
            <div className="container max-w-4xl text-center">
              <h2 id="cta-heading" className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-lg mb-8 opacity-90">
                Join thousands of contractors buying and selling materials every day.
              </p>
              <nav className="flex flex-col sm:flex-row gap-4 justify-center" aria-label="Get started actions">
                {!user && (
                  <Link to="/auth">
                    <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                      Create Free Account
                    </Button>
                  </Link>
                )}
                <Link to="/listings">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                    Browse Materials
                  </Button>
                </Link>
              </nav>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t py-8 bg-background">
          <div className="container max-w-6xl">
            <div className="text-center text-sm text-muted-foreground">
              <p>&copy; 2025 Loadout Marketplace. All rights reserved. | <a href="/Loadout_Marketplace_Terms_of_Service.pdf" target="_blank" rel="noopener noreferrer" className="hover:text-foreground underline">Terms of Service</a> | <Link to="/privacy-policy" className="hover:text-foreground underline">Privacy Policy</Link></p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Landing;
