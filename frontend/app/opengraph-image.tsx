import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "SoU Technology Solutions — Software, SaaS, Blockchain & Web3";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logo = await readFile(join(process.cwd(), "public/client/images/logo.svg"), "base64");

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 80px", background: "#faf9f6", color: "#19202c", borderBottom: "12px solid #b18a47" }}>
        {/* Satori renders this local SVG directly into the shareable PNG. */}
        <img src={`data:image/svg+xml;base64,${logo}`} width={282} height={124} alt="SoU Technology Solutions" />
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 62, fontWeight: 700 }}>Your vision. Our expertise.</div>
          <div style={{ fontSize: 30, color: "#846127" }}>Software · SaaS · Blockchain &amp; Web3</div>
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#666b72" }}>soutechnology.vn</div>
      </div>
    ),
    size,
  );
}
