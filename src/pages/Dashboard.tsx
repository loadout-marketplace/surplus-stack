import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Edit, Archive, Plus, Eye, BarChart2 } from "lucide-react";
import { toast } from "sonner";

interface Listing {
  id: string; title: string; slug: string; fixed_price: number | null; starting_bid: number | null;
  status: string; quantity: number; unit: string; created_at: string; views_count: number;
}

const playfair: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const montserrat: React.CSSProperties = { fontFamily: "'Montserrat', sans-serif" };

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { toast.error("Please sign in to view dashboard"); navigate("/auth"); }
  }, [user, authLoading, navigate]);

  useEffect(() => { if (user) fetchMyListings(); }, [user]);

  const fetchMyListings = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("listings").select("*").eq("seller_id", user.id).order("created_at", { ascending: false });
    if (error) toast.error("Failed to load listings");
    else setListings(data || []);
    setLoading(false);
  };

  const handleArchive = async (id: string) => {
    const { error } = await supabase.from("listings").update({ status: "archived" }).eq("id", id);
    if (error) toast.error("Failed to archive listing");
    else { toast.success("Listing archived"); fetchMyListings(); }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white"><Navbar />
        <div className="container max-w-6xl py-16">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-neutral-100 rounded w-1/3" />
            <div className="h-64 bg-neutral-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const activeListings = listings.filter((l) => l.status === "active");
  const archivedListings = listings.filter((l) => l.status === "archived");
  const totalViews = listings.reduce((sum, l) => sum + (l.views_count || 0), 0);

  return (
    <div className="min-h-screen bg-white">
      <SEO title="Dashboard | Loadout Marketplace" description="Manage your listings" noIndex={true} />
      <Navbar />
      <div className="container max-w-6xl px-6" style={{ paddingTop: "96px", paddingBottom: "80px" }}>

        {/* Header */}
        <div className="flex items-baseline justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-neutral-400 mb-2" style={montserrat}>Seller Account</p>
            <h1 className="text-3xl font-bold text-neutral-900" style={playfair}>Dashboard</h1>
          </div>
          <Link to="/create-listing">
            <button className="flex items-center gap-2 h-10 px-6 text-white text-xs font-bold uppercase tracking-wider rounded-sm" style={{ ...montserrat, background: "#111" }}>
              <Plus className="h-3.5 w-3.5" /> New Listing
            </button>
          </Link>
        </div>
        <div className="silver-rule mb-10" />

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-5 mb-10">
          {[
            { icon: Package, label: "Active Listings", value: activeListings.length },
            { icon: Eye, label: "Total Views", value: totalViews },
            { icon: BarChart2, label: "Total Listings", value: listings.length },
          ].map((stat) => (
            <div key={stat.label} className="p-6 bg-white rounded-sm" style={{ border: "1px solid #e8e8e8" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center">
                  <stat.icon className="h-4 w-4 text-neutral-500" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400" style={montserrat}>{stat.label}</p>
              </div>
              <p className="text-3xl font-bold text-neutral-900" style={playfair}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Listings Table */}
        <div className="bg-white rounded-sm" style={{ border: "1px solid #e8e8e8" }}>
          <div className="px-6 py-5" style={{ borderBottom: "1px solid #f0f0f0" }}>
            <h2 className="text-lg font-bold text-neutral-900" style={playfair}>My Listings</h2>
          </div>
          <div className="p-6">
            <Tabs defaultValue="active">
              <TabsList className="bg-neutral-100 rounded-sm p-0.5 mb-6">
                <TabsTrigger value="active" className="rounded-sm text-xs font-semibold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm text-neutral-400" style={montserrat}>
                  Active ({activeListings.length})
                </TabsTrigger>
                <TabsTrigger value="archived" className="rounded-sm text-xs font-semibold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm text-neutral-400" style={montserrat}>
                  Archived ({archivedListings.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                {loading ? (
                  <div className="text-center py-10 text-sm text-neutral-400" style={montserrat}>Loading…</div>
                ) : activeListings.length === 0 ? (
                  <div className="text-center py-16">
                    <Package className="h-10 w-10 text-neutral-300 mx-auto mb-4" />
                    <p className="text-sm text-neutral-500 mb-6" style={montserrat}>No active listings yet</p>
                    <Link to="/create-listing">
                      <button className="h-10 px-6 text-white text-xs font-bold uppercase tracking-wider rounded-sm" style={{ ...montserrat, background: "#111" }}>
                        Post Your First Listing
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="w-full text-sm" style={montserrat}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                          {["Title", "Price", "Quantity", "Views", "Listed", "Actions"].map((h) => (
                            <th key={h} className="text-left text-xs font-semibold uppercase tracking-wider text-neutral-400 pb-3 pr-4">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {activeListings.map((listing) => (
                          <tr key={listing.id} style={{ borderBottom: "1px solid #f9f9f9" }}>
                            <td className="py-3 pr-4">
                              <Link to={`/listings/${listing.slug}`} className="font-medium text-neutral-900 hover:underline line-clamp-1">{listing.title}</Link>
                            </td>
                            <td className="py-3 pr-4 font-semibold text-neutral-900">${(listing.fixed_price ?? listing.starting_bid ?? 0).toLocaleString()}</td>
                            <td className="py-3 pr-4 text-neutral-500">{listing.quantity} {listing.unit}</td>
                            <td className="py-3 pr-4 text-neutral-500">{listing.views_count || 0}</td>
                            <td className="py-3 pr-4 text-neutral-400">{new Date(listing.created_at).toLocaleDateString()}</td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button className="p-1.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors" onClick={() => navigate(`/listings/${listing.slug}`)}>
  <Edit className="h-3.5 w-3.5" />
</button>
                                <button className="p-1.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors" onClick={() => handleArchive(listing.id)}>
                                  <Archive className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="archived">
                {archivedListings.length === 0 ? (
                  <div className="text-center py-10 text-sm text-neutral-400" style={montserrat}>No archived listings</div>
                ) : (
                  <table className="w-full text-sm" style={montserrat}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                        {["Title", "Price", "Archived"].map((h) => (
                          <th key={h} className="text-left text-xs font-semibold uppercase tracking-wider text-neutral-400 pb-3 pr-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {archivedListings.map((listing) => (
                        <tr key={listing.id} style={{ borderBottom: "1px solid #f9f9f9" }}>
                          <td className="py-3 pr-4 text-neutral-500">{listing.title}</td>
                          <td className="py-3 pr-4 text-neutral-500">${listing.fixed_price?.toLocaleString()}</td>
                          <td className="py-3 text-neutral-400">{new Date(listing.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
