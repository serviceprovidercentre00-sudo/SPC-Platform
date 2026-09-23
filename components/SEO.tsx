// @ts-nocheck
import Head from "expo-router/head";
import React from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
}

export default function SEO({
  title = "Service Provider Center (SPC) | Best Home Utility Repair Services in Patna & Fatwah",
  description = "Top rated home repair services in Patna & Fatwah. Ceiling fan repair, BLDC motor wiring, plumber, electrician, cyber services, and emergency home utility repairs.",
  keywords = "repairing near me, electrician in patna, plumber in patna, fan repair patna, motor winding fatwah, home repair services, service provider center, spc repair",
}: SEOProps) {
  const siteUrl = "https://spc-platform.vercel.app";
  const logoUrl = "https://spc-platform.vercel.app/favicon.png";

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: "Service Provider Center (SPC)",
    image: logoUrl,
    "@id": siteUrl,
    url: siteUrl,
    telephone: "+919470884239",
    priceRange: "₹₹",
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
    areaServed: [
      { "@type": "City", name: "Patna" },
      { "@type": "City", name: "Fatwah" },
    ],
    description: description,
  };

  return (
    <Head>
      {/* Title & Browser Favicon Logo */}
      <title>{title}</title>
      <link rel="icon" type="image/png" href="/favicon.png" />
      <link rel="shortcut icon" href="/favicon.png" type="image/x-icon" />
      <link rel="apple-touch-icon" href="/favicon.png" />

      {/* Meta Tags */}
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Service Provider Center (SPC)" />

      {/* Open Graph Tags for Social Sharing */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Service Provider Center (SPC)" />
      <meta property="og:url" content={siteUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={logoUrl} />

      {/* Structured Data Schema for Search Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
    </Head>
  );
}
