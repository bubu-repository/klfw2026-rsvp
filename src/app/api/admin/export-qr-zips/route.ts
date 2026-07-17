import { NextResponse } from "next/server";
import { listGuests } from "@/lib/db";
import QRCode from "qrcode";
const archiver = require("archiver");

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pwd = url.searchParams.get("password");

  if (pwd !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const guests = await listGuests();

    // Use readable stream with archiver for ZIP creation
    const { Readable: ReadableStream } = await import("stream");

    const archive = archiver("zip", { zlib: { level: 9 } });

    // Append QR codes to zip
    for (const guest of guests) {
      let qrBuffer = guest.qr_code;
      if (!qrBuffer || qrBuffer.length === 0) {
        const qrUrl = `${process.env.APP_URL}/ticket/${guest.ticket_hash}`;
        qrBuffer = await QRCode.toBuffer(qrUrl, { margin: 4, width: 400 });
      }

      if (qrBuffer && qrBuffer.length > 0) {
        const filename = `${guest.name.replace(/\s+/g, "_")}_${guest.ticket_hash.slice(0, 8)}.png`;
        archive.append(qrBuffer, { name: `QR Codes/${filename}` });
      }
    }

    archive.finalize();

    return new NextResponse(archive as any, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="klfw_2026_qr_codes.zip"',
      },
    });
  } catch (err) {
    console.error("[api/admin/export-qr-zips]", err);
    return NextResponse.json(
      { error: "Failed to export QR codes" },
      { status: 500 }
    );
  }
}
