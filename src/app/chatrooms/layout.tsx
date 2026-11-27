import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "City Voice & Text Chat Rooms | TalkToStranger",
  description:
    "Join live city-based voice and text chat rooms across India and worldwide. Hang out, talk, and meet new people anonymously.",
  alternates: {
    canonical: "/chatrooms",
  },
  openGraph: {
    title: "City Voice & Text Chat Rooms | TalkToStranger",
    description:
      "Join live city chat rooms for anonymous group voice and text conversations.",
    url: "/chatrooms",
  },
};

export default function ChatroomsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
