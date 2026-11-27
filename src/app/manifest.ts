import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "TalkToStranger - Anonymous Chat & Voice",
    short_name: "TalkToStranger",
    description:
      "Connect anonymously with real strangers worldwide across instant random text, HD voice call, video cam, and topic chat rooms.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#09090f",
    theme_color: "#09090f",
    categories: ["social", "communication"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Random Text Chat",
        short_name: "Text Chat",
        url: "/chat",
      },
      {
        name: "Voice Call",
        short_name: "Voice",
        url: "/voice",
      },
      {
        name: "Video Cam",
        short_name: "Video",
        url: "/video",
      },
    ],
  };
}
