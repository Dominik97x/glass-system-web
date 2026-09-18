import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://moonglass.pl"),

  title: {
    default: "Ogrody zimowe i zadaszenia tarasów na wymiar | MoonGlass",
    template: "%s | MoonGlass",
  },

  description:
    "Ogrody zimowe, zadaszenia tarasów i zabudowy szklane na wymiar. Skonfiguruj projekt online i sprawdź orientacyjną wycenę.",

  openGraph: {
    type: "website",
    locale: "pl_PL",
    siteName: "MoonGlass",
    images: [
      {
        url: "/images/glass-system/hero-moonglass-day-v2.png",
        alt: "MoonGlass — ogrody zimowe i zadaszenia tarasów",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    images: ["/images/glass-system/hero-moonglass-day-v2.png"],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://moonglass.pl/#organization",
  name: "MoonGlass",
  legalName: "Moon Glass Monika Bąk",
  url: "https://moonglass.pl",
  email: "biuro@moonglass.pl",
  telephone: "+48 533 850 226",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Elizy Orzeszkowej 14/54",
    postalCode: "02-374",
    addressLocality: "Warszawa",
    addressCountry: "PL",
  },
  areaServed: {
    "@type": "Country",
    name: "Polska",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://moonglass.pl/#website",
  url: "https://moonglass.pl",
  name: "MoonGlass",
  inLanguage: "pl-PL",
  publisher: {
    "@id": "https://moonglass.pl/#organization",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${manrope.variable} ${cormorant.variable} antialiased`}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
