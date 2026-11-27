import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Anonymous Voice Call with Strangers | TalkToStranger",
  description:
    "Talk to strangers on crystal-clear HD voice calls anonymously. Instant 1-on-1 random voice chat with zero registration.",
  alternates: {
    canonical: "/voice",
  },
  openGraph: {
    title: "Free Anonymous Voice Call with Strangers | TalkToStranger",
    description:
      "Instant 1-on-1 HD voice calls with strangers worldwide. Free and anonymous.",
    url: "/voice",
  },
};

export default function VoiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
