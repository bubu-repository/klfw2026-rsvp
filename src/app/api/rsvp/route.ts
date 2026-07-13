import { NextResponse } from "next/server";
import { createGuest } from "@/lib/db";
import { sendTicketEmail, type EmailOutcome } from "@/lib/email";
import { GUEST_TITLES, type GuestTitle } from "@/lib/types";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
// Digits with optional +, spaces, dashes, parentheses. 7-20 digits total.
const PHONE_RE = /^\+?[0-9()\-\s]{7,24}$/;

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = str(body?.name);
  const email = str(body?.email);
  const phone = str(body?.phone);
  const company = str(body?.company);
  const title = str(body?.title);
  const attending_after_party = body?.attending_after_party === true;
  const category = body?.category === "vip" ? "vip" : "regular";

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
  if (!PHONE_RE.test(phone) || phone.replace(/\D/g, "").length < 7) {
    return NextResponse.json(
      { error: "Please enter a valid phone number." },
      { status: 400 }
    );
  }
  if (company.length < 1 || company.length > 120) {
    return NextResponse.json(
      { error: "Please enter your company." },
      { status: 400 }
    );
  }
  if (!(GUEST_TITLES as readonly string[]).includes(title)) {
    return NextResponse.json(
      { error: "Please select your title." },
      { status: 400 }
    );
  }
  if (typeof body?.attending_after_party !== "boolean") {
    return NextResponse.json(
      { error: "Please tell us if you are joining the after party." },
      { status: 400 }
    );
  }

  try {
    const { guest, existing } = await createGuest({
      name,
      email,
      phone,
      company,
      title: title as GuestTitle,
      attending_after_party,
      category,
    });

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
