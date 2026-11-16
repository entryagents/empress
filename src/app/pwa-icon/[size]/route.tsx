import { ImageResponse } from "next/og";

const SIZES: Record<string, { px: number; maskable: boolean }> = {
  "192": { px: 192, maskable: false },
  "512": { px: 512, maskable: false },
  "maskable-512": { px: 512, maskable: true },
};

export async function GET(_req: Request, ctx: { params: Promise<{ size: string }> }) {
  const { size } = await ctx.params;
  const cfg = SIZES[size];
  if (!cfg) return new Response("Not found", { status: 404 });

  const { px, maskable } = cfg;
  // Maskable icons need content within the central safe zone (~80%)
  const fontSize = Math.round(px * (maskable ? 0.42 : 0.56));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#340a18",
          borderRadius: maskable ? 0 : Math.round(px * 0.22),
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: Math.round(px * (maskable ? 0.62 : 0.78)),
            height: Math.round(px * (maskable ? 0.62 : 0.78)),
            borderRadius: "50%",
            border: `${Math.max(2, Math.round(px * 0.02))}px solid #d4af6a`,
            color: "#d4af6a",
            fontSize,
            fontWeight: 700,
            fontFamily: "serif",
          }}
        >
          E
        </div>
      </div>
    ),
    { width: px, height: px }
  );
}
