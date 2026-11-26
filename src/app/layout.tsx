import type { Metadata } from "next";
import "./globals.css";
import { SafeBanner } from "@/components/SafeBanner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AgeGateModal } from "@/components/AgeGateModal";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://chatsphere.com").replace(/\/+$/, "");

export const metadata: Metadata = {
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
  openGraph: {
    title: "TalkToStranger - Anonymous Random Chat & Voice Calls",
    description: "Instant stranger matching with text, voice, video cam, and public rooms.",
    type: "website",
    url: SITE_URL,
    siteName: "ChatSphere",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen flex flex-col bg-[#09090f] text-slate-100 antialiased selection:bg-purple-600 selection:text-white">
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
