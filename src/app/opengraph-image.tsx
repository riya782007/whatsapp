import { ImageResponse } from "next/og";

export const alt = "Voice2WA – Speak Your Mind, Send Like a Pro";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded social-share image, generated at build/request time.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0E9F6E 0%, #25D366 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontSize: 34,
            fontWeight: 700,
            opacity: 0.95,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
            }}
          >
            🎙️
          </div>
          Voice2WA
        </div>

        <div
          style={{
            fontSize: 78,
            fontWeight: 800,
            lineHeight: 1.05,
            marginTop: 40,
            maxWidth: 980,
          }}
        >
          Speak your mind. Send like a pro.
        </div>

        <div style={{ fontSize: 38, marginTop: 28, opacity: 0.92, maxWidth: 920 }}>
          Voice notes → polished WhatsApp messages in Hindi, Hinglish & English.
        </div>
      </div>
    ),
    { ...size }
  );
}
