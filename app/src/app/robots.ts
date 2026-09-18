import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api"],
    },
    sitemap: "https://moonglass.pl/sitemap.xml",
    host: "https://moonglass.pl",
  };
}