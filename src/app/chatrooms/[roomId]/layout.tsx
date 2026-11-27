import type { Metadata } from "next";

function formatRoomName(roomId: string): string {
  return roomId
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ roomId: string }>;
}): Promise<Metadata> {
  const { roomId } = await params;
  const roomName = formatRoomName(roomId) || "Chat Room";

  return {
    title: `${roomName} Live Chat Room | TalkToStranger`,
    description: `Join the ${roomName} live voice and text chat room on TalkToStranger. Connect anonymously with people online right now.`,
    alternates: {
      canonical: `/chatrooms/${roomId}`,
    },
    openGraph: {
      title: `${roomName} Live Chat Room | TalkToStranger`,
      description: `Join the ${roomName} anonymous group voice and text chat room.`,
      url: `/chatrooms/${roomId}`,
    },
  };
}

export default function ChatroomDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
