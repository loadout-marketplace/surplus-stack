import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  structuredData?: object;
  noIndex?: boolean;
}

const SEO = ({
  title = 'Loadout Marketplace | Surplus Construction & DIY Materials',
  description = 'Buy & sell surplus building & DIY materials. Get bulk-price savings without bulk quantities—up to 80% off lumber, roofing, tools & more.',
  keywords = 'surplus construction materials, building materials marketplace, discount lumber, used construction supplies, contractor materials, DIY materials, construction surplus, building supply deals',
  canonicalUrl,
  ogImage = 'https://storage.googleapis.com/gpt-engineer-file-uploads/WG7wJmAPLaTQ3GX71A4Zs8CYgCp2/social-images/social-1763430598234-Screenshot 2025-11-13 152439.png',
  ogType = 'website',
  structuredData,
  noIndex = false,
}: SEOProps) => {
  const siteUrl = window.location.origin;
  const fullCanonicalUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : window.location.href;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Loadout Marketplace" />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Loadout Marketplace" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
