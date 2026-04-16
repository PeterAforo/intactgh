// Structured data components for SEO (JSON-LD)

export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Intact Ghana",
    url: "https://www.intactghana.com",
    logo: "https://www.intactghana.com/logo.png",
    description: "Ghana's #1 destination for electronics, smartphones, laptops, TVs, and home appliances.",
    foundingDate: "2014",
    address: {
      "@type": "PostalAddress",
      streetAddress: "A&C Mall, East Legon",
      addressLocality: "Accra",
      addressRegion: "Greater Accra",
      addressCountry: "GH",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+233-543-645-126",
      contactType: "customer service",
      availableLanguage: "English",
    },
    sameAs: [
      "https://www.facebook.com/share/1CV6VqyyYa/",
      "https://www.instagram.com/intact_ghana",
      "https://www.tiktok.com/@intactghana_",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function WebSiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Intact Ghana",
    url: "https://www.intactghana.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://www.intactghana.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function LocalBusinessJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "ElectronicsStore",
    name: "Intact Ghana",
    image: "https://www.intactghana.com/logo.png",
    url: "https://www.intactghana.com",
    telephone: "+233-543-645-126",
    email: "sales@intactghana.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "A&C Mall, East Legon",
      addressLocality: "Accra",
      addressRegion: "Greater Accra",
      postalCode: "",
      addressCountry: "GH",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 5.6369,
      longitude: -0.1654,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "10:00",
        closes: "16:00",
      },
    ],
    priceRange: "₵₵",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function ProductJsonLd({
  name, description, image, price, currency, sku, brand, url, inStock, rating, reviewCount,
}: {
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  sku?: string;
  brand?: string;
  url: string;
  inStock: boolean;
  rating?: number;
  reviewCount?: number;
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image,
    sku: sku || undefined,
    brand: brand ? { "@type": "Brand", name: brand } : undefined,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: currency || "GHS",
      price: price.toFixed(2),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Intact Ghana",
      },
    },
  };

  if (rating && reviewCount) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating.toFixed(1),
      reviewCount,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
