# KLFW 2026 × Cultured by Todak — RSVP & Check-in

Event RSVP and door check-in app for Kuala Lumpur Fashion Week 2026, Collection 1.0 "Battlescars" (Friday 07.08.2026, Esplanade, KLCC Park). Guests RSVP and receive a unique QR ticket on screen and by email; organizers scan tickets at the door with their phone camera.

Built with Next.js 16 (App Router), Tailwind CSS 4, and Supabase (Postgres).

## Routes

| Route | What it is |
|---|---|
| `/` | Event landing page + RSVP form |
| `/ticket/[hash]` | Guest's QR ticket (also emailed) |
| `/admin` | Organizer login + live door list |
| `/admin/scan` | Camera QR scanner with manual-code fallback |

## Local development

```bash
npm install
cp .env.local.example .env.local   # set at least ADMIN_PASSWORD
npm run dev
```

Without Supabase keys, data is stored in `.dev-data/guests.json` and outgoing emails are written to `.dev-data/outbox/` as HTML + ICS files. The full flow (RSVP → ticket → scan → check-in) works locally with zero external services.

## Production setup (Vercel)

The app is serverless in production: there is no persistent filesystem, so RSVPs **must** be stored in Supabase. Without it, every RSVP fails with "Something went wrong saving your RSVP." Follow these steps once.

### 1. Create the database (about 3 minutes)

1. Go to [supabase.com](https://supabase.com), create a free project.
2. Open **SQL Editor** → **New query**, paste the entire contents of `supabase/migrations/0001_create_guests.sql`, and click **Run**. (Safe to run more than once.)
3. Open **Project Settings → API** and copy two values:
   - **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`
   - **`service_role` secret key** (under "Project API keys", reveal the `service_role` one — NOT the `anon`/publishable key) → this is `SUPABASE_SERVICE_ROLE_KEY`

### 2. Set environment variables in Vercel

In your Vercel project: **Settings → Environment Variables**, add these for the **Production** environment, then **redeploy**:

| Variable | Required | Value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase `service_role` secret |
| `ADMIN_PASSWORD` | Yes | A strong password for `/admin` |
| `APP_URL` | Recommended | Your live URL, e.g. `https://klfw2026-rsvp.vercel.app` |
| `RESEND_API_KEY` | Optional | [Resend](https://resend.com) API key, to email tickets |
| `EMAIL_FROM` | Optional | Verified sender, e.g. `KLFW 2026 <tickets@yourdomain.com>` |

Email is optional: without a Resend key, guests still get their QR ticket on screen at `/ticket/[hash]` (nothing breaks).

### 3. Confirm it works

After redeploying, open **`https://YOUR-APP.vercel.app/api/health`** in a browser. It reports exactly what is configured and reachable:

- `"rsvpReady": true` → done, submit a test RSVP.
- Otherwise the `hint` field tells you the one thing left to fix (missing key, or schema not run).

Notes: the guests table has RLS enabled with no public policies, so all access goes through server route handlers using the service-role key. Check-in is an atomic SQL function, so two simultaneous scans of the same ticket can never both succeed. HTTPS is required in production because browsers block camera access on plain HTTP.

## Door staff manual

The operator's guide (login, scanning, red/green verdicts, duplicate handling, lost tickets, troubleshooting) lives in the BUBU workspace: `01_BUBU_CULTURAL_AGENCY/05_Client_Presentations_and_Decks/KAHF/Documents/KAHF_Documents_RSVPCheckinAdminGuide_2026-07-10.docx`.
