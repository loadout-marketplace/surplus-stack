import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const playfair: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const montserrat: React.CSSProperties = { fontFamily: "'Montserrat', sans-serif" };

const sections = [
  { title: "1. Information We Collect", content: "We collect information you provide directly to us, such as when you create an account, list items for sale, make purchases, or communicate with other users. This may include your name, email address, phone number, company name, location, and payment information." },
  { title: "2. How We Use Your Information", content: "We use the information we collect to provide, maintain, and improve our services; process transactions and send related information; send you technical notices and support messages; respond to your comments and questions; monitor and analyze trends and usage; and detect, prevent, and address fraud and security issues." },
  { title: "3. Information Sharing", content: "We may share your information in the following circumstances: with other users when you list items or make purchases; with service providers who perform services on our behalf; in response to legal requests or to prevent harm; and in connection with a merger, sale, or acquisition." },
  { title: "4. Data Security", content: "We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction." },
  { title: "5. Your Rights", content: "You have the right to access, update, or delete your personal information. You can do this by logging into your account or contacting us directly." },
  { title: "6. Cookies", content: "We use cookies and similar tracking technologies to collect information about your browsing activities and to provide you with a personalized experience." },
  { title: "7. Children's Privacy", content: "Our services are not intended for users under the age of 18. We do not knowingly collect personal information from children under 18." },
  { title: "8. Changes to This Policy", content: "We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the \"Last Updated\" date." },
  { title: "9. Contact Us", content: "If you have any questions about this Privacy Policy, please contact us through our support channels." },
];

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container max-w-3xl px-6" style={{ paddingTop: "96px", paddingBottom: "80px" }}>

        {/* Back */}
        <Link to="/" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-neutral-700 transition-colors mb-10" style={montserrat}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
        </Link>

        {/* Header */}
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.22em] text-neutral-400 mb-4" style={montserrat}>Legal</p>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2" style={playfair}>Privacy Policy</h1>
          <p className="text-xs text-neutral-400" style={montserrat}>Last Updated: January 2025</p>
          <div className="silver-rule mt-8" />
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-lg font-bold text-neutral-900 mb-3" style={playfair}>{section.title}</h2>
              <p className="text-sm text-neutral-600 leading-relaxed" style={montserrat}>{section.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #ebebeb", background: "#fafafa", padding: "32px 0" }}>
        <div className="container max-w-6xl text-center">
          <p className="text-xs text-neutral-400" style={montserrat}>&copy; {new Date().getFullYear()} Loadout Marketplace. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
