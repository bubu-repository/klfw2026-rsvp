import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Setup self-check. Open /api/health in a browser after deploying to see
// exactly what is configured and whether the database is reachable. It only
// ever reports booleans and database error text, never any secret values.
export async function GET() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    ADMIN_PASSWORD: Boolean(process.env.ADMIN_PASSWORD),
    RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY),
    EMAIL_FROM: Boolean(process.env.EMAIL_FROM),
    APP_URL: Boolean(process.env.APP_URL),
  };

  const database = {
    configured: env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY,
    reachable: false,
    guestsTable: false,
    checkInFunction: false,
    error: null as string | null,
  };

  if (database.configured) {
    try {
      const sb = supabaseAdmin();

      // Does the guests table exist and is it queryable with the given key?
      const table = await sb
        .from("guests")
        .select("id", { count: "exact", head: true });
      if (table.error) {
        database.error = `${table.error.code ?? ""} ${table.error.message}`.trim();
      } else {
        database.reachable = true;
        database.guestsTable = true;
      }

      // Does the atomic check-in function exist? A random hash matches no row,
      // so this proves the function is installed without changing any data.
      const rpc = await sb.rpc("check_in_guest", {
        p_ticket_hash: "healthcheck-no-match-000000000000",
      });
      if (!rpc.error) {
        database.reachable = true;
        database.checkInFunction = true;
      } else if (!database.error) {
        database.error = `${rpc.error.code ?? ""} ${rpc.error.message}`.trim();
      }
    } catch (err) {
      database.error = err instanceof Error ? err.message : String(err);
    }
  }

  // The RSVP flow only needs the database. Email is optional; without it,
  // guests still get their ticket on the confirmation screen.
  const rsvpReady =
    database.configured &&
    database.guestsTable &&
    database.checkInFunction &&
    env.ADMIN_PASSWORD;

  let hint: string;
  if (!database.configured) {
    hint =
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your Vercel project, then redeploy.";
  } else if (!database.guestsTable || !database.checkInFunction) {
    hint =
      "Database is configured but the schema is missing. Run supabase/migrations/0001_create_guests.sql in the Supabase SQL editor.";
  } else if (!env.ADMIN_PASSWORD) {
    hint = "Set ADMIN_PASSWORD in Vercel so organizers can log in to /admin.";
  } else {
    hint = "All set. RSVP, tickets, and check-in are ready.";
  }

  return NextResponse.json(
    { ok: rsvpReady, rsvpReady, env, database, hint },
    { status: rsvpReady ? 200 : 503 }
  );
}
