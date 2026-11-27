import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export const metadata: Metadata = {
  title: "Random Text Chat with Strangers | TalkToStranger",
  description:
    "Start an instant anonymous text chat with random strangers worldwide. 100% free, fast matching, and no sign-up required.",
  alternates: {
    canonical: "/chat",
  },
  openGraph: {
    title: "Random Text Chat with Strangers | TalkToStranger",
    description:
      "Instant anonymous text chat with real strangers online. Free and no registration needed.",
    url: "/chat",
  },
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
