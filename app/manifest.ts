import type { MetadataRoute } from "next";

/** Required for static export: the manifest must be generated at build time. */
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kana Trainer — learn Japanese kana",
    short_name: "Kana Trainer",
    description:
      "Minimal drills for hiragana and katakana: read, type, pick or draw. Works offline.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#141313",
    theme_color: "#141313",
    categories: ["education", "utilities"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
