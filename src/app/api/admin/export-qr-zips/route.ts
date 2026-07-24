import { NextResponse } from "next/server";
import { listGuests } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import QRCode from "qrcode";
// archiver v8 ships no bundled type declarations.
// @ts-expect-error - no types for archiver
import * as ArchiverPkg from "archiver";

// archiver v8 is pure ESM with named class exports (no factory function).
type ZipArchive = {
  on(event: "data", cb: (chunk: Buffer) => void): void;
  on(event: "end", cb: () => void): void;
  on(event: "error", cb: (err: Error) => void): void;
  append(source: Buffer, opts: { name: string }): void;
  finalize(): Promise<void>;
};
const ZipArchive = (
  ArchiverPkg as unknown as {
    ZipArchive: new (opts?: { zlib?: { level?: number } }) => ZipArchive;
  }
).ZipArchive;

export async function GET() {
  // Reuse the admin login session (cookie) instead of re-prompting for the
  // password: the organizer is already authenticated to reach this button.
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const guests = await listGuests();

    const archive = new ZipArchive({ zlib: { level: 9 } });
    const chunks: Buffer[] = [];
    archive.on("data", (c: Buffer) => chunks.push(c));
    const done = new Promise<void>((resolve, reject) => {
      archive.on("end", () => resolve());
      archive.on("error", (e: Error) => reject(e));
    });

    const used = new Set<string>();
    for (const guest of guests) {
      // Generate from the raw ticket_hash so the PNG scans at the door.
      const qrPng = await QRCode.toBuffer(guest.ticket_hash, {
        width: 600,
        margin: 4,
        color: { dark: "#1D2BF0", light: "#FFFFFF" },
      });
      const code = guest.ticket_hash.slice(0, 8).toUpperCase();
      const safeName = (guest.name || "guest")
        .replace(/[^a-z0-9]+/gi, "_")
        .replace(/^_+|_+$/g, "");
      let filename = `${safeName}_${code}.png`;
      // Guard against duplicate guest names colliding in the zip.
      if (used.has(filename)) filename = `${safeName}_${guest.ticket_hash}.png`;
      used.add(filename);
      archive.append(qrPng, { name: filename });
    }

    await archive.finalize();
    await done;

    const zip = Buffer.concat(chunks);
    return new NextResponse(new Uint8Array(zip), {
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
