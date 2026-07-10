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

## Production setup

1. **Database**: create a Supabase project, run `supabase/migrations/0001_create_guests.sql` in its SQL editor, then set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. The table has RLS enabled with no public policies; all access goes through server route handlers. Check-in is an atomic SQL function, so double scans can never both succeed.
2. **Email**: set `RESEND_API_KEY`, `EMAIL_FROM` (verified sender), and `APP_URL` (the public site URL used in email links). Guests get their QR inline, attached as PNG, plus an "Add to Google Calendar" link and a universal `.ics` attachment.
3. **Admin**: set a strong `ADMIN_PASSWORD`. Sessions are signed cookies, 12-hour expiry.
4. **HTTPS is required in production**: browsers block camera access on plain HTTP, and the scanner needs the camera.

## Door staff manual

The operator's guide (login, scanning, red/green verdicts, duplicate handling, lost tickets, troubleshooting) lives in the BUBU workspace: `01_BUBU_CULTURAL_AGENCY/05_Client_Presentations_and_Decks/KAHF/Documents/KAHF_Documents_RSVPCheckinAdminGuide_2026-07-10.docx`.
