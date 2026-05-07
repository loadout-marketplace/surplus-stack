import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { CheckCircle, X } from "lucide-react";

const playfair: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const montserrat: React.CSSProperties = { fontFamily: "'Montserrat', sans-serif" };

const Pricing = () => {
  return (
    <>
      <SEO
        title="Pricing | Loadout Marketplace"
        description="Free to list. You only pay when you sell. Simple, transparent pricing with no hidden fees."
        canonicalUrl="/pricing"
      />
      <div className="min-h-screen bg-white">
        <Navbar />

        {/* Hero */}
        <section style={{ paddingTop: "120px", paddingBottom: "60px", background: "#fafafa", borderBottom: "1px solid #ebebeb" }}>
          <div className="container max-w-3xl px-6 text-center">
            <p className="text-xs uppercase tracking-[0.22em] text-neutral-400 mb-4" style={montserrat}>Simple Pricing</p>
            <h1 className="text-4xl font-bold text-neutral-900 mb-4" style={playfair}>List Free. Sell Fast.<br />
  <span style={{ fontStyle: "italic" }}>Get Paid.</span>
</h1>
            <div className="w-12 h-px bg-neutral-300 mx-auto mt-6" />
          </div>
        </section>

        {/* Pricing card */}
        <section style={{ padding: "80px 0" }}>
          <div className="container max-w-3xl px-6">
            <div className="grid md:grid-cols-2 gap-6 mb-16">

              {/* Sellers */}
              <div className="p-8 rounded-sm" style={{ border: "2px solid #111" }}>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1" style={montserrat}>For Sellers</p>
                <h2 className="text-3xl font-bold text-neutral-900 mb-1" style={playfair}>Free to List</h2>
                <p className="text-sm text-neutral-500 mb-6" style={montserrat}>Post unlimited listings at no cost.</p>
                <div className="space-y-3 mb-8">
                  {[
                    "Unlimited listings",
                    "Photo uploads",
                    "Secure messaging with buyers",
                    "Dashboard to manage listings",
                    "Auction and fixed price options",
                    "9.9% fee on completed sales only",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-neutral-900 shrink-0" />
                      <span className="text-sm text-neutral-700" style={montserrat}>{item}</span>
                    </div>
                  ))}
                </div>
                <Link to="/create-listing">
                  <button className="w-full h-11 text-white text-xs font-bold uppercase tracking-wider rounded-sm" style={{ ...montserrat, background: "#111" }}>
                    Post a Free Listing
                  </button>
                </Link>
              </div>

              {/* Buyers */}
              <div className="p-8 rounded-sm" style={{ border: "1px solid #e8e8e8" }}>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1" style={montserrat}>For Buyers</p>
                <h2 className="text-3xl font-bold text-neutral-900 mb-1" style={playfair}>Always Free</h2>
                <p className="text-sm text-neutral-500 mb-6" style={montserrat}>Browse and buy with no fees ever.</p>
                <div className="space-y-3 mb-8">
                  {[
                    "Browse all listings for free",
                    "Search by location and category",
                    "Message sellers directly",
                    "Secure Stripe checkout",
                    "Save up to 80% off retail",
                    "No buyer fees — ever",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-neutral-900 shrink-0" />
                      <span className="text-sm text-neutral-700" style={montserrat}>{item}</span>
                    </div>
                  ))}
                </div>
                <Link to="/listings">
                  <button className="w-full h-11 text-neutral-700 text-xs font-bold uppercase tracking-wider rounded-sm" style={{ ...montserrat, border: "1px solid #e0e0e0" }}>
                    Browse Listings
                  </button>
                </Link>
              </div>
            </div>

           
            {/* Comparison */}
            <div className="mb-16">
              <h3 className="text-xl font-bold text-neutral-900 mb-6 text-center" style={playfair}>How We Compare</h3>
              <div className="rounded-sm overflow-hidden" style={{ border: "1px solid #e8e8e8" }}>
                <table className="w-full text-sm" style={montserrat}>
                  <thead>
                    <tr style={{ background: "#111" }}>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-300">Platform</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-300">Listing Fee</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-300">Sale Fee</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-300">Construction Focused</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { platform: "Loadout", listing: "Free", sale: "9.9%", focused: true, highlight: true },
                      { platform: "eBay", listing: "$0.35+", sale: "12-15%", focused: false },
                    ].map((row) => (
                      <tr key={row.platform} style={{ borderBottom: "1px solid #f0f0f0", background: row.highlight ? "#f9f9f9" : "#fff" }}>
                        <td className="px-5 py-4 font-semibold text-neutral-900">{row.platform}{row.highlight && <span className="ml-2 text-xs bg-neutral-900 text-white px-2 py-0.5 rounded-sm">You're here</span>}</td>
                        <td className="px-5 py-4 text-center text-neutral-600">{row.listing}</td>
                        <td className="px-5 py-4 text-center text-neutral-600">{row.sale}</td>
                        <td className="px-5 py-4 text-center">
                          {row.focused ? <CheckCircle className="h-4 w-4 text-green-600 mx-auto" /> : <X className="h-4 w-4 text-neutral-300 mx-auto" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Stripe Climate */}
<div className="p-8 rounded-sm mb-16 text-center" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
  <p className="text-xs font-bold uppercase tracking-wider text-green-700 mb-2" style={montserrat}>🌱 Climate Commitment</p>
  <h3 className="text-xl font-bold text-neutral-900 mb-3" style={playfair}>Every Transaction Fights Climate Change</h3>
  <p className="text-sm text-neutral-600 max-w-lg mx-auto" style={montserrat}>
    Loadout is proud to partner with Stripe Climate. A portion of every transaction on our platform goes directly toward carbon removal, funding the technologies pulling CO₂ out of the atmosphere for good.
  </p>
</div>
            
            {/* FAQ */}
            <div>
              <h3 className="text-xl font-bold text-neutral-900 mb-6 text-center" style={playfair}>Common Questions</h3>
              <div className="space-y-4">
                {[
                  { q: "When do I get paid?", a: "Funds are deposited to your connected bank account within 2 business days of a completed sale." },
                  { q: "Are there any hidden fees?", a: "No. Listing is free. The only fee is 9.9% on completed sales — no monthly subscriptions, no listing fees, nothing else." },
                  { q: "What if a sale falls through?", a: "Loadout connects buyers and sellers directly. We recommend agreeing on a pickup timeframe before completing payment. For any issues, email support@loadout-marketplace.com." },
                  { q: "Do buyers pay any fees?", a: "No. Buyers pay only the listing price plus applicable sales tax. There are no buyer fees on Loadout." },
                  { q: "How do I receive my money?", a: "Connect your bank account through Stripe when you create your first listing. It takes about 2 minutes." },
                ].map((item) => (
                  <div key={item.q} className="p-5 rounded-sm" style={{ border: "1px solid #e8e8e8" }}>
                    <h4 className="text-sm font-bold text-neutral-900 mb-2" style={playfair}>{item.q}</h4>
                    <p className="text-sm text-neutral-500" style={montserrat}>{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Pricing;
