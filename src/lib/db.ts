import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import QRCode from "qrcode";
import { supabaseAdmin } from "./supabase";
import { normalizePhone } from "./whatsapp";
import type { Guest, NewGuest, CheckInResult } from "./types";

// Result of an RSVP attempt. A returning guest must present BOTH the email
// and the phone number they registered with to get their existing ticket
// back; matching on only one of the two is refused with a conflict, so a
// stranger who happens to know someone's email can't pull up their QR.
export type CreateGuestResult =
  | { kind: "created" | "existing"; guest: Guest }
  | { kind: "conflict"; conflict: "phone_mismatch" | "email_mismatch" }
  | { kind: "quota_exceeded"; category: string };

// Same person, differently typed number ("012 345 6789" vs "+60123456789")
// must still count as the same phone.
function samePhone(stored: string | null, input: string): boolean {
  // Guests from before the phone field existed have nothing to compare
  // against; their email match is the best identity we have.
  if (!stored || !stored.trim()) return true;
  return normalizePhone(stored) === normalizePhone(input);
}

const hasSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);

export function newTicketHash(): string {
  return crypto.randomBytes(16).toString("hex");
}

// ---------- Local dev fallback (no Supabase keys present) ----------
// Stores guests in .dev-data/guests.json so the full RSVP -> ticket ->
// check-in flow works before a Supabase project exists.

const DATA_FILE = path.join(process.cwd(), ".dev-data", "guests.json");
let warned = false;

function warnLocal() {
  // Runtime guard, not module-level: `next build` always sets
  // NODE_ENV=production and would otherwise fail without Supabase keys.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Supabase env vars are required in production. The local file store is dev-only."
    );
  }
  if (!warned) {
    warned = true;
    console.warn(
      "[db] No Supabase keys found. Using local dev store at .dev-data/guests.json"
    );
  }
}

async function localReadAll(): Promise<Guest[]> {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, "utf8")) as Guest[];
  } catch {
    return [];
  }
}

async function localWriteAll(guests: Guest[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(guests, null, 2));
}

// ---------- Public data-access API ----------

export async function createGuest(input: NewGuest): Promise<CreateGuestResult> {
  const ticket_hash = newTicketHash();

  if (hasSupabase) {
    const sb = supabaseAdmin();

    // 1. Known email? Then the phone must match too, or we refuse.
    const { data: byEmail, error: emailErr } = await sb
      .from("guests")
      .select()
      .ilike("email", input.email)
      .maybeSingle();
    if (emailErr) throw new Error(emailErr.message);
    if (byEmail) {
      return samePhone((byEmail as Guest).phone, input.phone)
        ? { kind: "existing", guest: byEmail as Guest }
        : { kind: "conflict", conflict: "phone_mismatch" };
    }

    // 2. New email but a known phone number belongs to someone else.
    // Phones are stored as typed, so normalize-and-compare in code; the
    // guest list is event-sized (hundreds), one column scan is cheap.
    const { data: phones, error: phoneErr } = await sb
      .from("guests")
      .select("phone")
      .not("phone", "is", null);
    if (phoneErr) throw new Error(phoneErr.message);
    const phoneTaken = (phones as { phone: string }[]).some(
      (p) =>
        p.phone.trim() !== "" &&
        normalizePhone(p.phone) === normalizePhone(input.phone)
    );
    if (phoneTaken) return { kind: "conflict", conflict: "email_mismatch" };

    // 3. Check quota for this category (max 200 per category)
    const { data: categoryCount, error: countErr } = await sb
      .from("guests")
      .select("id", { count: "exact" })
      .eq("category", input.category);
    if (countErr) throw new Error(countErr.message);
    if ((categoryCount?.length ?? 0) >= 200) {
      return { kind: "quota_exceeded", category: input.category };
    }

    // 4. Genuinely new guest. Store a QR of the raw ticket_hash: that is
    // exactly what the door scanner decodes. Encoding a URL here would make
    // the stored QR unscannable and inconsistent with the ticket page and
    // the emailed attachment, which both encode the bare hash.
    let qrBuffer: Buffer | null = null;
    try {
      qrBuffer = await QRCode.toBuffer(ticket_hash, { margin: 4, width: 400 });
    } catch (qrErr) {
      console.error("[db] QR generation failed:", qrErr);
      throw new Error(
        `QR code generation failed: ${qrErr instanceof Error ? qrErr.message : String(qrErr)}`
      );
    }

    const { data, error } = await sb
      .from("guests")
      .insert({ ...input, ticket_hash, qr_code: qrBuffer })
      .select()
      .single();
    if (!error) return { kind: "created", guest: data as Guest };

    // Unique violation on lower(email): a concurrent RSVP with the same
    // email won the race between our check and this insert. Re-apply the
    // email+phone rule against the winning row.
    if (error.code === "23505") {
      const { data: found, error: findErr } = await sb
        .from("guests")
        .select()
        .ilike("email", input.email)
        .single();
      if (findErr || !found) throw new Error(findErr?.message ?? "Lookup failed");
      return samePhone((found as Guest).phone, input.phone)
        ? { kind: "existing", guest: found as Guest }
        : { kind: "conflict", conflict: "phone_mismatch" };
    }
    throw new Error(error.message);
  }

  warnLocal();
  const guests = await localReadAll();

  const byEmail = guests.find(
    (g) => g.email.toLowerCase() === input.email.toLowerCase()
  );
  if (byEmail) {
    return samePhone(byEmail.phone, input.phone)
      ? { kind: "existing", guest: byEmail }
      : { kind: "conflict", conflict: "phone_mismatch" };
  }

  const phoneTaken = guests.some(
    (g) =>
      g.phone &&
      g.phone.trim() !== "" &&
      normalizePhone(g.phone) === normalizePhone(input.phone)
  );
  if (phoneTaken) return { kind: "conflict", conflict: "email_mismatch" };

  // Check quota for this category (max 200 per category)
  const categoryCount = guests.filter((g) => g.category === input.category).length;
  if (categoryCount >= 200) {
    return { kind: "quota_exceeded", category: input.category };
  }

  const guest: Guest = {
    id: crypto.randomUUID(),
    ...input,
    ticket_hash,
    checked_in: false,
    checked_in_at: null,
    created_at: new Date().toISOString(),
    // Local dev doesn't store qr_code (BYTEA); it's generated on-the-fly at /api/qr
  };
  guests.push(guest);
  await localWriteAll(guests);
  return { kind: "created", guest };
}

export async function getGuestByHash(hash: string): Promise<Guest | null> {
  if (hasSupabase) {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("guests")
      .select()
      .eq("ticket_hash", hash)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Guest) ?? null;
  }

  warnLocal();
  const guests = await localReadAll();
  return guests.find((g) => g.ticket_hash === hash) ?? null;
}

export async function listGuests(): Promise<Guest[]> {
  if (hasSupabase) {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("guests")
      .select()
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data as Guest[];
  }

  warnLocal();
  const guests = await localReadAll();
  return guests.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

// Resolves a short code (the 8-char prefix printed on the ticket) to the
// full ticket hash, for manual entry when the camera can't scan. Returns
// null unless the prefix matches exactly one guest.
export async function resolveTicketPrefix(
  prefix: string
): Promise<string | null> {
  if (!/^[0-9a-f]{6,31}$/i.test(prefix)) return null;

  if (hasSupabase) {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("guests")
      .select("ticket_hash")
      .ilike("ticket_hash", `${prefix.toLowerCase()}%`)
      .limit(2);
    if (error) throw new Error(error.message);
    return data.length === 1 ? data[0].ticket_hash : null;
  }

  warnLocal();
  const guests = await localReadAll();
  const matches = guests.filter((g) =>
    g.ticket_hash.startsWith(prefix.toLowerCase())
  );
  return matches.length === 1 ? matches[0].ticket_hash : null;
}

export async function checkInGuest(hash: string): Promise<CheckInResult> {
  if (hasSupabase) {
    const sb = supabaseAdmin();
    const { data, error } = await sb.rpc("check_in_guest", {
      p_ticket_hash: hash,
    });
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    return row as CheckInResult;
  }

  warnLocal();
  const guests = await localReadAll();
  const guest = guests.find((g) => g.ticket_hash === hash);
  if (!guest) {
    return {
      status: "not_found",
      guest_name: null,
      guest_email: null,
      at: null,
      guest_category: null,
      after_party: null,
    };
  }
  if (guest.checked_in) {
    return {
      status: "already_checked_in",
      guest_name: guest.name,
      guest_email: guest.email,
      at: guest.checked_in_at,
      guest_category: guest.category ?? "regular",
      after_party: guest.attending_after_party ?? false,
    };
  }
  guest.checked_in = true;
  guest.checked_in_at = new Date().toISOString();
  await localWriteAll(guests);
  return {
    status: "checked_in",
    guest_name: guest.name,
    guest_email: guest.email,
    at: guest.checked_in_at,
    guest_category: guest.category ?? "regular",
    after_party: guest.attending_after_party ?? false,
  };
}
