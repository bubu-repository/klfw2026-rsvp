import { NextResponse } from "next/server";
import { createGuest } from "@/lib/db";
import { sendTicketEmail, type EmailOutcome } from "@/lib/email";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (name.length < 1 || name.length > 120) {
    return NextResponse.json(
      { error: "Please enter your full name." },
      { status: 400 }
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  try {
    const { guest, existing } = await createGuest(name, email);

    // New RSVPs get their ticket by email. Existing ones don't get a
    // re-send (their ticket page shows everything); sendTicketEmail never
    // throws, so a mail outage can't block the RSVP itself.
    let emailed: EmailOutcome | "skipped" = "skipped";
    if (!existing) {
      emailed = await sendTicketEmail(guest);
    }

    return NextResponse.json({ ticket_hash: guest.ticket_hash, existing, emailed });
  } catch (err) {
    console.error("[api/rsvp]", err);
    return NextResponse.json(
      { error: "Something went wrong saving your RSVP. Please try again." },
      { status: 500 }
    );
  }
}
