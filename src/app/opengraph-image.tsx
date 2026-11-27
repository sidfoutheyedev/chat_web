import { ImageResponse } from "next/og";

export const alt = "TalkToStranger - Free Anonymous Chat, Voice & Video";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #09090f 0%, #170d2e 55%, #09090f 100%)",
          color: "#ffffff",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "10px 24px",
            borderRadius: "999px",
            border: "1px solid rgba(168, 85, 247, 0.45)",
            background: "rgba(147, 51, 234, 0.18)",
            color: "#d8b4fe",
            fontSize: "24px",
            fontWeight: 600,
            marginBottom: "28px",
          }}
        >
          100% Free · Anonymous · No Sign-Up
        </div>

        <div
          style={{
            fontSize: "76px",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            textAlign: "center",
            lineHeight: 1.1,
            marginBottom: "22px",
            background: "linear-gradient(90deg, #ffffff 0%, #e9d5ff 50%, #f9a8d4 100%)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          TalkToStranger
        </div>

        <div
          style={{
            fontSize: "32px",
            color: "#cbd5e1",
            textAlign: "center",
            maxWidth: "880px",
            lineHeight: 1.4,
            marginBottom: "42px",
          }}
        >
          Instant random text chat, HD voice calls, video cam, and public topic rooms worldwide.
        </div>

        <div
          style={{
            display: "flex",
            gap: "20px",
            fontSize: "22px",
            color: "#a855f7",
            fontWeight: 600,
          }}
        >
          <span>Text Chat</span>
          <span>·</span>
          <span>Voice Calls</span>
          <span>·</span>
          <span>Video Cam</span>
          <span>·</span>
          <span>City Rooms</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
