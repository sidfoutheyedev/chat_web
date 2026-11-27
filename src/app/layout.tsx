import type { Metadata } from "next";
import "./globals.css";
import { SafeBanner } from "@/components/SafeBanner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AgeGateModal } from "@/components/AgeGateModal";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://talktostranger.online").replace(/\/+$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "TalkToStranger - Talk to Strangers Online | Free Anonymous Chat & Voice",
  description: "Connect anonymously with real strangers worldwide across instant random text, HD voice call, video cam, and topic chat rooms. 100% free, no sign-up required.",
  keywords: [
    "talk to strangers",
    "random chat",
    "voice chat strangers",
    "video chat strangers",
    "anonymous chat online",
    "omegle alternative",
    "free chat rooms"
  ],
  authors: [{ name: "TalkToStranger" }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "TalkToStranger - Anonymous Random Chat & Voice Calls",
    description: "Instant stranger matching with text, voice, video cam, and public rooms.",
    type: "website",
    url: SITE_URL,
    siteName: "TalkToStranger",
  },
  twitter: {
    card: "summary_large_image",
    title: "TalkToStranger - Talk to Strangers Online",
    description: "Free anonymous text, voice, and video chat with strangers worldwide.",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "y1ffNa40I7leuXaeNJR1ZcMiWKOuY2w5qU0eAjMeNZs",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "TalkToStranger",
  url: SITE_URL,
  description:
    "Connect anonymously with real strangers worldwide across instant random text, HD voice call, video cam, and topic chat rooms.",
  publisher: {
    "@type": "Organization",
    name: "TalkToStranger",
    url: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen flex flex-col bg-[#09090f] text-slate-100 antialiased selection:bg-purple-600 selection:text-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SafeBanner />
        <Navbar />
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        <Footer />
        <AgeGateModal />
      </body>
    </html>
  );
}
