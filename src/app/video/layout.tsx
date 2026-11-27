import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Random Video Chat with Strangers | TalkToStranger",
  description:
    "Meet and talk to strangers face-to-face on free anonymous video cam chat. Instant matching, safe moderation, no sign-up required.",
  alternates: {
    canonical: "/video",
  },
  openGraph: {
    title: "Random Video Chat with Strangers | TalkToStranger",
    description:
      "Free anonymous 1-on-1 video cam chat with strangers worldwide.",
    url: "/video",
  },
};

export default function VideoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
