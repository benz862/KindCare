import type { MetadataRoute } from "next";

import { brand } from "@/lib/copy";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    short_name: brand.name,
    description: brand.tagline,
    start_url: "/home",
    display: "standalone",
    background_color: "#f8fbfa",
    theme_color: "#0b4a86",
    lang: "en",
  };
}
