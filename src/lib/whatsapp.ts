import { promises as fs } from "fs";
import path from "path";
import type { Guest } from "./types";

export type WhatsappOutcome = "sent" | "dev" | "failed" | "skipped";

function appUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

// Wablas dashboard gives you a per-account server domain (e.g.
// https://sby-1.wablas.com) and a device token. Both are required; the
// secret key is only needed if you turned on "secret key" security in the
// Wablas dashboard (Device > Settings).
function wablasBaseUrl(): string | null {
  const url = process.env.WABLAS_BASE_URL;
  return url ? url.replace(/\/$/, "") : null;
}

function wablasAuthHeader(): string | null {
  const token = process.env.WABLAS_TOKEN;
  if (!token) return null;
  const secret = process.env.WABLAS_SECRET_KEY;
  return secret ? `${token}.${secret}` : token;
}

// Guests are asked for a phone number in local Malaysian format (the form's
// placeholder is "012 345 6789"), so a bare leading 0 is assumed to be a
// Malaysian number missing its +60 country code. Anything that already
// includes a country code (starts with + or with no leading 0) passes
// through untouched. Wablas expects digits only, no leading +.
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("+")) {
    return trimmed.slice(1).replace(/\D/g, "");
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return `60${digits.slice(1)}`;
  }
  return digits;
}

function ticketMessage(guest: Guest, ticketUrl: string): string {
  const shortCode = guest.ticket_hash.slice(0, 8).toUpperCase();
  const vip = guest.category === "vip" ? "🖤 *VIP*\n" : "";
  const afterParty = guest.attending_after_party
    ? "🎉 After party ft. Juju: 7.00–10.00 PM · Level 3, Isetan KLCC\n"
    : "";

  return (
    `✨ *You're on the list* ✨\n` +
    `KLFW 2026 x Cultured by Todak\n\n` +
    `${vip}*${guest.name}*\n` +
    `Ticket ${shortCode}\n\n` +
    `📅 Friday, 07.08.2026\n` +
    `🕠 Registration 5.00 PM · Runway 6.00 PM\n` +
    `${afterParty}` +
    `📍 Esplanade, KLCC Park, Kuala Lumpur\n\n` +
    `Your ticket & QR code: ${ticketUrl}\n\n` +
    `Show the QR code above at registration.`
  );
}

// Sends the ticket as a WhatsApp image (the QR code) with the details as a
// caption, via Wablas (https://wablas.com). Never throws: the RSVP must
// succeed even when WhatsApp delivery fails. Without WABLAS_BASE_URL/
// WABLAS_TOKEN (local dev) the message is written to .dev-data/outbox-wa/
// so it can be inspected.
export async function sendTicketWhatsapp(guest: Guest): Promise<WhatsappOutcome> {
  if (!guest.phone) {
    return "skipped";
  }

  try {
    const base = appUrl();
    const ticketUrl = `${base}/ticket/${guest.ticket_hash}`;
    const qrImageUrl = `${base}/api/qr/${guest.ticket_hash}`;
    const phone = normalizePhone(guest.phone);
    const caption = ticketMessage(guest, ticketUrl);

    const baseUrl = wablasBaseUrl();
    const auth = wablasAuthHeader();

    if (baseUrl && auth) {
      const res = await fetch(`${baseUrl}/api/send-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: auth,
        },
        body: JSON.stringify({
          phone,
          image: qrImageUrl,
          caption,
        }),
      });

      const data = await res.json().catch(() => null);
      // Wablas returns { status: true/false, ... } on both 200 and error
      // responses, so check the body, not just the HTTP status.
      if (!res.ok || data?.status === false) {
        console.error("[whatsapp] Wablas error:", res.status, data);
        return "failed";
      }
      return "sent";
    }

    if (process.env.NODE_ENV === "production") {
      console.warn(
        `[whatsapp] No WABLAS_BASE_URL/WABLAS_TOKEN in production. Skipping WhatsApp for ${guest.phone}.`
      );
      return "failed";
    }

    const outbox = path.join(process.cwd(), ".dev-data", "outbox-wa");
    await fs.mkdir(outbox, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const slug = phone.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    await fs.writeFile(
      path.join(outbox, `${stamp}-${slug}.txt`),
      `To: ${phone} (raw input: ${guest.phone})\nImage: ${qrImageUrl}\n\n${caption}\n`
    );
    console.warn(
      `[whatsapp] No WABLAS_BASE_URL/WABLAS_TOKEN. Ticket message for ${guest.phone} written to .dev-data/outbox-wa/`
    );
    return "dev";
  } catch (err) {
    console.error("[whatsapp] Failed to send ticket WhatsApp message:", err);
    return "failed";
  }
}
