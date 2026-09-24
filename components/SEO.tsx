// @ts-nocheck
import Head from "expo-router/head";
import React from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
}

export default function SEO({
  title = "Best Home Repairing, AC & Electrician Service Near Me | Patna, Fatwah, Barh & Gaya | SPC",
  description = "Top-rated doorstep home utility repairing services. Emergency AC repair, electrician, BLDC fan winding, plumber, electronic repair & cyber assistance near you in Patna, Fatwah, Danapur, Bakhtiyarpur, Barh, Mokama & Gaya.",
  keywords = "repairing near me, best repairing near me, electric service near me, electronic service near me, ac repair near me, ceiling fan repair near me, bldc motor winding patna, plumber near me, switchboard wiring fatwah, home repair services, service provider center, spc repair",
}: SEOProps) {
  const siteUrl = "https://spc-platform.vercel.app";
  const logoUrl = "https://spc-platform.vercel.app/favicon.png";

  const targetLocations = [
    { "@type": "City", name: "Patna" },
    { "@type": "City", name: "Fatwah" },
    { "@type": "City", name: "Danapur" },
    { "@type": "City", name: "Bakhtiyarpur" },
    { "@type": "City", name: "Barh" },
    { "@type": "City", name: "Mokama" },
    { "@type": "City", name: "Gaya" },
  ];

  // Specific Services List for AI Knowledge Base Matching
  const allServicesList = [
    "AC Repair & Service Near Me",
    "Ceiling Fan & BLDC Motor Repairing",
    "Electrician & Switchboard Wiring",
    "Electronic Appliance Repair Service",
    "Plumbing Utility Services",
    "Doorstep Home Repairing Services",
    "Cyber & Office Assistance Services",
  ];

  // Deep Schema for Google Search & Google AI Overviews (SGE)
  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "HomeAndConstructionBusiness",
        "@id": `${siteUrl}/#business`,
        name: "Service Provider Center (SPC)",
        url: siteUrl,
        logo: logoUrl,
        image: logoUrl,
        telephone: "+919470884239",
        priceRange: "₹₹",
        description: description,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Patna",
          addressRegion: "Bihar",
          addressCountry: "IN",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 25.5941,
          longitude: 85.1376,
        },
        areaServed: targetLocations,
        knowsAbout: allServicesList,
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "All Doorstep Home & Cyber Services",
          itemListElement: [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "AC Repairing & Servicing Near Me",
                description:
                  "Fast doorstep AC installation, gas filling, and cooling repair service across all target locations.",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Electric & Electronic Service Near Me",
                description:
                  "Expert electrician for house wiring, BLDC fan winding, motor repair, and electronic appliance servicing.",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Ceiling Fan & Motor Winding Repair",
                description:
                  "Specialized ceiling fan stator assembly, 3-phase BLDC motor, and winding repair services.",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Plumbing & General Home Utility Repair",
                description:
                  "Reliable plumbers for pipe fitting, leak repair, and complete bathroom utility maintenance.",
              },
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Cyber & Digital Office Services",
                description:
                  "Online utility services, cyber assistance, and office support tasks.",
              },
            },
          ],
        },
      },
    ],
  };

  return (
    <Head>
      {/* Title & Favicon */}
      <title>{title}</title>
      <link
        rel="icon"
        type="image/png"
        href="https://spc-platform.vercel.app/favicon.png"
      />
      <link
        rel="shortcut icon"
        href="https://spc-platform.vercel.app/favicon.png"
        type="image/x-icon"
      />
      <link
        rel="apple-touch-icon"
        href="https://spc-platform.vercel.app/favicon.png"
      />

      {/* Primary Meta Tags for Exact Keyword Matching */}
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta
        name="robots"
        content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
      />
      <meta name="author" content="Service Provider Center (SPC)" />

      {/* Google Search Brand Identifiers */}
      <meta name="site_name" content="Service Provider Center" />
      <meta name="application-name" content="Service Provider Center (SPC)" />
      <meta name="apple-mobile-web-app-title" content="SPC Repair" />

      {/* Open Graph Tags for Social & Mobile Previews */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Service Provider Center" />
      <meta property="og:url" content={siteUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={logoUrl} />

      {/* Regional GPS & Location Tags for 'Near Me' Searches */}
      <meta name="geo.region" content="IN-BR" />
      <meta
        name="geo.placename"
        content="Patna, Fatwah, Danapur, Bakhtiyarpur, Barh, Mokama, Gaya"
      />
      <meta name="geo.position" content="25.5941;85.1376" />
      <meta name="ICBM" content="25.5941, 85.1376" />

      {/* Structured JSON-LD Schema Engine for Google AI & Crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
    </Head>
  );
}
