import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { supabaseAdmin } from "./supabase";
import type { Guest, CheckInResult } from "./types";

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

export async function createGuest(
  name: string,
  email: string
): Promise<{ guest: Guest; existing: boolean }> {
  const ticket_hash = newTicketHash();

  if (hasSupabase) {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("guests")
      .insert({ name, email, ticket_hash })
      .select()
      .single();

    if (!error) return { guest: data as Guest, existing: false };

    // Unique violation on lower(email): this person already has a ticket.
    if (error.code === "23505") {
      const { data: found, error: findErr } = await sb
        .from("guests")
        .select()
        .ilike("email", email)
        .single();
      if (findErr || !found) throw new Error(findErr?.message ?? "Lookup failed");
      return { guest: found as Guest, existing: true };
    }
    throw new Error(error.message);
  }

  warnLocal();
  const guests = await localReadAll();
  const existing = guests.find(
    (g) => g.email.toLowerCase() === email.toLowerCase()
  );
  if (existing) return { guest: existing, existing: true };

  const guest: Guest = {
    id: crypto.randomUUID(),
    name,
    email,
    ticket_hash,
    checked_in: false,
    checked_in_at: null,
    created_at: new Date().toISOString(),
  };
  guests.push(guest);
  await localWriteAll(guests);
  return { guest, existing: false };
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
    return { status: "not_found", guest_name: null, guest_email: null, at: null };
  }
  if (guest.checked_in) {
    return {
      status: "already_checked_in",
      guest_name: guest.name,
      guest_email: guest.email,
      at: guest.checked_in_at,
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
  };
}
