import { Helmet } from 'react-helmet-async';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  structuredData?: object;
  breadcrumbs?: BreadcrumbItem[];
}

const SEO = ({
  title = 'Loadout Marketplace | Buy & Sell Surplus Construction Materials Near You',
  description = 'Save up to 80% on surplus construction materials. Buy & sell lumber, roofing, tools, hardware from local contractors. Free to list. Trusted by thousands.',
  keywords = 'surplus construction materials, building materials marketplace, discount lumber, used construction supplies, contractor materials, DIY materials, construction surplus, building supply deals, buy surplus lumber, sell leftover materials',
  canonicalUrl,
  ogImage = 'https://storage.googleapis.com/gpt-engineer-file-uploads/WG7wJmAPLaTQ3GX71A4Zs8CYgCp2/social-images/social-1763430598234-Screenshot 2025-11-13 152439.png',
  ogType = 'website',
  structuredData,
  breadcrumbs,
}: SEOProps) => {
  const siteUrl = 'https://loadoutmarketplace.com';
  const fullCanonicalUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : window.location.href.split('?')[0];

  const breadcrumbSchema = breadcrumbs ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `${siteUrl}${item.url}`
    }))
  } : null;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Loadout Marketplace" />
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content="Loadout Marketplace - Surplus Construction Materials" />
      <meta property="og:site_name" content="Loadout Marketplace" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content="Loadout Marketplace - Surplus Construction Materials" />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
      
      {/* Breadcrumb Schema */}
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
