import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Placeholder brand mark until a real logo file exists — swap this out for
// a proper <Image> from a static file the moment one is uploaded.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#fdfbf6",
          fontFamily: "Georgia, serif",
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        O
      </div>
    ),
    { ...size }
  );
}
