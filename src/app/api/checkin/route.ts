import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { checkInGuest, resolveTicketPrefix } from "@/lib/db";

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  let hash = typeof body?.hash === "string" ? body.hash.trim().toLowerCase() : "";

  if (!/^[0-9a-f]{6,64}$/.test(hash)) {
    return NextResponse.json(
      {
        status: "not_found",
        guest_name: null,
        guest_email: null,
        at: null,
      },
      { status: 200 }
    );
  }

  try {
    // Short codes (manual entry) resolve to the full hash first.
    if (hash.length !== 32) {
      const full = await resolveTicketPrefix(hash);
      if (!full) {
        return NextResponse.json({
          status: "not_found",
          guest_name: null,
          guest_email: null,
          at: null,
        });
      }
      hash = full;
    }

    const result = await checkInGuest(hash);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/checkin]", err);
    return NextResponse.json(
      { error: "Check-in failed. Try again." },
      { status: 500 }
    );
  }
}
