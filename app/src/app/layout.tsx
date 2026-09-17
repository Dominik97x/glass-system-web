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
    default: "MoonGlass | Ogrody zimowe i zadaszenia tarasów",
    template: "%s | MoonGlass",
  },

  description:
    "Ogrody zimowe, zadaszenia tarasów i zabudowy szklane na wymiar. Skonfiguruj projekt online i sprawdź orientacyjną wycenę.",

  openGraph: {
    type: "website",
    locale: "pl_PL",
    siteName: "MoonGlass",
    url: "https://moonglass.pl",
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
      <body>{children}</body>
    </html>
  );
}
