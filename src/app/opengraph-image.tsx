import { ImageResponse } from "next/og";

export const alt = "Portage: You trained for this abroad. Now practise it here.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** 1200x630 social card: the hero headline on ink with the maple mark. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#0c0a09",
          color: "#fafaf9",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#D52B1E" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
            <path d="M12 2.5 13.6 6.4 16 5.4 15.2 9.8 19.4 8.2 18.5 11.1 21 12 16.7 15.3 17.3 17 12 16.2 6.7 17 7.3 15.3 3 12 5.5 11.1 4.6 8.2 8.8 9.8 8 5.4 10.4 6.4Z" />
            <path d="M12 16.2V21.5" />
          </svg>
          <span style={{ fontSize: 40, letterSpacing: -1 }}>Portage</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 76, lineHeight: 1.05, letterSpacing: -2 }}>
          <span>You trained for this abroad.</span>
          <span style={{ color: "#78716c" }}>Now practise it here.</span>
        </div>
        <div style={{ display: "flex", fontSize: 20, color: "#a8a29e", letterSpacing: 3 }}>
          CARRY YOUR CAREER ACROSS
        </div>
      </div>
    ),
    size,
  );
}
