# Loadout Marketplace

**A two-sided marketplace for surplus and salvage construction materials.**
Contractors list leftover lumber, roofing, electrical, and other materials; buyers purchase them at a discount through fixed-price listings or timed auctions.

🔗 **Live site:** [loadout-marketplace.com](https://www.loadout-marketplace.com)

---

## Highlights

- **AI-powered listings.** Sellers upload a photo, and a vision model (Anthropic Claude) identifies the material and auto-fills the title, description, category, condition, quantity, unit, and a suggested price. This cut average listing time from about 3 minutes to about 15 seconds.
- **Fixed-price and auction listings.** Auctions support starting bids and reserve prices. A scheduled server function closes expired auctions, determines the winning bid, and notifies buyers and sellers.
- **Stripe Connect seller onboarding** for marketplace payouts.
- **Messaging, notifications, and reputation.** Buyer–seller message threads, in-app notifications, seller ratings and reviews, and seller badges.
- **AI support chatbot** that answers buyer and seller questions (authenticated users only).
- **Admin dashboard** with server-side role checks.

## Tech Stack

| Layer | Tools |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, TanStack Query |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions on Deno) |
| AI | Anthropic Claude API (vision for listing analysis, chat for support) |
| Payments | Stripe Connect |
| Hosting | Vercel |
| Validation | Zod, React Hook Form |

## Architecture

```
React (Vite) client  ──►  Supabase Auth + PostgreSQL (Row Level Security on every table)
        │
        └──►  Supabase Edge Functions
                 ├── analyze-listing-image     → Claude vision → structured listing JSON
                 ├── chat-support              → authenticated AI support assistant
                 └── process-expired-auctions  → HMAC-verified scheduled job that settles auctions
```

### Security

- **Row Level Security** enabled on all 12 tables, with 69 policies defined across 36 migrations.
- **Secret keys stay server-side.** API keys for Anthropic and Stripe live only in Edge Function environment variables, never in the client.
- **The scheduled auction job** verifies HMAC-SHA256 signatures with timestamp checks to block replayed or forged requests.
- **Notification text is sanitized** to prevent XSS.
- **Edge functions validate auth tokens** and cap request sizes to limit abuse.

## Project Structure

```
src/
  pages/           Listings, ListingDetail, CreateListing, Dashboard, Orders, Messages, Admin, ...
  components/      Navbar, BidDialog, ReviewDialog, SellerRating, SellerBadges, ChatBot, ...
  hooks/           useAuth, useNotifications
  integrations/    Supabase client and generated database types
supabase/
  functions/       Edge Functions (AI listing analysis, support chat, auction settlement)
  migrations/      Database schema, RLS policies, and functions
```

## Running Locally

```bash
git clone https://github.com/loadout-marketplace/surplus-stack.git
cd surplus-stack
npm install
cp .env.example .env   # add your Supabase URL, publishable key, and Stripe publishable key
npm run dev
```

## About

Built by **Derek Hayduk**, Co-Founder & CEO of Loadout Marketplace.
Developed with AI-assisted tooling (Lovable, Claude); I designed the product, data model, security policies, and AI features, and handle deployment and operations.

[LinkedIn](https://linkedin.com/in/derek-hayduk-purdue) · haydukderek17@gmail.com
