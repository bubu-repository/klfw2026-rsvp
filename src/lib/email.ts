import { promises as fs } from "fs";
import path from "path";
import QRCode from "qrcode";
import { Resend } from "resend";
import type { Guest } from "./types";

export type EmailOutcome = "sent" | "dev" | "failed";

function appUrl(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function fromAddress(): string {
  return (
    process.env.EMAIL_FROM ??
    "KLFW 2026 x Cultured by Todak <onboarding@resend.dev>"
  );
}

// Event window: registration 5.00 PM MYT (UTC+8). Runway guests are booked
// to 9.00 PM; guests staying for the after party (7.00-10.00 PM) to 10.00 PM.
const EVENT_START_UTC = "20260807T090000Z";
const EVENT_END_UTC = "20260807T130000Z";
const EVENT_END_AFTER_PARTY_UTC = "20260807T140000Z";
const EVENT_TITLE = "KLFW 2026 x Cultured by Todak";
// Runway show venue; the after party is at Level 3, Isetan KLCC.
const EVENT_LOCATION = "Esplanade, KLCC Park, Kuala Lumpur";

function eventEnd(guest: Guest): string {
  return guest.attending_after_party ? EVENT_END_AFTER_PARTY_UTC : EVENT_END_UTC;
}

function eventDetails(guest: Guest, ticketUrl: string): string {
  const afterParty = guest.attending_after_party
    ? " After party ft. Juju 7.00-10.00 PM at Level 3, Isetan KLCC."
    : "";
  return `Collection 1.0 "Battlescars". Registration 5.00 PM, runway show 6.00 PM.${afterParty} Invitation only.\nYour ticket: ${ticketUrl}`;
}

function googleCalendarUrl(guest: Guest, ticketUrl: string): string {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: EVENT_TITLE,
    dates: `${EVENT_START_UTC}/${eventEnd(guest)}`,
    location: EVENT_LOCATION,
    details: eventDetails(guest, ticketUrl),
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

function icsFile(guest: Guest, ticketUrl: string): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//KLFW 2026 x Cultured by Todak//RSVP//EN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${guest.ticket_hash}@klfw2026-todak`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${EVENT_START_UTC}`,
    `DTEND:${eventEnd(guest)}`,
    `SUMMARY:${EVENT_TITLE}`,
    `LOCATION:${EVENT_LOCATION}`,
    `DESCRIPTION:${eventDetails(guest, ticketUrl).replace(/,/g, "\\,").replace(/\n/g, "\\n")}`,
    `URL:${ticketUrl}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:KLFW 2026 x Cultured by Todak starts soon",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function ticketEmailHtml(guest: Guest): string {
  const base = appUrl();
  const ticketUrl = `${base}/ticket/${guest.ticket_hash}`;
  const label =
    "font-family:Arial,Helvetica,sans-serif;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;";

  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#fafaf8;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafaf8;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px;max-width:94%;background:#ffffff;border:4px solid #1d2bf0;">
        <tr>
          <td style="background:#1d2bf0;padding:24px;" align="center">
            <img src="${base}/brand/klfw-white.png" alt="Kuala Lumpur Fashion Week 2026" width="180" style="display:block;max-width:180px;height:auto;" />
          </td>
        </tr>
        <tr>
          <td style="padding:34px 24px 8px;" align="center">
            <p style="font-family:Arial Black,Arial,Helvetica,sans-serif;color:#1d2bf0;font-size:44px;line-height:1;text-transform:uppercase;letter-spacing:1px;margin:0;">You&rsquo;re in.</p>
            <p style="${label}color:#111111;font-size:14px;margin:14px 0 0;">Your RSVP is confirmed</p>
          </td>
        </tr>
        <tr>
          <td style="padding:22px 24px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0ff;border-left:5px solid #1d2bf0;">
              <tr>
                <td style="padding:18px 20px;">
                  <p style="${label}color:#1d2bf0;font-size:13px;margin:0 0 8px;">📎 Your QR ticket is attached to this email</p>
                  <p style="font-family:Arial,Helvetica,sans-serif;color:#333333;font-size:13px;line-height:1.55;margin:0;">Look for the attachment <strong>klfw2026-ticket-qr.png</strong>. Save it and show it at registration, it is your entry pass. One ticket per guest.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 24px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:2px dashed #1d2bf0;">
              <tr>
                <td style="padding:16px 0 0;">
                  <p style="${label}color:#888888;font-size:10px;margin:0;">Date</p>
                  <p style="${label}color:#1d2bf0;font-size:12px;margin:2px 0 0;">Friday 07.08.2026</p>
                </td>
                <td align="right" style="padding:16px 0 0;">
                  <p style="${label}color:#888888;font-size:10px;margin:0;">Venue</p>
                  <p style="${label}color:#1d2bf0;font-size:12px;margin:2px 0 0;">Esplanade, KLCC Park</p>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0 0;">
                  <p style="${label}color:#888888;font-size:10px;margin:0;">Registration</p>
                  <p style="${label}color:#1d2bf0;font-size:12px;margin:2px 0 0;">5.00 PM</p>
                </td>
                <td align="right" style="padding:12px 0 0;">
                  <p style="${label}color:#888888;font-size:10px;margin:0;">Runway show</p>
                  <p style="${label}color:#1d2bf0;font-size:12px;margin:2px 0 0;">6.00 PM</p>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0 0;">
                  <p style="${label}color:#888888;font-size:10px;margin:0;">After party ft. Juju</p>
                  <p style="${label}color:#1d2bf0;font-size:12px;margin:2px 0 0;">7.00–10.00 PM</p>
                </td>
                <td align="right" style="padding:12px 0 0;">
                  <p style="${label}color:#888888;font-size:10px;margin:0;">After party venue</p>
                  <p style="${label}color:#1d2bf0;font-size:12px;margin:2px 0 0;">Level 3, Isetan KLCC</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:8px 24px 28px;">
            <a href="${googleCalendarUrl(guest, ticketUrl)}" style="${label}display:inline-block;border:2px solid #1d2bf0;color:#1d2bf0;font-size:12px;text-decoration:none;padding:11px 22px;">Add to Google Calendar</a>
            <p style="${label}color:#888888;font-size:9px;margin:10px 0 0;">Apple or Outlook calendar: open the attached klfw2026.ics</p>
          </td>
        </tr>
        <tr>
          <td style="background:#1d2bf0;padding:12px 24px;" align="center">
            <p style="${label}color:#ffffff;font-size:9px;margin:0;">Invitation only. Collection 1.0 &ldquo;Battlescars&rdquo;. Creative direction by Min Luna.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Sends the ticket email. Never throws: the RSVP must succeed even when
// email delivery fails. Without a RESEND_API_KEY (local dev) the email is
// written to .dev-data/outbox/ so it can be opened and inspected.
export async function sendTicketEmail(guest: Guest): Promise<EmailOutcome> {
  try {
    const qrPng = await QRCode.toBuffer(guest.ticket_hash, {
      width: 440,
      // Full 4-module quiet zone so the attached PNG scans reliably even
      // when viewed against a dark background.
      margin: 4,
      color: { dark: "#1d2bf0", light: "#ffffff" },
    });
    // The inline QR <img> loads from ${APP_URL}/api/qr/[hash]; email clients
    // like Gmail strip base64 data: URIs, so a hosted URL is what actually
    // renders. The same PNG is still attached below as a download.
    const html = ticketEmailHtml(guest);
    const subject = "Your KLFW 2026 ticket: Cultured by Todak, Friday 07.08.2026";
    const ticketUrl = `${appUrl()}/ticket/${guest.ticket_hash}`;
    const ics = icsFile(guest, ticketUrl);

    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: fromAddress(),
        to: guest.email,
        subject,
        html,
        attachments: [
          {
            filename: "klfw2026-ticket-qr.png",
            content: qrPng.toString("base64"),
          },
          {
            filename: "klfw2026.ics",
            content: Buffer.from(ics).toString("base64"),
            contentType: "text/calendar",
          },
        ],
      });
      if (error) {
        console.error("[email] Resend error:", error);
        return "failed";
      }
      return "sent";
    }

    // Production has no writable/persistent filesystem (Vercel is read-only),
    // so the dev outbox only makes sense locally. Without a Resend key in
    // production we simply skip email; the guest still gets their ticket on
    // the confirmation screen and at /ticket/[hash].
    if (process.env.NODE_ENV === "production") {
      console.warn(
        `[email] No RESEND_API_KEY in production. Skipping email for ${guest.email}; ticket is still available on screen.`
      );
      return "failed";
    }

    const outbox = path.join(process.cwd(), ".dev-data", "outbox");
    await fs.mkdir(outbox, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const slug = guest.email.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    await fs.writeFile(path.join(outbox, `${stamp}-${slug}.html`), html);
    await fs.writeFile(path.join(outbox, `${stamp}-${slug}.ics`), ics);
    console.warn(
      `[email] No RESEND_API_KEY. Ticket email for ${guest.email} written to .dev-data/outbox/`
    );
    return "dev";
  } catch (err) {
    console.error("[email] Failed to send ticket email:", err);
    return "failed";
  }
}
