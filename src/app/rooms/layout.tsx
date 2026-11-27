import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Topic & Interest Chat Rooms | TalkToStranger",
  description:
    "Explore public topic chat rooms for gaming, music, anime, movies, tech, and chill conversations with strangers online.",
  alternates: {
    canonical: "/rooms",
  },
  openGraph: {
    title: "Topic & Interest Chat Rooms | TalkToStranger",
    description:
      "Browse public interest-based chat rooms and talk to strangers who share your vibe.",
    url: "/rooms",
  },
};

export default function RoomsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
