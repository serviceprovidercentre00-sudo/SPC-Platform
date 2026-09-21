// @ts-nocheck
import Head from "expo-router/head";
import React from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
}

export default function SEO({
  title = "Best Home Repair & Electrician Service in Patna | Service Provider Center (SPC)",
  description = "Top rated home repair services in Patna & Fatwah. Ceiling fan repair, BLDC motor wiring, plumber, electrician, and emergency home utility repair services.",
  keywords = "repairing near me, electrician in patna, plumber in patna, fan repair patna, motor winding fatwah, home repair services, service provider center, spc repair",
}: SEOProps) {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: "Service Provider Center (SPC)",
    image: "https://spc-platform.vercel.app/favicon.png",
    "@id": "https://spc-platform.vercel.app",
    url: "https://spc-platform.vercel.app",
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
      {/* Title & Favicon */}
      <title>{title}</title>
      <link rel="icon" type="image/png" href="/favicon.png" />
      <link rel="shortcut icon" href="/favicon.png" />
      <link rel="apple-touch-icon" href="/favicon.png" />

      {/* Meta Tags */}
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Service Provider Center" />

      {/* Open Graph Tags for Social Media */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://spc-platform.vercel.app/" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta
        property="og:image"
        content="https://spc-platform.vercel.app/favicon.png"
      />

      {/* Structured Data Schema for Google & AI Search */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
    </Head>
  );
}
