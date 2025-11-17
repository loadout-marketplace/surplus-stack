import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, DollarSign, Package, Shield, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Landing = () => {
  const [stats, setStats] = useState({
    materialsSold: 0,
    activeListings: 0,
    contractors: 0,
    avgSavings: "8%"
  });

  useEffect(() => {
    const fetchStats = async () => {
      // Get count of completed orders
      const { count: completedOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      // Get total value of completed orders
      const { data: orderData } = await supabase
        .from('orders')
        .select('total_price')
        .eq('status', 'completed');
      
      const totalSales = orderData?.reduce((sum, order) => sum + Number(order.total_price), 0) || 0;

      // Get count of active listings
      const { count: activeListings } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get count of all users (contractors)
      const { count: contractors } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      setStats({
        materialsSold: totalSales,
        activeListings: activeListings || 0,
        contractors: contractors || 0,
        avgSavings: "8%"
      });
    };

    fetchStats();

    // Set up realtime subscription for listings
    const channel = supabase
      .channel('stats-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listings' },
        () => fetchStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-hero-bg text-hero-fg py-20 md:py-32">
        <div className="container max-w-6xl">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Turn Leftover Materials Into Money
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Find deals up to 70% off retail. Buy and sell surplus construction materials.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
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
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">
                ${stats.materialsSold.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Materials Sold</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">
                {stats.activeListings.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Active Listings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">
                {stats.contractors.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Contractors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">{stats.avgSavings}</div>
              <div className="text-sm text-muted-foreground mt-1">Platform Fee</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-background">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple process to buy or sell construction materials
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Package className="h-6 w-6 text-primary" />
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
                  <DollarSign className="h-6 w-6 text-primary" />
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
                  <CheckCircle className="h-6 w-6 text-primary" />
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
      <section className="py-20 bg-muted/30">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why LoadOut?</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Verified Contractors</h3>
              <p className="text-sm text-muted-foreground">
                All sellers are verified. Review system ensures trust and quality.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Best Prices</h3>
              <p className="text-sm text-muted-foreground">
                Save up to 70% off retail on quality construction materials.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Wide Selection</h3>
              <p className="text-sm text-muted-foreground">
                Lumber, tools, hardware, and more. Everything you need in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of contractors buying and selling materials every day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Create Free Account
              </Button>
            </Link>
            <Link to="/listings">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10">
                Browse Materials
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-background">
        <div className="container max-w-6xl">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2024 LoadOut Marketplace. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
