import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const playfair: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const montserrat: React.CSSProperties = { fontFamily: "'Montserrat', sans-serif" };

const sections = [
  {
    title: "1. Introduction",
    content: "Loadout Marketplace, Inc. ('Loadout,' 'we,' 'us,' or 'our') operates the platform available at loadout-marketplace.com. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, mobile application, and related services (collectively, the 'Services'). By using the Services, you agree to the collection and use of information in accordance with this policy. If you do not agree, please discontinue use immediately."
  },
  {
    title: "2. Information We Collect",
    content: "We collect the following categories of information: (a) Account Information: name, username, email address, password, ZIP code, company name, and profile photo when you register. (b) Listing Information: photos, descriptions, pricing, quantities, and location data you provide when creating listings. (c) Transaction Information: purchase history, order details, payment amounts, and transaction status. (d) Location Data: city, state, and ZIP code you provide to facilitate local transactions. (e) Communications: messages exchanged between buyers and sellers through our platform, support inquiries, and feedback. (f) Device and Usage Data: IP address, browser type, operating system, pages visited, time spent on pages, links clicked, and referring URLs collected automatically when you use the Services. (g) Payment Information: payment method details are collected and processed directly by Stripe, Inc. Loadout does not store full payment card numbers or bank account credentials on its servers."
  },
  {
    title: "3. How We Use Your Information",
    content: "We use the information we collect to: (a) create and manage your account and authenticate your identity; (b) facilitate transactions between buyers and sellers, including processing payments through Stripe; (c) hold funds in escrow and release payments to sellers upon confirmed pickup; (d) send transactional emails including order confirmations, pickup notifications, and payout confirmations; (e) send account-related notices including security alerts and policy updates; (f) enable secure messaging between buyers and sellers; (g) display seller profiles, ratings, and transaction history to other users; (h) enforce our Terms of Service and prevent fraud, abuse, and illegal activity; (i) analyze platform usage to improve our Services; (j) comply with applicable legal obligations; and (k) respond to customer support requests."
  },
  {
    title: "4. Information Sharing and Disclosure",
    content: "We do not sell your personal information. We may share your information in the following circumstances: (a) With Other Users: your username, general location (city/state), listings, and ratings are visible to other users as necessary to operate the marketplace. Your email address and full payment details are never shared with other users. (b) With Service Providers: we share information with third-party vendors who assist in operating our platform, including Stripe, Inc. (payment processing and seller payouts), Supabase (database hosting and authentication), Vercel (website hosting), and Resend (transactional email delivery). These providers are contractually obligated to protect your information and may only use it to provide services to us. (c) For Legal Compliance: we may disclose your information if required by law, subpoena, court order, or other legal process, or when we believe disclosure is necessary to protect our rights, prevent fraud, or protect the safety of users or the public. (d) Business Transfers: in connection with a merger, acquisition, bankruptcy, or sale of assets, your information may be transferred as part of that transaction. We will notify you via email or prominent notice on our website of any such change in ownership. (e) With Your Consent: we may share your information for any other purpose with your explicit consent."
  },
  {
    title: "5. Payment Processing and Stripe Connect",
    content: "All payment processing on Loadout is handled by Stripe, Inc. When you make a purchase, your payment information is transmitted directly to Stripe and is subject to Stripe's Privacy Policy (available at stripe.com/privacy). Loadout does not store credit card numbers, bank account numbers, or other sensitive financial credentials. Sellers who connect their bank accounts to receive payouts do so through Stripe Connect, and their banking information is stored and managed exclusively by Stripe. Funds paid by buyers are held in escrow by Loadout through Stripe until the buyer confirms pickup, at which point funds are automatically transferred to the seller's connected Stripe account, less the 9.9% platform fee. Additionally, a portion of each transaction is contributed to carbon removal through Stripe Climate."
  },
  {
    title: "6. Data Retention",
    content: "We retain your personal information for as long as your account is active or as needed to provide you with the Services. We retain transaction records, communications, and account data for a minimum of seven (7) years after account closure to comply with applicable tax, legal, and accounting requirements. You may request deletion of your account and associated data by contacting support@loadout-marketplace.com. Note that we may retain certain information even after deletion where required by law or for legitimate business purposes such as fraud prevention."
  },
  {
    title: "7. Data Security",
    content: "We implement industry-standard technical and organizational measures to protect your personal information, including encryption of data in transit (TLS/HTTPS), secure database storage through Supabase hosted on AWS infrastructure, access controls limiting employee access to personal data, and regular security monitoring. However, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security and are not responsible for breaches resulting from factors outside our reasonable control. In the event of a data breach that affects your personal information, we will notify you as required by applicable law."
  },
  {
    title: "8. Cookies and Tracking Technologies",
    content: "We use cookies, local storage, and similar tracking technologies to maintain your session and keep you logged in, remember your preferences and settings, analyze how our Services are used, and detect and prevent fraud. We use only essential and functional cookies necessary to operate the platform. We do not use third-party advertising cookies or sell data to advertising networks. You may disable cookies through your browser settings, but doing so may affect the functionality of the Services, including your ability to remain logged in."
  },
  {
    title: "9. Your Rights and Choices",
    content: "Depending on your location, you may have the following rights regarding your personal information: (a) Access: the right to request a copy of the personal information we hold about you. (b) Correction: the right to request correction of inaccurate or incomplete information. You may update most information directly in your account settings. (c) Deletion: the right to request deletion of your personal information, subject to legal retention requirements. (d) Portability: the right to receive your data in a structured, commonly used format. (e) Objection: the right to object to certain processing of your information. To exercise any of these rights, contact us at support@loadout-marketplace.com. We will respond to all requests within 30 days. We do not discriminate against users who exercise their privacy rights."
  },
  {
    title: "10. California Privacy Rights (CCPA)",
    content: "If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA). You have the right to know what personal information we collect, use, disclose, and sell. You have the right to delete your personal information. You have the right to opt out of the sale of your personal information. We do not sell personal information as defined under the CCPA. You may designate an authorized agent to submit requests on your behalf. To exercise your California privacy rights, contact us at support@loadout-marketplace.com with the subject line 'California Privacy Request.'"
  },
  {
    title: "11. Children's Privacy",
    content: "The Services are not directed to individuals under the age of 18. We do not knowingly collect, solicit, or maintain personal information from anyone under 18. If we learn that we have collected personal information from a child under 18 without parental consent, we will delete that information promptly. If you believe we have inadvertently collected information from a minor, please contact us immediately at support@loadout-marketplace.com."
  },
  {
    title: "12. Third-Party Links and Services",
    content: "The Services may contain links to third-party websites, applications, or services that are not operated by Loadout Marketplace. This Privacy Policy does not apply to those third-party services. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party services. We encourage you to review the privacy policy of every site or service you visit."
  },
  {
    title: "13. Changes to This Policy",
    content: "We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make material changes, we will update the 'Last Updated' date at the top of this page and, where required by law or where we deem appropriate, notify you by email or by posting a prominent notice on the Services. Your continued use of the Services after the effective date of any updated Privacy Policy constitutes your acceptance of the revised policy. We encourage you to review this page periodically."
  },
  {
    title: "14. Contact Us",
    content: "If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at: Loadout Marketplace, Inc., Email: support@loadout-marketplace.com, Website: https://www.loadout-marketplace.com. We take privacy concerns seriously and will respond to all inquiries within 30 days."
  },
];

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container max-w-3xl px-6" style={{ paddingTop: "96px", paddingBottom: "80px" }}>

        <Link to="/" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-neutral-700 transition-colors mb-10" style={montserrat}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </Link>

        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.22em] text-neutral-400 mb-4" style={montserrat}>Legal</p>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2" style={playfair}>Privacy Policy</h1>
          <p className="text-xs text-neutral-400" style={montserrat}>Last Updated: May 17, 2026</p>
          <div className="silver-rule mt-8" />
        </div>

        <div className="space-y-10">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-lg font-bold text-neutral-900 mb-3" style={playfair}>{section.title}</h2>
              <p className="text-sm text-neutral-600 leading-relaxed" style={montserrat}>{section.content}</p>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ borderTop: "1px solid #ebebeb", background: "#fafafa", padding: "32px 0" }}>
        <div className="container max-w-6xl text-center">
          <p className="text-xs text-neutral-400" style={montserrat}>&copy; {new Date().getFullYear()} Loadout Marketplace. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
