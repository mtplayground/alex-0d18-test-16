import type { MetadataRoute } from "next";

import { getAbsoluteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/posts/new", "/profile/edit", "/users/*/edit"],
    },
    sitemap: getAbsoluteUrl("/sitemap.xml"),
  };
}
