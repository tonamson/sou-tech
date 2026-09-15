import type { MetadataRoute } from "next";
import { site } from "@/src/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // Section fragments are part of the homepage, not separate indexable pages.
  return [{ url: site.url }];
}
