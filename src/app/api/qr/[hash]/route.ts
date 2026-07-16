import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getGuestByHash } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;
  const guest = await getGuestByHash(hash);
  if (!guest) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }

  const png = await QRCode.toBuffer(guest.ticket_hash, {
    width: 440,
    // Full 4-module quiet zone: readers fail to detect the code at all when
    // the PNG is viewed against a dark background with a thinner margin.
    margin: 4,
    color: { dark: "#1d2bf0", light: "#ffffff" },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
